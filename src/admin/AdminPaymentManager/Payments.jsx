import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Box, Paper, Snackbar, Alert as MuiAlert, Typography, Stack, Button, Tooltip, Switch, FormControlLabel,
} from "@mui/material";
import { SaveAlt as ExportIcon, Refresh as RefreshIcon } from "@mui/icons-material";
import {
  collection, getDocs, onSnapshot, orderBy, query, where, limit, startAfter,
} from "firebase/firestore";
import { db } from "../../firebaseConfig";

import TopBar from "./components/TopBar";
import FiltersBar from "./components/FiltersBar";
import PaymentsTable from "./components/PaymentsTable";
import PaymentDetailsDrawer from "./components/PaymentDetailsDrawer";
import PaginationBar from "../../shared/PaginationBar";

// NEW: pull link status helper used by details drawer too
import { getPaymentLinkStatus } from "./lib/firestore";

const PAGE_SIZE = 10;
const COLLECTION = "interac_payments";

/* ---------------- helpers ---------------- */
const parseSender = (metaFrom = "") => {
  const m = metaFrom.match(/^(.*?)\s*<([^>]+)>/);
  return { name: (m?.[1] || "").trim(), email: (m?.[2] || "").trim() || metaFrom.trim() };
};
const parseAmountFromSubject = (subject = "") => {
  const m = subject.match(/\$([\d,]+\.\d{2})/);
  return m ? parseFloat(m[1].replace(/,/g, "")) : null;
};
const localDateFromISO = (iso) => {
  try { const d = new Date(iso); if (!isNaN(d.getTime())) return d; } catch { }
  return null;
};
const toStartOfDayLocal = (yyyy_mm_dd) => {
  if (!yyyy_mm_dd) return null;
  const [y, m, d] = yyyy_mm_dd.split("-").map(Number);
  return new Date(y, m - 1, d, 0, 0, 0, 0);
};
const toEndOfDayLocal = (yyyy_mm_dd) => {
  if (!yyyy_mm_dd) return null;
  const [y, m, d] = yyyy_mm_dd.split("-").map(Number);
  return new Date(y, m - 1, d, 23, 59, 59, 999);
};
// NEW: ISO (UTC) -> local YYYY-MM-DD (for your date textfields)
const isoToYMD = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  // local y-m-d
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${day}`;
};

/** Build CSV text with link status columns */
const toCSV = (rows, statusMapForCSV) => {
  const head = [
    "date",
    "amount_value",
    "currency",
    "sender_name",
    "sender_email",
    "subject",
    "bank_tail",
    "txn_id",
    "gateway",
    "event",
    "autodeposit",
    "verified_dkim_dmarc",
    "warnings",
    // NEW:
    "link_status",
    "remaining",
  ];
  const esc = (v) => (typeof v === "string" ? `"${v.replace(/"/g, '""')}"` : v ?? "");

  const line = (r) => {
    const st = statusMapForCSV[r.id];
    let linkStatus = "Unlinked";
    let remaining = "";
    if (st) {
      const rem = Number(st.remaining || 0);
      remaining = Number.isFinite(rem) ? rem.toFixed(2) : "";
      if (st.hasApprovedAny && rem <= 0) linkStatus = "Linked";
      else if (st.hasApprovedAny && rem > 0) linkStatus = `Partial`;
    }

    return ([
      r.dateDisplay,
      r.amount?.value ?? "",
      r.amount?.currency ?? "",
      r.sender?.name ?? "",
      r.sender?.email ?? "",
      r.meta?.subject ?? "",
      r.bank_account_tail ?? "",
      r.transaction_id ?? "",
      r.gateway ?? "",
      r.event ?? "",
      r.autodeposit ?? "",
      r.verified?.dkim_dmarc ?? "",
      (r._warnings || []).join("; "),
      linkStatus,
      remaining,
    ].map(esc).join(","));
  };

  return [head.join(","), ...rows.map(line)].join("\n");
};

