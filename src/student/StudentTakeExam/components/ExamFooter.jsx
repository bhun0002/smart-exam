// src/student/StudentTakeExam/components/ExamFooter.jsx
import React from "react";
import { Box, Button } from "@mui/material";
import NavigateBeforeIcon from "@mui/icons-material/NavigateBefore";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import ClearIcon from "@mui/icons-material/Clear";

const ExamFooter = ({
  isLastQuestion,
  onPrev,
  onNext,
  onClear,
  onOpenSubmit,
  onFinishEarly,
  disablePrev,
}) => {
  return (
    <>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        flexWrap="wrap"
        gap={2}
        sx={{ mt: "auto", pt: 2 }}
      >
        <Button
          variant="outlined"
          onClick={onPrev}
          disabled={disablePrev}
          startIcon={<NavigateBeforeIcon />}
          sx={{
            borderRadius: "12px",
            borderColor: "#4CAF50",
            color: "#4CAF50",
            fontWeight: "bold",
            "&:hover": { backgroundColor: "#e8f5e9" },
          }}
        >
          Previous
        </Button>

        <Button
          variant="outlined"
          color="error"
          onClick={onClear}
          startIcon={<ClearIcon />}
          sx={{
            borderRadius: "12px",
            borderColor: "#ef5350",
            color: "#ef5350",
            fontWeight: "bold",
            "&:hover": { backgroundColor: "#ffebee" },
          }}
        >
          Clear Response
        </Button>

        {isLastQuestion ? (
          <Button
            variant="contained"
            color="success"
            onClick={onOpenSubmit}
            startIcon={<DoneAllIcon />}
            sx={{
              borderRadius: "12px",
              fontWeight: "bold",
              bgcolor: "#388e3c",
              "&:hover": { bgcolor: "#2e7d32" },
            }}
          >
            Submit Exam
          </Button>
        ) : (
          <Button
            variant="contained"
            onClick={onNext}
            endIcon={<NavigateNextIcon />}
            sx={{
              borderRadius: "12px",
              fontWeight: "bold",
              bgcolor: "#4CAF50",
              "&:hover": { bgcolor: "#388e3c" },
            }}
          >
            Next Question
          </Button>
        )}
      </Box>
      <Box mt={2} textAlign="center">
        <Button
          variant="text"
          color="error"
          onClick={onFinishEarly}
          sx={{ borderRadius: "12px", fontWeight: "bold" }}
        >
          Finish Exam Early
        </Button>
      </Box>
    </>
  );
};

export default ExamFooter;
