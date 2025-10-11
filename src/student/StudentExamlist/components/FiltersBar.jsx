// src/student/StudentExamlist/components/FiltersBar.jsx
import React from "react";
import {
  Box,
  TextField,
  InputAdornment,
  MenuItem,
} from "@mui/material";
import { Search as SearchIcon } from "@mui/icons-material";

const FiltersBar = ({  loading = false, search, setSearch, status, setStatus }) => {

  return (
    <Box
      sx={{
        display: "grid",
        gap: 2,
        gridTemplateColumns: { xs: "1fr", md: "1fr 1fr 1fr 1fr auto" }, // 4 controls + actions lane (like View Submissions)
      }}
    >
      {/* Search */}
      <TextField
        label="Search Exams"
        size="small"
        fullWidth
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="e.g. Module 1, Mod…"
        InputProps={{
          startAdornment: (
            <InputAdornment position="start"><SearchIcon /></InputAdornment>
          ),
          sx: { borderRadius: "12px" },
        }}
        disabled={loading}
      />
      {/* Availability */}
      <TextField
        select
        size="small"
        label="Availability"
        value={status}
        onChange={(e) => setStatus(e.target.value)}
        disabled={loading}
        InputProps={{ sx: { borderRadius: "12px" } }}
      >
        <MenuItem value="all">All Exams</MenuItem>
        <MenuItem value="attemptable">Attemptable</MenuItem>
        <MenuItem value="submitted">Submitted</MenuItem>
      </TextField>
    </Box>
  );
};

export default FiltersBar;
