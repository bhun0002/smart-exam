// src/admin/components/FiltersBar.jsx
import React, { useMemo } from "react";
import {
  Box, TextField, InputAdornment, FormControlLabel, Switch, Stack, Chip, Button,
  FormControl, InputLabel, Select, MenuItem
} from "@mui/material";
import { Search as SearchIcon, Refresh as RefreshIcon, Add as AddIcon } from "@mui/icons-material";

const isTrue = (v) => v === true || v === "true" || v === 1;

export default function FiltersBar({
  search, setSearch,
  showDeleted, setShowDeleted,
  loading, onReset,
  activeCount = 0,
  deletedCount = 0,
  courses = [],
  intakes = [],
  filterCourseId, setFilterCourseId,
  filterIntakeId, setFilterIntakeId,
  onAddClick,
}) {
  const courseOptions = useMemo(
    () => courses.map((c) => ({ id: c.id, name: c.name, del: isTrue(c.isDeleted) })),
    [courses]
  );
  const intakeOptions = useMemo(
    () => intakes.map((i) => ({ id: i.id, name: i.name, del: isTrue(i.isDeleted) })),
    [intakes]
  );

  return (
    <Box
      sx={{
        display: "grid",
        gap: 2,
        gridTemplateColumns: { xs: "1fr", md: "1.3fr 1fr 1fr auto auto" },
        alignItems: "center",
      }}
    >
      <TextField
        label="Search (course/intake/currency/amount)"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        disabled={loading}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
          sx: { borderRadius: "12px" },
        }}
      />

      <FormControl size="medium">
        <InputLabel id="fee-filter-course">Course</InputLabel>
        <Select
          labelId="fee-filter-course" label="Course"
          value={filterCourseId} onChange={(e) => setFilterCourseId(e.target.value)}
          sx={{ borderRadius: "12px" }}
        >
          <MenuItem value=""><em>All</em></MenuItem>
          {courseOptions.map((c) => (
            <MenuItem key={c.id} value={c.id} disabled={c.del}>{c.name}</MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl size="medium">
        <InputLabel id="fee-filter-intake">Intake</InputLabel>
        <Select
          labelId="fee-filter-intake" label="Intake"
          value={filterIntakeId} onChange={(e) => setFilterIntakeId(e.target.value)}
          sx={{ borderRadius: "12px" }}
        >
          <MenuItem value=""><em>All</em></MenuItem>
          {intakeOptions.map((i) => (
            <MenuItem key={i.id} value={i.id} disabled={i.del}>{i.name}</MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControlLabel
        control={<Switch checked={!!showDeleted} onChange={(e) => setShowDeleted(e.target.checked)} />}
        label="Show deleted"
      />

      <Stack direction="row" gap={1} justifyContent="flex-end" alignItems="center">
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
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={onAddClick}
            sx={{ borderRadius: "12px", fontWeight: "bold" }}
          >
            Add Fee
          </Button>
        )}
      </Stack>
    </Box>
  );
}
