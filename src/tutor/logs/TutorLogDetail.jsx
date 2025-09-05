// src/tutor/logs/TutorLogDetail.jsx
import React, { useEffect, useMemo, useState, useRef } from "react";
import {
  Box, Paper, Typography, Chip, Button, Stack, Divider, Tooltip,
  TextField, InputAdornment, MenuItem, Switch, FormControlLabel
} from "@mui/material";
import { ArrowBack as ArrowBackIcon, Search as SearchIcon, Download as DownloadIcon, Refresh as RefreshIcon } from "@mui/icons-material";
import { useNavigate, useParams } from "react-router-dom";
import { db } from "../../firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  Tooltip as RTooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";

const COLORS = { high: "#e53935", medium: "#fb8c00", low: "#90a4ae" };

const severityChipColor = (sev) => {
  switch ((sev || "low").toLowerCase()) {
    case "high": return "error";
    case "medium": return "warning";
    default: return "default";
  }
};

// ---- Helpers -------------------------------------------------
const toDate = (ts) => {
  const d = new Date(ts);
  return isNaN(d) ? null : d;
};

const inRange = (d, from, to) => {
  if (!d) return false;
  if (from && d < from) return false;
  if (to && d > to) return false;
  return true;
};

const summarizeSeverities = (events = []) => {
  const c = { high: 0, medium: 0, low: 0 };
  events.forEach((e) => { c[(e.severity || "low").toLowerCase()]++; });
  return c;
};

const sevPieData = (counts) => ([
  { name: "High", value: counts.high, key: "high" },
  { name: "Medium", value: counts.medium, key: "medium" },
  { name: "Low", value: counts.low, key: "low" },
]);

const groupByHour = (events = []) => {
  const buckets = {};
  events.forEach((e) => {
    const d = toDate(e.ts);
    if (!d) return;
    const k = d.toISOString().slice(0, 13) + ":00";
    buckets[k] = (buckets[k] || 0) + 1;
  });
  return Object.entries(buckets)
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([k, v]) => ({ hour: k.slice(11, 16), count: v }));
};

const countByType = (events = []) => {
  const t = {};
  events.forEach((e) => { t[e.type] = (t[e.type] || 0) + 1; });
  return Object.entries(t)
    .sort((a, b) => b[1] - a[1])
    .map(([type, count]) => ({ type, count }));
};

