// src/tutoradmin/TutorAdminDashboard.jsx

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
} from "firebase/firestore";
import {
    Box,
    Typography,
    Button,
    Paper,
    Divider,
    IconButton,
} from "@mui/material";
import LogoutIcon from '@mui/icons-material/Logout';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import TutorAdminForm from "./TutorAdminForm";
import TutorAdminList from "./TutorAdminList";
import { useAuth } from '../AuthContext';
import { useNavigate } from "react-router-dom";

const TutorAdminDashboard = () => {
    const [tutors, setTutors] = useState([]);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const { logout, user } = useAuth();
    const navigate = useNavigate();

    const tutorsCollectionRef = collection(db, "tutors");

    const clearMessages = () => {
        setError("");
        setSuccess("");
    };

    const handleLogout = () => {
        logout();
        navigate("/tutor-admin-login");
    };

    const handleMasterPanelRedirect = () => {
        navigate("/admin-dashboard");
    };

    const validateEmail = (email) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    const getTutors = async () => {
        try {
            const q = query(
                tutorsCollectionRef,
                where("isDeleted", "!=", true),
                orderBy("createdAt", "desc")
            );
            const data = await getDocs(q);
            setTutors(data.docs.map((doc) => ({ ...doc.data(), id: doc.id })));
        } catch (err) {
            console.error("Error fetching tutors:", err);
            setError("Failed to fetch tutors.");
        }
    };

    useEffect(() => {
        getTutors();
    }, []);

    useEffect(() => {
        if (success) {
            const timer = setTimeout(() => {
                setSuccess("");
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [success]);

    const handleAddTutor = async ({ name, email, password }) => {
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
            const q = query(tutorsCollectionRef, where("email", "==", email));
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
                setError("A tutor with this email already exists.");
                return;
            }
            await addDoc(tutorsCollectionRef, {
                name,
                email,
                password,
                isApproved: false,
                isDeleted: false,
                createdAt: serverTimestamp(),
            });
            setSuccess("Tutor added successfully! They need to be approved.");
            getTutors();
        } catch (err) {
            console.error("Error adding tutor:", err);
            setError("Failed to add tutor. " + err.message);
        }
    };

    const handleUpdateTutor = async (id, updatedData) => {
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
                    tutorsCollectionRef,
                    where("email", "==", updatedData.email),
                    where("__name__", "!=", id)
                );
                const querySnapshot = await getDocs(q);
                if (!querySnapshot.empty) {
                    setError("Another tutor with this email already exists.");
                    return;
                }
            }
            const tutorDoc = doc(db, "tutors", id);
            await updateDoc(tutorDoc, updatedData);
            setSuccess("Tutor updated successfully!");
            getTutors();
        } catch (err) {
            console.error("Error updating tutor:", err);
            setError("Failed to update tutor. " + err.message);
        }
    };

    const handleDeleteTutor = async (id) => {
        if (window.confirm("Are you sure you want to delete this tutor?")) {
            clearMessages();
            try {
                const tutorDoc = doc(db, "tutors", id);
                await updateDoc(tutorDoc, {
                    isDeleted: true,
                    deletedAt: serverTimestamp(),
                });
                setSuccess("Tutor deleted successfully!");
                getTutors();
            } catch (err) {
                console.error("Error deleting tutor:", err);
                setError("Failed to delete tutor. " + err.message);
            }
        }
    };

    return (
        <Box
            sx={{
                background: 'linear-gradient(135deg, #FFD1DC, #B2EBF2)', // Pastel gradient
                minHeight: '100vh',
                padding: '32px 0',
                fontFamily: 'Roboto, sans-serif',
            }}
        >
            {/* Header with sticky behavior and buttons */}
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
                    backgroundColor: 'rgba(255, 255, 255, 0.9)', // Semi-transparent white
                    backdropFilter: 'blur(5px)', // Blurry background effect
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
                    Tutor Admin Panel
                </Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    {user?.role === 'masterAdmin' && (
                        <Button
                            variant="contained"
                            startIcon={<AdminPanelSettingsIcon />}
                            onClick={handleMasterPanelRedirect}
                            sx={{
                                backgroundColor: '#607d8b',
                                color: '#fff',
                                borderRadius: '12px',
                                fontWeight: 'bold',
                                '&:hover': {
                                    backgroundColor: '#455a64',
                                    transform: 'translateY(-2px)',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                                },
                            }}
                        >
                            Master Admin
                        </Button>
                    )}
                    <Button
                        variant="contained"
                        startIcon={<LogoutIcon />}
                        onClick={handleLogout}
                        sx={{
                            backgroundColor: '#e57373', // Lighter red
                            color: '#fff',
                            borderRadius: '12px',
                            fontWeight: 'bold',
                            '&:hover': {
                                backgroundColor: '#ef5350',
                                transform: 'translateY(-2px)',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                            },
                        }}
                    >
                        Logout
                    </Button>
                </Box>
            </Box>

            {/* Main Content Container */}
            <Box
                sx={{
                    maxWidth: 1200, // Wider container
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
                    Tutor Dashboard
                </Typography>
                <Divider sx={{ mb: 4 }} /> {/* Separator */}
                
                {/* Tutor Admin Form Section */}
                <Box sx={{ mb: 4 }}>
                    <TutorAdminForm
                        onAddTutor={handleAddTutor}
                        error={error}
                        success={success}
                    />
                </Box>
                
                {/* Tutor Admin List Section */}
                <Box>
                    <TutorAdminList
                        tutors={tutors}
                        onUpdateTutor={handleUpdateTutor}
                        onDeleteTutor={handleDeleteTutor}
                        error={error}
                        success={success}
                    />
                </Box>
            </Box>
        </Box>
    );
};

export default TutorAdminDashboard;