// src/admin/ManageAdmins.jsx
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
  TableContainer, Tooltip, Drawer, Divider, Stack, CircularProgress,
  Checkbox, FormControlLabel
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import EditIcon from "@mui/icons-material/Edit";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";

// ---------- helpers ----------
const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

// ---------- Top action bar (matches Students) ----------
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
      <Typography variant="h4" sx={{ fontWeight: "bold", color: "#1A237E", display: "inline-flex", gap: 1, alignItems: "center" }}>
        <AdminPanelSettingsIcon sx={{ fontSize: 28 }} />
        Manage Admins
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
      Add Admin
    </Button>
  </Box>
);

// ---------- Filters (aligned grid; same sizing as Students) ----------
const FiltersBar = ({
  search, setSearch,
  role, setRole,      // 'all' | 'master' | 'tutor'
  status, setStatus,  // 'all' | 'approved' | 'pending'
  loading,
  onReset
}) => (
  <Paper elevation={2} sx={{ p: 2, mb: 2, borderRadius: "14px", bgcolor: "#fff", border: "1px solid #eef2f6" }}>
    <Box sx={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr auto", gap: 1.5, alignItems: "center" }}>
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
        <InputLabel id="role-filter-label">Role</InputLabel>
        <Select
          labelId="role-filter-label"
          value={role}
          label="Role"
          onChange={(e) => setRole(e.target.value)}
          disabled={loading}
          sx={{ borderRadius: "12px" }}
        >
          <MenuItem value="all">All</MenuItem>
          <MenuItem value="master">Master Admin</MenuItem>
          <MenuItem value="tutor">Tutor Admin</MenuItem>
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

// ---------- Drawer Form (Add/Edit) ----------
const AdminDrawerForm = ({ open, onClose, onSubmit, editing }) => {
  const isEdit = !!editing;
  const [name, setName] = useState(editing?.name || "");
  const [email, setEmail] = useState(editing?.email || "");
  const [password, setPassword] = useState("");
  const [isMasterAdmin, setIsMasterAdmin] = useState(!!editing?.isMasterAdmin);
  const [isTutorAdmin, setIsTutorAdmin] = useState(!!editing?.isTutorAdmin);
  const [err, setErr] = useState("");

  useEffect(() => {
    setName(editing?.name || "");
    setEmail(editing?.email || "");
    setPassword("");
    setIsMasterAdmin(!!editing?.isMasterAdmin);
    setIsTutorAdmin(!!editing?.isTutorAdmin);
    setErr("");
  }, [editing, open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    if (!name.trim() || !email.trim()) return setErr("Name and Email are required.");
    if (!validateEmail(email)) return setErr("Please enter a valid email.");
    if (!isEdit && (!password.trim() || password.length < 6)) return setErr("Password must be at least 6 characters.");

    const payload = {
      name: name.trim(),
      email: email.trim(),
      isMasterAdmin,
      isTutorAdmin
    };
    if (password.trim()) payload.password = password.trim();

    await onSubmit(payload);
  };

  return (
    <Drawer anchor="right" open={open} onClose={onClose} PaperProps={{ sx: { width: { xs: "100%", sm: 420 } } }}>
      <Box sx={{ p: 3, display: "flex", flexDirection: "column", height: "100%" }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
          {isEdit ? "Edit Admin" : "Add New Admin"}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {isEdit ? "Update details and save changes." : "Create an admin and assign roles."}
        </Typography>
        <Divider sx={{ mb: 2 }} />

        <Box component="form" onSubmit={handleSubmit} sx={{ display: "grid", gap: 2 }}>
          {!!err && <MuiAlert severity="error">{err}</MuiAlert>}

          <TextField
            label="Admin Name *"
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

          <FormControlLabel
            control={<Checkbox checked={isMasterAdmin} onChange={(e) => setIsMasterAdmin(e.target.checked)} />}
            label="Master Admin"
          />
          <FormControlLabel
            control={<Checkbox checked={isTutorAdmin} onChange={(e) => setIsTutorAdmin(e.target.checked)} />}
            label="Tutor Admin"
          />

          <Stack direction="row" gap={1} justifyContent="flex-end" sx={{ mt: 1 }}>
            <Button onClick={onClose} variant="outlined" sx={{ borderRadius: "12px" }}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" sx={{ borderRadius: "12px", fontWeight: "bold" }}>
              {isEdit ? "Save Changes" : "Add Admin"}
            </Button>
          </Stack>
        </Box>
      </Box>
    </Drawer>
  );
};

// ---------- Table ----------
const AdminsTable = ({ rows, onApprove, onEdit, onDelete, loading }) => (
  <TableContainer component={Paper} sx={{ borderRadius: "14px", border: "1px solid #eef2f6" }}>
    <Table stickyHeader size="medium">
      <TableHead sx={{ bgcolor: "#f7f9fc" }}>
        <TableRow>
          <TableCell sx={{ fontWeight: 700 }}>Name</TableCell>
          <TableCell sx={{ fontWeight: 700 }}>Email</TableCell>
          <TableCell sx={{ fontWeight: 700 }}>Roles</TableCell>
          <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
          <TableCell sx={{ fontWeight: 700, width: 260 }}>Actions</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {loading ? (
          <TableRow><TableCell colSpan={5} align="center" sx={{ py: 6 }}><CircularProgress size={26} /></TableCell></TableRow>
        ) : rows.length === 0 ? (
          <TableRow><TableCell colSpan={5} align="center" sx={{ py: 6, color: "text.secondary" }}>No admins found.</TableCell></TableRow>
        ) : rows.map((a) => (
          <TableRow key={a.id} sx={{ "&:nth-of-type(odd)": { bgcolor: "#fafafa" } }}>
            <TableCell>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Box
                  sx={{
                    width: 32, height: 32, borderRadius: "10px",
                    bgcolor: "#BBDEFB", color: "#0D47A1",
                    display: "grid", placeItems: "center", fontWeight: 700,
                  }}
                >
                  {(a.name || "A")[0].toUpperCase()}
                </Box>
                <Box>
                  <Typography sx={{ fontWeight: 600, lineHeight: 1.1 }}>{a.name}</Typography>
                  <Typography variant="caption" color="text.secondary">{a.id}</Typography>
                </Box>
              </Stack>
            </TableCell>
            <TableCell>{a.email}</TableCell>
            <TableCell>
              {!!a.isMasterAdmin && (
                <Chip label="Master" size="small" sx={{ mr: 1, bgcolor: "#FFC107", color: "#000", fontWeight: 700, borderRadius: "8px" }} />
              )}
              {!!a.isTutorAdmin && (
                <Chip label="Tutor Admin" size="small" sx={{ bgcolor: "#03A9F4", color: "#fff", fontWeight: 700, borderRadius: "8px" }} />
              )}
            </TableCell>
            <TableCell>
              <Chip
                label={a.isApproved ? "Approved" : "Pending"}
                color={a.isApproved ? "success" : "warning"}
                size="small"
                sx={{ fontWeight: 700, borderRadius: "8px" }}
              />
            </TableCell>
            <TableCell>
              <Stack direction="row" spacing={1}>
                {!a.isApproved && (
                  <Tooltip title="Approve">
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<CheckCircleOutlineIcon />}
                      onClick={() => onApprove(a.id, true)}
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
                    onClick={() => onEdit(a)}
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
                    onClick={() => onDelete(a.id)}
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
const ManageAdmins = () => {
  const navigate = useNavigate();
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [snack, setSnack] = useState({ open: false, msg: "", severity: "success" });

  // filters
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("all");     // 'all' | 'master' | 'tutor'
  const [status, setStatus] = useState("all"); // 'all' | 'approved' | 'pending'

  // drawer
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const closeSnack = (_, r) => (r === "clickaway" ? null : setSnack((s) => ({ ...s, open: false })));

  const adminsRef = collection(db, "admins");

  const fetchData = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(query(adminsRef, where("isDeleted", "==", false), orderBy("createdAt", "desc")));
      setAdmins(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (e) {
      console.error(e);
      setSnack({ open: true, msg: "Failed to load admins.", severity: "error" });
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { fetchData(); }, []);

  const resetFilters = () => { setSearch(""); setRole("all"); setStatus("all"); };

  const filtered = useMemo(() => {
    const t = search.trim().toLowerCase();
    return admins.filter((a) => {
      const matchSearch = a.name?.toLowerCase().includes(t) || a.email?.toLowerCase().includes(t);
      const matchRole = role === "all" ||
        (role === "master" && a.isMasterAdmin) ||
        (role === "tutor" && a.isTutorAdmin);
      const matchStatus = status === "all" || (status === "approved" ? a.isApproved : !a.isApproved);
      return matchSearch && matchRole && matchStatus;
    });
  }, [admins, search, role, status]);

  // actions
  const addAdmin = async ({ name, email, password, isMasterAdmin, isTutorAdmin }) => {
    if (!name || !email || !password) {
      setSnack({ open: true, msg: "Please fill in all required fields.", severity: "error" });
      return;
    }
    if (!validateEmail(email)) {
      setSnack({ open: true, msg: "Please enter a valid email.", severity: "error" });
      return;
    }
    if (password.length < 6) {
      setSnack({ open: true, msg: "Password must be at least 6 characters.", severity: "error" });
      return;
    }
    try {
      const dup = await getDocs(query(adminsRef, where("email", "==", email)));
      if (!dup.empty) {
        setSnack({ open: true, msg: "An admin with this email already exists.", severity: "error" });
        return;
      }
      await addDoc(adminsRef, {
        name, email, password,
        isMasterAdmin: !!isMasterAdmin,
        isTutorAdmin: !!isTutorAdmin,
        isApproved: false,
        isDeleted: false,
        createdAt: serverTimestamp(),
      });
      setSnack({ open: true, msg: "Admin added. Approval pending.", severity: "success" });
      setDrawerOpen(false);
      setEditing(null);
      fetchData();
    } catch (e) {
      console.error(e);
      setSnack({ open: true, msg: "Failed to add admin.", severity: "error" });
    }
  };

  const updateAdmin = async (id, payload) => {
    if (payload.email && !validateEmail(payload.email)) {
      setSnack({ open: true, msg: "Please enter a valid email.", severity: "error" });
      return;
    }
    if (payload.password && payload.password.length < 6) {
      setSnack({ open: true, msg: "Password must be at least 6 characters.", severity: "error" });
      return;
    }
    try {
      if (payload.email) {
        const dup = await getDocs(query(adminsRef, where("email", "==", payload.email), where("__name__", "!=", id)));
        if (!dup.empty) {
          setSnack({ open: true, msg: "Another admin with this email already exists.", severity: "error" });
          return;
        }
      }
      await updateDoc(doc(db, "admins", id), payload);
      setSnack({ open: true, msg: "Admin updated.", severity: "success" });
      setDrawerOpen(false);
      setEditing(null);
      fetchData();
    } catch (e) {
      console.error(e);
      setSnack({ open: true, msg: "Failed to update admin.", severity: "error" });
    }
  };

  const approveAdmin = async (id, isApproved) => {
    try {
      await updateDoc(doc(db, "admins", id), { isApproved });
      setSnack({ open: true, msg: `Admin ${isApproved ? "approved" : "unapproved"}.`, severity: "success" });
      fetchData();
    } catch (e) {
      console.error(e);
      setSnack({ open: true, msg: "Failed to update status.", severity: "error" });
    }
  };

  const deleteAdmin = async (id) => {
    if (!window.confirm("Delete this admin?")) return;
    try {
      await updateDoc(doc(db, "admins", id), { isDeleted: true, deletedAt: serverTimestamp() });
      setSnack({ open: true, msg: "Admin deleted.", severity: "success" });
      fetchData();
    } catch (e) {
      console.error(e);
      setSnack({ open: true, msg: "Failed to delete.", severity: "error" });
    }
  };

  return (
    <Box sx={{ background: "linear-gradient(135deg, #FFDDC1, #C1FFD7)", minHeight: "100vh", py: { xs: 2, md: 4 } }}>
      <Paper elevation={12} sx={{ bgcolor: "#fff", borderRadius: 0, width: "100%", px: 0, py: 0 }}>
        <Box sx={{ maxWidth: 1200, mx: "auto", px: { xs: 2, md: 5 }, py: { xs: 2, md: 4 } }}>
          <TopBar
            onBack={() => navigate("/admin-dashboard")}
            onCreate={() => { setEditing(null); setDrawerOpen(true); }}
          />

          <FiltersBar
            search={search} setSearch={setSearch}
            role={role} setRole={setRole}
            status={status} setStatus={setStatus}
            loading={loading}
            onReset={resetFilters}
          />

          <AdminsTable
            rows={filtered}
            onApprove={approveAdmin}
            onEdit={(a) => { setEditing(a); setDrawerOpen(true); }}
            onDelete={deleteAdmin}
            loading={loading}
          />
        </Box>
      </Paper>

      <AdminDrawerForm
        open={drawerOpen}
        onClose={() => { setDrawerOpen(false); setEditing(null); }}
        editing={editing}
        onSubmit={(payload) => editing ? updateAdmin(editing.id, payload) : addAdmin(payload)}
      />

      <Snackbar open={snack.open} autoHideDuration={4000} onClose={closeSnack} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <MuiAlert onClose={closeSnack} severity={snack.severity} elevation={6} variant="filled">
          {snack.msg}
        </MuiAlert>
      </Snackbar>
    </Box>
  );
};

export default ManageAdmins;
