import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from "@mui/material";

const FinishEarlyDialog = ({ open, onClose, onConfirm, fullScreen, timeLeftLabel }) => (
  <Dialog
    open={open}
    onClose={onClose}
    aria-labelledby="finish-early-dialog-title"
    aria-describedby="finish-early-dialog-description"
    fullScreen={fullScreen}
    PaperProps={{ sx: { borderRadius: "16px", boxShadow: "0 8px 30px rgba(0,0,0,0.1)" } }}
  >
    <DialogTitle id="finish-early-dialog-title" sx={{ fontWeight: "bold", color: "#37474f" }}>
      Finish Exam Early?
    </DialogTitle>
    <DialogContent>
      <DialogContentText id="finish-early-dialog-description" sx={{ color: "#546e7a" }}>
        Are you sure you want to finish the exam early? You have {timeLeftLabel} remaining. You can still review your answers.
      </DialogContentText>
    </DialogContent>
    <DialogActions sx={{ p: 2 }}>
      <Button onClick={onClose} color="secondary" sx={{ borderRadius: "8px" }}>
        Keep Working
      </Button>
      <Button onClick={onConfirm} color="warning" variant="contained" sx={{ borderRadius: "8px", fontWeight: "bold" }} autoFocus>
        Yes, Finish Early
      </Button>
    </DialogActions>
  </Dialog>
);

export default FinishEarlyDialog;
