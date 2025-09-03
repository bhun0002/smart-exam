import React from "react";
import {
  Box, TextField, InputAdornment, MenuItem, Chip, Stack, Button
} from "@mui/material";
import { Search as SearchIcon, RestartAlt as ResetIcon } from "@mui/icons-material";

const FiltersBar = ({
  loading,
  examsMap,
  intakesMap,
  search, setSearch,
  examId, setExamId,
  intakeId, setIntakeId,
  status, setStatus,
  reset
}) => {
  const examOptions = Object.entries(examsMap).map(([id, e]) => ({ id, title: e.title }));
  const intakeOptions = Object.entries(intakesMap).map(([id, name]) => ({ id, name }));

  return (
    <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: 2 }}>
      <TextField
        label="Search (student, exam, intake)"
        size="small"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start"><SearchIcon /></InputAdornment>
          ),
          sx: { borderRadius: "12px" }
        }}
      />

      <TextField
        select size="small" label="Filter by Exam" value={examId} onChange={(e) => setExamId(e.target.value)}
        InputProps={{ sx: { borderRadius: "12px" } }}
      >
        <MenuItem value="all">All Exams</MenuItem>
        {examOptions.map(opt => (
          <MenuItem key={opt.id} value={opt.id}>{opt.title}</MenuItem>
        ))}
      </TextField>

      <TextField
        select size="small" label="Filter by Intake" value={intakeId} onChange={(e) => setIntakeId(e.target.value)}
        InputProps={{ sx: { borderRadius: "12px" } }}
      >
        <MenuItem value="all">All Intakes</MenuItem>
        {intakeOptions.map(opt => (
          <MenuItem key={opt.id} value={opt.id}>{opt.name}</MenuItem>
        ))}
      </TextField>

      <Stack direction="row" spacing={1} alignItems="center" justifyContent="flex-end">
        <Chip
          label={status === "submitted" ? "Submitted" : status === "inprogress" ? "In Progress" : "All"}
          color={status === "submitted" ? "success" : status === "inprogress" ? "warning" : "default"}
          sx={{ borderRadius: "8px", fontWeight: "bold" }}
        />
        <TextField
          select size="small" label="Status" value={status} onChange={(e) => setStatus(e.target.value)}
          sx={{ minWidth: 140, "& .MuiOutlinedInput-root": { borderRadius: "12px" } }}
        >
          <MenuItem value="submitted">Submitted</MenuItem>
          <MenuItem value="inprogress">In Progress</MenuItem>
          <MenuItem value="all">All</MenuItem>
        </TextField>
        <Button variant="outlined" startIcon={<ResetIcon />} onClick={reset} disabled={loading} sx={{ borderRadius: "12px" }}>
          Reset
        </Button>
      </Stack>
    </Box>
  );
};

export default FiltersBar;
