// src/admin/AdminDocManager/components/FiltersBar.jsx
import React from "react";
import {
  Box, TextField, InputAdornment, FormControlLabel, Switch,
  Stack, Chip, Button
} from "@mui/material";
import { Search as SearchIcon, Refresh as RefreshIcon, Add as AddIcon } from "@mui/icons-material";

export default function FiltersBar({
  search, setSearch,
  onlyMandatory, setOnlyMandatory,
  showDeleted, setShowDeleted,
  activeCount = 0, deletedCount = 0,
  loading = false,
  onReset,
  onAddClick,
}) {
  return (
    <Box
      sx={{
        display: "grid",
        gap: 2,
        gridTemplateColumns: { xs: "1fr", md: "1.2fr auto auto auto" },
        alignItems: "center",
      }}
    >
      <TextField
        label="Search (title, description)"
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

      <FormControlLabel
        control={<Switch checked={!!onlyMandatory} onChange={(e) => setOnlyMandatory(e.target.checked)} />}
        label="Mandatory only"
      />
      <FormControlLabel
        control={<Switch checked={!!showDeleted} onChange={(e) => setShowDeleted(e.target.checked)} />}
        label="Show deleted"
      />

      <Stack direction="row" spacing={1} justifyContent="flex-end" alignItems="center">
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
            Add Requirement
          </Button>
        )}
      </Stack>
    </Box>
  );
}
