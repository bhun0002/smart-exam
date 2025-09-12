import React, { useEffect, useState } from "react";
import {
  Drawer, Box, Typography, Divider, Stack,
  FormControl, InputLabel, Select, MenuItem, TextField, Button, Alert
} from "@mui/material";
import { MONTHS, buildIntakeName, parseIntakeName } from "../helpers/months";

export default function EditIntakeDrawer({ open, initialName, onClose, onSubmit }) {
  const [monthIndex, setMonthIndex] = useState(new Date().getMonth());
  const [year, setYear] = useState(new Date().getFullYear());
  const [err, setErr] = useState("");
  const [parseWarn, setParseWarn] = useState("");

  useEffect(() => {
    if (open) {
      setErr("");
      setParseWarn("");
      if (initialName) {
        const parsed = parseIntakeName(initialName);
        if (parsed.ok) {
          setMonthIndex(parsed.monthIndex);
          setYear(parsed.year);
        } else {
          // fallback to current month/year; inform the user
          const n = new Date();
          setMonthIndex(n.getMonth());
          setYear(n.getFullYear());
          setParseWarn(
            "The existing name is not in structured format (e.g., 'Apr 2026'). Please select Month & Year to rename."
          );
        }
      }
    }
  }, [open, initialName]);

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
          Edit Intake
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Update the intake using Month & Year only.
        </Typography>
        <Divider sx={{ mb: 2 }} />

        {parseWarn && <Alert severity="warning" sx={{ mb: 2 }}>{parseWarn}</Alert>}
        {err && <Alert severity="error" sx={{ mb: 2 }}>{err}</Alert>}

        <Box component="form" onSubmit={handleSubmit} sx={{ display: "grid", gap: 2 }}>
          <Stack direction={{ xs: "column", sm: "row" }} gap={2}>
            <FormControl sx={{ minWidth: 160 }}>
              <InputLabel id="edit-month-label">Month</InputLabel>
              <Select
                labelId="edit-month-label"
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
              Save Changes
            </Button>
          </Stack>
        </Box>
      </Box>
    </Drawer>
  );
}
