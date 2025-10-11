// src/tutor/ManageStudents.jsx
import React, { useEffect, useMemo, useState } from "react";
import { db } from "../firebaseConfig";
import {
  collection, addDoc, getDocs, updateDoc, doc, serverTimestamp,
  query, orderBy, where, runTransaction
} from "firebase/firestore";
import {
  Box, Paper, Snackbar, Alert as MuiAlert, Button, Typography,
  TextField, InputAdornment, Chip, MenuItem, Select, FormControl,
  InputLabel, Table, TableHead, TableRow, TableCell, TableBody,
  TableContainer, IconButton, Tooltip, Drawer, Divider, Stack, CircularProgress
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import EditIcon from "@mui/icons-material/Edit";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";

// ---------- helpers ----------
const getYYMM = () => {
  const d = new Date();
  return String(d.getFullYear() % 100).padStart(2, "0") + String(d.getMonth() + 1).padStart(2, "0");
};
const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

// ---------- Top action bar ----------
const TopBar = ({ onBack, onCreate }) => (
  <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2, flexWrap: "wrap" }}>
    <Button
      variant="outlined"
      startIcon={<ArrowBackIcon />}
      onClick={onBack}
      sx={{
        borderColor: "#4A90E2", color: "#4A90E2", borderRadius: "12px",
        fontWeight: "bold", "&:hover": { backgroundColor: "#E3F2FD" },
      }}
    >
      Back to Dashboard
    </Button>
    <Box sx={{ flex: 1, textAlign: "center" }}>
      <Typography variant="h4" sx={{ fontWeight: "bold", color: "#1A237E" }}>
        Manage Students
      </Typography>
    </Box>
    <Button
      variant="contained"
      startIcon={<AddIcon />}
      onClick={onCreate}
      sx={{
        borderRadius: "12px", fontWeight: "bold",
        backgroundColor: "#81C784", color: "#1B5E20",
        "&:hover": { backgroundColor: "#66BB6A" },
      }}
    >
      Add Student
    </Button>
  </Box>
);

// ---------- Filters ----------
const FiltersBar = ({ search, setSearch, intakeId, setIntakeId, status, setStatus, intakes, loading, onReset }) => (
  <Paper
    elevation={2}
    sx={{
      p: 2, mb: 2, borderRadius: "14px", bgcolor: "#fff",
      border: "1px solid #eef2f6",
    }}
  >
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "1.5fr 1fr 1fr auto",
        gap: 1.5,
        alignItems: "center",
      }}
    >
      <TextField
        label="Search (name, email, intake, ID)"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        disabled={loading}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
          sx: { borderRadius: "12px" },
        }}
      />
      <FormControl>
        <InputLabel id="intake-filter-label">Intake</InputLabel>
        <Select
          labelId="intake-filter-label"
          value={intakeId}
          label="Intake"
          onChange={(e) => setIntakeId(e.target.value)}
          disabled={loading}
          sx={{ borderRadius: "12px" }}
        >
          <MenuItem value="all">All</MenuItem>
          {intakes.map((i) => (
            <MenuItem key={i.id} value={i.id}>{i.name}</MenuItem>
          ))}
        </Select>
      </FormControl>
      <FormControl>
        <InputLabel id="status-filter-label">Status</InputLabel>
        <Select
          labelId="status-filter-label"
          value={status}
          label="Status"
          onChange={(e) => setStatus(e.target.value)}
          disabled={loading}
          sx={{ borderRadius: "12px" }}
        >
          <MenuItem value="all">All</MenuItem>
          <MenuItem value="approved">Approved</MenuItem>
          <MenuItem value="pending">Pending</MenuItem>
        </Select>
      </FormControl>
      <Stack direction="row" gap={1} justifyContent="flex-end">
        <Chip
          label={
            status === "approved" ? "Approved" :
            status === "pending" ? "Pending" : "All"
          }
          color={status === "approved" ? "success" : status === "pending" ? "warning" : "default"}
          sx={{ borderRadius: "8px", fontWeight: "bold", alignSelf: "center" }}
        />
        <Button variant="outlined" onClick={onReset} disabled={loading} sx={{ borderRadius: "12px" }}>
          Reset
        </Button>
      </Stack>
    </Box>
  </Paper>
);