/* ---------------- page ---------------- */
export default function Payments() {
  const navigate = useNavigate();
  const location = useLocation();

  // data
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  // pagination
  const [page, setPage] = useState(1);
  const lastDocRef = useRef(null);

  // filters
  const [search, setSearch] = useState(""); // subject/name/email/txn
  const [dateFrom, setDateFrom] = useState(""); // YYYY-MM-DD
  const [dateTo, setDateTo] = useState("");     // YYYY-MM-DD
  const [amountMin, setAmountMin] = useState("");
  const [amountMax, setAmountMax] = useState("");
  const [autodeposit, setAutodeposit] = useState("all"); // 'all'|'true'|'false'
  const [gateway, setGateway] = useState("all");
  const [event, setEvent] = useState("all");

  // live
  const [live, setLive] = useState(false);
  const liveUnsubRef = useRef(null);

  // drawer
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selected, setSelected] = useState(null);

  // NEW: when the table “Link” button is used, start link drawer immediately
  const [startLink, setStartLink] = useState(false);

  // snackbar
  const [snack, setSnack] = useState({ open: false, msg: "", severity: "success" });
  const closeSnack = (_, r) => (r === "clickaway" ? null : setSnack((s) => ({ ...s, open: false })));

  // options for selects (from loaded rows)
  const gatewayOptions = useMemo(() => {
    const s = new Set(); rows.forEach((r) => r.gateway && s.add(r.gateway)); return Array.from(s);
  }, [rows]);
  const eventOptions = useMemo(() => {
    const s = new Set(); rows.forEach((r) => r.event && s.add(r.event)); return Array.from(s);
  }, [rows]);

  /* ------------ seed filters from navigation state (clean URLs) ------------ */
  useEffect(() => {
    if (!location.state) return;
    const { from, to, linked } = location.state || {};
    if (from) {
      const ymd = isoToYMD(from);
      if (ymd) setDateFrom(ymd);
    }
    if (to) {
      const ymd = isoToYMD(to);
      if (ymd) setDateTo(ymd);
    }
    // If you later add a "linked" filter, handle it here:
    // if (typeof linked === "string") setLinkedFilter(linked);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);

  /* ------------ shared query builder (server) ------------ */
  const buildBaseQuery = useCallback(({ afterDoc } = {}) => {
    const col = collection(db, COLLECTION);

    // order & range on stored_at (Firestore Timestamp)
    const from = toStartOfDayLocal(dateFrom);
    const to = toEndOfDayLocal(dateTo);

    let parts = [orderBy("stored_at", "desc")];
    if (from) parts.push(where("stored_at", ">=", from));
    if (to) parts.push(where("stored_at", "<=", to));
    if (autodeposit === "true") parts.push(where("autodeposit", "==", true));
    if (autodeposit === "false") parts.push(where("autodeposit", "==", false));
    if (afterDoc) parts.push(startAfter(afterDoc));
    parts.push(limit(PAGE_SIZE));

    return query(col, ...parts);
  }, [autodeposit, dateFrom, dateTo]);

  /* ------------ fetch page 1 ------------ */
  const fetchPage1 = useCallback(async () => {
    setLoading(true);
    try {
      const snap = await getDocs(buildBaseQuery());
      const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      lastDocRef.current = snap.docs[snap.docs.length - 1] || null;
      setRows(docs);
      setPage(1);
    } catch (e) {
      console.error(e);
      setSnack({ open: true, msg: "Failed to load payments.", severity: "error" });
    } finally {
      setLoading(false);
    }
  }, [buildBaseQuery]);

  /* ------------ next page ------------ */
  const fetchNext = useCallback(async () => {
    if (!lastDocRef.current) return;
    setLoading(true);
    try {
      const snap = await getDocs(buildBaseQuery({ afterDoc: lastDocRef.current }));
      const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      lastDocRef.current = snap.docs[snap.docs.length - 1] || null;
      setRows((r) => [...r, ...docs]);
      setPage((p) => p + 1);
    } catch (e) {
      console.error(e);
      setSnack({ open: true, msg: "Failed to load more.", severity: "error" });
    } finally {
      setLoading(false);
    }
  }, [buildBaseQuery]);

  /* ------------ live listener (with same filters) ------------ */
  useEffect(() => {
    if (!live) {
      if (liveUnsubRef.current) { liveUnsubRef.current(); liveUnsubRef.current = null; }
      return;
    }
    const unsub = onSnapshot(buildBaseQuery(), (snap) => {
      const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setRows(docs); setPage(1);
      lastDocRef.current = snap.docs[snap.docs.length - 1] || null;
    }, (err) => setSnack({ open: true, msg: err?.message || "Live updates failed.", severity: "error" }));
    liveUnsubRef.current = unsub;
    return () => { if (liveUnsubRef.current) liveUnsubRef.current(); liveUnsubRef.current = null; };
  }, [live, buildBaseQuery]);

  /* ------------ first load ------------ */
  useEffect(() => { fetchPage1(); }, [fetchPage1]);

  /* ------------ re-fetch when autodeposit/date range change ------------ */
  useEffect(() => {
    setPage(1);
    fetchPage1();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autodeposit, dateFrom, dateTo]);

  /* ------------ enrich rows for UI ------------ */
  const enriched = useMemo(() => rows.map((r) => {
    const sender = parseSender(r?.meta?.from || "");
    const d = (r?.stored_at?.toDate && r.stored_at.toDate()) || localDateFromISO(r?.transfer_date?.iso);
    const dateDisplay = d ? d.toLocaleString() : (r?.transfer_date?.raw || "");
    const subAmt = parseAmountFromSubject(r?.meta?.subject);
    const warnings = [];
    if (typeof r?.amount?.value === "number" && subAmt !== null && subAmt !== r.amount.value) {
      warnings.push(`Amount mismatch: subject ${subAmt} vs parsed ${r.amount.value}`);
    }
    return { ...r, sender, dateDisplay, _warnings: warnings };
  }), [rows]);

  /* ------------ client-side filters ------------ */
  const filtered = useMemo(() => {
    const t = search.trim().toLowerCase();
    const min = amountMin === "" ? null : Number(amountMin);
    const max = amountMax === "" ? null : Number(amountMax);
    const from = dateFrom ? toStartOfDayLocal(dateFrom) : null;
    const to = dateTo ? toEndOfDayLocal(dateTo) : null;

    return enriched.filter((r) => {
      const hay = `${r?.meta?.subject || ""} ${r?.sender?.name || ""} ${r?.sender?.email || ""} ${r?.transaction_id || ""}`.toLowerCase();
      const searchOk = !t || hay.includes(t);

      const gatewayOk = gateway === "all" || r.gateway === gateway;
      const eventOk = event === "all" || r.event === event;

      const val = Number(r?.amount?.value ?? NaN);
      const amountOk = (min === null || (!Number.isNaN(val) && val >= min)) && (max === null || (!Number.isNaN(val) && val <= max));

      const autoOk = autodeposit === "all" || (autodeposit === "true" && !!r.autodeposit) || (autodeposit === "false" && !r.autodeposit);

      const d = (r?.stored_at?.toDate && r.stored_at.toDate()) || localDateFromISO(r?.transfer_date?.iso);
      const dateOk = !d || (!from || d >= from) && (!to || d <= to);

      return searchOk && gatewayOk && eventOk && amountOk && autoOk && dateOk;
    });
  }, [enriched, search, gateway, event, amountMin, amountMax, autodeposit, dateFrom, dateTo]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = useMemo(() => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [filtered, page]);

  /* ------------ NEW: fetch link status for current page ------------ */
  const [statusMap, setStatusMap] = useState({});
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const entries = await Promise.all(
          pageItems.map(async (p) => {
            try {
              const st = await getPaymentLinkStatus(p.id);
              return [p.id, st || null];
            } catch {
              return [p.id, null];
            }
          })
        );
        if (!alive) return;
        const obj = Object.fromEntries(entries);
        setStatusMap(obj);
      } catch {
        if (alive) setStatusMap({});
      }
    })();
    return () => { alive = false; };
  }, [pageItems]);

  /* ------------ reset & export ------------ */
  const handleResetFilters = () => {
    setSearch(""); setDateFrom(""); setDateTo(""); setAmountMin(""); setAmountMax("");
    setAutodeposit("all"); setGateway("all"); setEvent("all"); setPage(1);
  };

  // UPDATED: export with link status across the CURRENT FILTERED SET (not only the visible page)
  const handleExportCSV = async () => {
    try {
      // build status map for all filtered rows so CSV has complete info
      const entries = await Promise.all(
        filtered.map(async (p) => {
          try {
            const st = await getPaymentLinkStatus(p.id);
            return [p.id, st || null];
          } catch {
            return [p.id, null];
          }
        })
      );
      const statusMapForCSV = Object.fromEntries(entries);
      const csv = toCSV(filtered, statusMapForCSV);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `payments_export_${new Date().toISOString().split("T")[0]}.csv`;
      a.click(); URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      setSnack({ open: true, msg: "CSV export failed.", severity: "error" });
    }
  };

  /* ------------ NEW: link from table button ------------ */
  const handleOpenLinkFromTable = (row) => {
    setSelected(row);
    setStartLink(true);     // ask drawer to open link drawer immediately
    setDrawerOpen(true);
  };

  /* ---------------- render ---------------- */
  return (
    <Box sx={{ padding: 4, bgcolor: "#f7f5f2", minHeight: "100vh" }}>
      <TopBar onBack={() => navigate("/admin-dashboard")} />

      <Paper elevation={3} sx={{ p: 2, mb: 2, borderRadius: "12px" }}>
        <FiltersBar
          loading={loading}
          search={search} setSearch={(v) => { setSearch(v); setPage(1); }}
          dateFrom={dateFrom} setDateFrom={(v) => { setDateFrom(v); setPage(1); }}
          dateTo={dateTo} setDateTo={(v) => { setDateTo(v); setPage(1); }}
          amountMin={amountMin} setAmountMin={(v) => { setAmountMin(v); setPage(1); }}
          amountMax={amountMax} setAmountMax={(v) => { setAmountMax(v); setPage(1); }}
          autodeposit={autodeposit} setAutodeposit={(v) => { setAutodeposit(v); setPage(1); }}
          gateway={gateway} setGateway={(v) => { setGateway(v); setPage(1); }}
          event={event} setEvent={(v) => { setEvent(v); setPage(1); }}
          activeCount={filtered.length}
          flaggedCount={filtered.filter((r) => (r._warnings || []).length > 0).length}
          onReset={handleResetFilters}
          gatewayOptions={gatewayOptions}
          eventOptions={eventOptions}
        />
      </Paper>

      <Stack direction="row" spacing={1} sx={{ mb: 2 }} alignItems="center">
        <Tooltip title="Export current filtered view">
          <span>
            <Button size="small" variant="outlined" startIcon={<ExportIcon />} onClick={handleExportCSV} disabled={loading} sx={{ borderRadius: "12px" }}>
              Export CSV
            </Button>
          </span>
        </Tooltip>
        <Tooltip title="Refresh first page">
          <span>
            <Button size="small" variant="outlined" startIcon={<RefreshIcon />} onClick={fetchPage1} disabled={loading} sx={{ borderRadius: "12px" }}>
              Refresh
            </Button>
          </span>
        </Tooltip>
        <FormControlLabel control={<Switch checked={live} onChange={(e) => setLive(e.target.checked)} />} label="Live" />
      </Stack>

      <PaymentsTable
        rows={pageItems}
        loading={loading}
        onRowClick={(r) => { setSelected(r); setDrawerOpen(true); }}
        statusMap={statusMap}
        onLink={handleOpenLinkFromTable}
      />

      <Typography variant="body2" sx={{ mt: 1, color: "text.secondary" }}>
        Showing {filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}
        –
        {Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
      </Typography>

      <PaginationBar
        page={page}
        totalPages={totalPages}
        onPrev={() => setPage((p) => Math.max(1, p - 1))}
        onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
      />
      <PaymentDetailsDrawer
        open={drawerOpen}
        onClose={() => { setDrawerOpen(false); setStartLink(false); }}
        payment={selected}
        startLink={startLink}                 // NEW: auto-open link drawer when coming from table button
        onLinkOpened={() => setStartLink(false)}
      />

      <Snackbar open={snack.open} autoHideDuration={4000} onClose={closeSnack} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <MuiAlert onClose={closeSnack} severity={snack.severity} elevation={6} variant="filled">
          {snack.msg}
        </MuiAlert>
      </Snackbar>
    </Box>
  );
}
