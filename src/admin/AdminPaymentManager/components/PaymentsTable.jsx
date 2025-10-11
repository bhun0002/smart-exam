// src/admin/AdminPaymentManager/components/PaymentsTable.jsx
import React from "react";
import {
  Paper, Table, TableHead, TableRow, TableCell, TableBody, TableContainer,
  Chip, Tooltip, Typography, Stack, IconButton, CircularProgress, Box, Button
} from "@mui/material";
import { ContentCopy as CopyIcon, Link as LinkIcon, InfoOutlined as InfoIcon } from "@mui/icons-material";

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
        if (typeof v.value === "string" || typeof v.value === "boolean") return v.value;
      }
    }
  }
  return null;
};

const findVerifiedRecursive = (obj, depth = 0) => {
  if (!obj || typeof obj !== "object" || depth > 2) return null;

  const fromPreferred = getFromKnownKeys(obj);
  if (fromPreferred != null) return fromPreferred;

  for (const [k, v] of Object.entries(obj)) {
    if (KEY_HINT.test(k)) {
      if (typeof v === "string" || typeof v === "boolean") return v;
      if (v && typeof v === "object") {
        for (const vv of Object.values(v)) {
          if (typeof vv === "string" || typeof vv === "boolean") return vv;
        }
      }
    }
  }

  for (const v of Object.values(obj)) {
    if (v && typeof v === "object") {
      const found = findVerifiedRecursive(v, depth + 1);
      if (found != null) return found;
    }
  }
  return null;
};

const getVerifiedRaw = (row) => {
  const v = row?.verified;
  if (typeof v === "string" || typeof v === "boolean") return v;
  if (v && typeof v === "object") {
    const fromVerified = getFromKnownKeys(v) ?? findVerifiedRecursive(v);
    if (fromVerified != null) return fromVerified;
  }
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

/* ---------------- Link status chip ---------------- */
const LinkStatus = ({ st }) => {
  if (!st) return <Typography variant="caption" color="text.secondary">—</Typography>;
  const rem = Number(st.remaining || 0);
  if (st.hasApprovedAny && rem <= 0) return <Chip size="small" color="success" label="Linked" />;
  if (st.hasApprovedAny && rem > 0)  return <Chip size="small" color="warning" label={`Partial · Rem: ${rem.toFixed(2)}`} />;
  return <Chip size="small" variant="outlined" label="Unlinked" />;
};

/* ---------------- Tooltip renderer for linked details ---------------- */
const renderLinkedTooltip = (st) => {
  if (!st?.hasApprovedAny || !Array.isArray(st.linksDetails) || st.linksDetails.length === 0) return "No linked students.";
  const lines = st.linksDetails.map((l) => {
    const who = l.studentName
      ? `${l.studentName}${l.studentMintId ? ` (${l.studentMintId})` : ""}`
      : (l.studentMintId || "Unknown");
    const amt = Number(l.amountApplied || 0).toFixed(2);
    const enr = l.enrollmentTitle ? ` — ${l.enrollmentTitle}` : "";
    return `${who} — $${amt} ${l.currency || "CAD"}${enr}`;
  });
  const rem = Number(st.remaining || 0);
  if (rem > 0) lines.push(`Remaining: $${rem.toFixed(2)}`);
  return lines.join("\n");
};

/* ---------------- Table ---------------- */
export default function PaymentsTable({ rows = [], loading, onRowClick, statusMap = {}, onLink }) {
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
            {/* NEW column */}
            <TableCell align="right">Link</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {loading && rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={11} align="center" sx={{ py: 6 }}>
                <CircularProgress size={26} />
              </TableCell>
            </TableRow>
          ) : rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={11} align="center" sx={{ py: 6, color: "text.secondary" }}>
                No payments found.
              </TableCell>
            </TableRow>
          ) : (
            rows.map((r) => {
              const st = statusMap[r.id];
              const canLink = !!onLink && st && !st.hasApprovedAny && Number(st.remaining || 0) > 0;

              return (
                <TableRow
                  key={r.id}
                  sx={{ "&:hover": { bgcolor: "#f1f1f1" }, cursor: "pointer" }}
                  onClick={() => onRowClick && onRowClick(r)}
                >
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

                  {/* Verified */}
                  <TableCell><VerifiedChip row={r} /></TableCell>

                  <TableCell><AutoChip v={!!r?.autodeposit} /></TableCell>
                  <TableCell><WarnChip warnings={r?._warnings} /></TableCell>

                  {/* NEW Link column */}
                  <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                    <Stack direction="row" spacing={1} justifyContent="flex-end" alignItems="center">
                      <LinkStatus st={st} />
                      {/* If already linked/partial -> show ℹ️ tooltip with details */}
                      {st?.hasApprovedAny && (
                        <Tooltip title={<pre style={{ margin: 0 }}>{renderLinkedTooltip(st)}</pre>} arrow>
                          <IconButton size="small">
                            <InfoIcon fontSize="inherit" />
                          </IconButton>
                        </Tooltip>
                      )}
                      {/* If still linkable -> show existing button unchanged */}
                      {canLink && (
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<LinkIcon />}
                          sx={{ borderRadius: "10px" }}
                          onClick={() => onLink(r)}
                        >
                          Link To Student
                        </Button>
                      )}
                    </Stack>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
