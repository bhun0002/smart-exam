import React from 'react';
import { Box, Button, TextField, IconButton, MenuItem, Select, FormControl, InputLabel } from "@mui/material";
import { Add as AddIcon, Delete as DeleteIcon } from "@mui/icons-material";

const MultipleChoiceForm = ({ question, onChange }) => {

  // Update question fields
  const handleQuestionChange = (field, value) => {
    onChange({
      ...question,
      [field]: value
    });
  };

  // Update an option's text
  const handleOptionChange = (index, value) => {
    const updatedOptions = [...question.options];
    updatedOptions[index] = value;
    onChange({
      ...question,
      options: updatedOptions
    });
    // Do NOT reset correct answer here to avoid blocking typing
  };

  // Add a new empty option
  const addOption = () => {
    onChange({
      ...question,
      options: [...question.options, ""]
    });
  };

  // Delete an option
  const deleteOption = (index) => {
    const updatedOptions = question.options.filter((_, i) => i !== index);
    onChange({
      ...question,
      options: updatedOptions
    });

    // Only reset correct answer if the deleted option was the current answer
    if (question.answer === question.options[index]) {
      handleQuestionChange("answer", "");
    }
  };

  // Update media file
  const handleMediaChange = (file) => {
    onChange({
      ...question,
      media: file
    });
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

      <Box sx={{ mt: 2 }}>
        {question.options.map((opt, i) => (
          <Box key={i} sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
            <TextField
              fullWidth
              label={`Option ${i + 1}`}
              value={opt}
              onChange={(e) => handleOptionChange(i, e.target.value)}
              margin="dense"
              variant="outlined"
            />
            <IconButton
              color="error"
              onClick={() => deleteOption(i)}
              sx={{ ml: 1 }}
              disabled={question.options.length <= 1} // prevent deleting last option
            >
              <DeleteIcon />
            </IconButton>
          </Box>
        ))}
        <Button
          startIcon={<AddIcon />}
          onClick={addOption}
          variant="outlined"
          sx={{ mt: 1 }}
        >
          Add Option
        </Button>
      </Box>

      {/* Correct Answer Dropdown */}
      <FormControl fullWidth sx={{ mt: 2 }}>
        <InputLabel id="correct-answer-label">Correct Answer</InputLabel>
        <Select
          labelId="correct-answer-label"
          value={question.answer || ""}
          label="Correct Answer"
          onChange={(e) => handleQuestionChange("answer", e.target.value)}
        >
          {question.options.map((opt, i) => (
            <MenuItem key={i} value={opt}>{opt || `Option ${i + 1}`}</MenuItem>
          ))}
        </Select>
      </FormControl>
    </>
  );
};

export default MultipleChoiceForm;
