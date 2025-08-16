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
    if (readonly) return;
    onChange({ ...question, [field]: value });
  };

  // Update an option
  const handleOptionChange = (index, value) => {
    if (readonly) return;
    const updatedOptions = [...question.options];
    updatedOptions[index] = value;
    onChange({ ...question, options: updatedOptions });
  };

  // Add option
  const addOption = () => {
    if (readonly) return;
    onChange({ ...question, options: [...question.options, ""] });
  };

  // Delete option
  const deleteOption = (index) => {
    if (readonly) return;
    const updatedOptions = question.options.filter((_, i) => i !== index);
    onChange({ ...question, options: updatedOptions });
    if (question.answer === question.options[index]) {
      handleQuestionChange("answer", "");
    }
  };

  // Media handling
  const handleMediaChange = (file) => {
    if (readonly) return;
    onChange({ ...question, media: file });
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result);
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }
  };

  const deleteMedia = () => {
    if (readonly) return;
    handleMediaChange(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Set preview if question already has media
  React.useEffect(() => {
    if (!question.media) {
      setPreview(null);
      return;
    }

    if (question.media instanceof File) {
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result);
      reader.readAsDataURL(question.media);
    } else {
      // Already a string (URL or base64 from DB)
      setPreview(question.media);
    }
  }, [question.media]);

  return (
    <>
      {/* Question Text */}
      <TextField
        fullWidth
        label="Question Text"
        multiline
        rows={2}
        value={question.question || ""}
        onChange={(e) => handleQuestionChange("question", e.target.value)}
        margin="normal"
        variant="outlined"
        disabled={readonly}
      />

      {/* File Upload (hide completely in readonly) */}
      {!readonly && (
        <Box sx={{ mt: 2, display: "flex", alignItems: "center", gap: 2 }}>
          <TextField
            fullWidth
            type="file"
            inputRef={fileInputRef}
            inputProps={{ accept: "image/*,video/*" }}
            onChange={(e) => handleMediaChange(e.target.files[0])}
            margin="normal"
            variant="outlined"
          />
          {preview && (
            <IconButton color="error" onClick={deleteMedia}>
              <DeleteIcon />
            </IconButton>
          )}
        </Box>
      )}

      {/* Preview for image/video */}
      {preview && (
        <Box sx={{ mt: 2, textAlign: "center" }}>
          {question.media.type?.startsWith("video") ? (
            <video
              src={preview}
              controls
              style={{ maxWidth: "100%", maxHeight: 200 }}
            />
          ) : (
            <img
              src={preview}
              alt="Preview"
              style={{ maxWidth: "100%", maxHeight: 200 }}
            />
          )}
        </Box>
      )}

      {/* Options */}
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
              disabled={readonly}
            />
            {/* Delete Option Button */}
            {!readonly && (
              <IconButton
                color="error"
                onClick={() => deleteOption(i)}
                sx={{ ml: 1 }}
                disabled={question.options.length <= 1}
              >
                <DeleteIcon />
              </IconButton>
            )}
          </Box>
        ))}
        {/* Add Option Button */}
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

      {/* Correct Answer */}
      <FormControl fullWidth sx={{ mt: 2 }}>
        <InputLabel id="correct-answer-label">Correct Answer</InputLabel>
        <Select
          labelId="correct-answer-label"
          value={question.answer || ""}
          label="Correct Answer"
          onChange={(e) => handleQuestionChange("answer", e.target.value)}
          disabled={readonly}
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
