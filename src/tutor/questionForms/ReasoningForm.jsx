// src/components/ReasoningForm.jsx

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

const ReasoningForm = ({ question, onChange, readonly = false }) => {
    const [preview, setPreview] = React.useState(null);
    const fileInputRef = React.useRef(null);

    const handleQuestionChange = (field, value) => {
        if (readonly) return;
        onChange({ ...question, [field]: value });
    };

    const deleteMedia = () => {
        handleMediaChange(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    // Update media file and preview
    const handleMediaChange = (file) => {
        if (readonly) return;
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
                    multiline
                    rows={2}
                    value={question.question || ""}
                    onChange={(e) => handleQuestionChange("question", e.target.value)}
                    margin="normal"
                    variant="outlined"
                    disabled={readonly}
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
                        {question.media.type?.startsWith("video") ? (
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
                    multiline
                    rows={4}
                    value={question.answer || ""}
                    onChange={(e) => handleQuestionChange("answer", e.target.value)}
                    margin="normal"
                    variant="outlined"
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
                    helperText="Provide a detailed explanation or a sample correct answer."
                    disabled={readonly}
                />
            </CardContent>
        </Card>
    );
};

export default ReasoningForm;