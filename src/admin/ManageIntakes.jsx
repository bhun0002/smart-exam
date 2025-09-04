// src/admin/ManageIntakes.jsx
import React, { useState, useEffect, useMemo } from "react";
import { db } from "../firebaseConfig";
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  doc,
  deleteDoc,
  serverTimestamp,
  query,
  orderBy,
} from "firebase/firestore";
import {
  Box,
  Typography,
  Button,
  Paper,
  Divider,
  Snackbar,
  Alert as MuiAlert,
  TextField,
  CircularProgress,
  Dialog, DialogActions, DialogContent, DialogTitle,
  List, ListItem, ListItemText, ListItemSecondaryAction, IconButton,
  Grid,
  MenuItem,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SchoolIcon from '@mui/icons-material/School';

// ---- Month helpers ----
const MONTHS = [
  { idx: 0, full: "January",   short: "Jan" },
  { idx: 1, full: "February",  short: "Feb" },
  { idx: 2, full: "March",     short: "Mar" },
  { idx: 3, full: "April",     short: "Apr" },
  { idx: 4, full: "May",       short: "May" },
  { idx: 5, full: "June",      short: "Jun" },
  { idx: 6, full: "July",      short: "Jul" },
  { idx: 7, full: "August",    short: "Aug" },
  { idx: 8, full: "September", short: "Sep" },
  { idx: 9, full: "October",   short: "Oct" },
  { idx: 10, full: "November", short: "Nov" },
  { idx: 11, full: "December", short: "Dec" },
];

const monthNameToIndex = (name) => {
  if (!name) return -1;
  const n = name.toLowerCase();
  const found = MONTHS.find(m => m.full.toLowerCase() === n || m.short.toLowerCase() === n);
  return found ? found.idx : -1;
};

// Try to parse strings like "Apr 2025" or "April 2025"
const parseIntakeName = (name) => {
  if (!name || typeof name !== "string") return { ok: false };
  const parts = name.trim().split(/\s+/); // split by spaces
  if (parts.length !== 2) return { ok: false };

  const mIdx = monthNameToIndex(parts[0]);
  const year = Number(parts[1]);

  if (mIdx < 0 || !Number.isInteger(year) || year < 1900 || year > 3000) {
    return { ok: false };
  }
  return { ok: true, monthIndex: mIdx, year };
};

const buildIntakeName = (monthIndex, year) => {
  const m = MONTHS[monthIndex];
  return `${m.short} ${year}`; // <-- SHORT month + full year (e.g., "Apr 2025")
};

// Build a small year range (customize as needed)
const buildYearOptions = () => {
  const y = new Date().getFullYear();
  const start = y - 1;
  const end = y + 6;
  const out = [];
  for (let i = start; i <= end; i++) out.push(i);
  return out;
};

// --- ManageIntakes Main Component ---
const ManageIntakes = () => {
  const [intakes, setIntakes] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);

  // Add Intake (month/year) states
  const now = new Date();
  const [addMonthIndex, setAddMonthIndex] = useState(now.getMonth());
  const [addYear, setAddYear] = useState(now.getFullYear());

  // Edit modal states
  const [openIntakeModal, setOpenIntakeModal] = useState(false);
  const [editingIntakeId, setEditingIntakeId] = useState(null);
  const [editMonthIndex, setEditMonthIndex] = useState(now.getMonth());
  const [editYear, setEditYear] = useState(now.getFullYear());
  const [editFreeText, setEditFreeText] = useState(""); // fallback if unparsable
  const [editParsed, setEditParsed] = useState(true);   // toggles parser result

  const navigate = useNavigate();
  const intakesCollectionRef = collection(db, "intakes");

  const clearMessages = () => {
    setError("");
    setSuccess("");
  };

  const getIntakes = async () => {
    setLoading(true);
    try {
      const q = query(intakesCollectionRef, orderBy("name", "asc"));
      const data = await getDocs(q);
      setIntakes(data.docs.map((doc) => ({ ...doc.data(), id: doc.id })));
      clearMessages();
    } catch (err) {
      console.error("Error fetching intakes:", err);
      setError("Failed to fetch intakes. Check console for details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getIntakes();
  }, []);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  // Lowercased set of existing names for quick duplicate check
  const existingNames = useMemo(
    () => new Set(intakes.map(i => (i.name || "").toLowerCase())),
    [intakes]
  );

  // --- Add Intake ---
  const handleAddIntake = async () => {
    clearMessages();

    // build short name (e.g., "Apr 2025")
    const name = buildIntakeName(addMonthIndex, addYear);

    if (existingNames.has(name.toLowerCase())) {
      setError(`An intake named "${name}" already exists.`);
      return;
    }

    try {
      await addDoc(intakesCollectionRef, {
        name,
        createdAt: serverTimestamp(),
      });
      setSuccess(`Intake "${name}" added successfully!`);
      await getIntakes();
    } catch (err) {
      console.error("Error adding intake:", err);
      setError("Failed to add intake. " + err.message);
    }
  };

  // --- Edit Intake ---
  const handleOpenEditModal = (intake) => {
    clearMessages();
    setEditingIntakeId(intake.id);

    const parsed = parseIntakeName(intake.name);
    if (parsed.ok) {
      setEditParsed(true);
      setEditMonthIndex(parsed.monthIndex);
      setEditYear(parsed.year);
      setEditFreeText(""); // not used
    } else {
      // fallback: allow free text edit if unparsable
      setEditParsed(false);
      setEditFreeText(intake.name || "");
    }
    setOpenIntakeModal(true);
  };

  const handleCloseEditModal = () => {
    setOpenIntakeModal(false);
    setEditingIntakeId(null);
    setEditFreeText("");
    clearMessages();
  };

  const handleUpdateIntake = async () => {
    clearMessages();

    let newName = "";
    if (editParsed) {
      newName = buildIntakeName(editMonthIndex, editYear);
    } else {
      const txt = (editFreeText || "").trim();
      if (!txt) {
        setError("Intake name cannot be empty.");
        return;
      }
      newName = txt;
    }

    // Prevent duplicates (ignore the one we are editing)
    const dup = intakes.some(
      (i) => i.id !== editingIntakeId && (i.name || "").toLowerCase() === newName.toLowerCase()
    );
    if (dup) {
      setError(`An intake named "${newName}" already exists.`);
      return;
    }

    try {
      const intakeDoc = doc(db, "intakes", editingIntakeId);
      await updateDoc(intakeDoc, { name: newName });
      setSuccess(`Intake updated to "${newName}" successfully!`);
      handleCloseEditModal();
      await getIntakes();
    } catch (err) {
      console.error("Error updating intake:", err);
      setError("Failed to update intake. " + err.message);
    }
  };

  // --- Delete Intake ---
  const handleDeleteIntake = async (id) => {
    if (!window.confirm("Delete this intake? This action cannot be undone.")) return;
    clearMessages();
    try {
      const intakeDoc = doc(db, "intakes", id);
      await deleteDoc(intakeDoc);
      setSuccess("Intake deleted successfully!");
      await getIntakes();
    } catch (err) {
      console.error("Error deleting intake:", err);
      setError("Failed to delete intake. " + err.message);
    }
  };

  const yearOptions = useMemo(buildYearOptions, []);

  return (
    <Box
      sx={{
        background: 'linear-gradient(135deg, #C1FFD7, #FFDDC1)',
        minHeight: '100vh',
        padding: '32px 0',
        fontFamily: 'Roboto, sans-serif',
      }}
    >
      <Paper
        elevation={12}
        sx={{
          padding: { xs: 3, md: 5 },
          borderRadius: '24px',
          backgroundColor: '#ffffff',
          maxWidth: { xs: '95%', md: 1000 },
          mx: 'auto',
          boxShadow: '0px 15px 40px rgba(0,0,0,0.1)',
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate("/admin-dashboard")}
            sx={{
              borderColor: '#8d6e63', color: '#8d6e63', borderRadius: '12px', fontWeight: 'bold',
              '&:hover': { backgroundColor: '#efebe9' }
            }}
          >
            Back to Dashboard
          </Button>
          <Typography variant="h4" fontWeight="bold" color="#37474f" sx={{ flexGrow: 1, textAlign: 'center' }}>
            Manage Intakes
          </Typography>
          <Box sx={{ width: '150px' }} />
        </Box>
        <Divider sx={{ mb: 4 }} />

        {/* Add New Intake (Month + Year) */}
        <Paper elevation={3} sx={{ p: 3, borderRadius: '16px', bgcolor: '#fdfdfd', mb: 4 }}>
          <Typography variant="h6" fontWeight="bold" color="#455a64" sx={{ mb: 2 }}>
            Add New Intake
          </Typography>

          {error && <MuiAlert severity="error" sx={{ mb: 2 }}>{error}</MuiAlert>}
          {success && <MuiAlert severity="success" sx={{ mb: 2 }}>{success}</MuiAlert>}

          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="Month"
                value={addMonthIndex}
                onChange={(e) => setAddMonthIndex(Number(e.target.value))}
                InputProps={{ sx: { borderRadius: '12px' } }}
              >
                {MONTHS.map(m => (
                  <MenuItem key={m.idx} value={m.idx}>{m.full} ({m.short})</MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                select
                fullWidth
                label="Year"
                value={addYear}
                onChange={(e) => setAddYear(Number(e.target.value))}
                InputProps={{ sx: { borderRadius: '12px' } }}
              >
                {yearOptions.map(y => (
                  <MenuItem key={y} value={y}>{y}</MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} sm={2}>
              <Button
                fullWidth
                variant="contained"
                onClick={handleAddIntake}
                startIcon={<AddCircleOutlineIcon />}
                sx={{
                  backgroundColor: '#A5D6A7',
                  '&:hover': { backgroundColor: '#81C784' },
                  color: '#1B5E20',
                  borderRadius: '12px', fontWeight: 'bold', height: '56px'
                }}
              >
                Add
              </Button>
            </Grid>

            {/* Live preview of the string that will be saved */}
            <Grid item xs={12}>
              <Typography variant="body2" color="text.secondary">
                Will save as: <strong>{buildIntakeName(addMonthIndex, addYear)}</strong>
              </Typography>
            </Grid>
          </Grid>
        </Paper>

        {/* Existing Intakes List */}
        <Paper elevation={3} sx={{ p: 3, borderRadius: '16px', bgcolor: '#fdfdfd' }}>
          <Typography variant="h6" fontWeight="bold" color="#455a64" sx={{ mb: 2 }}>
            Existing Intakes
          </Typography>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <CircularProgress />
            </Box>
          ) : intakes.length === 0 ? (
            <Typography textAlign="center" color="text.secondary" sx={{ py: 3 }}>
              No intakes added yet.
            </Typography>
          ) : (
            <List>
              {intakes.map((intake) => (
                <ListItem
                  key={intake.id}
                  divider
                  sx={{ '&:nth-of-type(odd)': { bgcolor: '#fcfcfc' }, borderRadius: '8px' }}
                >
                  <SchoolIcon sx={{ mr: 2, color: '#4CAF50' }} />
                  <ListItemText primary={intake.name} />
                  <ListItemSecondaryAction>
                    <IconButton edge="end" aria-label="edit" onClick={() => handleOpenEditModal(intake)}>
                      <EditIcon color="primary" />
                    </IconButton>
                    <IconButton edge="end" aria-label="delete" onClick={() => handleDeleteIntake(intake.id)}>
                      <DeleteOutlineIcon color="error" />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          )}
        </Paper>

        {/* Edit Intake Dialog */}
        <Dialog open={openIntakeModal} onClose={handleCloseEditModal} fullWidth maxWidth="sm">
          <DialogTitle>Edit Intake</DialogTitle>
          <DialogContent>
            {editParsed ? (
              <Grid container spacing={2} sx={{ mt: 0.5 }}>
                <Grid item xs={12} sm={7}>
                  <TextField
                    select
                    fullWidth
                    label="Month"
                    value={editMonthIndex}
                    onChange={(e) => setEditMonthIndex(Number(e.target.value))}
                    InputProps={{ sx: { borderRadius: '12px' } }}
                  >
                    {MONTHS.map(m => (
                      <MenuItem key={m.idx} value={m.idx}>{m.full} ({m.short})</MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={5}>
                  <TextField
                    select
                    fullWidth
                    label="Year"
                    value={editYear}
                    onChange={(e) => setEditYear(Number(e.target.value))}
                    InputProps={{ sx: { borderRadius: '12px' } }}
                  >
                    {yearOptions.map(y => (
                      <MenuItem key={y} value={y}>{y}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Will save as: <strong>{buildIntakeName(editMonthIndex, editYear)}</strong>
                  </Typography>
                </Grid>
              </Grid>
            ) : (
              <>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  The current name couldn’t be parsed into Month/Year. You can edit it directly below.
                </Typography>
                <TextField
                  autoFocus
                  margin="dense"
                  id="intake-name"
                  label="Intake Name"
                  type="text"
                  fullWidth
                  variant="outlined"
                  value={editFreeText}
                  onChange={(e) => setEditFreeText(e.target.value)}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                />
                <Typography
                  variant="body2"
                  color="primary"
                  sx={{ mt: 1, cursor: "pointer", textDecoration: "underline" }}
                  onClick={() => {
                    // Try to parse what user typed into Month/Year mode
                    const p = parseIntakeName(editFreeText);
                    if (p.ok) {
                      setEditParsed(true);
                      setEditMonthIndex(p.monthIndex);
                      setEditYear(p.year);
                    }
                  }}
                >
                  Try to parse as Month/Year
                </Typography>
              </>
            )}

            {error && <MuiAlert severity="error" sx={{ mt: 2 }}>{error}</MuiAlert>}
            {success && <MuiAlert severity="success" sx={{ mt: 2 }}>{success}</MuiAlert>}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseEditModal}>Cancel</Button>
            <Button
              onClick={handleUpdateIntake}
              variant="contained"
              sx={{
                backgroundColor: '#FFB74D',
                '&:hover': { backgroundColor: '#FF9800' },
                color: '#E65100',
                borderRadius: '8px', fontWeight: 'bold'
              }}
            >
              Save
            </Button>
          </DialogActions>
        </Dialog>
      </Paper>

      <Snackbar
        open={!!(error || success)}
        autoHideDuration={5000}
        onClose={clearMessages}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <MuiAlert
          onClose={clearMessages}
          severity={error ? "error" : "success"}
          elevation={6}
          variant="filled"
          sx={{ backgroundColor: error ? "#F44336" : "#4CAF50" }}
        >
          {error || success}
        </MuiAlert>
      </Snackbar>
    </Box>
  );
};

export default ManageIntakes;
