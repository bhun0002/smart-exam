import React, { useState } from "react";
import { db } from "../firebaseConfig";
import axios from "axios";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  TextField,
  Typography,
} from "@mui/material";
import { Add as AddIcon } from "@mui/icons-material";
import { List, arrayMove } from "react-movable";

import QuestionRenderer from "./questionForms";

const questionTypeColors = {
  "multiple-choice": "#f0f4f7",
  "true-false": "#e8f5e9",
  "match": "#e3f2fd",
  "fill-blanks": "#fff3e0",
  "short-answer": "#ffebee",
  "reasoning": "#fce4ec",
};

const TutorForm = () => {
  const [title, setTitle] = useState("");
  const [duration, setDuration] = useState("");
  const [questions, setQuestions] = useState([
    { type: "multiple-choice", question: "", options: ["", ""], answer: "", media: null },
  ]);

 // Add question
  const addQuestion = (type) => {
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
    const updated = [...questions];
    updated[index] = newQuestionData;
    setQuestions(updated);
  };

  const deleteQuestion = (index) => {
    if (window.confirm("Are you sure you want to delete this question?")) {
      const updated = [...questions];
      updated.splice(index, 1);
      setQuestions(updated);
    }
  };

  const moveQuestion = (index, direction) => {
    const updated = [...questions];
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= updated.length) return;
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    setQuestions(updated);
  };

  // --- CLOUDINARY MEDIA UPLOAD FUNCTION ---
  const uploadMedia = async (file) => {
    if (!file) return null;
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
        questions: questionsWithMediaUrls,
        createdAt: serverTimestamp(),
      });
      alert("Exam saved!");
      setTitle("");
      setDuration("");
      setQuestions([{ type: "multiple-choice", question: "", options: ["", ""], answer: "", media: null }]);
    } catch (err) {
      console.error("Firestore error:", err);
      alert("Error saving exam! " + err.message);
    }
  };

  return (
    <Box sx={{ maxWidth: 900, margin: "20px auto", padding: 4, backgroundColor: "#ffffff", borderRadius: 4, boxShadow: "0px 10px 30px rgba(0,0,0,0.08)" }}>
      <Typography variant="h4" gutterBottom textAlign="center" fontWeight="bold" color="primary">
        Create a New Exam
      </Typography>
      <Typography variant="subtitle1" gutterBottom textAlign="center" color="text.secondary" sx={{ mb: 4 }}>
        Fill in the details and add questions to build your exam.
      </Typography>

      <Card sx={{ padding: 3, mb: 4, boxShadow: "0px 4px 16px rgba(0,0,0,0.05)", borderRadius: 2 }}>
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
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Box sx={{ mt: 5, mb: 3 }}>
        <Typography variant="h6" gutterBottom fontWeight="bold">Add Questions</Typography>
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
                color: "#212121",
                "&:hover": {
                  backgroundColor: questionTypeColors[type],
                  boxShadow: "0px 2px 8px rgba(0,0,0,0.15)",
                },
              }}
              startIcon={<AddIcon />}
            >
              {type.replace("-", " ")}
            </Button>
          ))}
        </Box>
      </Box>

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
              onDelete={() => deleteQuestion(index)}
              onMoveUp={() => moveQuestion(index, -1)}
              onMoveDown={() => moveQuestion(index, 1)}
              isFirst={index === 0}
              isLast={index === questions.length - 1}
              onChange={(newQuestionData) => handleQuestionState(index, newQuestionData)}
            />
          )}
        />

        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
          <Button type="submit" variant="contained" color="primary" size="large" sx={{ py: 1.5, px: 5 }}>
            Save Exam
          </Button>
        </Box>
      </form>
    </Box>
  );
};

export default TutorForm;