// src/student/payments/StudentPaymentsHome/components/Filters/ClaimsFilters.jsx
import React from "react";
import { TextField, MenuItem, InputAdornment } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";

export default function ClaimsFilters({
  from,
  to,
  status,
  hasProof,
  reference,
  setFrom,
  setTo,
  setStatus,
  setHasProof,
  setReference,
}) {
  return (
    <>
      <TextField
        type="date"
        size="small"
        label="From"
        value={from || ""}
        onChange={(e) => setFrom(e.target.value)}
        InputLabelProps={{ shrink: true }}
      />
      <TextField
        type="date"
        size="small"
        label="To"
        value={to || ""}
        onChange={(e) => setTo(e.target.value)}
        InputLabelProps={{ shrink: true }}
      />
      <TextField
        select
        size="small"
        label="Status"
        value={status || "all"}
        onChange={(e) => setStatus(e.target.value)}
        sx={{ minWidth: 160 }}
      >
        <MenuItem value="all">All</MenuItem>
        <MenuItem value="pending">pending</MenuItem>
        <MenuItem value="linked">linked</MenuItem>
        <MenuItem value="rejected">rejected</MenuItem>
      </TextField>
      <TextField
        select
        size="small"
        label="Has proof"
        value={hasProof || "all"}
        onChange={(e) => setHasProof(e.target.value)}
        sx={{ minWidth: 140 }}
      >
        <MenuItem value="all">All</MenuItem>
        <MenuItem value="yes">Yes</MenuItem>
        <MenuItem value="no">No</MenuItem>
      </TextField>
      <TextField
        size="small"
        label="Reference"
        value={reference || ""}
        onChange={(e) => setReference(e.target.value)}
        placeholder="C1Awny…"
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon fontSize="small" />
            </InputAdornment>
          ),
        }}
      />
    </>
  );
}
