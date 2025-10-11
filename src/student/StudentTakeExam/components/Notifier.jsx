// src/student/StudentTakeExam/components/Notifier.jsx
import React from "react";
import { Snackbar, Alert as MuiAlert, Slide } from "@mui/material";

function SlideUpTransition(props) {
  return <Slide {...props} direction="up" />;
}

const Notifier = ({ open, onClose, severity, message }) => (
  <Snackbar
    open={open}
    autoHideDuration={4000}
    onClose={onClose}
    anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
    TransitionComponent={SlideUpTransition}
  >
    <MuiAlert
      onClose={onClose}
      severity={severity}
      elevation={6}
      variant="filled"
      sx={{
        borderRadius: "12px",
        fontWeight: "bold",
        px: 2,
        py: 1,
        bgcolor:
          severity === "error"
            ? "#e53935"
            : severity === "info"
            ? "#1e88e5"
            : severity === "warning"
            ? "#fbc02d"
            : "#43a047",
        color: "#fff",
        boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
      }}
    >
      {message}
    </MuiAlert>
  </Snackbar>
);

export default Notifier;
