import React from 'react';
import { Box, TextField, Typography } from "@mui/material";

const TrueFalseForm = ({ question, onChange }) => {
  const handleQuestionChange = (field, value) => {
    onChange({ ...question, [field]: value });
  };

  const handleMediaChange = (file) => {
    onChange({ ...question, media: file });
  };

  return (
    <>
      <TextField
        fullWidth
        label="Question Text"
        multiline
        rows={2}
        value={question.question || ""}
        onChange={(e) => handleQuestionChange("question", e.target.value)}
        margin="normal"
        variant="outlined"
      />
      <TextField
        fullWidth
        type="file"
        inputProps={{ accept: "image/*,video/*" }}
        onChange={(e) => handleMediaChange(e.target.files[0])}
        margin="normal"
        variant="outlined"
        sx={{ mt: 2 }}
      />
      <Typography sx={{ mt: 2, mb: 1 }} color="text.secondary">Options: True / False (default)</Typography>
      <TextField
        fullWidth
        label="Correct Answer"
        value={question.answer || ""}
        onChange={(e) => handleQuestionChange("answer", e.target.value)}
        margin="normal"
        variant="outlined"
        sx={{ mt: 2 }}
      />
    </>
  );
};

export default TrueFalseForm;