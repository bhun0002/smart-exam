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

  // NEW
  showDeleted, setShowDeleted,
  activeCount = 0, deletedCount = 0,   // << counts to display

  onReset,
}) => {
  const intakeOptions = Object.entries(intakesMap); // [[id, name], ...]

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "1fr",
          sm: "1fr 1fr",
          md: "1.2fr 1fr 1fr 1fr 0.9fr auto",
        },
        gap: 2,
        p: 2,
        mb: 2,
        borderRadius: "12px",
        bgcolor: "#fffaf3",
        border: "1px solid #ffe0b2",
      }}
    >
      {/* Search by title */}
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

      {/* Intake */}
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
          <MenuItem key={id} value={id}>{name}</MenuItem>
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

      {/* Toggle + counts + Reset */}
      <Box
        sx={{
          display: "flex",
          justifyContent: { xs: "stretch", md: "flex-end" },
          alignItems: "center",
          gap: 1,
          flexWrap: "wrap",
        }}
      >
        <FormControlLabel
          control={<Switch checked={!!showDeleted} onChange={(e) => setShowDeleted(e.target.checked)} />}
          label="Show deleted"
        />

        {/* NEW: small count badge right next to the toggle */}
        <Chip
          label={`${activeCount} Active | ${deletedCount} Deleted`}
          size="small"
          variant="outlined"
          sx={{ borderRadius: "8px" }}
        />

        <Stack direction="row" gap={1} alignItems="center">
          <Chip
            label={showDeleted ? "Deleted" : "Active"}
            color={showDeleted ? "warning" : "default"}
            sx={{ fontWeight: "bold", borderRadius: "8px" }}
          />
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={onReset}
            disabled={loading}
            sx={{ borderRadius: "12px", whiteSpace: "nowrap", height: "100%" }}
          >
            Reset
          </Button>
        </Stack>
      </Box>
    </Box>
  );
};

export default FiltersBar;
