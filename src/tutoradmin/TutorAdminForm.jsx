// src/tutoradmin/TutorAdminForm.jsx

import React, { useState } from "react";
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
import { Link as RouterLink } from "react-router-dom";

const TutorAdminForm = ({ onAddTutor, error, success }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onAddTutor({ name, email, password });
    setName("");
    setEmail("");
    setPassword("");
  };

  return (
    <Box sx={{ maxWidth: 500, margin: "50px auto" }}>
      <Paper
        elevation={3}
        sx={{
          padding: 4,
          borderRadius: "16px",
          backgroundColor: "#e8f5e9", // Pastel green
        }}
      >
        <Typography
          variant="h5"
          align="center"
          fontWeight="bold"
          color="#37474f"
          sx={{ mb: 2 }}
        >
          Add New Tutor
        </Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <TextField
            label="Tutor's Name"
            fullWidth
            value={name}
            onChange={(e) => setName(e.target.value)}
            margin="normal"
            variant="outlined"
            required
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px" } }}
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
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px" } }}
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
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px" } }}
          />
          <Button
            type="submit"
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            sx={{
              mt: 3,
              py: 1.5,
              borderRadius: "12px",
              backgroundColor: "#b39ddb", // Pastel purple
              "&:hover": { backgroundColor: "#8e6bd8" },
            }}
            fullWidth
          >
            Add Tutor
          </Button>
        </Box>
        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            <Link component={RouterLink} to="/admin-dashboard" sx={{ color: '#00695c' }}>Back to Dashboard</Link>
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default TutorAdminForm;