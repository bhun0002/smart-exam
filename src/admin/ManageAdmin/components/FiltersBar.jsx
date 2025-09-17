// src/admin/components/FiltersBar.jsx
import React from "react";
import {
  Box, TextField, InputAdornment, MenuItem, Button, FormControlLabel, Switch, Chip, Stack
} from "@mui/material";
import { Search as SearchIcon, Refresh as RefreshIcon, Add as AddIcon } from "@mui/icons-material";

export default function FiltersBar({
  loading = false,
  search, setSearch,
  role, setRole,
  status, setStatus,
  showDeleted, setShowDeleted,
  activeCount = 0, deletedCount = 0,
  onReset,
  onAddClick,
}) {
  return (
    <Box
      sx={{
        display: "grid",
        gap: 2,
        gridTemplateColumns: { xs: "1fr", md: "1.1fr 1fr 1fr 1fr auto auto" },
      }}
    >
      <TextField
        label="Search (name, email)"
        size="small"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        InputProps={{
          startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment>,
          sx: { borderRadius: "12px" },
        }}
        placeholder="e.g. Alice, alice@email.com"
      />

      <TextField
        select size="small" label="Role" value={role} onChange={(e) => setRole(e.target.value)}
        InputProps={{ sx: { borderRadius: "12px" } }}
      >
        <MenuItem value="all">All</MenuItem>
        <MenuItem value="master">Master Admin</MenuItem>
        <MenuItem value="tutor">Tutor Admin</MenuItem>
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
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={onAddClick}
            sx={{ borderRadius: "12px", fontWeight: "bold" }}
          >
            Add Admin
          </Button>
        )}
      </Stack>
    </Box>
  );
}
