// src/student/StudentTakeExam/components/FinishEarlyDialog.jsx
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

const FinishEarlyDialog = ({ open, onClose, onConfirm, fullScreen, timeLeftLabel }) => (
  <Dialog
    open={open}
    onClose={onClose}
    aria-labelledby="finish-early-dialog-title"
    aria-describedby="finish-early-dialog-description"
    fullScreen={fullScreen}
    PaperProps={{
      sx: {
        borderRadius: "16px",
        boxShadow: "0 8px 30px rgba(0,0,0,0.1)",
      },
    }}
  >
    <DialogTitle
      id="finish-early-dialog-title"
      sx={{ fontWeight: "bold", color: "#37474f", pb: 1 }}
    >
      Finish Exam Early?
    </DialogTitle>

    <DialogContent sx={{ pt: 0.5 }}>
      <DialogContentText
        id="finish-early-dialog-description"
        sx={{ color: "#546e7a", mb: 1.5 }}
      >
        Are you sure you want to finish the exam early?
      </DialogContentText>
      <Typography
        variant="body2"
        sx={{
          bgcolor: "#fffde7",
          border: "1px solid #fff59d",
          color: "#8d6e63",
          borderRadius: "10px",
          px: 1.25,
          py: 0.75,
          display: "inline-block",
          fontWeight: 600,
        }}
      >
        Time remaining: {timeLeftLabel}
      </Typography>
    </DialogContent>

    <DialogActions sx={{ p: 2, pt: 1 }}>
      <Button
        onClick={onClose}
        color="secondary"
        sx={{ borderRadius: "10px", textTransform: "none" }}
      >
        Keep Working
      </Button>
      <Button
        onClick={onConfirm}
        color="warning"
        variant="contained"
        sx={{ borderRadius: "10px", fontWeight: "bold", textTransform: "none" }}
        autoFocus
      >
        Yes, Finish Early
      </Button>
    </DialogActions>
  </Dialog>
);

export default FinishEarlyDialog;
