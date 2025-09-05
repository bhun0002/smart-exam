// src/student/StudentTakeExam/StudentTakeExam.jsx
import React, { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Box, Paper, CircularProgress, Typography, Grid, useMediaQuery, useTheme } from "@mui/material";
import { db } from "../../firebaseConfig"; // adjust if your path differs
import { doc, getDoc, serverTimestamp, updateDoc, setDoc } from "firebase/firestore";
import { useAuth } from "../../AuthContext"; // adjust path
import { startProctoring, stopProctoring } from "../../proctoring/logService";

import StudentQuestionDisplay from "./components/StudentQuestionDisplay";
import ExamHeader from "./components/ExamHeader";
import ExamFooter from "./components/ExamFooter";
import SubmitDialog from "./components/SubmitDialog";
import FinishEarlyDialog from "./components/FinishEarlyDialog";
import Notifier from "./components/Notifier";
import { formatTime } from "../../utils/time";
import { isQuestionAnswered } from "../../utils/answers";

const StudentTakeExam = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const { user, isLoading: isAuthLoading } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [studentAnswers, setStudentAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [finishEarlyDialogOpen, setFinishEarlyDialogOpen] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");

  const intervalRef = useRef(null);
  const examStartTimeRef = useRef(null);
  const [submissionId, setSubmissionId] = useState(null);

  const studentAnswersRef = useRef(studentAnswers);
  const timeLeftRef = useRef(timeLeft);
  const submissionIdRef = useRef(submissionId);
  const examRef = useRef(exam);
  const userRef = useRef(user);

  // 🔑 keep controller returned by startProctoring
  const proctoringControllerRef = useRef(null);

  useEffect(() => {
    studentAnswersRef.current = studentAnswers;
  }, [studentAnswers]);
  useEffect(() => {
    timeLeftRef.current = timeLeft;
  }, [timeLeft]);
  useEffect(() => {
    submissionIdRef.current = submissionId;
  }, [submissionId]);
  useEffect(() => {
    examRef.current = exam;
  }, [exam]);
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  const handleSnackbarClose = (event, reason) => {
    if (reason === "clickaway") return;
    setSnackbarOpen(false);
  };

  const handleBackToList = useCallback(() => {
    const currentUser = userRef.current;
    const unlockedKey = currentUser?.id ? `examUnlocked-${currentUser.id}-${examId}` : null;
    if (unlockedKey) {
      sessionStorage.removeItem(unlockedKey);
    }
    navigate("/student-exam-list");
  }, [examId, navigate]);

  const handleSubmitExam = useCallback(
    async (overrideSubmissionId, overrideDuration, currentStudentAnswers, currentTimeLeft) => {
      const currentSubmissionId =
        overrideSubmissionId !== undefined ? overrideSubmissionId : submissionIdRef.current;
      const currentExam = examRef.current;
      const currentUser = userRef.current;
      const currentAnswers =
        currentStudentAnswers !== undefined ? currentStudentAnswers : studentAnswersRef.current;
      const currentDurationLeft =
        currentTimeLeft !== undefined ? currentTimeLeft : timeLeftRef.current;
      const currentOverrideDuration =
        overrideDuration !== undefined ? overrideDuration : currentExam?.duration * 60;

      setSubmitDialogOpen(false);
      setLoading(true);
      clearInterval(intervalRef.current);

      if (!currentSubmissionId || !currentExam || !currentUser) {
        setSnackbarMessage("Submission error: Missing data. Please contact support.");
        setSnackbarSeverity("error");
        setSnackbarOpen(true);
        setLoading(false);
        return;
      }

      try {
        const finalDurationTaken = currentOverrideDuration - currentDurationLeft;
        const submissionRef = doc(db, "examSubmissions", currentSubmissionId);
        await updateDoc(submissionRef, {
          answers: currentAnswers,
          endTime: serverTimestamp(),
          durationTaken: finalDurationTaken,
          isSubmitted: true,
        });

        setSnackbarMessage("Exam submitted successfully! 🎉");
        setSnackbarSeverity("success");
        setSnackbarOpen(true);

        const unlockedKey = currentUser?.id
          ? `examUnlocked-${currentUser.id}-${currentExam.id}`
          : null;
        if (unlockedKey) sessionStorage.removeItem(unlockedKey);

        setTimeout(() => navigate("/student-dashboard"), 2000);
      } catch (error) {
        console.error("Error submitting exam:", error);
        setSnackbarMessage("Failed to submit exam. Please try again.");
        setSnackbarSeverity("error");
        setSnackbarOpen(true);
        setLoading(false);
      }
    },
    [navigate]
  );

  const saveStudentAnswersToDb = useCallback(async () => {
    const currentSubmissionId = submissionIdRef.current;
    const currentExam = examRef.current;
    const currentUser = userRef.current;
    const currentStudentAnswers = studentAnswersRef.current;

    if (!currentSubmissionId || !currentExam || !currentUser) return;

    try {
      const submissionRef = doc(db, "examSubmissions", currentSubmissionId);
      await updateDoc(submissionRef, {
        answers: currentStudentAnswers,
        updatedAt: serverTimestamp(),
      });
      setSnackbarMessage("Response Saved! ✨");
      setSnackbarSeverity("info");
      setSnackbarOpen(true);
    } catch (error) {
      console.error("[Auto-Save] Error:", error);
      setSnackbarMessage("Auto-save failed. Please check your connection.");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }
  }, []);

  useEffect(() => {
    if (submissionId && Object.keys(studentAnswers).length > 0) {
      const delaySave = setTimeout(() => {
        saveStudentAnswersToDb();
      }, 1500);
      return () => clearTimeout(delaySave);
    }
  }, [studentAnswers, submissionId, saveStudentAnswersToDb]);

  useEffect(() => {
    const fetchExamDataAndSetupSubmission = async () => {
      if (isAuthLoading || !user) {
        if (!isAuthLoading && !user) navigate("/student-login");
        return;
      }
      const unlockedKey = user?.id ? `examUnlocked-${user.id}-${examId}` : null;
      if (!user?.id || sessionStorage.getItem(unlockedKey) !== "true") {
        setSnackbarMessage("Access Denied: Please unlock the exam from the list.");
        setSnackbarSeverity("error");
        setSnackbarOpen(true);
        handleBackToList();
        return;
      }

      setLoading(true);
      try {
        const examRefDoc = doc(db, "exams", examId);
        const examSnap = await getDoc(examRefDoc);
        if (!examSnap.exists()) {
          setSnackbarMessage("Exam not found.");
          setSnackbarSeverity("error");
          setSnackbarOpen(true);
          handleBackToList();
          return;
        }

        const examData = examSnap.data();
        if (!examData.isAvailable || examData.intakeId !== user.intake) {
          setSnackbarMessage("Exam not available or not assigned to your intake.");
          setSnackbarSeverity("error");
          setSnackbarOpen(true);
          handleBackToList();
          return;
        }

        setExam({ id: examSnap.id, ...examData });
        setQuestions(examData.questions.map((q) => ({ ...q, id: q.id })));

        const studentSubmissionDocId = `${examId}_${user.id}`;
        const submissionDocRef = doc(db, "examSubmissions", studentSubmissionDocId);
        const existingSubmissionSnap = await getDoc(submissionDocRef);
        if (existingSubmissionSnap.exists()) {
          const existing = { id: existingSubmissionSnap.id, ...existingSubmissionSnap.data() };
          if (existing.isSubmitted) {
            setSnackbarMessage("This exam has already been submitted and cannot be re-taken.");
            setSnackbarSeverity("warning");
            setSnackbarOpen(true);
            handleBackToList();
            return;
          }
          setSubmissionId(existing.id);
          setStudentAnswers(existing.answers || {});
          const durationTakenSoFar = (Date.now() - existing.startTime.toDate().getTime()) / 1000;
          const remainingTime = examData.duration * 60 - durationTakenSoFar;
          if (remainingTime <= 0) {
            setSnackbarMessage("Your exam time has expired. Submitting now...");
            setSnackbarSeverity("warning");
            setSnackbarOpen(true);
            await handleSubmitExam(existing.id, examData.duration * 60, existing.answers, 0);
            return;
          }
          setTimeLeft(Math.max(0, Math.floor(remainingTime)));
          examStartTimeRef.current = existing.startTime.toDate().getTime();
          setSnackbarMessage(`Resuming Exam '${examData.title}'!`);
          setSnackbarSeverity("info");
          setSnackbarOpen(true);
        } else {
          await setDoc(submissionDocRef, {
            examId,
            studentId: user.id,
            studentName: user.name || user.email,
            intakeId: user.intake,
            answers: {},
            startTime: serverTimestamp(),
            isSubmitted: false,
            durationTaken: 0,
          });
          setSubmissionId(studentSubmissionDocId);
          setTimeLeft(examData.duration * 60);
          examStartTimeRef.current = Date.now();
          setSnackbarMessage(`Starting New Exam: '${examData.title}'!`);
          setSnackbarSeverity("success");
          setSnackbarOpen(true);
        }

        // ✅ Start proctoring after submission is ready
        if (!proctoringControllerRef.current) {
          const controller = startProctoring({
            submissionId: studentSubmissionDocId,
            examId,
            studentId: user.id,
            studentName: user.name || user.email || "Student",
            requireFullscreen: false,
            severityMap: {
              visibilityHidden: "high",
              windowBlur: "high",
              keyMacScreenshot: "high",
              keyPrintScreen: "high",
              beforePrint: "high",
              contextMenu: "medium",
              copy: "high",
              paste: "high",
              afterPrint: "low",
            },
          });
          proctoringControllerRef.current = controller;
        }
      } catch (error) {
        console.error("[Setup] Error:", error);
        setSnackbarMessage("Failed to load exam. Please try again.");
        setSnackbarSeverity("error");
        setSnackbarOpen(true);
        handleBackToList();
      } finally {
        setLoading(false);
      }
    };

    fetchExamDataAndSetupSubmission();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      // ✅ Stop proctoring when unmounting
      if (proctoringControllerRef.current) {
        stopProctoring(proctoringControllerRef.current);
        proctoringControllerRef.current = null;
      }
    };
  }, [examId, user, isAuthLoading, navigate, handleBackToList, handleSubmitExam]);

  useEffect(() => {
    if (!loading && exam && submissionId && timeLeft > 0) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [loading, exam, submissionId, timeLeft]);

  useEffect(() => {
    if (timeLeft === 0 && !loading && exam && submissionId && !submitDialogOpen && !finishEarlyDialogOpen) {
      handleSubmitExam(submissionIdRef.current, examRef.current?.duration * 60, studentAnswersRef.current, 0);
    }
  }, [timeLeft, loading, submitDialogOpen, finishEarlyDialogOpen, handleSubmitExam, exam, submissionId]);

  const handleAnswerChange = useCallback((questionId, answer) => {
    setStudentAnswers((prev) => ({ ...prev, [questionId]: answer }));
  }, []);

  const handleClearResponse = useCallback(() => {
    const currentQuestionId = questions[currentQuestionIndex]?.id;
    if (currentQuestionId) {
      setStudentAnswers((prevAnswers) => {
        const newAnswers = { ...prevAnswers };
        delete newAnswers[currentQuestionId];
        studentAnswersRef.current = newAnswers;
        return newAnswers;
      });
      setSnackbarMessage("Response cleared for this question.");
      setSnackbarSeverity("info");
      setSnackbarOpen(true);
      saveStudentAnswersToDb();
    }
  }, [currentQuestionIndex, questions, saveStudentAnswersToDb]);

  if (loading || isAuthLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh" bgcolor="#f0f4f8">
        <CircularProgress sx={{ color: "#673ab7" }} />
        <Typography variant="body1" sx={{ ml: 2, color: "#673ab7" }}>
          Loading exam...
        </Typography>
      </Box>
    );
  }

  if (!exam || questions.length === 0) {
    return (
      <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" minHeight="100vh" bgcolor="#f0f4f8" p={4}>
        <Typography variant="h5" color="text.secondary" sx={{ mb: 2 }}>
          Exam not found or data missing.
        </Typography>
        <button onClick={handleBackToList}>Back to Exam List</button>
      </Box>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
  const answeredCount = questions.filter((q) => isQuestionAnswered(q, studentAnswers)).length;
  const totalQuestions = questions.length;

  return (
    <Box
      sx={{
        background: "linear-gradient(135deg, #e8f5e9, #c8e6c9)",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        py: { xs: 2, md: 4 },
        px: { xs: 1, md: 2 },
      }}
    >
      <Grid
        container
        spacing={3}
        sx={{ width: "100%", margin: "0 auto", flexGrow: 1, height: "100%", alignItems: "flex-start", justifyContent: "center" }}
      >
        <Grid item xs={12} sm={12} md={12} sx={{ display: "flex", justifyContent: "center" }}>
          <Paper
            elevation={6}
            sx={{
              width: "800px",
              maxWidth: "100%",
              borderRadius: "20px",
              p: { xs: 2, md: 4 },
              bgcolor: "#ffffff",
              boxShadow: "0 8px 30px rgba(0,0,0,0.15)",
              height: "700px",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <ExamHeader
              examTitle={exam.title}
              timeLeft={timeLeft}
              formatTime={formatTime}
              progress={progress}
              currentQuestionIndex={currentQuestionIndex}
              totalQuestions={questions.length}
              answeredCount={answeredCount}
              questions={questions}
              isQuestionAnswered={isQuestionAnswered}
              studentAnswers={studentAnswers}
              onBack={handleBackToList}
              onSelectQuestion={setCurrentQuestionIndex}
            />

            <Box sx={{ flexGrow: 1, overflowY: "auto" }}>
              <StudentQuestionDisplay
                question={currentQuestion}
                index={currentQuestionIndex}
                studentAnswer={studentAnswers[currentQuestion.id]}
                onAnswerChange={(answer) => handleAnswerChange(currentQuestion.id, answer)}
              />
            </Box>

            <ExamFooter
              isLastQuestion={currentQuestionIndex === questions.length - 1}
              onPrev={() => currentQuestionIndex > 0 && setCurrentQuestionIndex((i) => i - 1)}
              onNext={() =>
                currentQuestionIndex < questions.length - 1 && setCurrentQuestionIndex((i) => i + 1)
              }
              onClear={handleClearResponse}
              onOpenSubmit={() => setSubmitDialogOpen(true)}
              onFinishEarly={() => setFinishEarlyDialogOpen(true)}
              disablePrev={currentQuestionIndex === 0}
            />
          </Paper>
        </Grid>
      </Grid>

      <SubmitDialog
        open={submitDialogOpen}
        onClose={() => setSubmitDialogOpen(false)}
        onSubmit={() => handleSubmitExam()}
        answeredCount={answeredCount}
        totalQuestions={totalQuestions}
        fullScreen={isMobile}
      />

      <FinishEarlyDialog
        open={finishEarlyDialogOpen}
        onClose={() => setFinishEarlyDialogOpen(false)}
        onConfirm={() => {
          setFinishEarlyDialogOpen(false);
          setSubmitDialogOpen(true);
        }}
        fullScreen={isMobile}
        timeLeftLabel={formatTime(timeLeft)}
      />

      <Notifier
        open={snackbarOpen}
        onClose={handleSnackbarClose}
        severity={snackbarSeverity}
        message={snackbarMessage}
      />
    </Box>
  );
};

export default StudentTakeExam;
