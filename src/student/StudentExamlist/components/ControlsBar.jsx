import React from "react";
import { Box, Button, FormControl, InputAdornment, InputLabel, MenuItem, Select, TextField, Typography } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SearchIcon from "@mui/icons-material/Search";

export default function ControlsBar({ search, setSearch, status, setStatus, onBack }) {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        mb: 4,
        flexWrap: "wrap",
        gap: 2,
      }}
    >
      <Button
        variant="outlined"
        startIcon={<ArrowBackIcon />}
        onClick={onBack}
        sx={{
          borderColor: "#4CAF50",
          color: "#4CAF50",
          borderRadius: "12px",
          fontWeight: "bold",
          "&:hover": { backgroundColor: "#E8F5E9" },
        }}
      >
        Back to Dashboard
      </Button>

      <Typography variant="h4" sx={{ color: "#388e3c", flexGrow: 1, textAlign: "center" }}>
        Available Exams
      </Typography>

      <TextField
        label="Search Exams"
        variant="outlined"
        size="small"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
          sx: { borderRadius: "12px" },
        }}
        sx={{ flexGrow: 1, maxWidth: 300 }}
      />

      <FormControl variant="outlined" size="small" sx={{ minWidth: 120 }}>
        <InputLabel id="exam-status-filter-label">Status</InputLabel>
        <Select
          labelId="exam-status-filter-label"
          id="exam-status-filter"
          value={status}
          label="Status"
          onChange={(e) => setStatus(e.target.value)}
          sx={{ borderRadius: "12px" }}
        >
          <MenuItem value="all">All Exams</MenuItem>
          <MenuItem value="attemptable">Attemptable</MenuItem>
          <MenuItem value="submitted">Submitted</MenuItem>
        </Select>
      </FormControl>
    </Box>
  );
}
