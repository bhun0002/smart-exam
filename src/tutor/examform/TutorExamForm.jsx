// src/tutor/examform/TutorExamForm.jsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Box, Paper, Snackbar } from "@mui/material";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import MuiAlert from "@mui/material/Alert";
import { db } from "../../firebaseConfig";
import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  updateDoc,
  // ▼ NEW: for loading courses
  getDocs,
  query,
  orderBy,
} from "firebase/firestore";
import axios from "axios";

import TopBar from "./components/TopBar";
import ExamMetaForm from "./components/ExamMetaForm";
import AddQuestionButtons from "./components/AddQuestionButtons";
import QuestionsList from "./components/QuestionsList";
import { ensureUniqueIds, generateUniqueId } from "./utils/ids";
import useIntakes from "./hooks/useIntakes";
import QuestionRenderer from "../questionForms";

const MotionDiv = motion.div;

const TutorExamForm = ({ examData = null, readonly = false, onSaveSuccess }) => {
  const navigate = useNavigate();

  // meta
  const [title, setTitle] = useState(examData?.title || "");
  const [duration, setDuration] = useState(examData?.duration || "");
  const [selectedIntake, setSelectedIntake] = useState(examData?.intakeId || "");
  // ▼ NEW: course mapping like intake
  const [selectedCourse, setSelectedCourse] = useState(examData?.courseId || "");

  // questions
  const [questions, setQuestions] = useState([]);

  // ui
  const [showScroll, setShowScroll] = useState(false);
  const [questionNumber, setQuestionNumber] = useState("");
  const [searchError, setSearchError] = useState("");
  const [formError, setFormError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [isSnackbarOpen, setIsSnackbarOpen] = useState(false);

  // intakes
  const { intakes, error: intakesErr } = useIntakes();

  // ▼ NEW: courses (mirrors useIntakes behavior, but inline here to keep changes localized)
  const [courses, setCourses] = useState([]);
  const [coursesErr, setCoursesErr] = useState("");

  useEffect(() => {
    const loadCourses = async () => {
      try {
        const snap = await getDocs(query(collection(db, "courses"), orderBy("name", "asc")));
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setCourses(list);
      } catch (e) {
        console.error("Failed to load courses:", e);
        setCoursesErr("Failed to load courses.");
      }
    };
    loadCourses();
  }, []);

  // points helper
  const isValidPoints = (v) =>
    typeof v === "number" && !Number.isNaN(v) && v > 0 && v <= 100;

  // init questions + meta
  useEffect(() => {
    if (examData) {
      setTitle(examData.title || "");
      setDuration(examData.duration || "");
      setSelectedIntake(examData.intakeId || "");
      // ▼ NEW: hydrate selected course
      setSelectedCourse(examData.courseId || "");
      setQuestions(ensureUniqueIds(examData.questions || []));
    } else {
      setTitle("");
      setDuration("");
      setSelectedIntake("");
      // ▼ NEW: clear selected course
      setSelectedCourse("");
      setQuestions(
        ensureUniqueIds([
          {
            type: "multiple-choice",
            question: "",
            options: [{ text: "" }, { text: "" }],
            answer: "",
            media: null,
          },
        ])
      );
    }
  }, [examData]);

  // live TOTAL POINTS
  const totalPoints = useMemo(() => {
    return (questions || []).reduce((sum, q) => {
      const n = Number(q?.points);
      return sum + (Number.isFinite(n) ? n : 0);
    }, 0);
  }, [questions]);

  // scroll-to-top button
  const checkScrollTop = useCallback(() => {
    setShowScroll((prev) => {
      const on = window.pageYOffset > 400;
      return on !== prev ? on : prev;
    });
  }, []);
  useEffect(() => {
    window.addEventListener("scroll", checkScrollTop);
    return () => window.removeEventListener("scroll", checkScrollTop);
  }, [checkScrollTop]);

  const scrollTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  const scrollToQuestion = (number) => {
    const parsedNumber = parseInt(number, 10);
    setSearchError("");
    if (isNaN(parsedNumber) || parsedNumber < 1 || parsedNumber > questions.length) {
      setSearchError(`Please enter a number from 1 to ${questions.length}.`);
      return;
    }
    const el = document.getElementById(`question-${parsedNumber - 1}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const handleCloseSnackbar = () => setIsSnackbarOpen(false);

  // signed upload via your API (unchanged)
  const uploadMedia = async (file) => {
    if (readonly || !file) return null;
    try {
      const base = (process.env.REACT_APP_API_BASE || "").replace(/\/+$/, "");
      if (!base) throw new Error("Missing REACT_APP_API_BASE in your .env");

      try {
        console.log("[uploadMedia] file:", {
          name: file.name,
          type: file.type,
          size: file.size,
        });
      } catch (_) {}

      const signUrl = `${base}/sign-upload`;
      const signParams = { folder: "exam-media", access_mode: "authenticated" };
      try {
        console.log("[uploadMedia] GET", signUrl, "params:", signParams);
      } catch (_) {}

      const signRes = await axios.get(signUrl, { params: signParams });
      const { timestamp, signature, cloudName, apiKey, folder, access_mode } = signRes.data || {};

      try {
        console.log("[uploadMedia] sign-response:", {
          timestamp,
          signature: !!signature,
          cloudName,
          apiKey: !!apiKey,
          folder,
          access_mode,
        });
      } catch (_) {}

      const formData = new FormData();
      formData.append("file", file);
      formData.append("timestamp", timestamp);
      formData.append("api_key", apiKey);
      formData.append("signature", signature);
      if (folder) formData.append("folder", folder);
      if (access_mode) formData.append("access_mode", access_mode);

      try {
        const fdPreview = {};
        for (const [k, v] of formData.entries()) {
          fdPreview[k] = k === "file" ? `[File:${file.type}, ${file.size}B]` : v;
        }
        console.log("[uploadMedia] POST formData:", fdPreview);
      } catch (_) {}

      const uploadEndpoint = `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`;
      try {
        console.log("[uploadMedia] POST", uploadEndpoint);
      } catch (_) {}

      const res = await axios.post(uploadEndpoint, formData);

      const { public_id, resource_type, format, version, access_mode: storedAccessMode } = res.data || {};
      try {
        console.log("[uploadMedia] upload-response:", { public_id, resource_type, format, version, access_mode: storedAccessMode });
      } catch (_) {}

      if (!public_id) throw new Error("Missing Cloudinary public_id");

      return { public_id, resource_type, format, version };
    } catch (e) {
      console.error("[uploadMedia] ERROR:", e?.message || e);
      if (e?.response) {
        console.error("[uploadMedia] error.response.status:", e.response.status);
        console.error("[uploadMedia] error.response.data:", e.response.data);
      }
      setSnackbarMessage("Failed to upload media!");
      setIsSnackbarOpen(true);
      return null;
    }
  };

  // actions – add/move/delete/update question (unchanged)
  const addQuestion = (type) => {
    if (readonly) return;
    const q = { id: generateUniqueId(), type, media: null };
    if (type === "multiple-choice") {
      q.question = "";
      q.options = [
        { id: generateUniqueId(), text: "" },
        { id: generateUniqueId(), text: "" },
      ];
      q.answer = "";
    }
    if (type === "true-false") {
      q.question = "";
      q.options = ["True", "False"];
      q.answer = "";
    }
    if (["fill-blanks", "short-answer", "reasoning"].includes(type)) {
      q.question = "";
      q.options = [];
      q.answer = "";
    }
    if (type === "match") {
      q.matchPairs = [{ id: generateUniqueId(), left: "", right: "" }];
    }
    setQuestions((prev) => [...prev, q]);
  };

  const handleQuestionState = (index, newQ) => {
    if (readonly) return;
    setQuestions((prev) => {
      const copy = [...prev];
      copy[index] = newQ;
      return copy;
    });
  };

  const deleteQuestion = (index) => {
    if (readonly) return;
    if (window.confirm("Are you sure you want to delete this question?")) {
      setQuestions((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const moveQuestion = (index, dir) => {
    if (readonly) return;
    setQuestions((prev) => {
      const arr = [...prev];
      const ni = index + dir;
      if (ni < 0 || ni >= arr.length) return arr;
      [arr[index], arr[ni]] = [arr[ni], arr[index]];
      return arr;
    });
  };

  // validation — now also requires Course
  const validateQuestions = useCallback(() => {
    if (readonly) return null;
    if (!title || title.trim() === "") {
      return { message: "Please enter a valid Exam Title.", fieldId: "exam-title" };
    }
    if (!duration || duration <= 0) {
      return { message: "Please enter a valid Exam Duration.", fieldId: "exam-duration" };
    }
    if (!selectedIntake) {
      return { message: "Please select an Intake before saving the exam.", fieldId: "exam-intake" };
    }
    // ▼ NEW: require course like intake
    if (!selectedCourse) {
      return { message: "Please select a Course before saving the exam.", fieldId: "exam-course" };
    }
    if (questions.length === 0) {
      return { message: "Add at least one question to save the exam.", fieldId: "add-question-buttons" };
    }
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      const domId = `question-${i}`;
      if (!q.id) {
        return { message: `Question ${i + 1}: missing unique ID.`, fieldId: domId };
      }
      if (q.type !== "match" && (!q.question || q.question.trim() === "")) {
        return { message: `Question ${i + 1}: Question text cannot be empty.`, fieldId: `${domId}-question-text` };
      }
      if (q.type === "multiple-choice") {
        if (!q.options || q.options.length < 2) {
          return { message: `Question ${i + 1}: At least 2 options are required.`, fieldId: `${domId}-options` };
        }
        for (let j = 0; j < q.options.length; j++) {
          if (!q.options[j].text || q.options[j].text.trim() === "") {
            return { message: `Question ${i + 1}: Option ${j + 1} cannot be empty.`, fieldId: `${domId}-option-${j}` };
          }
        }
        if (!q.answer || q.answer.trim() === "") {
          return { message: `Question ${i + 1}: A correct answer must be selected.`, fieldId: `${domId}-answer` };
        }
        if (!isValidPoints(q.points)) {
          return {
            message: `Question ${i + 1}: Please enter a valid non-negative point value.`,
            fieldId: `${domId}-points`,
          };
        }
      }
      if (q.type === "true-false") {
        if (!q.question || q.question.trim() === "") {
          return { message: `Question ${i + 1}: Question text cannot be empty.`, fieldId: `${domId}-question-text` };
        }
        if (!q.answer || q.answer.trim() === "") {
          return { message: `Question ${i + 1}: Correct answer must be selected.`, fieldId: `${domId}-answer` };
        }
        if (!isValidPoints(q.points)) {
          return {
            message: `Question ${i + 1}: Please enter a valid non-negative point value.`,
            fieldId: `${domId}-points`,
          };
        }
      }
      if (["fill-blanks", "short-answer", "reasoning"].includes(q.type)) {
        if (!q.question || q.question.trim() === "") {
          return { message: `Question ${i + 1}: Question text cannot be empty.`, fieldId: `${domId}-question-text` };
        }
        if (!q.answer || q.answer.trim() === "") {
          return { message: `Question ${i + 1}: Answer cannot be empty.`, fieldId: `${domId}-answer` };
        }
        if (!isValidPoints(q.points)) {
          return {
            message: `Question ${i + 1}: Please enter a valid non-negative point value.`,
            fieldId: `${domId}-points`,
          };
        }
      }
      if (q.type === "match") {
        if (!q.matchPairs || q.matchPairs.length === 0) {
          return { message: `Question ${i + 1}: Add at least one matching pair.`, fieldId: `${domId}-match-pairs` };
        }
        for (let k = 0; k < q.matchPairs.length; k++) {
          const pair = q.matchPairs[k];
          if (!pair.left?.trim() || !pair.right?.trim()) {
            return { message: `Question ${i + 1}: Match pair ${k + 1} cannot have empty fields.`, fieldId: `${domId}-match-pair-${k}` };
          }
        }
        if (!isValidPoints(q.points)) {
          return {
            message: `Question ${i + 1}: Please enter a valid non-negative point value.`,
            fieldId: `${domId}-points`,
          };
        }
      }
    }
    return null;
  }, [readonly, title, duration, selectedIntake, selectedCourse, questions]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (readonly) return;
    setFormError("");
    setFieldErrors({});

    const v = validateQuestions();
    if (v) {
      setFormError(v.message);
      setFieldErrors({ [v.fieldId]: v.message });
      const el = document.getElementById(v.fieldId);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    try {
      // upload any new media files
      const withMedia = await Promise.all(
        questions.map(async (q) => {
          if (q.media instanceof File) {
            const identifiers = await uploadMedia(q.media);
            return { ...q, media: identifiers };
          }
          return q;
        })
      );

      // cleanup non-MCQ types
      const cleaned = withMedia.map((q) => {
        if (["true-false", "fill-blanks", "short-answer", "reasoning"].includes(q.type)) {
          const { options, ...rest } = q;
          return rest;
        }
        return q;
      });

      const payload = {
        title,
        duration: Number(duration),
        intakeId: selectedIntake,
        // ▼ NEW: save courseId
        courseId: selectedCourse,
        isDeleted: 0,
        questions: cleaned,
        totalPoints,
      };

      if (examData?.id) {
        const ref = doc(db, "exams", examData.id);
        await updateDoc(ref, { ...payload, updatedAt: serverTimestamp() });
        setSnackbarMessage("Exam updated successfully!");
      } else {
        await addDoc(collection(db, "exams"), { ...payload, createdAt: serverTimestamp() });
        setSnackbarMessage("Exam saved successfully!");
      }

      setIsSnackbarOpen(true);

      if (onSaveSuccess) {
        setTimeout(() => onSaveSuccess(), 2000);
      } else {
        setTimeout(() => navigate("/tutor-exam-list"), 2000);
      }
    } catch (err) {
      console.error("Firestore error:", err);
      setFormError("Error saving exam! " + err.message);
    }
  };

  return (
    <Box
      sx={{
        background: "linear-gradient(135deg, #FFD1DC, #B2EBF2)",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        py: { xs: 2, md: 4 },
      }}
    >
      <Paper elevation={12} sx={{ p: { xs: 3, md: 5 }, borderRadius: "24px", bgcolor: "#fff" }}>
        <TopBar
          readonly={readonly}
          examData={examData}
          onBack={() => navigate("/tutor-dashboard")}
        />

        <ExamMetaForm
          readonly={readonly}
          title={title}
          setTitle={setTitle}
          duration={duration}
          setDuration={setDuration}
          selectedIntake={selectedIntake}
          setSelectedIntake={setSelectedIntake}
          intakes={intakes}
          intakesError={intakesErr}
          // ▼ NEW: pass course props (ExamMetaForm can render Course dropdown like Intake)
          selectedCourse={selectedCourse}
          setSelectedCourse={setSelectedCourse}
          courses={courses}
          coursesError={coursesErr}
          fieldErrors={fieldErrors}
          setFieldErrors={setFieldErrors}
          totalPoints={totalPoints}
        />

        {!readonly && (
          <AddQuestionButtons
            onAdd={addQuestion}
            questionNumber={questionNumber}
            setQuestionNumber={(v) => {
              setQuestionNumber(v);
              scrollToQuestion(v);
            }}
            searchError={searchError}
          />
        )}

        <form onSubmit={handleSubmit}>
          <QuestionsList
            questions={questions}
            setQuestions={setQuestions}
            readonly={readonly}
            fieldErrors={fieldErrors}
            setFieldErrors={setFieldErrors}
            onDelete={deleteQuestion}
            onMoveUp={(i) => moveQuestion(i, -1)}
            onMoveDown={(i) => moveQuestion(i, 1)}
            QuestionRenderer={QuestionRenderer}
          />

          {formError && (
            <MotionDiv
              animate={{ backgroundColor: ["#fbe9e7", "#f4b39b", "#fbe9e7"] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              style={{ marginTop: 16, textAlign: "center", borderRadius: 8, padding: 8 }}
            >
              {formError}
            </MotionDiv>
          )}

          {!readonly && (
            <>
              <AddQuestionButtons
                onAdd={addQuestion}
                questionNumber={questionNumber}
                setQuestionNumber={(v) => {
                  setQuestionNumber(v);
                  scrollToQuestion(v);
                }}
                searchError={searchError}
              />
              <Box sx={{ display: "flex", justifyContent: "center", mt: 4, gap: 2 }}>
                <TopBar.GoToListButton onClick={() => navigate("/tutor-exam-list")} />
                <TopBar.SaveButton label={examData ? "Save Changes" : "Save Exam"} />
              </Box>
            </>
          )}
        </form>
      </Paper>

      <TopBar.ScrollTopFab show={showScroll} onClick={scrollTop} />

      <Snackbar
        open={isSnackbarOpen}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <motion.div
          animate={{ backgroundColor: ["#c8e6c9", "#a5d6a7", "#c8e6c9"] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        >
          <MuiAlert onClose={handleCloseSnackbar} severity="success" elevation={6} variant="filled" sx={{ backgroundColor: "transparent" }}>
            {snackbarMessage}
          </MuiAlert>
        </motion.div>
      </Snackbar>
    </Box>
  );
};

export default TutorExamForm;
