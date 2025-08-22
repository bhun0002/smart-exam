// src/tutor/TutorForm.jsx

import React, { useState, useEffect } from "react";
import { db } from "../firebaseConfig";
import axios from "axios";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import QuestionRenderer from "./questionForms";

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
  InputAdornment, // Added InputAdornment for the integrated icon
} from "@mui/material";
import {
  Add as AddIcon,
  Save as SaveIcon,
  ArrowUpward as ArrowUpwardIcon,
  Search as SearchIcon,
} from "@mui/icons-material";
import { List, arrayMove } from "react-movable";

// New, softer pastel colors
const questionTypeColors = {
  "multiple-choice": "#e3f2fd", // Lighter blue
  "true-false": "#e8f5e9", // Lighter green
  "match": "#fffde7", // Lighter yellow
  "fill-blanks": "#f3e5f5", // Lighter purple
  "short-answer": "#fbe9e7", // Lighter coral
  "reasoning": "#ede7f6", // Lighter lavender
};

const TutorForm = ({ examData = null, readonly = false }) => {
  // --- Form state ---
  const [title, setTitle] = useState(examData?.title || "");
  const [duration, setDuration] = useState(examData?.duration || "");
  const [questions, setQuestions] = useState(
    examData?.questions || [
      { type: "multiple-choice", question: "", options: ["", ""], answer: "", media: null },
    ]
  );
  const [showScroll, setShowScroll] = useState(false);
  const [questionNumber, setQuestionNumber] = useState("");
  // New state for handling in-line validation error
  const [searchError, setSearchError] = useState("");

  // Update state if examData changes (for modal view)
  useEffect(() => {
    if (examData) {
      setTitle(examData.title);
      setDuration(examData.duration);
      setQuestions(examData.questions);
    }
  }, [examData]);

  // Handle "Go to Top" button visibility
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

  // UPDATED function to scroll to a specific question
  const scrollToQuestion = (number) => {
    const parsedNumber = parseInt(number, 10);
    // Clear previous error
    setSearchError("");

    // Input validation: check if the number is valid
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

  // Add question
  const addQuestion = (type) => {
    if (readonly) return;
    const newQuestion = { type, media: null };
    if (type === "multiple-choice") newQuestion.options = ["", ""];
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

  // --- CLOUDINARY MEDIA UPLOAD FUNCTION ---
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
      alert("Failed to upload media!");
      return null;
    }
  };

  const validateQuestions = () => {
    if (readonly) return false; // No validation in readonly mode

    // Validate exam title and duration
    if (!title || title.trim() === "" || !duration || duration <= 0) {
      alert("Please enter a valid Exam Title and Duration.");
      return false;
    }

    // Validate at least one question exists
    if (questions.length === 0) {
      alert("Add at least one question to save the exam.");
      return false;
    }

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];

      // Non-match questions must have question text
      if (q.type !== "match" && (!q.question || q.question.trim() === "")) {
        alert(`Question ${i + 1}: Question text cannot be empty.`);
        return false;
      }

      // Multiple-choice: at least 2 options, all non-empty + answer non-empty
      if (q.type === "multiple-choice") {
        if (!q.options || q.options.length < 2) {
          alert(`Question ${i + 1}: Multiple-choice questions must have at least 2 options.`);
          return false;
        }
        for (let j = 0; j < q.options.length; j++) {
          if (!q.options[j] || q.options[j].trim() === "") {
            alert(`Question ${i + 1}: Option ${j + 1} cannot be empty.`);
            return false;
          }
        }
        if (!q.answer || q.answer.trim() === "") {
          alert(`Question ${i + 1}: Correct answer cannot be empty.`);
          return false;
        }
      }

      // True/False: answer required
      if (q.type === "true-false") {
        if (!q.question || q.question.trim() === "") {
          alert(`Question ${i + 1}: Question text cannot be empty.`);
          return false;
        }
        if (!q.answer || q.answer.trim() === "") {
          alert(`Question ${i + 1}: Correct answer cannot be empty.`);
          return false;
        }
      }

      // Fill-in-the-blanks, Short Answer, Reasoning: question + answer required
      if (["fill-blanks", "short-answer", "reasoning"].includes(q.type)) {
        if (!q.question || q.question.trim() === "") {
          alert(`Question ${i + 1}: Question text cannot be empty.`);
          return false;
        }
        if (!q.answer || q.answer.trim() === "") {
          alert(`Question ${i + 1}: Correct answer cannot be empty.`);
          return false;
        }
      }

      // Match questions: all pairs must have both left/right non-empty
      if (q.type === "match") {
        if (!q.matchPairs || q.matchPairs.length === 0) {
          alert(`Question ${i + 1}: Add at least one matching pair.`);
          return false;
        }
        for (let k = 0; k < q.matchPairs.length; k++) {
          const pair = q.matchPairs[k];
          if (!pair.left || pair.left.trim() === "" || !pair.right || pair.right.trim() === "") {
            alert(`Question ${i + 1}: Match pair ${k + 1} cannot have empty fields.`);
            return false;
          }
        }
      }
    }

    return true; // All validations passed
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateQuestions()) return; // <-- stop submission if invalid
    try {
      // Upload media for each question if needed
      const questionsWithMediaUrls = await Promise.all(
        questions.map(async (q) => {
          if (q.media instanceof File) {
            const url = await uploadMedia(q.media);
            return { ...q, media: url };
          }
          return q;
        })
      );

      await addDoc(collection(db, "exams"), {
        title,
        duration: Number(duration),
        isDeleted: 0,
        questions: questionsWithMediaUrls,
        createdAt: serverTimestamp(),
      });
      alert("Exam saved!");
      window.location.reload();
    } catch (err) {
      console.error("Firestore error:", err);
      alert("Error saving exam! " + err.message);
    }
  };

  return (
    <Box
      sx={{
        background: 'linear-gradient(135deg, #FFD1DC, #B2EBF2)', // Pastel gradient
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Paper elevation={12} sx={{ padding: { xs: 3, md: 5 }, borderRadius: '24px', backgroundColor: '#ffffff' }}>
        <Typography variant="h4" gutterBottom textAlign="center" fontWeight="bold" color="#37474f">
          {readonly ? "View Exam" : "Create a New Exam"}
        </Typography>
        <Typography variant="subtitle1" gutterBottom textAlign="center" color="text.secondary" sx={{ mb: 4 }}>
          {readonly ? "You are viewing this exam in read-only mode." : "Fill in the details and add questions to build your exam."}
        </Typography>

        {/* Exam title and duration */}
        <Card sx={{ padding: 3, mb: 4, boxShadow: "0px 4px 16px rgba(0,0,0,0.05)", borderRadius: '16px' }}>
          <CardContent>
            <Grid container spacing={3}>
              <Grid item xs={12} md={8}>
                <TextField
                  label="Exam Title"
                  fullWidth
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  variant="outlined"
                  disabled={readonly}
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
                  fullWidth
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  required
                  variant="outlined"
                  disabled={readonly}
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
          <Box sx={{ mt: 5, mb: 3 }}>
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
                    color: "#455a64", // Darker text for readability
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

            {/* UPDATED Search Input with integrated icon and live scrolling */}
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
            renderItem={({ value, props, index }) => (
              <QuestionRenderer
                question={value}
                index={index}
                {...props}
                questionTypeColors={questionTypeColors}
                onDelete={readonly ? undefined : () => deleteQuestion(index)}
                onMoveUp={readonly ? undefined : () => moveQuestion(index, -1)}
                onMoveDown={readonly ? undefined : () => moveQuestion(index, 1)}
                isFirst={index === 0}
                isLast={index === questions.length - 1}
                onChange={readonly ? undefined : (newQuestionData) => handleQuestionState(index, newQuestionData)}
                readonly={readonly}
                id={`question-${index}`}
              />
            )}
          />
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
                Save Exam
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
    </Box>
  );
};

export default TutorForm;