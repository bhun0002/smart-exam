// src/admin/AdminForm.jsx

import React, { useState } from "react";
import { db } from "../firebaseConfig";
import {
    collection,
    addDoc,
    getDocs,
    query,
    where,
    serverTimestamp,
} from "firebase/firestore";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import {
    Box,
    Button,
    TextField,
    Typography,
    Paper,
    Alert,
    Link,
} from "@mui/material";
import { Add as AddIcon, PersonAdd as PersonAddIcon } from "@mui/icons-material";

const AdminForm = ({ onAddAdmin, isDashboardForm, error, success }) => {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const navigate = useNavigate();
    const adminsCollectionRef = collection(db, "admins");

    const validateEmail = (email) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Clear existing messages from parent component if available
        if (onAddAdmin) {
            onAddAdmin({ name, email, password });
        } else {
            // Handle standalone form logic
            if (!name.trim() || !email.trim() || !password.trim()) {
                alert("Please fill in all fields.");
                return;
            }
            if (!validateEmail(email)) {
                alert("Please enter a valid email address.");
                return;
            }
            if (password.length < 6) {
                alert("Password must be at least 6 characters long.");
                return;
            }

            try {
                const q = query(adminsCollectionRef, where("email", "==", email));
                const querySnapshot = await getDocs(q);
                if (!querySnapshot.empty) {
                    alert("An admin with this email already exists.");
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

                alert("Admin registered successfully! Redirecting to login...");
                setTimeout(() => {
                    navigate('/admin-login');
                }, 2000);

            } catch (err) {
                console.error("Error adding admin:", err);
                alert("Failed to register admin. " + err.message);
            }
        }

        // Clear the form fields after successful submission
        setName("");
        setEmail("");
        setPassword("");
    };

    return (
        <Box
            sx={{
                maxWidth: 550,
                margin: isDashboardForm ? '0 auto' : '50px auto',
                px: { xs: 2, md: 0 }
            }}
        >
            <Paper
                elevation={6}
                sx={{
                    padding: { xs: 3, md: 5 },
                    borderRadius: '20px',
                    backgroundColor: '#fff',
                    transition: 'all 0.3s ease-in-out',
                    '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: '0 10px 20px rgba(0,0,0,0.1)',
                    }
                }}
            >
                <Typography
                    variant="h5"
                    align="center"
                    fontWeight="bold"
                    color="#37474f"
                    sx={{ mb: 2 }}
                >
                    {isDashboardForm ? "Register a New Admin" : "Admin Registration"}
                </Typography>
                {isDashboardForm ? (
                    <>
                        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
                    </>
                ) : (
                    <></>
                )}

                <Box component="form" onSubmit={handleSubmit} noValidate>
                    <TextField
                        label="Name"
                        fullWidth
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        margin="normal"
                        variant="outlined"
                        required
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                borderRadius: '12px',
                                transition: 'border-color 0.3s',
                                '&:hover fieldset': {
                                    borderColor: '#607d8b',
                                },
                                '&.Mui-focused fieldset': {
                                    borderColor: '#607d8b',
                                },
                            },
                        }}
                    />
                    <TextField
                        label="Email"
                        fullWidth
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        margin="normal"
                        variant="outlined"
                        required
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                borderRadius: '12px',
                                transition: 'border-color 0.3s',
                                '&:hover fieldset': {
                                    borderColor: '#607d8b',
                                },
                                '&.Mui-focused fieldset': {
                                    borderColor: '#607d8b',
                                },
                            },
                        }}
                    />
                    <TextField
                        label="Password"
                        fullWidth
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        margin="normal"
                        variant="outlined"
                        required
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                borderRadius: '12px',
                                transition: 'border-color 0.3s',
                                '&:hover fieldset': {
                                    borderColor: '#607d8b',
                                },
                                '&.Mui-focused fieldset': {
                                    borderColor: '#607d8b',
                                },
                            },
                        }}
                    />
                    <Button
                        type="submit"
                        variant="contained"
                        startIcon={isDashboardForm ? <PersonAddIcon /> : <AddIcon />}
                        sx={{
                            mt: 3,
                            py: 1.5,
                            borderRadius: '12px',
                            backgroundColor: '#607d8b',
                            color: '#fff',
                            fontWeight: 'bold',
                            '&:hover': {
                                backgroundColor: '#455a64',
                                transform: 'translateY(-2px)',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                            },
                            transition: 'all 0.3s ease-in-out',
                        }}
                        fullWidth
                    >
                        {isDashboardForm ? "Add New Admin" : "Register"}
                    </Button>
                </Box>

                {!isDashboardForm && (
                    <Box sx={{ mt: 2, textAlign: 'center' }}>
                        <Typography variant="body2" color="text.secondary">
                            Already have an account? <Link component={RouterLink} to="/admin-login" sx={{ color: '#455a64', fontWeight: 'bold' }}>Sign In</Link>
                        </Typography>
                    </Box>
                )}
            </Paper>
        </Box>
    );
};

export default AdminForm;