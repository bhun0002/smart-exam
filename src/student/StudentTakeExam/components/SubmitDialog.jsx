// src/student/StudentTakeExam/components/SubmitDialog.jsx
import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Typography,
} from "@mui/material";

const SubmitDialog = ({
  open,
  onClose,
  onSubmit,
  answeredCount,
  totalQuestions,
  fullScreen,
}) => (
  <Dialog
    open={open}
    onClose={onClose}
    aria-labelledby="submit-dialog-title"
    aria-describedby="submit-dialog-description"
    fullScreen={fullScreen}
    PaperProps={{
      sx: {
        borderRadius: "16px",
        boxShadow: "0 8px 30px rgba(0,0,0,0.1)",
      },
    }}
  >
    <DialogTitle
      id="submit-dialog-title"
      sx={{ fontWeight: "bold", color: "#37474f", pb: 1 }}
    >
      Confirm Exam Submission
    </DialogTitle>

    <DialogContent sx={{ pt: 0.5 }}>
      <DialogContentText
        id="submit-dialog-description"
        sx={{ color: "#546e7a", mb: 1.5 }}
      >
        You are about to submit your exam. Once submitted, you cannot make any
        further changes.
      </DialogContentText>

      <Typography
        variant="body2"
        sx={{
          bgcolor: "#e3f2fd",
          border: "1px solid #90caf9",
          color: "#1565c0",
          borderRadius: "10px",
          px: 1.5,
          py: 1,
          fontWeight: 600,
          display: "inline-block",
        }}
      >
        Answered {answeredCount} of {totalQuestions} questions
      </Typography>
    </DialogContent>

    <DialogActions sx={{ p: 2, pt: 1 }}>
      <Button
        onClick={onClose}
        color="secondary"
        sx={{ borderRadius: "10px", textTransform: "none" }}
      >
        Cancel
      </Button>
      <Button
        onClick={onSubmit}
        color="primary"
        variant="contained"
        sx={{ borderRadius: "10px", fontWeight: "bold", textTransform: "none" }}
        autoFocus
      >
        Submit
      </Button>
    </DialogActions>
  </Dialog>
);

export default SubmitDialog;
