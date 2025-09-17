// src/tutor/examlist/components/FiltersBar.jsx
import React from "react";
import {
  Box,
  TextField,
  InputAdornment,
  MenuItem,
  Button,
  FormControlLabel,
  Switch,
  Chip,
  Stack,
} from "@mui/material";
import { Search as SearchIcon, RestartAlt as ResetIcon } from "@mui/icons-material";

const FiltersBar = ({
  loading = false,

  // maps & current values
  intakesMap = {},                 // { intakeId: "Intake Name" }
  coursesMap = {},                 // { courseId: "Course Name" }
  search, setSearch,               // string
  intakeId, setIntakeId,           // 'all' | intakeId
  courseId, setCourseId,           // 'all' | courseId
  availability, setAvailability,   // 'all' | 'available' | 'unavailable'
  hasPassword, setHasPassword,     // 'all' | 'with' | 'without'
  minTotalPoints, setMinTotalPoints,

  // deleted toggle + counts
  showDeleted, setShowDeleted,
  activeCount = 0, deletedCount = 0,

  onReset,
}) => {
  const intakeOptions = Object.entries(intakesMap);   // [[id, name], ...]
  const courseOptions = Object.entries(coursesMap);   // [[id, name], ...]

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
        label="Search (title, intake, course)"
        size="small"
        fullWidth
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="e.g. Midterm, Final…"
        InputProps={{
          startAdornment: (
            <InputAdornment position="start"><SearchIcon /></InputAdornment>
          ),
          sx: { borderRadius: "12px" },
        }}
        disabled={loading}
      />

      {/* Intake */}
      <TextField
        select
        size="small"
        label="Filter by Intake"
        value={intakeId}
        onChange={(e) => setIntakeId(e.target.value)}
        disabled={loading}
        InputProps={{ sx: { borderRadius: "12px" } }}
      >
        <MenuItem value="all">All Intakes</MenuItem>
        {intakeOptions.map(([id, name]) => (
          <MenuItem key={id} value={id}>{name}</MenuItem>
        ))}
      </TextField>

      {/* Course */}
      <TextField
        select
        size="small"
        label="Filter by Course"
        value={courseId}
        onChange={(e) => setCourseId(e.target.value)}
        disabled={loading}
        InputProps={{ sx: { borderRadius: "12px" } }}
      >
        <MenuItem value="all">All Courses</MenuItem>
        {courseOptions.map(([id, name]) => (
          <MenuItem key={id} value={id}>{name}</MenuItem>
        ))}
      </TextField>

      {/* Availability */}
      <TextField
        select
        size="small"
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

      {/* Actions lane (chips + small controls + reset), right-aligned like View Submissions */}
      <Stack
        direction="row"
        spacing={1}
        alignItems="center"
        justifyContent="flex-end"
        sx={{ flexWrap: "wrap" }}
      >
        {/* State chip mirrors deleted/active context
        <Chip
          label={showDeleted ? "Deleted View" : "Active View"}
          color={showDeleted ? "warning" : "default"}
          sx={{ borderRadius: "8px", fontWeight: "bold" }}
        /> */}

        {/* Password filter (kept in actions lane to match the View Submissions pattern) */}
        <TextField
          select
          size="small"
          label="Password"
          value={hasPassword}
          onChange={(e) => setHasPassword(e.target.value)}
          disabled={loading}
          sx={{ minWidth: 140, "& .MuiOutlinedInput-root": { borderRadius: "12px" } }}
        >
          <MenuItem value="all">All</MenuItem>
          <MenuItem value="with">With</MenuItem>
          <MenuItem value="without">Without</MenuItem>
        </TextField>

        {/* Min Total Points (compact) */}
        <TextField
          size="small"
          type="number"
          label="Min Points"
          value={minTotalPoints}
          onChange={(e) => setMinTotalPoints(e.target.value)}
          disabled={loading}
          sx={{ width: 130, "& .MuiOutlinedInput-root": { borderRadius: "12px" } }}
          inputProps={{ min: 0 }}
        />

        {/* Show Deleted toggle */}
        <FormControlLabel
          control={
            <Switch
              checked={!!showDeleted}
              onChange={(e) => setShowDeleted(e.target.checked)}
              size="small"
            />
          }
          label="Show deleted"
          sx={{ ml: 1 }}
        />
        {/* Counts (Active | Deleted) */}
        <Chip
          label={`${activeCount} Active | ${deletedCount} Deleted`}
          variant="outlined"
          sx={{ borderRadius: "8px", fontWeight: "bold" }}
        />

        {/* Reset button */}
        <Button
          variant="outlined"
          startIcon={<ResetIcon />}
          onClick={onReset}
          disabled={loading}
          sx={{ borderRadius: "12px", whiteSpace: "nowrap" }}
        >
          Reset
        </Button>
      </Stack>
    </Box>
  );
};

export default FiltersBar;
