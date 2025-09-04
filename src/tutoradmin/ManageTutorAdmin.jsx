// src/tutoradmin/ManageTutorAdmin.jsx
import React, { useEffect, useMemo, useState } from "react";
import { db } from "../firebaseConfig";
import {
  collection, addDoc, getDocs, updateDoc, doc, serverTimestamp,
  query, orderBy, where
} from "firebase/firestore";
import {
  Box, Paper, Snackbar, Alert as MuiAlert, Button, Typography,
  TextField, InputAdornment, Chip, MenuItem, Select, FormControl,
  InputLabel, Table, TableHead, TableRow, TableCell, TableBody,
  TableContainer, Tooltip, Drawer, Divider, Stack, CircularProgress
} from "@mui/material";
import { useNavigate } from "react-router-dom";

import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import EditIcon from "@mui/icons-material/Edit";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";

// ---------- helpers ----------
const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

// ---------- Top action bar (same look as Students) ----------
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
        Manage Tutors
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
      Add Tutor
    </Button>
  </Box>
);

// ---------- Filters (search + status) ----------
const FiltersBar = ({
  search, setSearch,
  status, setStatus,
  loading,
  onReset
}) => (
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
        gridTemplateColumns: "1.5fr 1fr auto",
        gap: 1.5,
        alignItems: "center",
      }}
    >
      <TextField
        label="Search (name, email)"
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
          label={status === "approved" ? "Approved" : status === "pending" ? "Pending" : "All"}
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

// ---------- Right Drawer Form (mirrors StudentDrawerForm UX) ----------
const TutorDrawerForm = ({ open, onClose, onSubmit, editing }) => {
  const isEdit = !!editing;
  const [name, setName] = useState(editing?.name || "");
  const [email, setEmail] = useState(editing?.email || "");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    setName(editing?.name || "");
    setEmail(editing?.email || "");
    setPassword("");
    setErr("");
  }, [editing, open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr("");

    if (!name.trim() || !email.trim()) return setErr("Name and Email are required.");
    if (!validateEmail(email)) return setErr("Please enter a valid email address.");
    if (!isEdit && (!password.trim() || password.trim().length < 6)) {
      return setErr("Password must be at least 6 characters for a new tutor.");
    }
    const payload = { name: name.trim(), email: email.trim() };
    if (password.trim()) payload.password = password.trim(); // optional on edit
    await onSubmit(payload);
  };

  return (
    <Drawer anchor="right" open={open} onClose={onClose} PaperProps={{ sx: { width: { xs: "100%", sm: 420 } } }}>
      <Box sx={{ p: 3, display: "flex", flexDirection: "column", height: "100%" }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
          {isEdit ? "Edit Tutor" : "Add New Tutor"}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {isEdit ? "Update tutor details and save changes." : "Create a tutor account for your team."}
        </Typography>
        <Divider sx={{ mb: 2 }} />

        <Box component="form" onSubmit={handleSubmit} sx={{ display: "grid", gap: 2 }}>
          {!!err && <MuiAlert severity="error">{err}</MuiAlert>}
          <TextField
            label="Tutor Name *"
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

          <Stack direction="row" gap={1} justifyContent="flex-end" sx={{ mt: 1 }}>
            <Button onClick={onClose} variant="outlined" sx={{ borderRadius: "12px" }}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" sx={{ borderRadius: "12px", fontWeight: "bold" }}>
              {isEdit ? "Save Changes" : "Add Tutor"}
            </Button>
          </Stack>
        </Box>
      </Box>
    </Drawer>
  );
};

