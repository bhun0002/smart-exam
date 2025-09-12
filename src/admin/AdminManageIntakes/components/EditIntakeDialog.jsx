import React from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Stack, Chip,
  FormControl, InputLabel, Select, MenuItem, TextField
} from "@mui/material";
import { MONTHS } from "../helpers/months";

export default function EditIntakeDialog({
  open,
  parsedMode,
  onToggleMode,
  monthIndex, setMonthIndex,
  year, setYear,
  freeText, setFreeText,
  onSave, onClose,
}) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Edit Intake</DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
          <Chip
            label={parsedMode ? "Structured" : "Free Text"}
            color={parsedMode ? "success" : "default"}
            variant="outlined"
          />
          <Button variant="text" onClick={onToggleMode}>
            {parsedMode ? "Switch to Free Text" : "Switch to Structured"}
          </Button>
        </Stack>

        {parsedMode ? (
          <Stack direction={{ xs: "column", sm: "row" }} gap={2} alignItems="stretch">
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
        ) : (
          <TextField
            fullWidth
            label="Intake name"
            placeholder="e.g., Apr 2025"
            value={freeText}
            onChange={(e) => setFreeText(e.target.value)}
            sx={{ mt: 1, "& .MuiOutlinedInput-root": { borderRadius: "12px" } }}
          />
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={onSave}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}
