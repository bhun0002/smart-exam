import React, { useEffect, useState } from "react";
import {
  Drawer, Box, Typography, Divider, Stack,
  FormControl, InputLabel, Select, MenuItem, TextField, Button, Alert
} from "@mui/material";
import { MONTHS, buildIntakeName } from "../helpers/months";

export default function AddIntakeDrawer({ open, onClose, onSubmit }) {
  const [monthIndex, setMonthIndex] = useState(new Date().getMonth());
  const [year, setYear] = useState(new Date().getFullYear());
  const [err, setErr] = useState("");

  useEffect(() => {
    if (open) {
      const n = new Date();
      setMonthIndex(n.getMonth());
      setYear(n.getFullYear());
      setErr("");
    }
  }, [open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr("");

    const name = buildIntakeName(monthIndex, year);
    if (!name) {
      setErr("Please choose a valid month and year.");
      return;
    }
    await onSubmit(name); // parent validates & closes
  };

  return (
    <Drawer anchor="right" open={open} onClose={onClose} PaperProps={{ sx: { width: { xs: "100%", sm: 440 } } }}>
      <Box sx={{ p: 3, display: "flex", flexDirection: "column", height: "100%" }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
          Add New Intake
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Create a new intake using Month & Year.
        </Typography>
        <Divider sx={{ mb: 2 }} />

        {err && <Alert severity="error" sx={{ mb: 2 }}>{err}</Alert>}

        <Box component="form" onSubmit={handleSubmit} sx={{ display: "grid", gap: 2 }}>
          <Stack direction={{ xs: "column", sm: "row" }} gap={2}>
            <FormControl sx={{ minWidth: 160 }}>
              <InputLabel id="add-month-label">Month</InputLabel>
              <Select
                labelId="add-month-label"
                label="Month"
                value={monthIndex}
                onChange={(e) => setMonthIndex(Number(e.target.value))}
                sx={{ borderRadius: "12px" }}
              >
                {MONTHS.map((m) => (
                  <MenuItem key={m.idx} value={m.idx}>{m.full}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Year"
              type="number"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px" } }}
            />
          </Stack>

          <Stack direction="row" justifyContent="flex-end" gap={1}>
            <Button onClick={onClose} variant="outlined" sx={{ borderRadius: "12px" }}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" sx={{ borderRadius: "12px", fontWeight: "bold" }}>
              Create
            </Button>
          </Stack>
        </Box>
      </Box>
    </Drawer>
  );
}
