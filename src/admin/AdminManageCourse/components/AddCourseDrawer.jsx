import React, { useEffect, useState } from "react";
import { Drawer, Box, Typography, Divider, TextField, Button, Alert, Stack } from "@mui/material";

export default function AddCourseDrawer({ open, onClose, onSubmit }) {
  const [name, setName] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    if (open) {
      setName("");
      setErr("");
    }
  }, [open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    const v = (name || "").trim();
    if (!v) return setErr("Please provide a course name.");
    await onSubmit(v);
  };

  return (
    <Drawer anchor="right" open={open} onClose={onClose} PaperProps={{ sx: { width: { xs: "100%", sm: 440 } } }}>
      <Box sx={{ p: 3, display: "flex", flexDirection: "column", height: "100%" }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>Add New Course</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Create a new course by name.</Typography>
        <Divider sx={{ mb: 2 }} />

        {err && <Alert severity="error" sx={{ mb: 2 }}>{err}</Alert>}

        <Box component="form" onSubmit={handleSubmit} sx={{ display: "grid", gap: 2 }}>
          <TextField
            label="Course name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px" } }}
          />

          <Stack direction="row" justifyContent="flex-end" gap={1}>
            <Button onClick={onClose} variant="outlined" sx={{ borderRadius: "12px" }}>Cancel</Button>
            <Button type="submit" variant="contained" sx={{ borderRadius: "12px", fontWeight: "bold" }}>Create</Button>
          </Stack>
        </Box>
      </Box>
    </Drawer>
  );
}