const downloadCSV = (rows, filename = "proctor-log.csv") => {
  const headers = ["ts", "type", "severity", "meta"];
  const body = rows.map((r) => [
    r.ts || "",
    r.type || "",
    r.severity || "",
    r.meta ? JSON.stringify(r.meta).replaceAll('"', '""') : ""
  ]);
  const csv =
    headers.join(",") +
    "\n" +
    body.map((r) => r.map((c) => `"${String(c).replaceAll("\n", " ")}"`).join(",")).join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

// ---- Component -----------------------------------------------
const TutorLogDetail = () => {
  const { submissionId } = useParams();
  const navigate = useNavigate();

  const [docData, setDocData] = useState(null);
  const [loading, setLoading] = useState(true);

  // NEW: display fields resolved from related collections
  const [displayExamTitle, setDisplayExamTitle] = useState("—");
  const [displayStudentMintedId, setDisplayStudentMintedId] = useState("—");

  // Filters
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState(["high", "medium", "low"]); // multi
  const [typeFilter, setTypeFilter] = useState("all");
  const [rangeKey, setRangeKey] = useState("session"); // all|10m|1h|24h|session
  const [autoRefresh, setAutoRefresh] = useState(true);

  const refreshTimer = useRef(null);

  // fetch main proctor log doc
  const fetchDoc = async () => {
    setLoading(true);
    try {
      const snap = await getDoc(doc(db, "proctorLogs", submissionId));
      if (snap.exists()) setDocData({ id: snap.id, ...snap.data() });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDoc(); /* first load */ }, [submissionId]);

  // auto refresh (every 10s)
  useEffect(() => {
    if (!autoRefresh) {
      if (refreshTimer.current) clearInterval(refreshTimer.current);
      refreshTimer.current = null;
      return;
    }
    refreshTimer.current = setInterval(fetchDoc, 10000);
    return () => { if (refreshTimer.current) clearInterval(refreshTimer.current); };
  }, [autoRefresh]); // eslint-disable-line

  // NEW: resolve exam title and minted studentId whenever we have IDs
  useEffect(() => {
    const resolveRefs = async () => {
      try {
        // exam title
        if (docData?.examId) {
          const exSnap = await getDoc(doc(db, "exams", docData.examId));
          setDisplayExamTitle(exSnap.exists() ? (exSnap.data().title || docData.examId) : docData.examId);
        } else {
          setDisplayExamTitle("—");
        }

        // minted studentId (e.g., "250902") saved on students/{studentDocId}.studentId
        if (docData?.studentId) {
          const stSnap = await getDoc(doc(db, "students", docData.studentId));
          setDisplayStudentMintedId(stSnap.exists() ? (stSnap.data().studentId || docData.studentId) : docData.studentId);
        } else {
          setDisplayStudentMintedId("—");
        }
      } catch (e) {
        // If anything fails, gracefully fall back to raw IDs
        if (docData?.examId && !displayExamTitle) setDisplayExamTitle(docData.examId);
        if (docData?.studentId && !displayStudentMintedId) setDisplayStudentMintedId(docData.studentId);
      }
    };
    resolveRefs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [docData?.examId, docData?.studentId]);

  // derive
  const allEvents = docData?.events || [];

  const eventTypes = useMemo(() => {
    const m = {};
    allEvents.forEach((e) => { if (e.type) m[e.type] = true; });
    return Object.keys(m).sort();
  }, [allEvents]);

  // time window
  const [fromTime, toTime] = useMemo(() => {
    if (!allEvents.length) return [null, null];

    const times = allEvents
      .map((e) => toDate(e.ts))
      .filter(Boolean)
      .sort((a, b) => a - b);

    if (!times.length) return [null, null];

    const sessionStart = times[0];
    const sessionEnd = times[times.length - 1];

    const now = new Date();
    switch (rangeKey) {
      case "10m": return [new Date(now.getTime() - 10 * 60 * 1000), null];
      case "1h": return [new Date(now.getTime() - 60 * 60 * 1000), null];
      case "24h": return [new Date(now.getTime() - 24 * 60 * 60 * 1000), null];
      case "session": return [sessionStart, sessionEnd];
      case "all":
      default: return [null, null];
    }
  }, [allEvents, rangeKey]);

  // filtered events
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return allEvents.filter((e) => {
      // severity
      if (!severityFilter.includes((e.severity || "low").toLowerCase())) return false;
      // type
      if (typeFilter !== "all" && e.type !== typeFilter) return false;
      // time
      const d = toDate(e.ts);
      if (!inRange(d, fromTime, toTime)) return false;
      // search in type + meta
      if (term) {
        const hay = `${e.type || ""} ${JSON.stringify(e.meta || {})}`.toLowerCase();
        if (!hay.includes(term)) return false;
      }
      return true;
    });
  }, [allEvents, severityFilter, typeFilter, fromTime, toTime, search]);

  const counts = useMemo(() => summarizeSeverities(filtered), [filtered]);
  const pieData = useMemo(() => sevPieData(counts), [counts]);
  const hourly = useMemo(() => groupByHour(filtered), [filtered]);
  const byType = useMemo(() => countByType(filtered), [filtered]);

  const updatedAt = docData?.updatedAt?.seconds
    ? new Date(docData.updatedAt.seconds * 1000).toLocaleString()
    : "—";

  // UI helpers
  const toggleSeverity = (s) => {
    setSeverityFilter((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  };

  return (
    <Box sx={{ p: 4, minHeight: "100vh", bgcolor: "#f7f5f2" }}>
      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, gap: 2, flexWrap: "wrap" }}>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate("/tutor-view-logs")}
          sx={{ borderRadius: "12px", borderColor: "#4A90E2", color: "#4A90E2", "&:hover": { bgcolor: "#E3F2FD" } }}
        >
          Back to Logs
        </Button>
        <Typography variant="h4" sx={{ flexGrow: 1, textAlign: "center", color: "#5d5c61" }}>
          Log Detail
        </Typography>
        <Stack direction="row" spacing={1}>
          <FormControlLabel
            control={<Switch checked={autoRefresh} onChange={(e) => setAutoRefresh(e.target.checked)} />}
            label="Auto refresh"
          />
          <Button variant="outlined" onClick={fetchDoc} startIcon={<RefreshIcon />} sx={{ borderRadius: "10px" }}>
            Refresh
          </Button>
        </Stack>
      </Box>

      {/* Summary header */}
      <Paper sx={{ p: 2.5, borderRadius: "12px", mb: 2 }}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ xs: "flex-start", md: "center" }} justifyContent="space-between">
          <Stack direction="row" spacing={1} flexWrap="wrap" alignItems="center">
            <Chip label={docData?.studentName || "—"} sx={{ borderRadius: "8px" }} />
            {/* UPDATED: show minted Student ID and Exam Title */}
            <Chip label={`Student ID: ${displayStudentMintedId}`} sx={{ borderRadius: "8px" }} />
            <Chip label={`Exam: ${displayExamTitle}`} sx={{ borderRadius: "8px" }} />
          </Stack>
          <Typography variant="body2" color="text.secondary">Updated: {updatedAt}</Typography>
        </Stack>

        {/* KPI strip */}
        <Stack direction="row" spacing={1.5} sx={{ mt: 2 }} flexWrap="wrap">
          <Chip label={`Events: ${filtered.length}`} sx={{ borderRadius: "8px" }} />
          <Chip label={`High: ${counts.high}`} color="error" sx={{ borderRadius: "8px" }} />
          <Chip label={`Medium: ${counts.medium}`} color="warning" sx={{ borderRadius: "8px" }} />
          <Chip label={`Low: ${counts.low}`} sx={{ borderRadius: "8px" }} />
        </Stack>
      </Paper>

      {/* Filters row */}
      <Paper sx={{ p: 2, borderRadius: "12px", mb: 2 }}>
        <Stack direction={{ xs: "column", lg: "row" }} spacing={2} alignItems={{ xs: "stretch", lg: "center" }} justifyContent="space-between">
          <TextField
            size="small"
            label="Search type/meta"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment>, sx: { borderRadius: "12px" } }}
            sx={{ minWidth: 260 }}
          />

          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
            <Typography variant="body2" sx={{ mr: 1 }}>Severity:</Typography>
            {["high", "medium", "low"].map((s) => (
              <Chip
                key={s}
                label={s[0].toUpperCase() + s.slice(1)}
                color={severityChipColor(s)}
                variant={severityFilter.includes(s) ? "filled" : "outlined"}
                onClick={() => toggleSeverity(s)}
                sx={{ borderRadius: "10px" }}
              />
            ))}
          </Stack>

          <TextField
            select size="small" label="Event type"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            sx={{ minWidth: 220, "& .MuiOutlinedInput-root": { borderRadius: "12px" } }}
          >
            <MenuItem value="all">All types</MenuItem>
            {eventTypes.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
          </TextField>

          <TextField
            select size="small" label="Time window"
            value={rangeKey}
            onChange={(e) => setRangeKey(e.target.value)}
            sx={{ minWidth: 180, "& .MuiOutlinedInput-root": { borderRadius: "12px" } }}
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="10m">Last 10 min</MenuItem>
            <MenuItem value="1h">Last 1 hour</MenuItem>
            <MenuItem value="24h">Last 24 hours</MenuItem>
            <MenuItem value="session">This session</MenuItem>
          </TextField>

          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={() => downloadCSV(filtered, `proctor-log-${submissionId}.csv`)}
            sx={{ borderRadius: "12px" }}
          >
            Export CSV
          </Button>
        </Stack>
      </Paper>

      {/* Charts */}
      <Stack direction={{ xs: "column", lg: "row" }} spacing={2}>
        <Paper sx={{ p: 2, borderRadius: "12px", flex: 1, minHeight: 320 }}>
          <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 700 }}>Severity distribution</Typography>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                {pieData.map((e) => <Cell key={e.key} fill={COLORS[e.key]} />)}
              </Pie>
              <RTooltip />
            </PieChart>
          </ResponsiveContainer>
          <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
            <Chip size="small" label={`High: ${counts.high}`} color="error" />
            <Chip size="small" label={`Medium: ${counts.medium}`} color="warning" />
            <Chip size="small" label={`Low: ${counts.low}`} />
          </Stack>
        </Paper>

        <Paper sx={{ p: 2, borderRadius: "12px", flex: 2, minHeight: 320 }}>
          <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 700 }}>Events over time (hourly)</Typography>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={hourly}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" />
              <YAxis allowDecimals={false} />
              <RTooltip />
              <Bar dataKey="count" />
            </BarChart>
          </ResponsiveContainer>
        </Paper>
      </Stack>

      {/* Top types + Feed */}
      <Paper sx={{ p: 2, borderRadius: "12px", mt: 2 }}>
        <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 700 }}>
          Top events
        </Typography>
        <Stack direction="row" spacing={1} flexWrap="wrap">
          {byType.slice(0, 10).map((t) => (
            <Tooltip key={t.type} title={`${t.count} events`}>
              <Chip label={`${t.type} (${t.count})`} sx={{ borderRadius: "8px" }} />
            </Tooltip>
          ))}
        </Stack>

        <Divider sx={{ my: 2 }} />

        <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 700 }}>Event feed</Typography>
        <Box sx={{ display: "grid", gap: 1 }}>
          {filtered.slice().reverse().map((e, i) => (
            <Paper key={i} variant="outlined" sx={{ p: 1.25, borderRadius: "10px" }}>
              <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                  <Chip size="small" label={e.type} />
                  <Chip size="small" label={e.severity || "low"} color={severityChipColor(e.severity)} />
                </Stack>
                <Typography variant="caption" color="text.secondary">
                  {e.ts ? new Date(e.ts).toLocaleString() : "—"}
                </Typography>
              </Stack>
              {e.meta && Object.keys(e.meta).length > 0 && (
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
                  {JSON.stringify(e.meta)}
                </Typography>
              )}
            </Paper>
          ))}
          {!filtered.length && (
            <Typography variant="body2" color="text.secondary">No events in the current filter.</Typography>
          )}
        </Box>
      </Paper>
    </Box>
  );
};

export default TutorLogDetail;
