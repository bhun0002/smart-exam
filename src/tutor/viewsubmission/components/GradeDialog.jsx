import React, { useState } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Stack
} from "@mui/material";

// Placeholder — wire to your grading schema if/when you add it.
const GradeDialog = ({ open, onClose, submission, onSaved }) => {
  const [score, setScore] = useState("");
  const [notes, setNotes] = useState("");

  const handleSave = () => {
    // TODO: write to Firestore (e.g., examSubmissions/{id}.grade = { score, notes, gradedAt } )
    onSaved?.();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Grade Submission</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField label="Score" size="small" value={score} onChange={(e) => setScore(e.target.value)} />
          <TextField label="Notes" size="small" multiline minRows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="outlined">Cancel</Button>
        <Button onClick={handleSave} variant="contained">Save</Button>
      </DialogActions>
    </Dialog>
  );
};

export default GradeDialog;
