// src/tutoradmin/ManageTutorAdmincomponents/FiltersBar.jsx
import React from "react";
import {
  Box, TextField, InputAdornment, FormControl, InputLabel, Select, MenuItem,
  Stack, Chip, Button, FormControlLabel, Switch
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import RefreshIcon from "@mui/icons-material/Refresh";
import AddIcon from "@mui/icons-material/Add";

export default function FiltersBar({
  search, setSearch,
  status, setStatus,
  showDeleted, setShowDeleted,
  loading,
  onReset,
  activeCount = 0,
  deletedCount = 0,
  onAddClick,
}) {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", md: "1.4fr 1fr auto auto" },
        gap: 2,
        alignItems: "center",
        "& .MuiTextField-root .MuiOutlinedInput-input": { py: 1.25 },
      }}
    >
      <TextField
        label="Search (name, email)"
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

      <FormControl disabled={loading}>
        <InputLabel id="tutor-status">Status</InputLabel>
        <Select
          labelId="tutor-status"
          value={status}
          label="Status"
          onChange={(e) => setStatus(e.target.value)}
          sx={{ borderRadius: "12px" }}
        >
          <MenuItem value="all">All</MenuItem>
          <MenuItem value="approved">Approved</MenuItem>
          <MenuItem value="pending">Pending</MenuItem>
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
            Add Tutor
          </Button>
        )}
      </Stack>
    </Box>
  );
}
