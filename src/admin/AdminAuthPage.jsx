import React, { useState } from 'react';
import AdminDashboard from './AdminDashboard';
import AdminLogin from './AdminLogin'; // You'll create this in a moment
import { Box, Typography } from '@mui/material';

// For this example, we'll use a simple state to simulate authentication.
// In a real app, you would use a global state manager (like Redux or Context API)
// or Firebase Authentication to manage the user's login status.

const AdminAuthPage = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    // This is a placeholder function for logging in.
    const handleLogin = (isSuccess) => {
        setIsAuthenticated(isSuccess);
    };

    if (isAuthenticated) {
        return <AdminDashboard />;
    } else {
        return (
            <Box sx={{ maxWidth: 500, margin: '50px auto', p: 4 }}>
                <Typography variant="h5" align="center" gutterBottom>
                    Admin Login
                </Typography>
                <AdminLogin onLogin={handleLogin} />
            </Box>
        );
    }
};

export default AdminAuthPage;