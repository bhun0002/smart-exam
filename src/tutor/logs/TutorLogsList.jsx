// src/tutor/logs/TutorLogsList.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Box, Paper, Typography, Button, TextField, InputAdornment, MenuItem,
  Chip, Stack, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Snackbar
} from "@mui/material";
import { ArrowBack as ArrowBackIcon, Search as SearchIcon, RestartAlt as ResetIcon } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { db } from "../../firebaseConfig";
import {
  collection, getDocs, query, orderBy, limit as fbLimit,
} from "firebase/firestore";

/**
 * proctorLogs doc shape:
 * { examId, studentId (== students docId), studentName, createdAt, updatedAt, events: [...] }
 * students doc shape (relevant):
 * { studentId: "<minted YYMMxx like 250902>", name, ... }
 */

const severityColor = (s) =>
  s === "high" ? "error" : s === "medium" ? "warning" : "default";

const summarize = (events = []) => {
  const counts = { high: 0, medium: 0, low: 0 };
  const types = {};
  events.forEach((e) => {
    const sev = (e.severity || "low").toLowerCase();
    counts[sev] = (counts[sev] || 0) + 1;
    types[e.type] = (types[e.type] || 0) + 1;
  });
  const total = events.length;
  return { counts, total, types };
};

const TutorLogsList = () => {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  // map examId -> title (you already had this)
  const [examsMap, setExamsMap] = useState({});

  // NEW: map students docId -> minted studentId (e.g., "250902")
  const [studentIdMap, setStudentIdMap] = useState({});

  // filters
  const [search, setSearch] = useState("");
  const [severity, setSeverity] = useState("all"); // all | high | medium | low

  // snackbar (unchanged shell)
  const [snack, setSnack] = useState({ open: false, msg: "", severity: "success" });
  const closeSnack = (_, r) => r === "clickaway" ? null : setSnack(s => ({ ...s, open: false }));

  // Load logs
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const ql = query(collection(db, "proctorLogs"), orderBy("updatedAt", "desc"), fbLimit(200));
        const snap = await getDocs(ql);
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setRows(list);
      } catch (e) {
        console.error(e);
        setSnack({ open: true, msg: "Failed to load logs.", severity: "error" });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Load exams for title mapping
  useEffect(() => {
    (async () => {
      try {
        const esnap = await getDocs(collection(db, "exams"));
        const map = {};
        esnap.docs.forEach((docu) => {
          const data = docu.data() || {};
          map[docu.id] = data.title || "(Untitled Exam)";
        });
        setExamsMap(map);
      } catch (e) {
        console.error("Failed to load exams:", e);
      }
    })();
  }, []);

  // NEW: Load students for minted ID mapping
  useEffect(() => {
    (async () => {
      try {
        const ssnap = await getDocs(collection(db, "students"));
        const map = {};
        ssnap.docs.forEach((docu) => {
          const data = docu.data() || {};
          // docu.id is the Firestore docId (the one saved in proctorLogs.studentId)
          // data.studentId is the minted human ID you want to show (e.g., "250902")
          map[docu.id] = data.studentId || "";
        });
        setStudentIdMap(map);
      } catch (e) {
        console.error("Failed to load students:", e);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    const t = search.trim().toLowerCase();
    return rows.filter((r) => {
      const sum = summarize(r.events);
      const sevOk = severity === "all" ? true : sum.counts[severity] > 0;

      // resolve human (minted) id for search as well
      const humanId = studentIdMap[r.studentId] || r.studentId || "";
      const hay = `${r.studentName || ""} ${humanId} ${r.examId || ""}`.toLowerCase();

      const searchOk = !t || hay.includes(t);
      return sevOk && searchOk;
    });
  }, [rows, search, severity, studentIdMap]);

  return (
    <Box sx={{ p: 4, minHeight: "100vh", bgcolor: "#f7f5f2" }}>
      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, gap: 2, flexWrap: "wrap" }}>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate("/tutor-dashboard")}
          sx={{ borderRadius: "12px", borderColor: "#4A90E2", color: "#4A90E2", "&:hover": { bgcolor: "#E3F2FD" } }}
        >
          Back to Dashboard
        </Button>
        <Typography variant="h4" sx={{ flexGrow: 1, textAlign: "center", color: "#5d5c61" }}>
          Proctoring Logs
        </Typography>
        <Box sx={{ width: 150 }} />
      </Box>

      {/* Filters */}
      <Paper elevation={3} sx={{ p: 2, mb: 2, borderRadius: "12px" }}>
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 220px 120px", gap: 2 }}>
          <TextField
            label="Search (student, id, examId)"
            size="small"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment>,
              sx: { borderRadius: "12px" }
            }}
          />
          <TextField
            select size="small" label="Severity" value={severity} onChange={(e) => setSeverity(e.target.value)}
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px" } }}
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="high">High only</MenuItem>
            <MenuItem value="medium">Medium only</MenuItem>
            <MenuItem value="low">Low only</MenuItem>
          </TextField>
          <Button
            variant="outlined"
            startIcon={<ResetIcon />}
            onClick={() => { setSearch(""); setSeverity("all"); }}
            sx={{ borderRadius: "12px" }}
          >
            Reset
          </Button>
        </Box>
      </Paper>

      {/* Table */}
      <TableContainer component={Paper} sx={{ boxShadow: 3 }}>
        <Table>
          <TableHead sx={{ bgcolor: "#ffd6a5" }}>
            <TableRow>
              <TableCell sx={{ fontWeight: "bold" }}>Student</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Exam</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Totals</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Severities</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Updated</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} align="center">Loading…</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={6} align="center">No logs found</TableCell></TableRow>
            ) : filtered.map((row) => {
              const sum = summarize(row.events || []);
              const updatedAt = row.updatedAt?.seconds
                ? new Date(row.updatedAt.seconds * 1000).toLocaleString()
                : "—";
              const examTitle = examsMap[row.examId] || "(Untitled Exam)";
              const humanId = studentIdMap[row.studentId] || row.studentId || "—";

              return (
                <TableRow key={row.id} sx={{ "&:hover": { bgcolor: "#f1f1f1" } }}>
                  <TableCell>
                    <Stack spacing={0.5}>
                      <Typography variant="body2" sx={{ fontWeight: "bold" }}>{row.studentName || "—"}</Typography>
                      {/* Show the minted human ID here */}
                      <Typography variant="caption" color="text.secondary">ID: {humanId}</Typography>
                    </Stack>
                  </TableCell>
                  <TableCell>{examTitle}</TableCell>
                  <TableCell>{sum.total} events</TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1}>
                      <Chip size="small" label={`H: ${sum.counts.high}`} color="error" sx={{ borderRadius: "8px" }} />
                      <Chip size="small" label={`M: ${sum.counts.medium}`} color="warning" sx={{ borderRadius: "8px" }} />
                      <Chip size="small" label={`L: ${sum.counts.low}`} color="default" sx={{ borderRadius: "8px" }} />
                    </Stack>
                  </TableCell>
                  <TableCell>{updatedAt}</TableCell>
                  <TableCell>
                    <Button
                      size="small"
                      variant="outlined"
                      sx={{ borderRadius: "8px" }}
                      onClick={() => navigate(`/tutor-view-logs/${row.id}`)}
                    >
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      <Snackbar
        open={snack.open}
        autoHideDuration={3500}
        onClose={closeSnack}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Box component="div" />
      </Snackbar>
    </Box>
  );
};

export default TutorLogsList;
