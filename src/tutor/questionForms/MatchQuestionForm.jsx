// src/components/MatchQuestionForm.jsx

import React from "react";
import {
    Box,
    Button,
    Grid,
    TextField,
    Typography,
    IconButton,
    Card,
    CardContent,
} from "@mui/material";
import { Add as AddIcon, Delete as DeleteIcon } from "@mui/icons-material";

// ADDED: Accept `index`, `fieldErrors`, and `setFieldErrors` props
const MatchQuestionForm = ({ question, onChange, readonly = false, index, fieldErrors, setFieldErrors }) => {

    // UPDATED: Function to handle changes and clear errors
    const handleMatchPairChange = (pairIndex, side, value) => {
        if (readonly) return;
        const updatedMatchPairs = [...question.matchPairs];
        updatedMatchPairs[pairIndex][side] = value;
        onChange({
            ...question,
            matchPairs: updatedMatchPairs,
        });

        // Construct the unique ID for this specific match pair field
        const fieldId = `question-${index}-match-pair-${pairIndex}-${side}`;
        
        // Clear the error for this field if it exists
        if (fieldErrors[fieldId]) {
            setFieldErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[fieldId];
                return newErrors;
            });
        }
    };

    const addMatchPair = () => {
        if (readonly) return;
        onChange({
            ...question,
            matchPairs: [...question.matchPairs, { left: "", right: "" }],
        });
        // Clear the general "match-pairs" error if it was shown before adding
        const generalMatchErrorId = `question-${index}-match-pairs`;
        if (fieldErrors[generalMatchErrorId]) {
            setFieldErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[generalMatchErrorId];
                return newErrors;
            });
        }
    };

    const deleteMatchPair = (pairIndex) => {
        if (readonly) return;
        const updatedMatchPairs = [...question.matchPairs];
        updatedMatchPairs.splice(pairIndex, 1);
        onChange({
            ...question,
            matchPairs: updatedMatchPairs,
        });

        // Clear any errors specifically related to the deleted pair
        const leftFieldId = `question-${index}-match-pair-${pairIndex}-left`;
        const rightFieldId = `question-${index}-match-pair-${pairIndex}-right`;
        setFieldErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors[leftFieldId];
            delete newErrors[rightFieldId];
            // Also, check if removing this pair makes the overall "match-pairs" error irrelevant
            if (newErrors[`question-${index}-match-pairs`]) {
                // If there are no pairs left, the general error should persist or update.
                // If there are still pairs, this specific check might be too aggressive
                // and you might want a full re-validation of `matchPairs` on `TutorForm` level.
                // For simplicity here, we'll let the next submit re-evaluate.
            }
            return newErrors;
        });
    };

    // Define unique IDs for the overall match pairs container
    const matchPairsContainerId = `question-${index}-match-pairs`;

    return (
        <Card
            variant="outlined"
            sx={{
                p: { xs: 2, md: 3 },
                borderRadius: '16px',
                backgroundColor: '#fbe9e7', // A soft, pastel background
                boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                transition: 'box-shadow 0.3s ease-in-out',
                '&:hover': {
                    boxShadow: '0 6px 16px rgba(0,0,0,0.1)',
                },
            }}
            // ADDED: ID to the Card for scrolling if the whole section is invalid
            id={matchPairsContainerId}
        >
            <CardContent>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                    Matching Question
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Create pairs of matching items.
                </Typography>

                {/* ADDED: Display overall error for match pairs if any */}
                {fieldErrors[matchPairsContainerId] && (
                    <Typography color="error" variant="body2" sx={{ mb: 2 }}>
                        {fieldErrors[matchPairsContainerId]}
                    </Typography>
                )}

                {question.matchPairs.map((pair, i) => {
                    // Define specific IDs for each TextField in the pair
                    const leftFieldId = `question-${index}-match-pair-${i}-left`;
                    const rightFieldId = `question-${index}-match-pair-${i}-right`;

                    return (
                        <Grid container spacing={2} key={i} alignItems="center" sx={{ mb: 1 }}>
                            <Grid item xs={5}>
                                <TextField
                                    label={`Left Side ${i + 1}`}
                                    fullWidth
                                    value={pair.left}
                                    onChange={(e) => handleMatchPairChange(i, "left", e.target.value)}
                                    variant="outlined"
                                    disabled={readonly}
                                    // ADDED: ID, error, and helperText props for validation
                                    id={leftFieldId}
                                    error={!!fieldErrors[leftFieldId]}
                                    helperText={fieldErrors[leftFieldId]}
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
                            </Grid>
                            <Grid item xs={5}>
                                <TextField
                                    label={`Right Side ${i + 1}`}
                                    fullWidth
                                    value={pair.right}
                                    onChange={(e) =>
                                        handleMatchPairChange(i, "right", e.target.value)
                                    }
                                    variant="outlined"
                                    disabled={readonly}
                                    // ADDED: ID, error, and helperText props for validation
                                    id={rightFieldId}
                                    error={!!fieldErrors[rightFieldId]}
                                    helperText={fieldErrors[rightFieldId]}
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
                            </Grid>
                            <Grid item xs={2}>
                                {!readonly && (
                                    <IconButton
                                        color="error"
                                        onClick={() => deleteMatchPair(i)}
                                        sx={{
                                            p: 1,
                                            borderRadius: '8px',
                                            backgroundColor: '#ffebee',
                                            '&:hover': {
                                                backgroundColor: '#ffcdd2',
                                            }
                                        }}
                                    >
                                        <DeleteIcon />
                                    </IconButton>
                                )}
                            </Grid>
                        </Grid>
                    );
                })}
                {!readonly && (
                    <Button
                        startIcon={<AddIcon />}
                        onClick={addMatchPair}
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
                        Add Pair
                    </Button>
                )}
            </CardContent>
        </Card>
    );
};

export default MatchQuestionForm;