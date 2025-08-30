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
    CardContent,
    FormHelperText
} from "@mui/material";
import { Add as AddIcon, Delete as DeleteIcon } from "@mui/icons-material";

const MultipleChoiceForm = ({ question, onChange, readonly = false, index, fieldErrors, setFieldErrors }) => {
    const [preview, setPreview] = React.useState(null);
    const fileInputRef = React.useRef(null);

    const generateUniqueId = () => Math.random().toString(36).substring(2, 9);

    // UPDATED: Now accepts `propertyKey` (e.g., "question") and an optional `errorIdSuffix` (e.g., "question-text")
    // This allows the error clearing logic to use a different ID suffix if the property key and error key differ.
    const handleQuestionChange = (propertyKey, value, errorIdSuffix = propertyKey) => {
        if (readonly) return;
        onChange({ ...question, [propertyKey]: value }); // Update the actual property on the question object

        // Construct the fieldId using the provided suffix for clearing the error
        const fieldIdToClear = `question-${index}-${errorIdSuffix}`;
        
        if (fieldErrors[fieldIdToClear]) {
            setFieldErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[fieldIdToClear];
                return newErrors;
            });
        }
    };

    // This handler uses the option's array index to match the parent's error ID format
    const handleOptionChange = (optionIndex, value) => {
        if (readonly) return;
        const updatedOptions = question.options.map((opt, i) =>
            i === optionIndex ? { ...opt, text: value } : opt
        );
        onChange({ ...question, options: updatedOptions });

        const optionId = `question-${index}-option-${optionIndex}`; // Use the index 'i' to create the ID
        if (fieldErrors[optionId]) {
            setFieldErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[optionId];
                return newErrors;
            });
        }
    };

    const addOption = () => {
        if (readonly) return;
        onChange({ ...question, options: [...question.options, { id: generateUniqueId(), text: "" }] });
        
        const optionsId = `question-${index}-options`;
        if (fieldErrors[optionsId]) {
            setFieldErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[optionsId];
                return newErrors;
            });
        }
    };

    const deleteOption = (id) => {
        if (readonly) return;
        const updatedOptions = question.options.filter(opt => opt.id !== id);
        
        const deletedOption = question.options.find(opt => opt.id === id);
        if (question.answer === deletedOption.text) {
            handleQuestionChange("answer", ""); // "answer" as property key, "answer" as default errorIdSuffix
        }
        
        onChange({ ...question, options: updatedOptions });

        setFieldErrors(prev => {
            const newErrors = { ...prev };
            // A more robust way to clear all option-related errors
            Object.keys(newErrors).forEach(key => {
                if (key.startsWith(`question-${index}-option-`)) {
                    delete newErrors[key];
                }
            });
            delete newErrors[`question-${index}-options`];
            return newErrors;
        });
    };

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
            setPreview(question.media);
        }
    }, [question.media]);

    // This is the ID that the TextField will use for its `id` prop and that TutorForm uses for errors
    const questionId = `question-${index}-question-text`; 
    const optionsId = `question-${index}-options`;
    const answerId = `question-${index}-answer`;

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

                <TextField
                    fullWidth
                    label="Question Text"
                    multiline
                    rows={2}
                    value={question.question || ""}
                    // FIXED: Pass "question-text" as the errorIdSuffix to match parent's error key
                    onChange={(e) => handleQuestionChange("question", e.target.value, "question-text")} 
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
                                '& .MuiOutlinedInput-notchedOutline': {
                                    borderColor: '#e0e0e0',
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

                <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle1" fontWeight="bold" color="text.secondary">
                        Options
                    </Typography>
                    {fieldErrors[optionsId] && (
                        <FormHelperText error sx={{ ml: 1, mt: -1, mb: 1 }}>
                            {fieldErrors[optionsId]}
                        </FormHelperText>
                    )}
                    {question.options.map((opt, i) => {
                        const optionId = `question-${index}-option-${i}`; 
                        return (
                            <Box key={opt.id} sx={{ display: "flex", alignItems: "center", mt: 1 }}>
                                <TextField
                                    fullWidth
                                    label={`Option ${i + 1}`}
                                    value={opt.text}
                                    onChange={(e) => handleOptionChange(i, e.target.value)} 
                                    margin="dense"
                                    variant="outlined"
                                    disabled={readonly}
                                    id={optionId}
                                    error={!!fieldErrors[optionId]}
                                    helperText={fieldErrors[optionId]}
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
                                    <IconButton
                                        color="error"
                                        onClick={() => deleteOption(opt.id)}
                                        sx={{ ml: 1, p: 1 }}
                                        disabled={question.options.length <= 2}
                                    >
                                        <DeleteIcon />
                                    </IconButton>
                                )}
                            </Box>
                        );
                    })}
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

                <FormControl
                    fullWidth
                    sx={{ mt: 3 }}
                    error={!!fieldErrors[answerId]}
                >
                    <InputLabel id="correct-answer-label" sx={{ color: 'rgba(0,0,0,0.6)' }}>Correct Answer</InputLabel>
                    <Select
                        labelId="correct-answer-label"
                        value={question.answer || ""}
                        label="Correct Answer"
                        onChange={(e) => handleQuestionChange("answer", e.target.value)} 
                        disabled={readonly}
                        id={answerId}
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
                            <MenuItem key={opt.id} value={opt.text} sx={{ fontWeight: opt.text === question.answer ? 'bold' : 'normal' }}>
                                {opt.text || `Option ${i + 1}`}
                            </MenuItem>
                        ))}
                    </Select>
                    {fieldErrors[answerId] && (
                        <FormHelperText>{fieldErrors[answerId]}</FormHelperText>
                    )}
                </FormControl>
            </CardContent>
        </Card>
    );
};

export default MultipleChoiceForm;
