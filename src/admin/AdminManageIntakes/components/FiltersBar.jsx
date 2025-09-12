import React from "react";
import {
  Paper, Box, TextField, InputAdornment, FormControlLabel, Switch, Stack, Chip, Button,
} from "@mui/material";
import { Search as SearchIcon } from "@mui/icons-material";

export default function FiltersBar({
  search, setSearch,
  showDeleted, setShowDeleted,
  loading, onReset
}) {
  return (
    <Paper elevation={2} sx={{ p: 2, mb: 2, borderRadius: "14px", bgcolor: "#fff", border: "1px solid #eef2f6" }}>
      <Box sx={{ display: "grid", gridTemplateColumns: "1.5fr auto auto", gap: 1.5, alignItems: "center" }}>
        <TextField
          label="Search (intake name)"
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
          control={<Switch checked={!!showDeleted} onChange={(e) => setShowDeleted(e.target.checked)} />}
          label="Show deleted"
        />

        <Stack direction="row" gap={1} justifyContent="flex-end">
          <Chip
            label={showDeleted ? "Deleted" : "Active"}
            color={showDeleted ? "warning" : "default"}
            sx={{ borderRadius: "8px", fontWeight: "bold", alignSelf: "center" }}
          />
          <Button variant="outlined" onClick={onReset} disabled={loading} sx={{ borderRadius: "12px" }}>
            Reset
          </Button>
        </Stack>
      </Box>
    </Paper>
  );
}
