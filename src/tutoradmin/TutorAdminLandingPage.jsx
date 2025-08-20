// src/tutoradmin/TutorAdminLandingPage.jsx

import React from 'react';
import { Box, Button, Typography, Paper, Link } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

const TutorAdminLandingPage = () => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: '#e0f7fa', // Light blue pastel background
        padding: 4,
        textAlign: 'center',
      }}
    >
      <Paper
        elevation={6}
        sx={{
          padding: { xs: 3, md: 6 },
          borderRadius: '20px',
          backgroundColor: '#fff',
          maxWidth: '600px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
        }}
      >
        <Typography
          variant="h3"
          component="h1"
          fontWeight="bold"
          color="#424242"
          gutterBottom
          sx={{ mb: 2 }}
        >
          Tutor Admin Panel
        </Typography>
        <Typography
          variant="h6"
          color="#757575"
          sx={{ mb: 4 }}
        >
          Manage Tutors, Exams, and Student Progress.
        </Typography>

        <Link component={RouterLink} to="/tutor-admin-login" sx={{ textDecoration: 'none' }}>
          <Button
            variant="contained"
            size="large"
            sx={{
              backgroundColor: '#b39ddb', // Pastel purple
              color: '#fff',
              py: 1.5,
              px: 4,
              borderRadius: '12px',
              '&:hover': {
                backgroundColor: '#9575cd',
              },
            }}
          >
            Tutor Admin Login
          </Button>
        </Link>
        
        <Box sx={{ mt: 4 }}>
          <Typography variant="body1" color="#757575">
            Are you a Master Admin?
            <Link component={RouterLink} to="/admin-login" sx={{ ml: 1, color: '#42a5f5', fontWeight: 'bold' }}>
              Master Admin Login
            </Link>
          </Typography>
        </Box>

      </Paper>
    </Box>
  );
};

export default TutorAdminLandingPage;