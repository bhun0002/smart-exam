// src/tutor/TutorLogin.jsx
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

const TutorLogin = () => {
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
            const tutorsRef = collection(db, "tutors"); // Firestore collection for tutors
            const q = query(tutorsRef, where("email", "==", email));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                setLoginError("No tutor found with that email.");
                return;
            }

            const tutorDoc = querySnapshot.docs[0];
            const tutorData = tutorDoc.data();

            if (tutorData.password === password && tutorData.isApproved) {
                login({ email: tutorData.email, role: 'tutor' });
                navigate('/tutor-dashboard');
            } else {
                setLoginError("Invalid credentials or your account is not approved yet.");
            }
        } catch (error) {
            console.error("Login failed:", error);
            setLoginError("An error occurred during login. Please try again.");
        }
    };

    return (
        <Box
            sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '100vh',
                background: 'linear-gradient(135deg, #FFD1DC, #B2EBF2)',
                padding: 2,
            }}
        >
            <Paper
                elevation={12}
                sx={{
                    padding: { xs: 3, md: 5 },
                    borderRadius: '24px',
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    maxWidth: '450px',
                    width: '100%',
                    boxShadow: '0 15px 35px rgba(0,0,0,0.2)',
                    transition: 'all 0.4s ease-in-out',
                    '&:hover': {
                        transform: 'translateY(-8px)',
                        boxShadow: '0 25px 50px rgba(0,0,0,0.3)',
                    },
                }}
            >
                <Typography
                    variant="h4"
                    align="center"
                    fontWeight="bold"
                    color="#1a237e"
                    sx={{ mb: 3 }}
                >
                    Tutor Sign In
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
                        variant="outlined"
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                borderRadius: '12px',
                                transition: 'border-color 0.3s',
                                '&.Mui-focused fieldset': {
                                    borderColor: '#673ab7',
                                },
                            },
                        }}
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
                        variant="outlined"
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                borderRadius: '12px',
                                transition: 'border-color 0.3s',
                                '&.Mui-focused fieldset': {
                                    borderColor: '#673ab7',
                                },
                            },
                        }}
                    />
                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        sx={{
                            mt: 3,
                            py: 1.5,
                            borderRadius: '12px',
                            backgroundColor: '#673ab7',
                            color: '#fff',
                            fontWeight: 'bold',
                            '&:hover': {
                                backgroundColor: '#5e35b1',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                                transform: 'translateY(-2px)',
                            },
                            transition: 'all 0.3s ease-in-out',
                        }}
                    >
                        Sign In
                    </Button>
                </Box>
                <Box sx={{ mt: 1, textAlign: 'center' }}>
                    <Link component={RouterLink} to="/tutor-register" sx={{ color: '#455a64', fontWeight: 'bold' }}>
                        Don't have an account? Register here
                    </Link>
                </Box>
                <Box sx={{ mt: 1, textAlign: 'center' }}>
                    <Link component={RouterLink} to="/admin-login" sx={{ color: '#455a64', fontWeight: 'bold' }}>
                        Are you a Master Admin? Login here
                    </Link>
                </Box>
            </Paper>
        </Box>
    );
};

export default TutorLogin;
