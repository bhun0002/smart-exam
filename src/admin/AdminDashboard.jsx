// src/admin/AdminDashboard.jsx

import React, { useState, useEffect } from "react";
import { db } from "../firebaseConfig";
import {
    collection,
    addDoc,
    getDocs,
    updateDoc,
    doc,
    serverTimestamp,
    query,
    orderBy,
    where,
    deleteDoc
} from "firebase/firestore";
import {
    Box,
    Typography,
    Button,
    Paper,
    Divider,
    TextField,
    Dialog, DialogActions, DialogContent, DialogTitle
} from "@mui/material";
import TutorIcon from '@mui/icons-material/School';
import LogoutIcon from '@mui/icons-material/Logout';
import SettingsIcon from '@mui/icons-material/Settings';
import ListIcon from '@mui/icons-material/List';
import AdminForm from "./AdminForm";
import AdminList from "./AdminList";
import { useAuth } from "../AuthContext";
import { useNavigate } from "react-router-dom";

const AdminDashboard = () => {
    const [admins, setAdmins] = useState([]);
    const [intakes, setIntakes] = useState([]);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [currentView, setCurrentView] = useState('admin_management');

    // --- FIX: Added missing useState declarations for intake management ---
    const [currentIntakeName, setCurrentIntakeName] = useState(''); // For adding new intake
    const [openIntakeModal, setOpenIntakeModal] = useState(false); // Controls the edit modal visibility
    const [editingIntakeId, setEditingIntakeId] = useState(null); // ID of intake being edited
    const [editingIntakeName, setEditingIntakeName] = useState(''); // Name of intake being edited
    // --- End of FIX ---

    const { logout, user } = useAuth();
    const navigate = useNavigate();

    const adminsCollectionRef = collection(db, "admins");
    const intakesCollectionRef = collection(db, "intakes");

    const clearMessages = () => {
        setError("");
        setSuccess("");
    };

    const handleLogout = () => {
        logout();
        navigate("/admin-login");
    };

    const handleTutorPanelRedirect = () => {
        navigate("/tutor-admin-dashboard");
    };

    const validateEmail = (email) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    // --- Admin Management Functions (Existing) ---
    const getAdmins = async () => {
        try {
            const q = query(
                adminsCollectionRef,
                where("isDeleted", "!=", true),
                orderBy("createdAt", "desc")
            );
            const data = await getDocs(q);
            setAdmins(data.docs.map((doc) => ({ ...doc.data(), id: doc.id })));
        } catch (err) {
            console.error("Error fetching admins:", err);
            setError("Failed to fetch admins.");
        }
    };

    const handleAddAdmin = async ({ name, email, password }) => {
        clearMessages();
        if (!name.trim() || !email.trim() || !password.trim()) {
            setError("Please fill in all fields.");
            return;
        }
        if (!validateEmail(email)) {
            setError("Please enter a valid email address.");
            return;
        }
        if (password.length < 6) {
            setError("Password must be at least 6 characters long.");
            return;
        }

        try {
            const q = query(adminsCollectionRef, where("email", "==", email));
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
                setError("An admin with this email already exists.");
                return;
            }
            await addDoc(adminsCollectionRef, {
                name,
                email,
                password,
                isApproved: false,
                isDeleted: false,
                isMasterAdmin: false,
                isTutorAdmin: false,
                createdAt: serverTimestamp(),
            });
            setSuccess("Admin registered successfully! They need to be approved.");
            getAdmins();
        } catch (err) {
            console.error("Error adding admin:", err);
            setError("Failed to register admin. " + err.message);
        }
    };

    const handleUpdateAdmin = async (id, updatedData) => {
        clearMessages();
        if (updatedData.name && !updatedData.name.trim()) {
            setError("Name cannot be empty.");
            return;
        }
        if (
            updatedData.email &&
            (!updatedData.email.trim() || !validateEmail(updatedData.email))
        ) {
            setError("Please enter a valid email address.");
            return;
        }
        try {
            if (updatedData.email) {
                const q = query(
                    adminsCollectionRef,
                    where("email", "==", updatedData.email),
                    where("__name__", "!=", id)
                );
                const querySnapshot = await getDocs(q);
                if (!querySnapshot.empty) {
                    setError("Another admin with this email already exists.");
                    return;
                }
            }
            const adminDoc = doc(db, "admins", id);
            await updateDoc(adminDoc, updatedData);
            setSuccess("Admin updated successfully!");
            getAdmins();
        } catch (err) {
            console.error("Error updating admin:", err);
            setError("Failed to update admin. " + err.message);
        }
    };

    const handleDeleteAdmin = async (id) => {
        if (window.confirm("Are you sure you want to delete this admin?")) {
            clearMessages();
            try {
                const adminDoc = doc(db, "admins", id);
                await updateDoc(adminDoc, {
                    isDeleted: true,
                    deletedAt: serverTimestamp(),
                });
                setSuccess("Admin deleted successfully!");
                getAdmins();
            } catch (err) {
                console.error("Error deleting admin:", err);
                setError("Failed to delete admin. " + err.message);
            }
        }
    };

    // --- Intake Management Functions (New) ---
    const getIntakes = async () => {
        try {
            const q = query(intakesCollectionRef, orderBy("name", "asc"));
            const data = await getDocs(q);
            setIntakes(data.docs.map((doc) => ({ ...doc.data(), id: doc.id })));
        } catch (err) {
            console.error("Error fetching intakes:", err);
            setError("Failed to fetch intakes.");
        }
    };

    const handleAddIntake = async (intakeName) => {
        clearMessages();
        if (!intakeName.trim()) {
            setError("Intake name cannot be empty.");
            return;
        }
        const exists = intakes.some(intake => intake.name.toLowerCase() === intakeName.toLowerCase());
        if (exists) {
            setError("An intake with this name already exists.");
            return;
        }
        try {
            await addDoc(intakesCollectionRef, {
                name: intakeName,
                createdAt: serverTimestamp(),
            });
            setSuccess(`Intake "${intakeName}" added successfully!`);
            setCurrentIntakeName(''); // Clear input field after adding
            getIntakes();
        } catch (err) {
            console.error("Error adding intake:", err);
            setError("Failed to add intake. " + err.message);
        }
    };

    const handleUpdateIntake = async (id, newIntakeName) => {
        clearMessages();
        if (!newIntakeName.trim()) {
            setError("Intake name cannot be empty.");
            return;
        }
        const exists = intakes.some(intake => intake.name.toLowerCase() === newIntakeName.toLowerCase() && intake.id !== id);
        if (exists) {
            setError("An intake with this name already exists.");
            return;
        }
        try {
            const intakeDoc = doc(db, "intakes", id);
            await updateDoc(intakeDoc, { name: newIntakeName });
            setSuccess(`Intake updated to "${newIntakeName}" successfully!`);
            setOpenIntakeModal(false); // Close modal on success
            getIntakes();
        } catch (err) {
            console.error("Error updating intake:", err);
            setError("Failed to update intake. " + err.message);
        }
    };

    const handleDeleteIntake = async (id) => {
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

    // --- Fetch data on view change or initial load ---
    useEffect(() => {
        if (currentView === 'admin_management') {
            getAdmins();
        } else if (currentView === 'intake_management') {
            getIntakes();
        }
    }, [currentView]);

    useEffect(() => {
        if (success || error) {
            const timer = setTimeout(() => {
                clearMessages();
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [success, error]);

    return (
        <Box
            sx={{
                background: 'linear-gradient(135deg, #FFDDC1, #C1FFD7)',
                minHeight: '100vh',
                padding: '32px 0',
                fontFamily: 'Roboto, sans-serif',
            }}
        >
            <Box
                sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: 2,
                    gap: 2,
                    position: 'sticky',
                    top: 0,
                    zIndex: 100,
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    backdropFilter: 'blur(5px)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                }}
            >
                <Typography
                    variant="h5"
                    component="h1"
                    fontWeight="bold"
                    color="#455a64"
                    sx={{ flexGrow: 1, ml: 2 }}
                >
                    Master Admin Panel
                </Typography>
                
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                        variant={currentView === 'admin_management' ? "contained" : "outlined"}
                        onClick={() => setCurrentView('admin_management')}
                        startIcon={<ListIcon />}
                        sx={{
                            borderRadius: '12px',
                            fontWeight: 'bold',
                            backgroundColor: currentView === 'admin_management' ? '#80DEEA' : 'transparent',
                            color: currentView === 'admin_management' ? '#006064' : '#546e7a',
                            borderColor: '#80DEEA',
                            '&:hover': {
                                backgroundColor: currentView === 'admin_management' ? '#4DD0E1' : '#E0F7FA',
                                transform: 'translateY(-2px)',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                            },
                        }}
                    >
                        Admin Management
                    </Button>
                    <Button
                        variant={currentView === 'intake_management' ? "contained" : "outlined"}
                        onClick={() => setCurrentView('intake_management')}
                        startIcon={<SettingsIcon />}
                        sx={{
                            borderRadius: '12px',
                            fontWeight: 'bold',
                            backgroundColor: currentView === 'intake_management' ? '#A5D6A7' : 'transparent',
                            color: currentView === 'intake_management' ? '#1B5E20' : '#546e7a',
                            borderColor: '#A5D6A7',
                            '&:hover': {
                                backgroundColor: currentView === 'intake_management' ? '#81C784' : '#E8F5E9',
                                transform: 'translateY(-2px)',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                            },
                        }}
                    >
                        Intake Management
                    </Button>
                </Box>

                <Box sx={{ display: 'flex', gap: 2 }}>
                    {user?.role === 'masterAdmin' && (
                        <Button
                            variant="contained"
                            startIcon={<TutorIcon />}
                            onClick={handleTutorPanelRedirect}
                            sx={{
                                backgroundColor: '#90CAF9',
                                color: '#1A237E',
                                borderRadius: '12px',
                                fontWeight: 'bold',
                                '&:hover': {
                                    backgroundColor: '#64B5F6',
                                    transform: 'translateY(-2px)',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                                },
                            }}
                        >
                            Go to Tutor Panel
                        </Button>
                    )}
                    <Button
                        variant="contained"
                        startIcon={<LogoutIcon />}
                        onClick={handleLogout}
                        sx={{
                            backgroundColor: '#FF8A80',
                            color: '#fff',
                            borderRadius: '12px',
                            fontWeight: 'bold',
                            '&:hover': {
                                backgroundColor: '#FF5252',
                                transform: 'translateY(-2px)',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                            },
                        }}
                    >
                        Logout
                    </Button>
                </Box>
            </Box>

            <Box
                sx={{
                    maxWidth: 1200,
                    margin: "20px auto",
                    padding: { xs: 2, md: 4 },
                    backgroundColor: "#ffffff",
                    borderRadius: "20px",
                    boxShadow: "0px 15px 40px rgba(0,0,0,0.1)",
                }}
            >
                <Typography
                    variant="h3"
                    component="h2"
                    gutterBottom
                    textAlign="center"
                    fontWeight="bold"
                    color="#37474f"
                    sx={{ mb: 4 }}
                >
                    {currentView === 'admin_management' ? "Admin Management" : "Intake Management"}
                </Typography>
                <Divider sx={{ mb: 4 }} />
                
                {currentView === 'admin_management' && (
                    <>
                        <Box sx={{ mb: 4 }}>
                            <AdminForm
                                onAddAdmin={handleAddAdmin}
                                error={error}
                                success={success}
                                isDashboardForm={true}
                            />
                        </Box>
                        <Box>
                            <AdminList
                                admins={admins}
                                onUpdateAdmin={handleUpdateAdmin}
                                onDeleteAdmin={handleDeleteAdmin}
                                error={error}
                                success={success}
                            />
                        </Box>
                    </>
                )}

                {currentView === 'intake_management' && (
                    <>
                        <Box sx={{ mb: 4 }}>
                            <Typography variant="h5" gutterBottom color="#546e7a">
                                Add New Intake
                            </Typography>
                            {error && <Typography color="error" sx={{mb: 2}}>{error}</Typography>}
                            {success && <Typography color="success.main" sx={{mb: 2}}>{success}</Typography>}
                            <TextField 
                                label="New Intake Name (e.g., April 2025)"
                                variant="outlined" 
                                fullWidth 
                                sx={{ mb: 2 }}
                                value={currentIntakeName}
                                onChange={(e) => setCurrentIntakeName(e.target.value)}
                            />
                            <Button 
                                variant="contained" 
                                onClick={() => handleAddIntake(currentIntakeName)} 
                                disabled={!currentIntakeName.trim()}
                                sx={{ 
                                    backgroundColor: '#A5D6A7', 
                                    '&:hover': { backgroundColor: '#81C784' },
                                    color: '#1B5E20'
                                }}
                            >
                                Add Intake
                            </Button>
                        </Box>
                        <Box>
                            <Typography variant="h5" gutterBottom color="#546e7a">
                                Existing Intakes
                            </Typography>
                            {intakes.length === 0 ? (
                                <Typography>No intakes added yet.</Typography>
                            ) : (
                                intakes.map((intake) => (
                                    <Paper key={intake.id} sx={{ p: 2, mb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Typography>{intake.name}</Typography>
                                        <Box>
                                            <Button 
                                                size="small" 
                                                sx={{ mr: 1 }} 
                                                onClick={() => {
                                                    setEditingIntakeId(intake.id);
                                                    setEditingIntakeName(intake.name);
                                                    setOpenIntakeModal(true);
                                                }}
                                            >
                                                Edit
                                            </Button>
                                            <Button size="small" color="error" onClick={() => handleDeleteIntake(intake.id)}>
                                                Delete
                                            </Button>
                                        </Box>
                                    </Paper>
                                ))
                            )}
                        </Box>

                        <Dialog open={openIntakeModal} onClose={() => {
                            setOpenIntakeModal(false);
                            clearMessages(); // Clear messages when modal is closed via backdrop/escape
                        }}>
                            <DialogTitle>Edit Intake</DialogTitle>
                            <DialogContent>
                                <TextField
                                    autoFocus
                                    margin="dense"
                                    id="intake-name"
                                    label="Intake Name"
                                    type="text"
                                    fullWidth
                                    variant="standard"
                                    value={editingIntakeName}
                                    onChange={(e) => setEditingIntakeName(e.target.value)}
                                    // Added error and helperText for inline validation feedback in modal
                                    error={!!error && error.includes("intake with this name already exists")}
                                    helperText={!!error && error.includes("intake with this name already exists") ? error : ""}
                                />
                                {/* Display general error messages if not specific to the TextField */}
                                {error && !error.includes("intake with this name already exists") && <Typography color="error" sx={{ mt: 1 }}>{error}</Typography>}
                                {success && <Typography color="success.main" sx={{ mt: 1 }}>{success}</Typography>}

                            </DialogContent>
                            <DialogActions>
                                <Button onClick={() => {
                                    setOpenIntakeModal(false);
                                    clearMessages(); // Clear messages when cancel button is clicked
                                }}>Cancel</Button>
                                <Button onClick={async () => {
                                    await handleUpdateIntake(editingIntakeId, editingIntakeName);
                                    // handleUpdateIntake now handles closing the modal and clearing messages on success
                                    // No need for conditional close here, as handleUpdateIntake does it.
                                }}>Save</Button>
                            </DialogActions>
                        </Dialog>
                    </>
                )}
            </Box>
        </Box>
    );
};

export default AdminDashboard;