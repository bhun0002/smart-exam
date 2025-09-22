// src/admin/AdminPaymentClaims/components/ClaimsFiltersBar.jsx
import React from "react";
import {
  Paper, Stack, TextField, MenuItem, IconButton, Tooltip, Button, Chip
} from "@mui/material";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import RefreshIcon from "@mui/icons-material/Refresh";
import DownloadIcon from "@mui/icons-material/Download";

export default function ClaimsFiltersBar({
  filters, setFilters, counts,
  onRefresh, onExport, disabled = false
}) {
  const { from, to, status, hasProof, search } = filters;

  return (
    <Paper elevation={3} sx={{ p: 1.5, borderRadius: 2, mb: 2 }}>
      <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
        <TextField
          label="From"
          type="date"
          size="small"
          value={from || ""}
          onChange={e => setFilters(v => ({ ...v, from: e.target.value }))}
          InputLabelProps={{ shrink: true }}
        />
        <TextField
          label="To"
          type="date"
          size="small"
          value={to || ""}
          onChange={e => setFilters(v => ({ ...v, to: e.target.value }))}
          InputLabelProps={{ shrink: true }}
        />
        <TextField
          select
          label="Status"
          size="small"
          sx={{ minWidth: 160 }}
          value={status}
          onChange={e => setFilters(v => ({ ...v, status: e.target.value }))}
        >
          <MenuItem value="pending">Pending</MenuItem>
          <MenuItem value="linked">Linked</MenuItem>
          <MenuItem value="rejected">Rejected</MenuItem>
          <MenuItem value="all">All</MenuItem>
        </TextField>
        <TextField
          select
          label="Has proof"
          size="small"
          sx={{ minWidth: 140 }}
          value={hasProof}
          onChange={e => setFilters(v => ({ ...v, hasProof: e.target.value }))}
        >
          <MenuItem value="all">All</MenuItem>
          <MenuItem value="yes">Yes</MenuItem>
          <MenuItem value="no">No</MenuItem>
        </TextField>
        <TextField
          label="Search (student / ref / txn)"
          size="small"
          sx={{ minWidth: 280, flex: 1 }}
          value={search}
          onChange={e => setFilters(v => ({ ...v, search: e.target.value }))}
        />

        {typeof counts?.pending === "number" && (
          <Chip
            label={`${counts.pending} Pending`}
            color={counts.pending > 0 ? "warning" : "default"}
            variant={counts.pending > 0 ? "filled" : "outlined"}
          />
        )}

        <Tooltip title="Reset">
          <span>
            <IconButton onClick={() => setFilters({ from: "", to: "", status: "pending", hasProof: "all", search: "" })}
                        disabled={disabled}>
              <RestartAltIcon />
            </IconButton>
          </span>
        </Tooltip>

        <Tooltip title="Refresh">
          <span>
            <IconButton onClick={onRefresh} disabled={disabled}>
              <RefreshIcon />
            </IconButton>
          </span>
        </Tooltip>

        <Button
          size="small"
          startIcon={<DownloadIcon />}
          variant="outlined"
          onClick={onExport}
          disabled={disabled}
          sx={{ ml: "auto" }}
        >
          Export CSV
        </Button>
      </Stack>
    </Paper>
  );
}
