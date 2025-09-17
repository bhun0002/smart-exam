import React from "react";
import {
  Box, TextField, InputAdornment, MenuItem, Button, FormControlLabel, Switch, Chip, Stack
} from "@mui/material";
import { Search as SearchIcon, Refresh as RefreshIcon } from "@mui/icons-material";

export default function FiltersBar({
  loading = false,
  intakesMap = {},
  coursesMap = {},
  search, setSearch,
  intakeId, setIntakeId,
  courseId, setCourseId,
  status, setStatus,
  showDeleted, setShowDeleted,
  activeCount = 0, deletedCount = 0,
  onReset,
  onAddClick,
}) {
  const intakeOptions = Object.entries(intakesMap);
  const courseOptions = Object.entries(coursesMap);

  return (
    <Box
      sx={{
        display: "grid",
        gap: 2,
        gridTemplateColumns: { xs: "1fr", md: "1.1fr 1fr 1fr 1fr 1fr auto" },
      }}
    >
      <TextField
        label="Search (name, email, ID, contact)"   // ✅ updated label
        size="small"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        InputProps={{
          startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment>,
          sx: { borderRadius: "12px" },
        }}
        placeholder="e.g. Alice, alice@email.com, 416…"  // ✅ updated placeholder
      />

      <TextField
        select size="small" label="Intake" value={intakeId} onChange={(e) => setIntakeId(e.target.value)}
        InputProps={{ sx: { borderRadius: "12px" } }}
      >
        <MenuItem value="all">All</MenuItem>
        {intakeOptions.map(([id, name]) => (
          <MenuItem key={id} value={id}>{name}</MenuItem>
        ))}
      </TextField>

      <TextField
        select size="small" label="Course" value={courseId} onChange={(e) => setCourseId(e.target.value)}
        InputProps={{ sx: { borderRadius: "12px" } }}
      >
        <MenuItem value="all">All</MenuItem>
        {courseOptions.map(([id, name]) => (
          <MenuItem key={id} value={id}>{name}</MenuItem>
        ))}
      </TextField>

      <TextField
        select size="small" label="Status" value={status} onChange={(e) => setStatus(e.target.value)}
        InputProps={{ sx: { borderRadius: "12px" } }}
      >
        <MenuItem value="all">All</MenuItem>
        <MenuItem value="approved">Approved</MenuItem>
        <MenuItem value="pending">Pending</MenuItem>
      </TextField>

      <FormControlLabel
        control={<Switch checked={!!showDeleted} onChange={(e) => setShowDeleted(e.target.checked)} />}
        label="Show deleted"
      />

      <Stack direction="row" spacing={1} alignItems="center" justifyContent="flex-end">
        <Chip
          label={`${activeCount} Active | ${deletedCount} Deleted`}
          size="small"
          variant="outlined"
          sx={{ borderRadius: "8px", fontWeight: "bold" }}
        />
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={onReset}
          disabled={loading}
          sx={{ borderRadius: "12px" }}
        >
          Reset
        </Button>
        {onAddClick && (
          <Button variant="contained" onClick={onAddClick} sx={{ borderRadius: "12px", fontWeight: "bold" }}>
            Add Student
          </Button>
        )}
      </Stack>
    </Box>
  );
}
