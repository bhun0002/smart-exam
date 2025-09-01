import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
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
    PaperProps={{ sx: { borderRadius: "16px", boxShadow: "0 8px 30px rgba(0,0,0,0.1)" } }}
  >
    <DialogTitle id="submit-dialog-title" sx={{ fontWeight: "bold", color: "#37474f" }}>
      Confirm Exam Submission
    </DialogTitle>
    <DialogContent>
      <DialogContentText id="submit-dialog-description" sx={{ color: "#546e7a" }}>
        You are about to submit your exam. Please ensure you have answered all questions.
        You have answered {answeredCount} out of {totalQuestions} questions. Once submitted, you cannot make any further changes.
      </DialogContentText>
    </DialogContent>
    <DialogActions sx={{ p: 2 }}>
      <Button onClick={onClose} color="secondary" sx={{ borderRadius: "8px" }}>
        Cancel
      </Button>
      <Button onClick={onSubmit} color="primary" variant="contained" sx={{ borderRadius: "8px", fontWeight: "bold" }} autoFocus>
        Submit
      </Button>
    </DialogActions>
  </Dialog>
);

export default SubmitDialog;
