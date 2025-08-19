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
import { Add as AddIcon } from "@mui/icons-material";

const AdminForm = ({ onAddAdmin, isDashboardForm }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  const navigate = useNavigate();
  const adminsCollectionRef = collection(db, "admins");

  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

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
      
      // If used in the dashboard, call the parent's function and clear form
      if (isDashboardForm) {
        onAddAdmin({ name, email, password });
        
      } else {
        // If standalone, save directly to Firestore and redirect
        await addDoc(adminsCollectionRef, {
          name,
          email,
          password,
          isApproved: false,
          createdAt: serverTimestamp(),
        });
        
        setSuccess("Admin registered successfully! Redirecting to login...");
        
        setTimeout(() => {
          navigate('/admin-login'); 
        }, 2000);
      }
      
      // Clear the form fields after successful submission
      setName("");
      setEmail("");
      setPassword("");
      
    } catch (err) {
      console.error("Error adding admin:", err);
      setError("Failed to register admin. " + err.message);
    }
  };

  return (
    <Box sx={{ maxWidth: 500, margin: '50px auto' }}>
      <Paper elevation={3} sx={{ padding: 4, borderRadius: '16px', backgroundColor: '#e3f2fd' }}>
        <Typography variant="h5" align="center" fontWeight="bold" color="#37474f" sx={{ mb: 2 }}>
          Admin Registration
        </Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <TextField
            label="Name"
            fullWidth
            value={name}
            onChange={(e) => setName(e.target.value)}
            margin="normal"
            variant="outlined"
            required
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
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
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
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
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
          />
          <Button
            type="submit"
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            sx={{ mt: 3, py: 1.5, borderRadius: '12px', backgroundColor: '#4caf50', '&:hover': { backgroundColor: '#388e3c' } }}
            fullWidth
          >
            Register
          </Button>
        </Box>
        {!isDashboardForm && (
            <Box sx={{ mt: 2, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                    Already have an account? <Link component={RouterLink} to="/" sx={{ color: '#00695c' }}>Sign In</Link>
                </Typography>
            </Box>
        )}
      </Paper>
    </Box>
  );
};

export default AdminForm;