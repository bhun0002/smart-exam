import React from "react";
import {
  Box,
  Typography,
  Button,
  Paper,
  LinearProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";

const ExamHeader = ({
  examTitle,
  timeLeft,
  formatTime,
  progress,
  currentQuestionIndex,
  totalQuestions,
  answeredCount,
  questions,
  isQuestionAnswered,
  studentAnswers,
  onBack,
  onSelectQuestion,
}) => {
  return (
    <Box sx={{ mb: 3 }}>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
        flexWrap="wrap"
        gap={2}
      >
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={onBack}
          sx={{
            borderColor: "#388e3c",
            color: "#388e3c",
            borderRadius: "12px",
            fontWeight: "bold",
            "&:hover": { backgroundColor: "#e8f5e9" },
          }}
        >
          Back to List
        </Button>
        <Typography
          variant="h5"
          component="h1"
          fontWeight="bold"
          color="#388e3c"
          flexGrow={1}
          textAlign="center"
        >
          {examTitle}
        </Typography>
        <Paper
          variant="outlined"
          sx={{
            p: 1,
            minWidth: 100,
            textAlign: "center",
            borderRadius: "10px",
            bgcolor: timeLeft <= 60 ? "#ffebee" : "#f1f8e9",
            borderColor: timeLeft <= 60 ? "#ef5350" : "#c8e6c9",
            boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
          }}
        >
          <Typography variant="h6" fontWeight="bold" color={timeLeft <= 60 ? "#ef5350" : "#2e7d32"}>
            {formatTime(timeLeft)}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Time Left
          </Typography>
        </Paper>
      </Box>

      <LinearProgress
        variant="determinate"
        value={progress}
        sx={{
          height: 10,
          borderRadius: 5,
          bgcolor: "#e0f2f7",
          "& .MuiLinearProgress-bar": { bgcolor: "#388e3c", borderRadius: 5 },
          mb: 2,
        }}
      />

      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={1}>
        <Typography variant="body2" color="text.secondary">
          Question {currentQuestionIndex + 1} of {totalQuestions} ({answeredCount} answered)
        </Typography>
        <FormControl sx={{ minWidth: 180, flexShrink: 0 }} size="small">
          <InputLabel id="question-select-label">Go to Question</InputLabel>
          <Select
            labelId="question-select-label"
            value={currentQuestionIndex}
            label="Go to Question"
            onChange={(e) => onSelectQuestion(e.target.value)}
            sx={{ borderRadius: "12px", bgcolor: "#f0f4c3" }}
          >
            {questions.map((q, index) => (
              <MenuItem key={q.id} value={index}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  {isQuestionAnswered(q, studentAnswers) ? (
                    <CheckCircleOutlineIcon color="success" fontSize="small" />
                  ) : (
                    <RadioButtonUncheckedIcon color="disabled" fontSize="small" />
                  )}
                  Question {index + 1}
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
    </Box>
  );
};

export default ExamHeader;
