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
        background: 'linear-gradient(135deg, #B3E5FC, #FFF9C4)', // Updated pastel gradient
        padding: 4,
        textAlign: 'center',
      }}
    >
      <Paper
        elevation={12} // Increased elevation for more prominent shadow
        sx={{
          padding: { xs: 3, md: 6 },
          borderRadius: '24px', // Consistent border radius with AdminLogin
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          maxWidth: '600px',
          boxShadow: '0 15px 35px rgba(0,0,0,0.1)', // Initial box shadow
          transition: 'all 0.4s ease-in-out', // Smooth transition
          '&:hover': {
            transform: 'translateY(-8px)', // Lift effect on hover
            boxShadow: '0 25px 50px rgba(0,0,0,0.2)', // Larger shadow on hover
          },
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
              backgroundColor: '#607d8b', // Consistent button color
              color: '#fff',
              py: 1.5,
              px: 4,
              borderRadius: '12px',
              fontWeight: 'bold', // Consistent font weight
              transition: 'all 0.3s ease-in-out', // Smooth transition
              '&:hover': {
                backgroundColor: '#455a64',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                transform: 'translateY(-2px)', // Lift effect on hover
              },
            }}
          >
            Tutor Admin Login
          </Button>
        </Link>

        <Box sx={{ mt: 4 }}>
          <Typography variant="body1" color="#757575">
            Are you a Master Admin?
            <Link component={RouterLink} to="/admin-login" sx={{ ml: 1, color: '#455a64', fontWeight: 'bold' }}> {/* Consistent link color and weight */}
              Master Admin Login
            </Link>
          </Typography>
        </Box>

      </Paper>
    </Box>
  );
};

export default TutorAdminLandingPage;