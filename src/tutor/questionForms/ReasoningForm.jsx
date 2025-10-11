// src/tutor/questionForms/ReasoningForm.jsx

import React from "react";
import {
    Box,
    TextField,
    IconButton,
    Card,
    CardContent,
    Typography,
} from "@mui/material";
import { Add as AddIcon, Delete as DeleteIcon } from "@mui/icons-material";
import PointsField from "./PointsField";
import useMediaPreview, { isVideoFromMedia } from "../../shared/useMediaPreview";

// Accept `index`, `fieldErrors`, and `setFieldErrors` props
const ReasoningForm = ({ question, onChange, readonly = false, index, fieldErrors, setFieldErrors }) => {
    // 🔄 NEW: derive preview via shared hook (supports File, string URL, or Cloudinary IDs)
    const preview = useMediaPreview(question.media);
    const fileInputRef = React.useRef(null);

    // Handle changes and clear errors
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

    // 🔄 UPDATED: preview is derived by the hook; no manual FileReader here
    const handleMediaChange = (file) => {
        if (readonly) return;
        onChange({
            ...question,
            media: file,
        });
    };

    // Define unique IDs based on the question index
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
                backgroundColor: '#ede7f6', // A soft, pastel background
                boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                transition: 'box-shadow 0.3s ease-in-out',
                '&:hover': {
                    boxShadow: '0 6px 16px rgba(0,0,0,0.1)',
                },
            }}
        >
            <CardContent>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                    Reasoning Question
                </Typography>
                <TextField
                    fullWidth
                    label="Question Text"
                    multiline // Enable multiline
                    minRows={5} // Start with 5 rows for scenario/problem description
                    value={question.question || ""}
                    onChange={(e) => handleQuestionChange("question", e.target.value)}
                    margin="normal"
                    variant="outlined"
                    disabled={readonly}
                    id={questionId}
                    error={!!fieldErrors[questionId]}
                    helperText={fieldErrors[questionId]}
                    sx={{
                        '& .MuiOutlinedInput-root': {
                            borderRadius: '12px',
                            backgroundColor: readonly ? 'rgba(0,0,0,0.04)' : '#ffffff',
                        },
                        '& .MuiInputBase-input.Mui-disabled': {
                            WebkitTextFillColor: '#424242 !important',
                        },
                    }}
                />

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
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: '12px',
                                    backgroundColor: '#ffffff',
                                },
                            }}
                        />
                        {preview && (
                            <IconButton
                                color="error"
                                onClick={deleteMedia}
                                sx={{
                                    p: 1,
                                    backgroundColor: '#ffebee',
                                    '&:hover': { backgroundColor: '#ffcdd2' }
                                }}
                            >
                                <DeleteIcon />
                            </IconButton>
                        )}
                    </Box>
                )}

                {/* Preview for image/video */}
                {preview && (
                    <Box sx={{ mt: 2, textAlign: "center", border: '1px dashed #bdbdbd', p: 2, borderRadius: '12px' }}>
                        {isVideo() ? (
                            <video
                                src={preview}
                                controls
                                style={{ maxWidth: "100%", maxHeight: 200, borderRadius: '8px' }}
                            />
                        ) : (
                            <img
                                src={preview}
                                alt="Preview"
                                style={{ maxWidth: "100%", maxHeight: 200, borderRadius: '8px' }}
                            />
                        )}
                    </Box>
                )}

                <TextField
                    fullWidth
                    label="Correct Answer"
                    multiline // Enable multiline
                    minRows={7} // Start with 7 rows for detailed reasoning/solution
                    value={question.answer || ""}
                    onChange={(e) => handleQuestionChange("answer", e.target.value)}
                    margin="normal"
                    variant="outlined"
                    helperText={fieldErrors[answerId] || "Provide a detailed explanation or a sample correct answer."}
                    disabled={readonly}
                    id={answerId}
                    error={!!fieldErrors[answerId]}
                    sx={{
                        mt: 2,
                        '& .MuiOutlinedInput-root': {
                            borderRadius: '12px',
                            backgroundColor: readonly ? 'rgba(0,0,0,0.04)' : '#ffffff',
                        },
                        '& .MuiInputBase-input.Mui-disabled': {
                            WebkitTextFillColor: '#424242 !important',
                        },
                    }}
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
                    suggestions={[1, 2, 5, 10]} // e.g. per type
                />

            </CardContent>
        </Card>
    );
};

export default ReasoningForm;
