// src/components/NoPageFound.jsx

import React from "react";
import { Box, Typography, Button, Card, CardContent } from "@mui/material";
import { Link } from "react-router-dom";
import SentimentVeryDissatisfiedIcon from '@mui/icons-material/SentimentVeryDissatisfied';

const NoPageFound = () => {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        textAlign: "center",
        backgroundColor: "#f9f9fb", // Light, professional background
        p: 2,
      }}
    >
      <Card
        variant="outlined"
        sx={{
          maxWidth: 500,
          p: { xs: 2, md: 4 },
          borderRadius: '16px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
          backgroundColor: '#fff',
        }}
      >
        <CardContent>
          <SentimentVeryDissatisfiedIcon sx={{ fontSize: '6rem', color: 'rgba(0, 0, 0, 0.54)', mb: 2 }} />
          <Typography
            variant="h1"
            color="text.secondary"
            sx={{
              fontSize: { xs: '4rem', sm: '6rem' },
              fontWeight: "bold",
              textShadow: '2px 2px 4px rgba(0,0,0,0.1)',
            }}
          >
            404
          </Typography>
          <Typography
            variant="h4"
            color="text.primary"
            sx={{ mb: 1, fontWeight: 'bold' }}
          >
            Page Not Found
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            We're sorry, the page you are looking for does not exist or has been moved.
          </Typography>
          <Button
            variant="contained"
            color="primary"
            component={Link}
            to="/"
            sx={{
              borderRadius: '24px',
              px: 4,
              py: 1.5,
              fontWeight: 'bold',
              textTransform: 'none',
              backgroundColor: '#607d8b',
              '&:hover': {
                backgroundColor: '#455a64',
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              },
              transition: 'all 0.3s ease-in-out',
            }}
          >
            Go to Home
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
};

export default NoPageFound;