// src/admin/AdminPaymentManager/components/PaymentDetailsDrawer.jsx
import React, { useMemo, useState, useEffect } from "react";
import {
  Drawer,
  Box,
  Typography,
  Divider,
  Stack,
  IconButton,
  Tooltip,
  Chip,
  Button,
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import EmailIcon from "@mui/icons-material/Email";
import LinkIcon from "@mui/icons-material/Link";

import LinkPaymentDrawer from "../components/LinkPaymentDrawer";
import { getPaymentLinkStatus } from "../lib/firestore";

const copy = (t) => (navigator.clipboard && t ? navigator.clipboard.writeText(t) : null);

/* ---- verified helpers (unchanged) ---- */
const PREFERRED_KEYS = ["verified","dkim_dmarc","dkimDmarc","dkim","dmarc","status","result","auth","authentication_results"];
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
    if (/(verify|dkim|dmarc|auth|authentication|status|result|spf)/i.test(k)) {
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
const normalizeVerified = (val) => {
  if (val == null) return { label: "n/a", color: "default", isNA: true };
  let s = val;
  if (typeof s === "string") s = s.trim();
  const lower = String(s).toLowerCase();
  if (["true","pass","passed","strict","ok","success"].includes(lower)) return { label: typeof val === "string" ? val : "pass", color: "success", isNA: false };
  if (["relaxed"].includes(lower)) return { label: "relaxed", color: "info", isNA: false };
  if (["false","fail","failed","error"].includes(lower)) return { label: typeof val === "string" ? val : "fail", color: "error", isNA: false };
  if (["none","neutral","unknown"].includes(lower)) return { label: lower, color: "default", isNA: false };
  return { label: String(val), color: "default", isNA: false };
};

/* ---------------- Main component ---------------- */
export default function PaymentDetailsDrawer({ open, onClose, payment, startLink = false, onLinkOpened }) {
  const pretty = useMemo(() => {
    try { return JSON.stringify(payment, null, 2); } catch { return ""; }
  }, [payment]);

  const [hideLinkAction, setHideLinkAction] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);

  // Evaluate link status for this payment (to hide action if already linked / no remaining)
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        if (!payment?.id) { if (alive) setHideLinkAction(true); return; }
        const s = await getPaymentLinkStatus(payment.id);
        if (alive) setHideLinkAction(!!s?.hasApprovedAny || Number(s?.remaining || 0) <= 0);
      } catch {
        if (alive) setHideLinkAction(false);
      }
    })();
    return () => { alive = false; };
  }, [payment?.id]);

  // NEW: if opened from table "Link" column, auto-open the link drawer once
  useEffect(() => {
    if (open && startLink) {
      setLinkOpen(true);
      onLinkOpened && onLinkOpened();
    }
  }, [open, startLink, onLinkOpened]);

  if (!payment) return null;

  const gmailId = payment?.meta?.gmail_message_id;
  const vnorm = normalizeVerified(getVerifiedRaw(payment));

  return (
    <>
      <Drawer
        anchor="right"
        open={open}
        onClose={onClose}
        PaperProps={{ sx: { width: { xs: "100%", sm: 560 }, borderLeft: "1px solid #eee" } }}
      >
        <Box sx={{ p: 3, display: "flex", flexDirection: "column", height: "100%", gap: 2, bgcolor: "#fff" }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h6" sx={{ color: "#1A237E", fontWeight: "bold" }}>
              Payment Details
            </Typography>

            {!hideLinkAction && (
              <Button
                size="small"
                variant="outlined"
                startIcon={<LinkIcon />}
                onClick={() => setLinkOpen(true)}
                sx={{ borderRadius: "10px" }}
              >
                Link to student
              </Button>
            )}
          </Stack>

          <Divider />

          <Row label="Amount" value={
            typeof payment?.amount?.value === "number"
              ? `${payment.amount.value.toFixed(2)} ${payment?.amount?.currency || "CAD"}`
              : "-"
          } />
          <Row label="Sender" value={`${payment?.sender?.name || "-"}${payment?.sender?.email ? ` (${payment.sender.email})` : ""}`} copyable />
          <Row label="Subject" value={payment?.meta?.subject} copyable />
          <Row label="Txn ID" value={payment?.transaction_id} copyable />
          <Row label="Gateway" value={payment?.gateway} />
          <Row label="Event" value={payment?.event} />
          <Row label="Bank Tail" value={payment?.bank_account_tail} />

          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
            <Typography variant="body2" sx={{ width: 140, color: "text.secondary" }}>Verified</Typography>
            <Chip size="small" color={vnorm.isNA ? undefined : vnorm.color} label={vnorm.label} />
          </Stack>

          <Divider />

          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
            <Tooltip title={gmailId ? `gmail message id: ${gmailId}` : "no gmail id"}>
              <span>
                <IconButton size="small" disabled={!gmailId} onClick={() => gmailId && copy(gmailId)}>
                  <EmailIcon fontSize="inherit" />
                </IconButton>
              </span>
            </Tooltip>
            <Typography variant="body2">
              {gmailId ? "Copy Gmail message id" : "No Gmail message id on record"}
            </Typography>
          </Stack>

          <Typography variant="subtitle2">Raw JSON</Typography>
          <Box component="pre" sx={{
            fontFamily: "monospace", fontSize: 12, bgcolor: "#fafafa", p: 1.5,
            borderRadius: 1, maxHeight: 320, overflow: "auto", border: "1px solid #eee",
          }}>
            {pretty}
          </Box>
        </Box>
      </Drawer>

      {/* Manual link drawer (same component/UX you already use) */}
      <LinkPaymentDrawer
        open={linkOpen}
        onClose={() => setLinkOpen(false)}
        payment={payment}
        onDone={() => { setLinkOpen(false); onClose?.(); }}
      />
    </>
  );
}

/* small row renderer (unchanged) */
const Row = ({ label, value, copyable }) => (
  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
    <Typography variant="body2" sx={{ width: 140, color: "text.secondary" }}>{label}</Typography>
    <Typography variant="body2" sx={{ flex: 1, wordBreak: "break-word" }}>{value ?? "-"}</Typography>
    {copyable && value ? (
      <Tooltip title="Copy">
        <IconButton size="small" onClick={() => (value ? navigator.clipboard.writeText(value) : null)}>
          <ContentCopyIcon fontSize="inherit" />
        </IconButton>
      </Tooltip>
    ) : null}
  </Stack>
);
