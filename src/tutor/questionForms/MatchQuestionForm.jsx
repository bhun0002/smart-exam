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

const MatchQuestionForm = ({ question, onChange, readonly = false }) => {
    const handleMatchPairChange = (pairIndex, side, value) => {
        if (readonly) return;
        const updatedMatchPairs = [...question.matchPairs];
        updatedMatchPairs[pairIndex][side] = value;
        onChange({
            ...question,
            matchPairs: updatedMatchPairs,
        });
    };

    const addMatchPair = () => {
        if (readonly) return;
        onChange({
            ...question,
            matchPairs: [...question.matchPairs, { left: "", right: "" }],
        });
    };

    const deleteMatchPair = (pairIndex) => {
        if (readonly) return;
        const updatedMatchPairs = [...question.matchPairs];
        updatedMatchPairs.splice(pairIndex, 1);
        onChange({
            ...question,
            matchPairs: updatedMatchPairs,
        });
    };

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
        >
            <CardContent>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                    Matching Question
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Create pairs of matching items.
                </Typography>
                {question.matchPairs.map((pair, i) => (
                    <Grid container spacing={2} key={i} alignItems="center" sx={{ mb: 1 }}>
                        <Grid item xs={5}>
                            <TextField
                                label={`Left Side ${i + 1}`}
                                fullWidth
                                value={pair.left}
                                onChange={(e) => handleMatchPairChange(i, "left", e.target.value)}
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
                ))}
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