// src/components/MultipleChoiceForm.jsx

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
    Card,
    CardContent
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
        <Card
            variant="outlined"
            sx={{
                p: { xs: 2, md: 3 },
                borderRadius: '16px',
                backgroundColor: '#e3f2fd',
                boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                transition: 'box-shadow 0.3s ease-in-out',
                '&:hover': {
                    boxShadow: '0 6px 16px rgba(0,0,0,0.1)',
                },
            }}
        >
            <CardContent>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                    Multiple Choice
                </Typography>
                
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
                        {question.media?.type?.startsWith("video") ? (
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

                {/* Options */}
                <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle1" fontWeight="bold" color="text.secondary">Options</Typography>
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
                            {/* Delete Option Button */}
                            {!readonly && (
                                <IconButton
                                    color="error"
                                    onClick={() => deleteOption(i)}
                                    sx={{ ml: 1, p: 1 }}
                                    disabled={question.options.length <= 2}
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
                            variant="contained"
                            sx={{
                                mt: 2,
                                borderRadius: '12px',
                                backgroundColor: '#607d8b',
                                color: '#fff',
                                fontWeight: 'bold',
                                '&:hover': {
                                    backgroundColor: '#455a64',
                                    transform: 'translateY(-2px)',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                },
                                transition: 'all 0.3s ease-in-out',
                            }}
                        >
                            Add Option
                        </Button>
                    )}
                </Box>

                {/* Correct Answer */}
                <FormControl fullWidth sx={{ mt: 3 }}>
                    <InputLabel id="correct-answer-label" sx={{ color: 'rgba(0,0,0,0.6)' }}>Correct Answer</InputLabel>
                    <Select
                        labelId="correct-answer-label"
                        value={question.answer || ""}
                        label="Correct Answer"
                        onChange={(e) => handleQuestionChange("answer", e.target.value)}
                        disabled={readonly}
                        sx={{
                            borderRadius: '12px',
                            backgroundColor: readonly ? 'rgba(0,0,0,0.04)' : '#ffffff',
                            '& .MuiOutlinedInput-notchedOutline': {
                                borderColor: 'rgba(0, 0, 0, 0.23)',
                            },
                            '& .MuiSelect-select.Mui-disabled': {
                                WebkitTextFillColor: '#424242 !important',
                            },
                        }}
                    >
                        {question.options.map((opt, i) => (
                            <MenuItem key={i} value={opt} sx={{ fontWeight: opt === question.answer ? 'bold' : 'normal' }}>
                                {opt || `Option ${i + 1}`}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </CardContent>
        </Card>
    );
};

export default MultipleChoiceForm;