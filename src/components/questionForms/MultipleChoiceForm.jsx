import React from "react";
import {
  Box,
  Button,
  TextField,
  IconButton,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Typography,
} from "@mui/material";
import { Add as AddIcon, Delete as DeleteIcon } from "@mui/icons-material";

const MultipleChoiceForm = ({ question, onChange, readonly = false }) => {
  const [preview, setPreview] = React.useState(null);
  const fileInputRef = React.useRef(null);

  // Update question fields
  const handleQuestionChange = (field, value) => {
    if (readonly) return; // <-- disable editing in readonly mode
    onChange({
      ...question,
      [field]: value,
    });
  };

  // Update an option's text
  const handleOptionChange = (index, value) => {
    if (readonly) return; // <-- disable editing in readonly mode
    const updatedOptions = [...question.options];
    updatedOptions[index] = value;
    onChange({
      ...question,
      options: updatedOptions,
    });
    // Do NOT reset correct answer here to avoid blocking typing
  };

  // Add a new empty option
  const addOption = () => {
    if (readonly) return; // <-- disable editing in readonly mode
    onChange({
      ...question,
      options: [...question.options, ""],
    });
  };

  // Delete an option
  const deleteOption = (index) => {
    if (readonly) return; // <-- disable editing in readonly mode
    const updatedOptions = question.options.filter((_, i) => i !== index);
    onChange({
      ...question,
      options: updatedOptions,
    });

    // Only reset correct answer if the deleted option was the current answer
    if (question.answer === question.options[index]) {
      handleQuestionChange("answer", "");
    }
  };

  // Update media file and preview

  const deleteMedia = () => {
    handleMediaChange(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleMediaChange = (file) => {
    onChange({
      ...question,
      media: file,
    });

    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }
  };

  return (
    <>
      {/* Question text */}
      <TextField
        fullWidth
        label="Question Text"
        multiline
        rows={2}
        value={question.question || ""}
        onChange={(e) => handleQuestionChange("question", e.target.value)}
        margin="normal"
        variant="outlined"
        disabled={readonly} // <-- readonly mode disables input
      />
 {!readonly && (
      <Box sx={{ mt: 2, display: "flex", alignItems: "center", gap: 2 }}>
        <TextField
          fullWidth
          type="file"
          inputRef={fileInputRef} // added this line
          inputProps={{ accept: "image/*,video/*" }}
          onChange={(e) => handleMediaChange(e.target.files[0])}
          margin="normal"
          variant="outlined"
          disabled={readonly} // <-- readonly mode disables input
        />
         {preview && (
          <IconButton color="error" onClick={deleteMedia}>
            <DeleteIcon />
          </IconButton>
        )}
      </Box>
)}
      {preview && (
        <Box sx={{ mt: 1 }}>
          <Typography variant="subtitle2">Preview:</Typography>
          {question.media?.type?.startsWith("image/") ? (
            <img
              src={preview}
              alt="Preview"
              style={{ maxWidth: "100%", maxHeight: 200 }}
            />
          ) : (
            <video
              src={preview}
              controls
              style={{ maxWidth: "100%", maxHeight: 200 }}
            />
          )}
        </Box>
      )}
      {/* Options list */}
      <Box sx={{ mt: 2 }}>
        {question.options.map((opt, i) => (
          <Box key={i} sx={{ display: "flex", alignItems: "center", mt: 1 }}>
            <TextField
              fullWidth
              label={`Option ${i + 1}`}
              value={opt}
              onChange={(e) => handleOptionChange(i, e.target.value)}
              margin="dense"
              variant="outlined"
              disabled={readonly} // <-- readonly disables input
            />
            {!readonly && (
            <IconButton
              color="error"
              onClick={() => deleteOption(i)}
              sx={{ ml: 1 }}
              disabled={question.options.length <= 1} // prevent deleting last option
            >
              <DeleteIcon />
            </IconButton>
             )}
          </Box>
        ))}
        {!readonly && (
        <Button
          startIcon={<AddIcon />}
          onClick={addOption}
          variant="outlined"
          sx={{ mt: 1 }}
        >
          Add Option
        </Button>
        )}
      </Box>

      {/* Correct Answer Dropdown */}
      <FormControl fullWidth sx={{ mt: 2 }}>
        <InputLabel id="correct-answer-label">Correct Answer</InputLabel>
        <Select
          labelId="correct-answer-label"
          value={question.answer || ""}
          label="Correct Answer"
          onChange={(e) => handleQuestionChange("answer", e.target.value)}
          disabled={readonly} // <-- readonly disables select
        >
          {question.options.map((opt, i) => (
            <MenuItem key={i} value={opt}>
              {opt || `Option ${i + 1}`}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </>
  );
};

export default MultipleChoiceForm;
