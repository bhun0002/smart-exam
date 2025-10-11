// src/admin/AdminPaymentManager/components/FiltersBar.jsx
import React from "react";
import {
  Box, TextField, InputAdornment, MenuItem, Button, Chip, Stack,
} from "@mui/material";
import { Search as SearchIcon, Refresh as RefreshIcon } from "@mui/icons-material";

/** Mirrors the layout/feel of your admin FiltersBar (grid, chip+reset lane). */
export default function FiltersBar({
  loading = false,

  search, setSearch,
  dateFrom, setDateFrom,
  dateTo, setDateTo,
  amountMin, setAmountMin,
  amountMax, setAmountMax,
  autodeposit, setAutodeposit, // 'all'|'true'|'false'
  gateway, setGateway,
  event, setEvent,

  activeCount = 0,
  flaggedCount = 0,

  onReset,
  gatewayOptions = [],
  eventOptions = [],
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
        label="Search (subject, sender, txn)"
        size="small"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        InputProps={{
          startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment>,
          sx: { borderRadius: "12px" },
        }}
        placeholder="e.g. Alice, 1994..., Interac..."
      />

      <TextField
        size="small"
        type="date"
        label="From"
        value={dateFrom}
        onChange={(e) => setDateFrom(e.target.value)}
        InputLabelProps={{ shrink: true }}
        InputProps={{ sx: { borderRadius: "12px" } }}
      />

      <TextField
        size="small"
        type="date"
        label="To"
        value={dateTo}
        onChange={(e) => setDateTo(e.target.value)}
        InputLabelProps={{ shrink: true }}
        InputProps={{ sx: { borderRadius: "12px" } }}
      />

      <Stack direction="row" spacing={1}>
        <TextField
          size="small"
          type="number"
          label="Min $"
          value={amountMin}
          onChange={(e) => setAmountMin(e.target.value)}
          InputProps={{ sx: { borderRadius: "12px" } }}
        />
        <TextField
          size="small"
          type="number"
          label="Max $"
          value={amountMax}
          onChange={(e) => setAmountMax(e.target.value)}
          InputProps={{ sx: { borderRadius: "12px" } }}
        />
      </Stack>

      <Stack direction="row" spacing={1} alignItems="center" justifyContent="flex-end">
        <Chip
          label={`${activeCount} Payments | ${flaggedCount} Flagged`}
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
      </Stack>

      <TextField
        select size="small" label="Gateway" value={gateway} onChange={(e) => setGateway(e.target.value)}
        InputProps={{ sx: { borderRadius: "12px" } }}
      >
        <MenuItem value="all">All</MenuItem>
        {gatewayOptions.map((g) => (<MenuItem key={g} value={g}>{g}</MenuItem>))}
      </TextField>

      <TextField
        select size="small" label="Event" value={event} onChange={(e) => setEvent(e.target.value)}
        InputProps={{ sx: { borderRadius: "12px" } }}
      >
        <MenuItem value="all">All</MenuItem>
        {eventOptions.map((ev) => (<MenuItem key={ev} value={ev}>{ev}</MenuItem>))}
      </TextField>

      {/* keep 6-col rhythm */}
      <Box sx={{ display: { xs: "none", md: "block" } }} />
      <Box sx={{ display: { xs: "none", md: "block" } }} />
    </Box>
  );
}
