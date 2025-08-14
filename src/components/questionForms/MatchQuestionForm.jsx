import React from 'react';
import { Box, Button, Grid, TextField, Typography, IconButton } from "@mui/material";
import { Add as AddIcon, Delete as DeleteIcon } from "@mui/icons-material";

const MatchQuestionForm = ({ question, onChange }) => {
  const handleMatchPairChange = (pairIndex, side, value) => {
    const updatedMatchPairs = [...question.matchPairs];
    updatedMatchPairs[pairIndex][side] = value;
    onChange({
      ...question,
      matchPairs: updatedMatchPairs
    });
  };

  const addMatchPair = () => {
    onChange({
      ...question,
      matchPairs: [...question.matchPairs, { left: "", right: "" }]
    });
  };

  const deleteMatchPair = (pairIndex) => {
    const updatedMatchPairs = [...question.matchPairs];
    updatedMatchPairs.splice(pairIndex, 1);
    onChange({
      ...question,
      matchPairs: updatedMatchPairs
    });
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>Matching Pairs:</Typography>
      {question.matchPairs.map((pair, i) => (
        <Grid container spacing={2} key={i} alignItems="center" sx={{ mb: 1 }}>
          <Grid item xs={5}>
            <TextField
              label={`Left Side ${i + 1}`}
              fullWidth
              value={pair.left}
              onChange={(e) => handleMatchPairChange(i, "left", e.target.value)}
              variant="outlined"
            />
          </Grid>
          <Grid item xs={5}>
            <TextField
              label={`Right Side ${i + 1}`}
              fullWidth
              value={pair.right}
              onChange={(e) => handleMatchPairChange(i, "right", e.target.value)}
              variant="outlined"
            />
          </Grid>
          <Grid item xs={2}>
            <IconButton
              color="error"
              onClick={() => deleteMatchPair(i)}
            >
              <DeleteIcon />
            </IconButton>
          </Grid>
        </Grid>
      ))}
      <Button
        startIcon={<AddIcon />}
        onClick={addMatchPair}
        variant="outlined"
        sx={{ mt: 1 }}
      >
        Add Pair
      </Button>
    </Box>
  );
};

export default MatchQuestionForm;