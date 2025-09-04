// src/tutor/viewsubmission/components/FiltersBar.jsx
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
  grading, setGrading,               // NEW: 'all' | 'graded' | 'ungraded'
  reset
}) => {
  const examOptions = Object.entries(examsMap).map(([id, e]) => ({ id, title: e.title }));
  const intakeOptions = Object.entries(intakesMap).map(([id, name]) => ({ id, name }));

  return (
    <Box
      sx={{
        display: "grid",
        gap: 2,
        gridTemplateColumns: { xs: "1fr", md: "1fr 1fr 1fr 1fr auto" }, // 4 controls + actions
      }}
    >
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

      {/* NEW: Grading filter */}
      <TextField
        select size="small" label="Grading" value={grading} onChange={(e) => setGrading(e.target.value)}
        InputProps={{ sx: { borderRadius: "12px" } }}
      >
        <MenuItem value="all">All</MenuItem>
        <MenuItem value="graded">Graded</MenuItem>
        <MenuItem value="ungraded">Not graded</MenuItem>
      </TextField>

      {/* Actions lane (chips + reset), stays aligned to the right */}
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

        {/* NEW: grading summary chip mirrors the select above */}
        <Chip
          label={grading === "graded" ? "Graded" : grading === "ungraded" ? "Not graded" : "All"}
          color={grading === "graded" ? "success" : grading === "ungraded" ? "warning" : "default"}
          sx={{ borderRadius: "8px", fontWeight: "bold" }}
        />

        <Button
          variant="outlined"
          startIcon={<ResetIcon />}
          onClick={reset}
          disabled={loading}
          sx={{ borderRadius: "12px" }}
        >
          Reset
        </Button>
      </Stack>
    </Box>
  );
};

export default FiltersBar;
