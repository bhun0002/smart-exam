import React from "react";
import {
  Paper, Table, TableHead, TableRow, TableCell, TableBody, TableContainer,
  Chip, Tooltip, Typography, Stack, IconButton, CircularProgress, Box
} from "@mui/material";
import { ContentCopy as CopyIcon } from "@mui/icons-material";

const headerSx = {
  bgcolor: "#ffd6a5",
  "& .MuiTableCell-head": { backgroundColor: "#ffd6a5", fontWeight: 700 },
};

const copy = (t) => (navigator.clipboard && t ? navigator.clipboard.writeText(t) : null);

/* ---------------- Verified extraction (robust) ---------------- */
const KEY_HINT = /(verify|dkim|dmarc|auth|authentication|status|result|spf)/i;
const PREFERRED_KEYS = [
  "verified", "dkim_dmarc", "dkimDmarc", "dkim", "dmarc", "status", "result", "auth", "authentication_results"
];

const getFromKnownKeys = (obj) => {
  for (const k of PREFERRED_KEYS) {
    if (obj && Object.prototype.hasOwnProperty.call(obj, k)) {
      const v = obj[k];
      if (typeof v === "string" || typeof v === "boolean") return v;
      if (v && typeof v === "object") {
        // sometimes value is { value: "True" } etc.
        if (typeof v.value === "string" || typeof v.value === "boolean") return v.value;
      }
    }
  }
  return null;
};

const findVerifiedRecursive = (obj, depth = 0) => {
  if (!obj || typeof obj !== "object" || depth > 2) return null;

  // 1) preferred keys first
  const fromPreferred = getFromKnownKeys(obj);
  if (fromPreferred != null) return fromPreferred;

  // 2) scan other keys that look relevant
  for (const [k, v] of Object.entries(obj)) {
    if (KEY_HINT.test(k)) {
      if (typeof v === "string" || typeof v === "boolean") return v;
      if (v && typeof v === "object") {
        // common pattern: { mode: "relaxed" } or { dkim: "pass" }
        for (const vv of Object.values(v)) {
          if (typeof vv === "string" || typeof vv === "boolean") return vv;
        }
      }
    }
  }

  // 3) recurse into children (bounded depth)
  for (const v of Object.values(obj)) {
    if (v && typeof v === "object") {
      const found = findVerifiedRecursive(v, depth + 1);
      if (found != null) return found;
    }
  }
  return null;
};

const getVerifiedRaw = (row) => {
  // direct primitive on row.verified
  const v = row?.verified;
  if (typeof v === "string" || typeof v === "boolean") return v;

  // map inside verified
  if (v && typeof v === "object") {
    const fromVerified = getFromKnownKeys(v) ?? findVerifiedRecursive(v);
    if (fromVerified != null) return fromVerified;
  }

  // fallback: search whole row
  return findVerifiedRecursive(row);
};

/* ---------------- Normalize to a chip ---------------- */
const normalizeVerified = (val) => {
  if (val == null) return { label: "n/a", color: "default", isNA: true };
  let s = val;
  if (typeof s === "string") s = s.trim();
  const lower = String(s).toLowerCase();

  if (["true", "pass", "passed", "strict", "ok", "success"].includes(lower))
    return { label: typeof val === "string" ? val : "pass", color: "success", isNA: false };
  if (["relaxed"].includes(lower))
    return { label: "relaxed", color: "info", isNA: false };
  if (["false", "fail", "failed", "error"].includes(lower))
    return { label: typeof val === "string" ? val : "fail", color: "error", isNA: false };
  if (["none", "neutral", "unknown"].includes(lower))
    return { label: lower, color: "default", isNA: false };

  // unknown but present → show label neutral
  return { label: String(val), color: "default", isNA: false };
};

const VerifiedChip = ({ row }) => {
  const raw = getVerifiedRaw(row);
  const { label, color, isNA } = normalizeVerified(raw);
  return <Chip size="small" color={isNA ? undefined : color} label={label} />;
};

