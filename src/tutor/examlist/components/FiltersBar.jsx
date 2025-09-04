// src/tutor/examlist/components/FiltersBar.jsx
import React from "react";
import {
  Box,
  TextField,
  InputAdornment,
  MenuItem,
  Button,
} from "@mui/material";
import { Search as SearchIcon, Refresh as RefreshIcon } from "@mui/icons-material";

const FiltersBar = ({
  loading = false,

  // maps & current values
  intakesMap = {},                 // { intakeId: "Intake Name" }
  search, setSearch,               // string
  intakeId, setIntakeId,           // 'all' | intakeId
  availability, setAvailability,   // 'all' | 'available' | 'unavailable'
  hasPassword, setHasPassword,     // 'all' | 'with' | 'without'
  minTotalPoints, setMinTotalPoints, // number | '' (string when empty)

  onReset,                         // () => void
}) => {
  const intakeOptions = Object.entries(intakesMap); // [[id, name], ...]

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "1.2fr 1fr 1fr 1fr 0.7fr auto" },
        gap: 2,
        p: 2,
        mb: 2,
        borderRadius: "12px",
        bgcolor: "#fffaf3",
        border: "1px solid #ffe0b2",
      }}
    >
      {/* Search by title (standard size) */}
      <TextField
        label="Search by title"
        fullWidth
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="e.g. Midterm, Final…"
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
          sx: { borderRadius: "12px" },
        }}
        disabled={loading}
      />

      {/* Intake (TextField select for consistent sizing) */}
      <TextField
        select
        fullWidth
        label="Intake"
        value={intakeId}
        onChange={(e) => setIntakeId(e.target.value)}
        disabled={loading}
        InputProps={{ sx: { borderRadius: "12px" } }}
      >
        <MenuItem value="all">All</MenuItem>
        {intakeOptions.map(([id, name]) => (
          <MenuItem key={id} value={id}>
            {name}
          </MenuItem>
        ))}
      </TextField>

      {/* Availability */}
      <TextField
        select
        fullWidth
        label="Availability"
        value={availability}
        onChange={(e) => setAvailability(e.target.value)}
        disabled={loading}
        InputProps={{ sx: { borderRadius: "12px" } }}
      >
        <MenuItem value="all">All</MenuItem>
        <MenuItem value="available">Available</MenuItem>
        <MenuItem value="unavailable">Unavailable</MenuItem>
      </TextField>

      {/* Password filter */}
      <TextField
        select
        fullWidth
        label="Password"
        value={hasPassword}
        onChange={(e) => setHasPassword(e.target.value)}
        disabled={loading}
        InputProps={{ sx: { borderRadius: "12px" } }}
      >
        <MenuItem value="all">All</MenuItem>
        <MenuItem value="with">With</MenuItem>
        <MenuItem value="without">Without</MenuItem>
      </TextField>

      {/* Min Total Points */}
      <TextField
        fullWidth
        type="number"
        label="Min Total Points"
        value={minTotalPoints}
        onChange={(e) => setMinTotalPoints(e.target.value)}
        disabled={loading}
        InputProps={{ sx: { borderRadius: "12px" } }}
      />

      {/* Reset */}
      <Box sx={{ display: "flex", justifyContent: { xs: "stretch", md: "flex-end" } }}>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={onReset}
          disabled={loading}
          sx={{ borderRadius: "12px", whiteSpace: "nowrap", height: "100%" }}
        >
          Reset
        </Button>
      </Box>
    </Box>
  );
};

export default FiltersBar;
