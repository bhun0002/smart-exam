// src/admin/ManageIntakes.jsx
import React, { useState, useEffect } from "react";
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
    where,
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
    List, ListItem, ListItemText, ListItemSecondaryAction, IconButton
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ArrowBackIcon from '@mui/icons-material/ArrowBack'; // For back button
import SchoolIcon from '@mui/icons-material/School'; // For intake icon

// --- ManageIntakes Main Component ---
const ManageIntakes = () => {
    const [intakes, setIntakes] = useState([]);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(true);
    
    // Intake form/modal states
    const [currentIntakeName, setCurrentIntakeName] = useState(''); // For adding new intake
    const [openIntakeModal, setOpenIntakeModal] = useState(false); // Controls the edit modal visibility
    const [editingIntakeId, setEditingIntakeId] = useState(null); // ID of intake being edited
    const [editingIntakeName, setEditingIntakeName] = useState(''); // Name of intake being edited

    const navigate = useNavigate();
    const intakesCollectionRef = collection(db, "intakes");

    const clearMessages = () => {
        setError("");
        setSuccess("");
    };

    // --- Intake Management Functions ---
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
            const timer = setTimeout(() => {
                setSuccess("");
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [success]);

    const handleAddIntake = async () => { // No need to pass intakeName, use currentIntakeName state
        clearMessages();
        if (!currentIntakeName.trim()) {
            setError("Intake name cannot be empty.");
            return;
        }
        const exists = intakes.some(intake => intake.name.toLowerCase() === currentIntakeName.toLowerCase());
        if (exists) {
            setError("An intake with this name already exists.");
            return;
        }
        try {
            await addDoc(intakesCollectionRef, {
                name: currentIntakeName.trim(),
                createdAt: serverTimestamp(),
            });
            setSuccess(`Intake "${currentIntakeName.trim()}" added successfully!`);
            setCurrentIntakeName(''); // Clear input field after adding
            getIntakes();
        } catch (err) {
            console.error("Error adding intake:", err);
            setError("Failed to add intake. " + err.message);
        }
    };

    const handleUpdateIntake = async () => { // No need to pass id/name, use state
        clearMessages();
        if (!editingIntakeName.trim()) {
            setError("Intake name cannot be empty.");
            return;
        }
        const exists = intakes.some(intake => intake.name.toLowerCase() === editingIntakeName.toLowerCase() && intake.id !== editingIntakeId);
        if (exists) {
            setError("An intake with this name already exists.");
            return;
        }
        try {
            const intakeDoc = doc(db, "intakes", editingIntakeId);
            await updateDoc(intakeDoc, { name: editingIntakeName.trim() });
            setSuccess(`Intake updated to "${editingIntakeName.trim()}" successfully!`);
            setOpenIntakeModal(false); // Close modal on success
            setEditingIntakeId(null); // Clear editing state
            setEditingIntakeName(''); // Clear editing name
            getIntakes();
        } catch (err) {
            console.error("Error updating intake:", err);
            setError("Failed to update intake. " + err.message);
        }
    };

    const handleDeleteIntake = async (id) => {
        // IMPORTANT: Use custom modal, not window.confirm
        // For now, I'll keep window.confirm to avoid adding a new modal component immediately.
        // In a production app, replace this with a custom Material-UI Dialog.
        if (window.confirm("Are you sure you want to delete this intake? This action cannot be undone.")) {
            clearMessages();
            try {
                const intakeDoc = doc(db, "intakes", id);
                await deleteDoc(intakeDoc);
                setSuccess("Intake deleted successfully!");
                getIntakes();
            } catch (err) {
                console.error("Error deleting intake:", err);
                setError("Failed to delete intake. " + err.message);
            }
        }
    };

    const handleOpenEditModal = (intake) => {
        setEditingIntakeId(intake.id);
        setEditingIntakeName(intake.name);
        setOpenIntakeModal(true);
        clearMessages(); // Clear messages when opening modal
    };

    const handleCloseEditModal = () => {
        setOpenIntakeModal(false);
        setEditingIntakeId(null);
        setEditingIntakeName('');
        clearMessages(); // Clear messages when closing modal
    };


    return (
        <Box
            sx={{
                background: 'linear-gradient(135deg, #C1FFD7, #FFDDC1)', // Intake-themed gradient
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
                    <Box sx={{ width: '150px' }} /> {/* Placeholder to balance title */}
                </Box>
                <Divider sx={{ mb: 4 }} />

                {/* Add New Intake Form */}
                <Paper elevation={3} sx={{ p: 3, borderRadius: '16px', bgcolor: '#fdfdfd', mb: 4 }}>
                    <Typography variant="h6" fontWeight="bold" color="#455a64" sx={{ mb: 2 }}>
                        Add New Intake
                    </Typography>
                    {error && <MuiAlert severity="error" sx={{ mb: 2 }}>{error}</MuiAlert>}
                    {success && <MuiAlert severity="success" sx={{ mb: 2 }}>{success}</MuiAlert>}
                    <TextField
                        label="New Intake Name (e.g., April 2025)"
                        variant="outlined"
                        fullWidth
                        sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                        value={currentIntakeName}
                        onChange={(e) => setCurrentIntakeName(e.target.value)}
                    />
                    <Button
                        variant="contained"
                        onClick={handleAddIntake}
                        disabled={!currentIntakeName.trim()}
                        startIcon={<AddCircleOutlineIcon />}
                        sx={{
                            backgroundColor: '#A5D6A7',
                            '&:hover': { backgroundColor: '#81C784' },
                            color: '#1B5E20',
                            borderRadius: '12px', fontWeight: 'bold'
                        }}
                    >
                        Add Intake
                    </Button>
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
                <Dialog open={openIntakeModal} onClose={handleCloseEditModal}>
                    <DialogTitle>Edit Intake</DialogTitle>
                    <DialogContent>
                        <TextField
                            autoFocus
                            margin="dense"
                            id="intake-name"
                            label="Intake Name"
                            type="text"
                            fullWidth
                            variant="outlined" // Consistent with other text fields
                            value={editingIntakeName}
                            onChange={(e) => setEditingIntakeName(e.target.value)}
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                        />
                         {error && <MuiAlert severity="error" sx={{ mt: 2 }}>{error}</MuiAlert>}
                         {success && <MuiAlert severity="success" sx={{ mt: 2 }}>{success}</MuiAlert>}
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseEditModal}>Cancel</Button>
                        <Button
                            onClick={handleUpdateIntake}
                            disabled={!editingIntakeName.trim()}
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