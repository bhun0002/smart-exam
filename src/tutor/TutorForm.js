// src/tutor/TutorForm.jsx

import React, { useState, useEffect } from "react";
import { db } from "../firebaseConfig";
import axios from "axios";
import { collection, addDoc, serverTimestamp, doc, updateDoc } from "firebase/firestore";
import QuestionRenderer from "./questionForms"; // Ensure this path is correct
import { motion } from 'framer-motion';

import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  TextField,
  Typography,
  Paper,
  Zoom,
  InputAdornment,
  Snackbar,
  Alert as MuiAlert,
} from "@mui/material";
import {
  Add as AddIcon,
  Save as SaveIcon,
  ArrowUpward as ArrowUpwardIcon,
  Search as SearchIcon,
} from "@mui/icons-material";
import { List, arrayMove } from "react-movable";

const MotionBox = motion(Box);

const questionTypeColors = {
  "multiple-choice": "#e3f2fd",
  "true-false": "#e8f5e9",
  "match": "#fffde7",
  "fill-blanks": "#f3e5f5",
  "short-answer": "#fbe9e7",
  "reasoning": "#ede7f6",
};

const generateUniqueId = () => Math.random().toString(36).substring(2, 9);

const TutorForm = ({ examData = null, readonly = false, onSaveSuccess }) => {
  const [title, setTitle] = useState(examData?.title || "");
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [isSnackbarOpen, setIsSnackbarOpen] = useState(false);
  const [duration, setDuration] = useState(examData?.duration || "");
  const [questions, setQuestions] = useState(
    examData?.questions || [
      {
        type: "multiple-choice",
        question: "",
        options: [
          { id: generateUniqueId(), text: "" },
          { id: generateUniqueId(), text: "" },
        ],
        answer: "",
        media: null,
      },
    ]
  );
  const [showScroll, setShowScroll] = useState(false);
  const [questionNumber, setQuestionNumber] = useState("");
  const [searchError, setSearchError] = useState("");
  const [formError, setFormError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const handleCloseSnackbar = () => {
    setIsSnackbarOpen(false);
  };

  useEffect(() => {
    if (examData) {
      setTitle(examData.title);
      setDuration(examData.duration);
      const transformedQuestions = examData.questions.map(q => {
        if (q.type === 'multiple-choice' && q.options.every(opt => typeof opt === 'string')) {
          return {
            ...q,
            options: q.options.map(text => ({ id: generateUniqueId(), text })),
          };
        }
        return q;
      });
      setQuestions(transformedQuestions);
    } else {
      // Reset form fields when no examData is provided (for "Create" mode or initial load)
      setTitle("");
      setDuration("");
      setQuestions([
        {
          type: "multiple-choice",
          question: "",
          options: [
            { id: generateUniqueId(), text: "" },
            { id: generateUniqueId(), text: "" },
          ],
          answer: "",
          media: null,
        },
      ]);
    }
  }, [examData]); // Re-run when examData changes

  const checkScrollTop = () => {
    if (!showScroll && window.pageYOffset > 400) {
      setShowScroll(true);
    } else if (showScroll && window.pageYOffset <= 400) {
      setShowScroll(false);
    }
  };

  const scrollTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToQuestion = (number) => {
    const parsedNumber = parseInt(number, 10);
    setSearchError("");

    if (isNaN(parsedNumber) || parsedNumber < 1 || parsedNumber > questions.length) {
      setSearchError(`Please enter a number from 1 to ${questions.length}.`);
      return;
    }

    const element = document.getElementById(`question-${parsedNumber - 1}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  useEffect(() => {
    window.addEventListener('scroll', checkScrollTop);
    return () => {
      window.removeEventListener('scroll', checkScrollTop);
    };
  }, [showScroll]);

  const addQuestion = (type) => {
    if (readonly) return;
    const newQuestion = { type, media: null };
    if (type === "multiple-choice") {
      newQuestion.options = [
        { id: generateUniqueId(), text: "" },
        { id: generateUniqueId(), text: "" },
      ];
    }
    if (type === "true-false") newQuestion.options = ["True", "False"];
    if (["fill-blanks", "short-answer", "reasoning"].includes(type)) newQuestion.options = [];
    if (type !== "match") newQuestion.question = "";
    if (type !== "match") newQuestion.answer = "";
    if (type === "match") newQuestion.matchPairs = [{ left: "", right: "" }];
    setQuestions([...questions, newQuestion]);
  };

  const handleQuestionState = (index, newQuestionData) => {
    if (readonly) return;
    const updated = [...questions];
    updated[index] = newQuestionData;
    setQuestions(updated);
  };

  const deleteQuestion = (index) => {
    if (readonly) return;
    if (window.confirm("Are you sure you want to delete this question?")) {
      const updated = [...questions];
      updated.splice(index, 1);
      setQuestions(updated);
    }
  };

  const moveQuestion = (index, direction) => {
    if (readonly) return;
    const updated = [...questions];
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= updated.length) return;
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    setQuestions(updated);
  };

  const uploadMedia = async (file) => {
    if (readonly || !file) return null;
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET);

      const cloudName = process.env.REACT_APP_CLOUDINARY_URL.split("@")[1];
      const response = await axios.post(
        `https://api.cloudinary.com/v1_1/${cloudName}/upload`,
        formData
      );
      return response.data.secure_url;
    } catch (err) {
      console.error("Cloudinary upload error:", err);
      alert("Failed to upload media!"); // Consider using a Snackbar instead of alert
      return null;
    }
  };

  const validateQuestions = () => {
    if (readonly) return null;

    if (!title || title.trim() === "") {
      return { message: "Please enter a valid Exam Title.", fieldId: "exam-title" };
    }
    if (!duration || duration <= 0) {
      return { message: "Please enter a valid Exam Duration.", fieldId: "exam-duration" };
    }

    if (questions.length === 0) {
      return { message: "Add at least one question to save the exam.", fieldId: "add-question-buttons" };
    }

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      const questionId = `question-${i}`;

      if (q.type !== "match" && (!q.question || q.question.trim() === "")) {
        return { message: `Question ${i + 1}: Question text cannot be empty.`, fieldId: `${questionId}-question-text` };
      }

      if (q.type === "multiple-choice") {
        if (!q.options || q.options.length < 2) {
          return { message: `Question ${i + 1}: Multiple-choice questions must have at least 2 options.`, fieldId: `${questionId}-options` };
        }
        for (let j = 0; j < q.options.length; j++) {
          if (!q.options[j].text || q.options[j].text.trim() === "") {
            return { message: `Question ${i + 1}: Option ${j + 1} cannot be empty.`, fieldId: `${questionId}-option-${j}` };
          }
        }
        if (!q.answer || q.answer.trim() === "") {
          return { message: `Question ${i + 1}: A correct answer must be selected.`, fieldId: `${questionId}-answer` };
        }
      }

      if (q.type === "true-false") {
        if (!q.question || q.question.trim() === "") {
          return { message: `Question ${i + 1}: Question text cannot be empty.`, fieldId: `${questionId}-question-text` };
        }
        if (!q.answer || q.answer.trim() === "") {
          return { message: `Question ${i + 1}: Correct answer must be selected.`, fieldId: `${questionId}-answer` };
        }
      }

      if (["fill-blanks", "short-answer", "reasoning"].includes(q.type)) {
        if (!q.question || q.question.trim() === "") {
          return { message: `Question ${i + 1}: Question text cannot be empty.`, fieldId: `${questionId}-question-text` };
        }
        if (!q.answer || q.answer.trim() === "") {
          return { message: `Question ${i + 1}: Answer cannot be empty.`, fieldId: `${questionId}-answer` };
        }
      }

      if (q.type === "match") {
        if (!q.matchPairs || q.matchPairs.length === 0) {
          return { message: `Question ${i + 1}: Add at least one matching pair.`, fieldId: `${questionId}-match-pairs` };
        }
        for (let k = 0; k < q.matchPairs.length; k++) {
          const pair = q.matchPairs[k];
          if (!pair.left || pair.left.trim() === "" || !pair.right || pair.right.trim() === "") {
            return { message: `Question ${i + 1}: Match pair ${k + 1} cannot have empty fields.`, fieldId: `${questionId}-match-pair-${k}` };
          }
        }
      }
    }

    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setFieldErrors({});

    if (readonly) return; // Prevent submission in read-only mode

    const validationError = validateQuestions();
    if (validationError) {
      setFormError(validationError.message);
      setFieldErrors({ [validationError.fieldId]: validationError.message });
      const firstInvalidField = document.getElementById(validationError.fieldId);
      if (firstInvalidField) {
        firstInvalidField.scrollIntoView({ behavior: 'smooth', block: 'center' });
        firstInvalidField.focus();
      }
      return;
    }

    try {
      const questionsWithMediaUrls = await Promise.all(
        questions.map(async (q) => {
          if (q.media instanceof File) {
            const url = await uploadMedia(q.media);
            return { ...q, media: url };
          }
          return q;
        })
      );

      const examDataToSave = {
        title,
        duration: Number(duration),
        isDeleted: 0,
        questions: questionsWithMediaUrls,
      };

      if (examData && examData.id) {
        // EDITING: Update the existing document
        const examRef = doc(db, "exams", examData.id);
        await updateDoc(examRef, {
          ...examDataToSave,
          updatedAt: serverTimestamp(),
        });
        setSnackbarMessage("Exam updated successfully! ✅");
      } else {
        // CREATING: Add a new document
        await addDoc(collection(db, "exams"), {
          ...examDataToSave,
          createdAt: serverTimestamp(),
        });
        setSnackbarMessage("Exam saved successfully! ✅");
      }
      
      setIsSnackbarOpen(true);

      // Call onSaveSuccess if provided (for parent component to close modal and refresh list)
      if (onSaveSuccess) {
        // Delay calling onSaveSuccess to allow Snackbar to be visible for a moment
        setTimeout(() => {
            onSaveSuccess();
        }, 2000); 
      } else {
        // Only reload if it's a standalone form and not handled by a parent (e.g., /create-exam page)
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      }

    } catch (err) {
      console.error("Firestore error:", err);
      setFormError("Error saving exam! " + err.message);
    }
  };

  return (
    <Box
      sx={{
        background: 'linear-gradient(135deg, #FFD1DC, #B2EBF2)',
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Paper elevation={12} sx={{ padding: { xs: 3, md: 5 }, borderRadius: '24px', backgroundColor: '#ffffff' }}>
        <Typography variant="h4" gutterBottom textAlign="center" fontWeight="bold" color="#37474f">
          {readonly ? "View Exam" : (examData ? "Edit Exam" : "Create a New Exam")}
        </Typography>
        <Typography variant="subtitle1" gutterBottom textAlign="center" color="text.secondary" sx={{ mb: 4 }}>
          {readonly ? "You are viewing this exam in read-only mode." : (examData ? "Modify the exam details and questions." : "Fill in the details and add questions to build your exam.")}
        </Typography>

        {/* Exam title and duration */}
        <Card sx={{ padding: 3, mb: 4, boxShadow: "0px 4px 16px rgba(0,0,0,0.05)", borderRadius: '16px' }}>
          <CardContent>
            <Grid container spacing={3}>
              <Grid item xs={12} md={8}>
                <TextField
                  label="Exam Title"
                  id="exam-title"
                  fullWidth
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (fieldErrors['exam-title']) {
                      setFieldErrors(prev => ({ ...prev, 'exam-title': '' }));
                    }
                  }}
                  required
                  variant="outlined"
                  disabled={readonly}
                  error={!!fieldErrors['exam-title']}
                  helperText={fieldErrors['exam-title']}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '12px',
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  label="Duration (minutes)"
                  id="exam-duration"
                  fullWidth
                  type="number"
                  value={duration}
                  onChange={(e) => {
                    const numericValue = e.target.value.replace(/[^0-9]/g, '');
                    setDuration(numericValue);
                    if (fieldErrors['exam-duration']) {
                      setFieldErrors(prev => ({ ...prev, 'exam-duration': '' }));
                    }
                  }}
                  required
                  variant="outlined"
                  disabled={readonly}
                  error={!!fieldErrors['exam-duration']}
                  helperText={fieldErrors['exam-duration']}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '12px',
                    },
                  }}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Question type buttons and search */}
        {!readonly && (
          <Box sx={{ mt: 5, mb: 3 }} id="add-question-buttons">
            <Typography variant="h6" gutterBottom fontWeight="bold" color="#546e7a">
              Add Questions
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Click a button to add a new question type to your exam.
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
              {["multiple-choice", "true-false", "fill-blanks", "short-answer", "match", "reasoning"].map((type) => (
                <Button
                  key={type}
                  variant="contained"
                  onClick={() => addQuestion(type)}
                  sx={{
                    textTransform: "capitalize",
                    backgroundColor: questionTypeColors[type],
                    color: "#455a64",
                    borderRadius: '12px',
                    fontWeight: 'bold',
                    transition: 'all 0.3s ease-in-out',
                    '&:hover': {
                      backgroundColor: questionTypeColors[type],
                      transform: 'translateY(-2px)',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    },
                  }}
                  startIcon={<AddIcon />}
                >
                  {type.replace("-", " ")}
                </Button>
              ))}
            </Box>

            <Box sx={{ mt: 3, display: 'flex', alignItems: 'center' }}>
              <TextField
                label="Jump to Question #"
                type="number"
                value={questionNumber}
                onChange={(e) => {
                  setQuestionNumber(e.target.value);
                  scrollToQuestion(e.target.value);
                }}
                error={!!searchError}
                helperText={searchError}
                sx={{ width: 220 }}
                size="small"
                variant="outlined"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                  sx: { borderRadius: '12px' }
                }}
              />
            </Box>
          </Box>
        )}

        {/* Questions list */}
        <form onSubmit={handleSubmit}>
          <List
            values={questions}
            onChange={({ oldIndex, newIndex }) => setQuestions(arrayMove(questions, oldIndex, newIndex))}
            renderList={({ children, props }) => <Box {...props}>{children}</Box>}
            renderItem={({ value, props, index }) => {
              const { key, ...restProps } = props;
              return (
                <QuestionRenderer
                  key={key}
                  question={value}
                  index={index}
                  {...restProps}
                  questionTypeColors={questionTypeColors}
                  onDelete={readonly ? undefined : () => deleteQuestion(index)}
                  onMoveUp={readonly ? undefined : () => moveQuestion(index, -1)}
                  onMoveDown={readonly ? undefined : () => moveQuestion(index, 1)}
                  isFirst={index === 0}
                  isLast={index === questions.length - 1}
                  fieldErrors={fieldErrors}
                  setFieldErrors={setFieldErrors}
                  onChange={readonly ? undefined : (newQuestionData) => handleQuestionState(index, newQuestionData)}
                  readonly={readonly}
                  id={`question-${index}`}
                />
              );
            }}
          />
          {formError && (
            <MotionBox
              animate={{ backgroundColor: ["#fbe9e7", "#f4b39b", "#fbe9e7"] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              sx={{
                mt: 2,
                textAlign: "center",
                color: "black",
                fontWeight: "bold",
                borderRadius: "8px",
                py: 1,
              }}
            >
              <Typography variant="body1">{formError}</Typography>
            </MotionBox>
          )}
          {!readonly && (
            <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
              <Button
                type="submit"
                variant="contained"
                startIcon={<SaveIcon />}
                size="large"
                sx={{
                  py: 1.5,
                  px: 5,
                  borderRadius: '12px',
                  backgroundColor: '#607d8b',
                  fontWeight: 'bold',
                  '&:hover': {
                    backgroundColor: '#455a64',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  },
                  transition: 'all 0.3s ease-in-out',
                }}
              >
                {examData ? "Save Changes" : "Save Exam"}
              </Button>
            </Box>
          )}
        </form>
      </Paper>

      {/* Go to Top Button */}
      <Zoom in={showScroll}>
        <Button
          onClick={scrollTop}
          variant="contained"
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            borderRadius: '50%',
            width: 56,
            height: 56,
            minWidth: 0,
            backgroundColor: '#607d8b',
            '&:hover': {
              backgroundColor: '#455a64',
            },
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          }}
        >
          <ArrowUpwardIcon sx={{ color: 'white', fontSize: 32 }} />
        </Button>
      </Zoom>

      {/* Snackbar for notifications */}
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
          <MuiAlert
            onClose={handleCloseSnackbar}
            severity="success"
            elevation={6}
            variant="filled"
            sx={{
              backgroundColor: "transparent",
            }}
          >
            {snackbarMessage}
          </MuiAlert>
        </motion.div>
      </Snackbar>
    </Box>
  );
};

export default TutorForm;