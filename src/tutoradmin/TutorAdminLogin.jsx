// src/tutoradmin/TutorAdminLogin.jsx

import React, { useState } from 'react';
import { db } from "../firebaseConfig";
import { collection, getDocs, query, where } from "firebase/firestore";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import {
  Box,
  Button,
  TextField,
  Alert,
  Typography,
  Paper,
  Link
} from "@mui/material";
import { useAuth } from '../AuthContext';

const TutorAdminLogin = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loginError, setLoginError] = useState('');
    const navigate = useNavigate();
    const { login } = useAuth();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoginError('');

        if (!email || !password) {
            setLoginError('Please enter both email and password.');
            return;
        }

        try {
            const adminsRef = collection(db, "admins");
            const q = query(adminsRef, where("email", "==", email));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                setLoginError("No user found with that email.");
                return;
            }

            const adminDoc = querySnapshot.docs[0];
            const adminData = adminDoc.data();

            if (adminData.password === password && adminData.isApproved) {
                if (adminData.isTutorAdmin) {
                    login({ email: adminData.email, role: 'tutorAdmin' });
                    navigate('/tutor-admin-dashboard'); 
                } else {
                    setLoginError("You are not authorized to access this panel.");
                }
            } else {
                setLoginError("Invalid credentials or user is not yet approved.");
            }
        } catch (error) {
            console.error("Login failed:", error);
            setLoginError("An error occurred during login. Please try again.");
        }
    };

    return (
        <Box sx={{ maxWidth: 500, margin: '50px auto' }}>
            <Paper elevation={3} sx={{ padding: 4, borderRadius: '16px', backgroundColor: '#e8f5e9' }}>
                <Typography variant="h5" align="center" fontWeight="bold" color="#37474f" sx={{ mb: 2 }}>
                    Tutor Admin Sign In
                </Typography>
                <Box component="form" onSubmit={handleLogin} noValidate>
                    {loginError && <Alert severity="error" sx={{ mb: 2 }}>{loginError}</Alert>}
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        id="email"
                        label="Email Address"
                        name="email"
                        autoComplete="email"
                        autoFocus
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                    />
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        name="password"
                        label="Password"
                        type="password"
                        id="password"
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                    />
                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        sx={{ mt: 3, py: 1.5, borderRadius: '12px', backgroundColor: '#42a5f5', '&:hover': { backgroundColor: '#1e88e5' } }}
                    >
                        Sign In
                    </Button>
                </Box>
            </Paper>
        </Box>
    );
};

export default TutorAdminLogin;