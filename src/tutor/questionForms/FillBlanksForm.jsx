// src/tutor/questionForms/FillBlanksForm.jsx

import React, { useState, useRef } from "react";
import { Box, TextField, IconButton, Card, CardContent, Typography } from "@mui/material";
import { Add as AddIcon, Delete as DeleteIcon, InsertPhoto as InsertPhotoIcon } from "@mui/icons-material";
import PointsField from "./PointsField";
// import axios from "axios"; // no longer needed for preview
import useMediaPreview, { isVideoFromMedia } from "../../shared/useMediaPreview";

const FillBlanksForm = ({ question, onChange, readonly = false, index, fieldErrors, setFieldErrors }) => {
  const preview = useMediaPreview(question.media);
  const fileInputRef = useRef(null);

  const handleQuestionChange = (field, value) => {
    if (readonly) return;
    onChange({ ...question, [field]: value });

    const fieldId = `question-${index}-${field}`;
    if (fieldErrors[fieldId]) {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldId];
        return newErrors;
      });
    }
  };

  const deleteMedia = () => {
    handleMediaChange(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleMediaChange = (file) => {
    if (readonly) return;
    onChange({
      ...question,
      media: file,
    });
    // preview is now derived by the hook; no manual FileReader here
  };

  // Define unique IDs
  const questionId = `question-${index}-question-text`;
  const answerId = `question-${index}-answer`;
  const pointsId = `question-${index}-points`;

  const isVideo = () => isVideoFromMedia(question.media);

  return (
    <Card
      variant="outlined"
      sx={{
        p: { xs: 2, md: 3 },
        borderRadius: '16px',
        backgroundColor: '#f8fafc',
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
        transition: 'box-shadow 0.3s ease-in-out',
        '&:hover': {
          boxShadow: '0 6px 16px rgba(0,0,0,0.1)',
        },
      }}
    >
      <CardContent>
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          Fill-in-the-Blanks
        </Typography>

        <TextField
          fullWidth
          label="Question Text"
          multiline
          minRows={3}
          value={question.question || ""}
          onChange={(e) => handleQuestionChange("question", e.target.value)}
          margin="normal"
          variant="outlined"
          helperText={fieldErrors[questionId] || "Use underscores '__' to indicate a blank."}
          disabled={readonly}
          id={questionId}
          error={!!fieldErrors[questionId]}
          sx={{
            '& .MuiOutlinedInput-root.Mui-disabled': {
              '& fieldset': { borderColor: 'rgba(0, 0, 0, 0.12)' },
            },
            '& .MuiInputBase-input.Mui-disabled': {
              WebkitTextFillColor: '#424242 !important',
            },
            '& .MuiOutlinedInput-root': { borderRadius: '12px' }
          }}
        />

        {!readonly && (
          <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
            <TextField
              fullWidth
              type="file"
              inputRef={fileInputRef}
              inputProps={{ accept: "image/*,video/*" }}
              onChange={(e) => {
                try {
                  const f = e.target.files[0];
                  if (f) console.log("[preview] file input selected:", { name: f.name, type: f.type, size: f.size });
                } catch (_) {}
                handleMediaChange(e.target.files[0]);
              }}
              margin="normal"
              variant="outlined"
              disabled={readonly}
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: '#ffffff',
                  borderRadius: '12px',
                },
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#e0e0e0',
                },
              }}
            />
            {preview && (
              <IconButton color="error" onClick={deleteMedia} sx={{ p: 1, backgroundColor: '#ffebee', '&:hover': { backgroundColor: '#ffcdd2' } }}>
                <DeleteIcon />
              </IconButton>
            )}
          </Box>
        )}

        {/* Preview for image/video */}
        {preview && (
          <Box sx={{ mt: 2, textAlign: "center", border: '1px dashed #bdbdbd', p: 2, borderRadius: '12px' }}>
            {isVideo() ? (
              <video src={preview} controls style={{ maxWidth: "100%", maxHeight: 200, borderRadius: '8px' }} />
            ) : (
              <img src={preview} alt="Preview" style={{ maxWidth: "100%", maxHeight: 200, borderRadius: '8px' }} />
            )}
          </Box>
        )}

        {/* Correct Answer */}
        <TextField
          fullWidth
          label="Correct Answer"
          multiline
          minRows={2}
          value={question.answer || ""}
          onChange={(e) => handleQuestionChange("answer", e.target.value)}
          margin="normal"
          variant="outlined"
          id={answerId}
          error={!!fieldErrors[answerId]}
          helperText={fieldErrors[answerId] || "Separate multiple answers with a comma. e.g. answer1, answer2"}
          sx={{
            mt: 2,
            '& .MuiOutlinedInput-root.Mui-disabled': {
              '& fieldset': { borderColor: 'rgba(0, 0, 0, 0.12)' },
            },
            '& .MuiInputBase-input.Mui-disabled': {
              WebkitTextFillColor: '#424242 !important',
            },
            '& .MuiOutlinedInput-root': { borderRadius: '12px' }
          }}
          disabled={readonly}
        />

        <PointsField
          value={question.points}
          id={pointsId}
          onChange={(e) =>
            handleQuestionChange(
              "points",
              e.target.value === "" ? "" : Number(e.target.value)
            )
          }
          index={index}
          fieldErrors={fieldErrors}
          setFieldErrors={setFieldErrors}
          readonly={readonly}
          suggestions={[1, 2, 5, 10]}
        />
      </CardContent>
    </Card>
  );
};

export default FillBlanksForm;