const AutoChip = ({ v }) => <Chip size="small" color={v ? "success" : "default"} label={v ? "Auto" : "Manual"} />;
const WarnChip = ({ warnings }) =>
  warnings && warnings.length > 0 ? <Chip size="small" color="warning" label="Check" /> : <Chip size="small" variant="outlined" label="OK" />;

/* ---------------- Table ---------------- */
export default function PaymentsTable({ rows = [], loading, onRowClick }) {
  return (
    <TableContainer component={Paper} sx={{ boxShadow: 3 }}>
      <Table stickyHeader size="medium">
        <TableHead sx={headerSx}>
          <TableRow>
            <TableCell>Date</TableCell>
            <TableCell>Amount (CAD)</TableCell>
            <TableCell>Sender</TableCell>
            <TableCell>Subject</TableCell>
            <TableCell>Bank Tail</TableCell>
            <TableCell>Txn ID</TableCell>
            <TableCell>Gateway / Event</TableCell>
            <TableCell>Verified</TableCell>
            <TableCell>Auto-deposit</TableCell>
            <TableCell>Warnings</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {loading && rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={10} align="center" sx={{ py: 6 }}>
                <CircularProgress size={26} />
              </TableCell>
            </TableRow>
          ) : rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={10} align="center" sx={{ py: 6, color: "text.secondary" }}>
                No payments found.
              </TableCell>
            </TableRow>
          ) : (
            rows.map((r) => (
              <TableRow key={r.id} sx={{ "&:hover": { bgcolor: "#f1f1f1" }, cursor: "pointer" }} onClick={() => onRowClick && onRowClick(r)}>
                <TableCell>{r.dateDisplay}</TableCell>
                <TableCell>{typeof r?.amount?.value === "number" ? r.amount.value.toFixed(2) : "-"}</TableCell>

                {/* Sender (keep copy inline) */}
                <TableCell sx={{ whiteSpace: "nowrap" }}>
                  <Stack direction="row" spacing={1.25} alignItems="center" sx={{ flexWrap: "nowrap" }}>
                    <Box sx={{ width: 32, height: 32, borderRadius: "10px", bgcolor: "#BBDEFB", color: "#0D47A1",
                               display: "grid", placeItems: "center", fontWeight: 700, flex: "0 0 auto" }}>
                      {(r?.sender?.name || "S")[0].toUpperCase()}
                    </Box>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.1 }}>
                        {r?.sender?.name || "Unknown"}
                      </Typography>
                      <Stack direction="row" spacing={0.75} alignItems="center" sx={{ minWidth: 0, overflow: "hidden" }}>
                        <Typography variant="caption" color="text.secondary"
                                    sx={{ whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden", maxWidth: 220 }}
                                    title={r?.sender?.email || ""}>
                          {r?.sender?.email || "—"}
                        </Typography>
                        {r?.sender?.email && (
                          <Tooltip title="Copy email">
                            <IconButton size="small" onClick={(e) => { e.stopPropagation(); copy(r.sender.email); }}>
                              <CopyIcon fontSize="inherit" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Stack>
                    </Box>
                  </Stack>
                </TableCell>

                <TableCell sx={{ maxWidth: 320, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {r?.meta?.subject || "-"}
                </TableCell>
                <TableCell>{r?.bank_account_tail || "-"}</TableCell>

                {/* Txn ID (keep copy inline) */}
                <TableCell sx={{ whiteSpace: "nowrap" }}>
                  <Stack direction="row" spacing={0.75} alignItems="center">
                    <Typography variant="body2">{r?.transaction_id || "-"}</Typography>
                    {r?.transaction_id && (
                      <Tooltip title="Copy transaction id">
                        <IconButton size="small" onClick={(e) => { e.stopPropagation(); copy(r.transaction_id); }}>
                          <CopyIcon fontSize="inherit" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Stack>
                </TableCell>

                <TableCell>{r?.gateway || "-"} {r?.event ? ` / ${r.event}` : ""}</TableCell>

                {/* ✅ Verified now scans whole row if needed */}
                <TableCell><VerifiedChip row={r} /></TableCell>

                <TableCell><AutoChip v={!!r?.autodeposit} /></TableCell>
                <TableCell><WarnChip warnings={r?._warnings} /></TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
