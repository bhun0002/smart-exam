import React, { useEffect, useMemo, useState } from "react";
import {
  Drawer, Box, Typography, Divider, TextField, Button, Alert, Stack,
  FormControl, InputLabel, Select, MenuItem
} from "@mui/material";

export default function AddFeeDrawer({ open, onClose, onSubmit, courses = [], intakes = [] }) {
  const [courseId, setCourseId] = useState("");
  const [intakeId, setIntakeId] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("CAD");
  const [notes, setNotes] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    if (open) {
      setCourseId("");
      setIntakeId("");
      setAmount("");
      setCurrency("CAD");
      setNotes("");
      setErr("");
    }
  }, [open]);

  const canSubmit = useMemo(() => courseId && intakeId && Number(amount) >= 0, [courseId, intakeId, amount]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    if (!canSubmit) {
      setErr("Please select course & intake and enter a valid amount.");
      return;
    }
    await onSubmit({ courseId, intakeId, amount: Number(amount), currency, notes });
  };

  return (
    <Drawer anchor="right" open={open} onClose={onClose} PaperProps={{ sx: { width: { xs: "100%", sm: 480 } } }}>
      <Box sx={{ p: 3, display: "flex", flexDirection: "column", height: "100%" }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>Add Fee</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Select a Course and Intake, then set the fee amount.
        </Typography>
        <Divider sx={{ mb: 2 }} />

        {err && <Alert severity="error" sx={{ mb: 2 }}>{err}</Alert>}

        <Box component="form" onSubmit={handleSubmit} sx={{ display: "grid", gap: 2 }}>
          <FormControl>
            <InputLabel id="add-fee-course">Course</InputLabel>
            <Select
              labelId="add-fee-course" label="Course"
              value={courseId} onChange={(e) => setCourseId(e.target.value)}
              sx={{ borderRadius: "12px" }}
            >
              {courses.length === 0 && <MenuItem value="" disabled>No active courses</MenuItem>}
              {courses.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
            </Select>
          </FormControl>

          <FormControl>
            <InputLabel id="add-fee-intake">Intake</InputLabel>
            <Select
              labelId="add-fee-intake" label="Intake"
              value={intakeId} onChange={(e) => setIntakeId(e.target.value)}
              sx={{ borderRadius: "12px" }}
            >
              {intakes.length === 0 && <MenuItem value="" disabled>No active intakes</MenuItem>}
              {intakes.map((i) => <MenuItem key={i.id} value={i.id}>{i.name}</MenuItem>)}
            </Select>
          </FormControl>

          <TextField
            label="Amount"
            type="number"
            inputProps={{ step: "0.01", min: "0" }}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px" } }}
          />

          <TextField
            label="Currency"
            value={currency}
            onChange={(e) => setCurrency(e.target.value.toUpperCase())}
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px" } }}
          />

          <TextField
            label="Notes (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            multiline minRows={2}
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px" } }}
          />

          <Stack direction="row" justifyContent="flex-end" gap={1} sx={{ mt: 1 }}>
            <Button onClick={onClose} variant="outlined" sx={{ borderRadius: "12px" }}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={!canSubmit} sx={{ borderRadius: "12px", fontWeight: "bold" }}>
              Create
            </Button>
          </Stack>
        </Box>
      </Box>
    </Drawer>
  );
}
