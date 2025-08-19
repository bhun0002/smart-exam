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

const AdminLogin = () => {
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
                setLoginError("No admin found with that email.");
                return;
            }

            const adminDoc = querySnapshot.docs[0];
            const adminData = adminDoc.data();

            if (adminData.password === password && adminData.isApproved) {
                // Check if the user is a master admin
                if (adminData.isMasterAdmin) {
                    login({ email: adminData.email, role: 'masterAdmin' });
                    // Redirect to the Admin Dashboard for master admin
                    navigate('/admin-dashboard'); 
                } else {
                    // Regular approved admin
                    setLoginError("You are logged in, but you don't have permissions to access this panel.");
                    // You could redirect them to a different page here if needed
                }
            } else {
                setLoginError("Invalid credentials or admin is not yet approved.");
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
                    Admin Sign In
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
                <Box sx={{ mt: 2, textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                        Don't have an account? <Link component={RouterLink} to="/admin-register" sx={{ color: '#00695c' }}>Register here</Link>
                    </Typography>
                </Box>
            </Paper>
        </Box>
    );
};

export default AdminLogin;