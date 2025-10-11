// src/student/payments/StudentPaymentsHome/components/Filters/ConfirmedFilters.jsx
import React from "react";
import { TextField, InputAdornment } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";

export default function ConfirmedFilters({
  from,
  to,
  min,
  max,
  txn,
  setFrom,
  setTo,
  setMin,
  setMax,
  setTxn,
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
        type="number"
        size="small"
        label="Min $"
        value={min ?? ""}
        onChange={(e) => setMin(e.target.value)}
        InputProps={{ inputProps: { step: "0.01" } }}
      />
      <TextField
        type="number"
        size="small"
        label="Max $"
        value={max ?? ""}
        onChange={(e) => setMax(e.target.value)}
        InputProps={{ inputProps: { step: "0.01" } }}
      />
      <TextField
        size="small"
        label="Txn ID"
        value={txn || ""}
        onChange={(e) => setTxn(e.target.value)}
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
