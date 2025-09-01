import React from "react";
import { Snackbar, Alert as MuiAlert } from "@mui/material";

const Notifier = ({ open, onClose, severity, message }) => (
  <Snackbar
    open={open}
    autoHideDuration={4000}
    onClose={onClose}
    anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
  >
    <MuiAlert
      onClose={onClose}
      severity={severity}
      elevation={6}
      variant="filled"
      sx={{
        backgroundColor:
          severity === "error" ? "#ef5350" : severity === "info" ? "#2196f3" : "#81c784",
        fontWeight: "bold",
        borderRadius: "8px",
      }}
    >
      {message}
    </MuiAlert>
  </Snackbar>
);

export default Notifier;
