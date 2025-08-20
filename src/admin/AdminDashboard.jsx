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
} from "firebase/firestore";
import {
    Box,
    Typography,
    Button,
    Paper,
    Divider,
} from "@mui/material";
import TutorIcon from '@mui/icons-material/School';
import LogoutIcon from '@mui/icons-material/Logout';
import AdminForm from "./AdminForm";
import AdminList from "./AdminList";
import { useAuth } from "../AuthContext";
import { useNavigate } from "react-router-dom";

const AdminDashboard = () => {
    const [admins, setAdmins] = useState([]);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const { logout, user } = useAuth();
    const navigate = useNavigate();

    const adminsCollectionRef = collection(db, "admins");

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

    useEffect(() => {
        getAdmins();
    }, []);

    useEffect(() => {
        if (success) {
            const timer = setTimeout(() => {
                setSuccess("");
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [success]);

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

    return (
        <Box
            sx={{
                background: 'linear-gradient(135deg, #FFDDC1, #C1FFD7)', // Soft pastel gradient
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
                <Box sx={{ display: 'flex', gap: 2 }}>
                    {user?.role === 'masterAdmin' && (
                        <Button
                            variant="contained"
                            startIcon={<TutorIcon />}
                            onClick={handleTutorPanelRedirect}
                            sx={{
                                backgroundColor: '#90CAF9', // Pastel blue
                                color: '#1A237E', // Dark blue text
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
                            backgroundColor: '#FF8A80', // Pastel red
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

            {/* Main Content Container */}
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
                    Master Admin Dashboard
                </Typography>
                <Divider sx={{ mb: 4 }} />
                
                {/* Admin Form Section */}
                <Box sx={{ mb: 4 }}>
                    <AdminForm
                        onAddAdmin={handleAddAdmin}
                        error={error}
                        success={success}
                        isDashboardForm={true}
                    />
                </Box>
                
                {/* Admin List Section */}
                <Box>
                    <AdminList
                        admins={admins}
                        onUpdateAdmin={handleUpdateAdmin}
                        onDeleteAdmin={handleDeleteAdmin}
                        error={error}
                        success={success}
                    />
                </Box>
            </Box>
        </Box>
    );
};

export default AdminDashboard;