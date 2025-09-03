import React from "react";
import {
  Box,
  Button,
  InputAdornment,
  TextField,
  Typography,
} from "@mui/material";
import { Add as AddIcon, Search as SearchIcon } from "@mui/icons-material";

const COLORS = {
  "multiple-choice": "#e3f2fd",
  "true-false": "#e8f5e9",
  "match": "#fffde7",
  "fill-blanks": "#f3e5f5",
  "short-answer": "#fbe9e7",
  reasoning: "#ede7f6",
};

const AddQuestionButtons = ({
  onAdd,
  questionNumber,
  setQuestionNumber,
  searchError,
}) => {
  return (
    <Box sx={{ mt: 5, mb: 3 }} id="add-question-buttons">
      <Typography variant="h6" gutterBottom fontWeight="bold" color="#546e7a">
        Add Questions
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Click a button to add a new question type to your exam.
      </Typography>

      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
        {[
          "multiple-choice",
          "true-false",
          "fill-blanks",
          "short-answer",
          "match",
          "reasoning",
        ].map((type) => (
          <Button
            key={type}
            variant="contained"
            onClick={() => onAdd(type)}
            sx={{
              textTransform: "capitalize",
              backgroundColor: COLORS[type],
              color: "#455a64",
              borderRadius: "12px",
              fontWeight: "bold",
              transition: "all 0.3s ease-in-out",
              "&:hover": {
                backgroundColor: COLORS[type],
                transform: "translateY(-2px)",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              },
            }}
            startIcon={<AddIcon />}
          >
            {type.replace("-", " ")}
          </Button>
        ))}
      </Box>

      <Box sx={{ mt: 3, display: "flex", alignItems: "center" }}>
        <TextField
          label="Jump to Question #"
          type="number"
          value={questionNumber}
          onChange={(e) => setQuestionNumber(e.target.value)}
          error={!!searchError}
          helperText={searchError}
          sx={{ width: 220 }}
          size="small"
          variant="outlined"
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <SearchIcon />
              </InputAdornment>
            ),
            sx: { borderRadius: "12px" },
          }}
        />
      </Box>
    </Box>
  );
};

export default AddQuestionButtons;