// ---------- Tutors Table (same styling as StudentsTable) ----------
const TutorsTable = ({ rows, onApprove, onEdit, onDelete, loading }) => (
  <TableContainer component={Paper} sx={{ borderRadius: "14px", border: "1px solid #eef2f6" }}>
    <Table stickyHeader size="medium">
      <TableHead sx={{ bgcolor: "#f7f9fc" }}>
        <TableRow>
          <TableCell sx={{ fontWeight: 700 }}>Name</TableCell>
          <TableCell sx={{ fontWeight: 700 }}>Email</TableCell>
          <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
          <TableCell sx={{ fontWeight: 700, width: 240 }}>Actions</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {loading ? (
          <TableRow><TableCell colSpan={4} align="center" sx={{ py: 6 }}><CircularProgress size={26} /></TableCell></TableRow>
        ) : rows.length === 0 ? (
          <TableRow><TableCell colSpan={4} align="center" sx={{ py: 6, color: "text.secondary" }}>No tutors found.</TableCell></TableRow>
        ) : rows.map((t) => (
          <TableRow key={t.id} sx={{ "&:nth-of-type(odd)": { bgcolor: "#fafafa" } }}>
            <TableCell>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Box
                  sx={{
                    width: 32, height: 32, borderRadius: "10px",
                    bgcolor: t.isApproved ? "#C8E6C9" : "#FFECB3",
                    color: t.isApproved ? "#1B5E20" : "#FF6F00",
                    display: "grid", placeItems: "center", fontWeight: 700,
                  }}
                >
                  {(t.name || "T")[0].toUpperCase()}
                </Box>
                <Typography sx={{ fontWeight: 600, lineHeight: 1.1 }}>{t.name}</Typography>
              </Stack>
            </TableCell>
            <TableCell>{t.email}</TableCell>
            <TableCell>
              <Chip
                label={t.isApproved ? "Approved" : "Pending"}
                color={t.isApproved ? "success" : "warning"}
                size="small"
                sx={{ fontWeight: 700, borderRadius: "8px" }}
              />
            </TableCell>
            <TableCell>
              <Stack direction="row" spacing={1}>
                {!t.isApproved && (
                  <Tooltip title="Approve">
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<CheckCircleOutlineIcon />}
                      onClick={() => onApprove(t.id, true)}
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
                    onClick={() => onEdit(t)}
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
                    onClick={() => onDelete(t.id)}
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
const ManageTutorAdmin = () => {
  const navigate = useNavigate();
  const [tutors, setTutors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [snack, setSnack] = useState({ open: false, msg: "", severity: "success" });

  // filters
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");

  // drawer
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const closeSnack = (_, r) => (r === "clickaway" ? null : setSnack((s) => ({ ...s, open: false })));

  const tutorsRef = collection(db, "tutors");

  const fetchTutors = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(query(tutorsRef, where("isDeleted", "==", false), orderBy("createdAt", "desc")));
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setTutors(list);
    } catch (e) {
      console.error(e);
      setSnack({ open: true, msg: "Failed to load tutors.", severity: "error" });
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { fetchTutors(); }, []);

  const resetFilters = () => { setSearch(""); setStatus("all"); };

  const filtered = useMemo(() => {
    const t = search.trim().toLowerCase();
    return tutors.filter((u) => {
      const matchSearch = u.name?.toLowerCase().includes(t) || u.email?.toLowerCase().includes(t);
      const matchStatus = status === "all" || (status === "approved" ? u.isApproved : !u.isApproved);
      return matchSearch && matchStatus;
    });
  }, [tutors, search, status]);

  // actions
  const addTutor = async ({ name, email, password }) => {
    if (!name || !email || !password) {
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
      const exists = await getDocs(query(tutorsRef, where("email", "==", email)));
      if (!exists.empty) {
        setSnack({ open: true, msg: "Email already exists.", severity: "error" });
        return;
      }

      await addDoc(tutorsRef, {
        name, email, password,
        isApproved: false, isDeleted: false, createdAt: serverTimestamp(),
      });
      setSnack({ open: true, msg: "Tutor added.", severity: "success" });
      setDrawerOpen(false);
      setEditing(null);
      fetchTutors();
    } catch (e) {
      console.error(e);
      setSnack({ open: true, msg: "Failed to add tutor.", severity: "error" });
    }
  };

  const updateTutor = async (id, payload) => {
    if (payload.email && !validateEmail(payload.email)) {
      setSnack({ open: true, msg: "Invalid email.", severity: "error" });
      return;
    }
    if (payload.password && payload.password.length < 6) {
      setSnack({ open: true, msg: "Password must be at least 6 characters.", severity: "error" });
      return;
    }
    try {
      await updateDoc(doc(db, "tutors", id), payload);
      setSnack({ open: true, msg: "Tutor updated.", severity: "success" });
      setDrawerOpen(false);
      setEditing(null);
      fetchTutors();
    } catch (e) {
      console.error(e);
      setSnack({ open: true, msg: "Failed to update tutor.", severity: "error" });
    }
  };

  const approveTutor = async (id, isApproved) => {
    try {
      await updateDoc(doc(db, "tutors", id), { isApproved });
      setSnack({ open: true, msg: `Tutor ${isApproved ? "approved" : "unapproved"}.`, severity: "success" });
      fetchTutors();
    } catch (e) {
      console.error(e);
      setSnack({ open: true, msg: "Failed to update status.", severity: "error" });
    }
  };

  const deleteTutor = async (id) => {
    if (!window.confirm("Delete this tutor?")) return;
    try {
      await updateDoc(doc(db, "tutors", id), { isDeleted: true, deletedAt: serverTimestamp() });
      setSnack({ open: true, msg: "Tutor deleted.", severity: "success" });
      fetchTutors();
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
            onBack={() => navigate("/tutor-admin-dashboard")}
            onCreate={() => { setEditing(null); setDrawerOpen(true); }}
          />

          <FiltersBar
            search={search} setSearch={setSearch}
            status={status} setStatus={setStatus}
            loading={loading}
            onReset={resetFilters}
          />

          <TutorsTable
            rows={filtered}
            onApprove={approveTutor}
            onEdit={(t) => { setEditing(t); setDrawerOpen(true); }}
            onDelete={deleteTutor}
            loading={loading}
          />
        </Box>
      </Paper>

      <TutorDrawerForm
        open={drawerOpen}
        onClose={() => { setDrawerOpen(false); setEditing(null); }}
        editing={editing}
        onSubmit={(payload) => editing ? updateTutor(editing.id, payload) : addTutor(payload)}
      />

      <Snackbar open={snack.open} autoHideDuration={4000} onClose={closeSnack} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <MuiAlert onClose={closeSnack} severity={snack.severity} elevation={6} variant="filled">
          {snack.msg}
        </MuiAlert>
      </Snackbar>
    </Box>
  );
};

export default ManageTutorAdmin;
