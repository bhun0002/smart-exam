import React from "react";
import { Box, TextField, IconButton, Typography } from "@mui/material";
import { Add as AddIcon, Delete as DeleteIcon } from "@mui/icons-material";

const TrueFalseForm = ({ question, onChange, readonly = false }) => {
  const [preview, setPreview] = React.useState(null);
  const fileInputRef = React.useRef(null);
  const handleQuestionChange = (field, value) => {
    if (readonly) return; // <-- disable editing
    onChange({ ...question, [field]: value });
  };

  const deleteMedia = () => {
    handleMediaChange(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Update media file and preview
  const handleMediaChange = (file) => {
    if (readonly) return; // <-- disable editing
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
  // Set preview if examData has media
  React.useEffect(() => {
    if (question.media && !(question.media instanceof File)) {
      setPreview(question.media);
    }
  }, [question.media]);

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
        disabled={readonly} // <-- readonly disables input
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
      <Typography sx={{ mt: 2, mb: 1 }} color="text.secondary">
        Options: True / False (default)
      </Typography>
      <TextField
        fullWidth
        label="Correct Answer"
        value={question.answer || ""}
        onChange={(e) => handleQuestionChange("answer", e.target.value)}
        margin="normal"
        variant="outlined"
        sx={{ mt: 2 }}
        disabled={readonly} // <-- readonly disables input
      />
    </>
  );
};

export default TrueFalseForm;