// ---------- Drawer Form ----------
const StudentDrawerForm = ({
  open, onClose, intakes, onSubmit, editing,
}) => {
  const isEdit = !!editing;
  const [name, setName] = useState(editing?.name || "");
  const [email, setEmail] = useState(editing?.email || "");
  const [password, setPassword] = useState("");
  const [intakeId, setIntakeId] = useState(editing?.intakeId || "");
  const [err, setErr] = useState("");

  useEffect(() => {
    setName(editing?.name || "");
    setEmail(editing?.email || "");
    setPassword("");
    setIntakeId(editing?.intakeId || "");
    setErr("");
  }, [editing, open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    if (!name.trim() || !email.trim() || !intakeId) return setErr("Name, Email and Intake are required.");
    if (!validateEmail(email)) return setErr("Please enter a valid email.");
    if (!isEdit && (!password.trim() || password.length < 6)) return setErr("Password must be at least 6 characters.");

    const payload = { name: name.trim(), email: email.trim(), intakeId };
    if (password.trim()) payload.password = password.trim();
    await onSubmit(payload);
  };

  return (
    <Drawer anchor="right" open={open} onClose={onClose} PaperProps={{ sx: { width: { xs: "100%", sm: 420 } } }}>
      <Box sx={{ p: 3, display: "flex", flexDirection: "column", height: "100%" }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
          {isEdit ? "Edit Student" : "Add New Student"}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {isEdit ? "Update details and save changes." : "Create a student and assign an intake."}
        </Typography>
        <Divider sx={{ mb: 2 }} />

        <Box component="form" onSubmit={handleSubmit} sx={{ display: "grid", gap: 2 }}>
          {!!err && <MuiAlert severity="error">{err}</MuiAlert>}
          <TextField
            label="Student Name *"
            value={name}
            onChange={(e) => setName(e.target.value)}
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px" } }}
          />
          <TextField
            label="Email *"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px" } }}
          />
          <TextField
            label={isEdit ? "New Password (optional)" : "Password *"}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px" } }}
          />
          <FormControl>
            <InputLabel id="intake-dd">Intake *</InputLabel>
            <Select
              labelId="intake-dd"
              label="Intake *"
              value={intakeId}
              onChange={(e) => setIntakeId(e.target.value)}
              sx={{ borderRadius: "12px" }}
            >
              {intakes.map((i) => <MenuItem key={i.id} value={i.id}>{i.name}</MenuItem>)}
            </Select>
          </FormControl>

          <Stack direction="row" gap={1} justifyContent="flex-end" sx={{ mt: 1 }}>
            <Button onClick={onClose} variant="outlined" sx={{ borderRadius: "12px" }}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" sx={{ borderRadius: "12px", fontWeight: "bold" }}>
              {isEdit ? "Save Changes" : "Add Student"}
            </Button>
          </Stack>
        </Box>
      </Box>
    </Drawer>
  );
};

// ---------- Students Table ----------
const StudentsTable = ({ rows, onApprove, onEdit, onDelete, loading }) => (
  <TableContainer component={Paper} sx={{ borderRadius: "14px", border: "1px solid #eef2f6" }}>
    <Table stickyHeader size="medium">
      <TableHead sx={{ bgcolor: "#f7f9fc" }}>
        <TableRow>
          <TableCell sx={{ fontWeight: 700 }}>Name</TableCell>
          <TableCell sx={{ fontWeight: 700 }}>Email</TableCell>
          <TableCell sx={{ fontWeight: 700 }}>Intake</TableCell>
          <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
          <TableCell sx={{ fontWeight: 700, width: 240 }}>Actions</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {loading ? (
          <TableRow><TableCell colSpan={5} align="center" sx={{ py: 6 }}><CircularProgress size={26} /></TableCell></TableRow>
        ) : rows.length === 0 ? (
          <TableRow><TableCell colSpan={5} align="center" sx={{ py: 6, color: "text.secondary" }}>No students found.</TableCell></TableRow>
        ) : rows.map((s) => (
          <TableRow key={s.id} sx={{ "&:nth-of-type(odd)": { bgcolor: "#fafafa" } }}>
            <TableCell>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Box
                  sx={{
                    width: 32, height: 32, borderRadius: "10px",
                    bgcolor: s.isApproved ? "#C8E6C9" : "#FFECB3",
                    color: s.isApproved ? "#1B5E20" : "#FF6F00",
                    display: "grid", placeItems: "center", fontWeight: 700,
                  }}
                >
                  {(s.name || "S")[0].toUpperCase()}
                </Box>
                <Box>
                  <Typography sx={{ fontWeight: 600, lineHeight: 1.1 }}>{s.name}</Typography>
                  <Typography variant="caption" color="text.secondary">ID: {s.studentId || "—"}</Typography>
                </Box>
              </Stack>
            </TableCell>
            <TableCell>{s.email}</TableCell>
            <TableCell>
              <Chip label={s.intakeName || "N/A"} size="small" sx={{ bgcolor: "#E3F2FD", color: "#0D47A1", fontWeight: 700, borderRadius: "8px" }} />
            </TableCell>
            <TableCell>
              <Chip
                label={s.isApproved ? "Approved" : "Pending"}
                color={s.isApproved ? "success" : "warning"}
                size="small"
                sx={{ fontWeight: 700, borderRadius: "8px" }}
              />
            </TableCell>
            <TableCell>
              <Stack direction="row" spacing={1}>
                {!s.isApproved && (
                  <Tooltip title="Approve">
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<CheckCircleOutlineIcon />}
                      onClick={() => onApprove(s.id, true)}
                      sx={{ borderRadius: "10px", borderColor: "#81C784", color: "#1B5E20" }}
                    >
                      Approve
                    </Button>
                  </Tooltip>
                )}
                <Tooltip title="Edit">
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<EditIcon />}
                    onClick={() => onEdit(s)}
                    sx={{ borderRadius: "10px", borderColor: "#FFB74D", color: "#E65100" }}
                  >
                    Edit
                  </Button>
                </Tooltip>
                <Tooltip title="Delete">
                  <Button
                    size="small"
                    variant="outlined"
                    color="error"
                    startIcon={<DeleteOutlineIcon />}
                    onClick={() => onDelete(s.id)}
                    sx={{ borderRadius: "10px" }}
                  >
                    Delete
                  </Button>
                </Tooltip>
              </Stack>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </TableContainer>
);

// ---------- Page ----------
const ManageStudents = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [intakes, setIntakes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [snack, setSnack] = useState({ open: false, msg: "", severity: "success" });

  // filters
  const [search, setSearch] = useState("");
  const [intakeId, setIntakeId] = useState("all");
  const [status, setStatus] = useState("all");

  // drawer
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const closeSnack = (_, r) => (r === "clickaway" ? null : setSnack((s) => ({ ...s, open: false })));

  const studentsRef = collection(db, "students");
  const intakesRef = collection(db, "intakes");

  const fetchData = async () => {
    setLoading(true);
    try {
      const intSnap = await getDocs(query(intakesRef, orderBy("name", "asc")));
      const intakeList = intSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setIntakes(intakeList);

      const sSnap = await getDocs(query(studentsRef, where("isDeleted", "==", false), orderBy("createdAt", "desc")));
      const list = sSnap.docs.map((d) => {
        const s = d.data();
        const intake = intakeList.find((i) => i.id === s.intakeId);
        return { id: d.id, ...s, intakeName: intake ? intake.name : "Unknown Intake" };
      });
      setStudents(list);
    } catch (e) {
      console.error(e);
      setSnack({ open: true, msg: "Failed to load students.", severity: "error" });
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { fetchData(); }, []);

  const resetFilters = () => { setSearch(""); setIntakeId("all"); setStatus("all"); };

  const filtered = useMemo(() => {
    const t = search.trim().toLowerCase();
    return students.filter((s) => {
      const matchSearch =
        s.name?.toLowerCase().includes(t) ||
        s.email?.toLowerCase().includes(t) ||
        s.intakeName?.toLowerCase().includes(t) ||
        (s.studentId && String(s.studentId).includes(search.trim()));
      const matchIntake = intakeId === "all" || s.intakeId === intakeId;
      const matchStatus = status === "all" || (status === "approved" ? s.isApproved : !s.isApproved);
      return matchSearch && matchIntake && matchStatus;
    });
  }, [students, search, intakeId, status]);

  // actions
  const addStudent = async ({ name, email, password, intakeId }) => {
    if (!name || !email || !password || !intakeId) {
      setSnack({ open: true, msg: "All fields are required.", severity: "error" });
      return;
    }
    if (!validateEmail(email)) {
      setSnack({ open: true, msg: "Invalid email.", severity: "error" });
      return;
    }
    if (password.length < 6) {
      setSnack({ open: true, msg: "Password must be at least 6 characters.", severity: "error" });
      return;
    }

    try {
      // email unique?
      const exists = await getDocs(query(studentsRef, where("email", "==", email)));
      if (!exists.empty) {
        setSnack({ open: true, msg: "Email already exists.", severity: "error" });
        return;
      }

      // studentId YYMM + seq
      const yymm = getYYMM();
      const ctrRef = doc(db, "counters", `SID-${yymm}`);
      let mintedId = null;
      await runTransaction(db, async (tx) => {
        const snap = await tx.get(ctrRef);
        const last = snap.exists() ? (snap.data().lastSeq || 0) : 0;
        const next = last + 1;
        if (next > 99) throw new Error("Monthly student ID capacity exceeded.");
        tx.set(ctrRef, { lastSeq: next, updatedAt: serverTimestamp() }, { merge: true });
        mintedId = `${yymm}${String(next).padStart(2, "0")}`;
      });

      await addDoc(studentsRef, {
        studentId: mintedId, name, email, password, intakeId,
        isApproved: false, isDeleted: false, createdAt: serverTimestamp(),
      });
      setSnack({ open: true, msg: "Student added.", severity: "success" });
      setDrawerOpen(false);
      setEditing(null);
      fetchData();
    } catch (e) {
      console.error(e);
      setSnack({ open: true, msg: "Failed to add student.", severity: "error" });
    }
  };

  const updateStudent = async (id, payload) => {
    if (payload.email && !validateEmail(payload.email)) {
      setSnack({ open: true, msg: "Invalid email.", severity: "error" });
      return;
    }
    if (payload.password && payload.password.length < 6) {
      setSnack({ open: true, msg: "Password must be at least 6 characters.", severity: "error" });
      return;
    }
    if (!payload.intakeId) {
      setSnack({ open: true, msg: "Intake cannot be empty.", severity: "error" });
      return;
    }
    try {
      await updateDoc(doc(db, "students", id), payload);
      setSnack({ open: true, msg: "Student updated.", severity: "success" });
      setDrawerOpen(false);
      setEditing(null);
      fetchData();
    } catch (e) {
      console.error(e);
      setSnack({ open: true, msg: "Failed to update student.", severity: "error" });
    }
  };

  const approveStudent = async (id, isApproved) => {
    try {
      await updateDoc(doc(db, "students", id), { isApproved });
      setSnack({ open: true, msg: `Student ${isApproved ? "approved" : "unapproved"}.`, severity: "success" });
      fetchData();
    } catch (e) {
      console.error(e);
      setSnack({ open: true, msg: "Failed to update status.", severity: "error" });
    }
  };

  const deleteStudent = async (id) => {
    if (!window.confirm("Delete this student?")) return;
    try {
      await updateDoc(doc(db, "students", id), { isDeleted: true, deletedAt: serverTimestamp() });
      setSnack({ open: true, msg: "Student deleted.", severity: "success" });
      fetchData();
    } catch (e) {
      console.error(e);
      setSnack({ open: true, msg: "Failed to delete.", severity: "error" });
    }
  };

  return (
    <Box sx={{ background: "linear-gradient(135deg, #FFD1DC, #B2EBF2)", minHeight: "100vh", py: { xs: 2, md: 4 } }}>
      <Paper elevation={12} sx={{ bgcolor: "#fff", borderRadius: 0, width: "100%", px: 0, py: 0 }}>
        <Box sx={{ maxWidth: 1200, mx: "auto", px: { xs: 2, md: 5 }, py: { xs: 2, md: 4 } }}>
          <TopBar
            onBack={() => navigate("/tutor-dashboard")}
            onCreate={() => { setEditing(null); setDrawerOpen(true); }}
          />

          <FiltersBar
            search={search} setSearch={setSearch}
            intakeId={intakeId} setIntakeId={setIntakeId}
            status={status} setStatus={setStatus}
            intakes={intakes}
            loading={loading}
            onReset={resetFilters}
          />

          <StudentsTable
            rows={filtered}
            onApprove={approveStudent}
            onEdit={(s) => { setEditing(s); setDrawerOpen(true); }}
            onDelete={deleteStudent}
            loading={loading}
          />
        </Box>
      </Paper>

      <StudentDrawerForm
        open={drawerOpen}
        onClose={() => { setDrawerOpen(false); setEditing(null); }}
        intakes={intakes}
        editing={editing}
        onSubmit={(payload) => editing ? updateStudent(editing.id, payload) : addStudent(payload)}
      />

      <Snackbar open={snack.open} autoHideDuration={4000} onClose={closeSnack} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <MuiAlert onClose={closeSnack} severity={snack.severity} elevation={6} variant="filled">
          {snack.msg}
        </MuiAlert>
      </Snackbar>
    </Box>
  );
};

export default ManageStudents;
