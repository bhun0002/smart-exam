// src/tutoradmin/TutorAdminDashboard.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import {
    Box,
    Typography,
    Card,
    CardContent,
    Button,
    Grid,
    AppBar,
    Toolbar,
    IconButton,
} from "@mui/material";
import LogoutIcon from '@mui/icons-material/Logout';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import GroupIcon from '@mui/icons-material/Group'; // Icon for managing tutors
import { useAuth } from '../AuthContext';

const TutorAdminDashboard = () => {
    const navigate = useNavigate();
    const { logout, user } = useAuth(); // Assuming 'user' contains role information

    // Card styles for consistency
    const cardStyle = {
        backgroundColor: "#E1F5FE", // A soft blue, similar to your exam list card
        hover: "#B3E5FC",
        iconColor: "#3498DB",
    };

    const handleLogout = () => {
        logout();
        navigate("/tutor-admin-login"); // Navigate to admin login page after logout
    };

    const handleMasterPanelRedirect = () => {
        navigate("/admin-dashboard"); // Redirect to the Master Admin dashboard
    };

    return (
        <Box
            sx={{
                background: 'linear-gradient(135deg, #FFD1DC, #B2EBF2)', // Pastel gradient
                minHeight: "100vh",
                display: "flex",
                flexDirection: "column",
            }}
        >
            {/* Top AppBar */}
            <AppBar
                position="static"
                elevation={0}
                sx={{
                    bgcolor: 'rgba(255, 255, 255, 0.8)',
                    backdropFilter: 'blur(10px)',
                    borderBottom: '1px solid #e0e0e0',
                }}
            >
                <Toolbar>
                    <Typography
                        variant="h6"
                        component="div"
                        sx={{ flexGrow: 1, color: '#37474f', fontWeight: 'bold' }}
                    >
                        Tutor Admin Panel
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        {user?.role === 'masterAdmin' && ( // Only show if user is master admin
                            <Button
                                variant="contained"
                                startIcon={<AdminPanelSettingsIcon />}
                                onClick={handleMasterPanelRedirect}
                                sx={{
                                    backgroundColor: '#607d8b', color: '#fff', borderRadius: '12px', fontWeight: 'bold',
                                    '&:hover': { backgroundColor: '#455a64', transform: 'translateY(-2px)', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' },
                                    transition: 'all 0.3s ease-in-out',
                                }}
                            >
                                Master Admin
                            </Button>
                        )}
                        <Button
                            variant="contained"
                            startIcon={<LogoutIcon />}
                            onClick={handleLogout}
                            sx={{
                                backgroundColor: '#e57373', color: '#fff', borderRadius: '12px', fontWeight: 'bold',
                                '&:hover': { backgroundColor: '#ef5350', transform: 'translateY(-2px)', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' },
                                transition: 'all 0.3s ease-in-out',
                            }}
                        >
                            Logout
                        </Button>
                    </Box>
                </Toolbar>
            </AppBar>

            {/* Main Content Box */}
            <Box sx={{ flexGrow: 1, p: { xs: 2, md: 4 } }}>
                <Typography
                    variant="h3"
                    align="center"
                    gutterBottom
                    fontWeight="bold"
                    sx={{ mb: 2, mt: 4, color: "#37474f" }}
                >
                    Tutor Administration
                </Typography>
                <Typography
                    variant="h6"
                    align="center"
                    color="text.secondary"
                    sx={{ mb: 6 }}
                >
                    Overview and management of tutor accounts.
                </Typography>

                <Grid container spacing={4} justifyContent="center" alignItems="stretch">
                    {/* Manage Tutors Card */}
                    <Grid item xs={12} sm={6} md={4}>
                        <Card
                            elevation={6}
                            sx={{
                                borderRadius: '16px',
                                bgcolor: cardStyle.backgroundColor,
                                transition: "0.3s",
                                "&:hover": {
                                    bgcolor: cardStyle.hover,
                                    transform: "translateY(-8px)",
                                    boxShadow: '0 10px 20px rgba(0,0,0,0.15)',
                                },
                                display: 'flex',
                                flexDirection: 'column',
                                height: '100%',
                            }}
                        >
                            <CardContent sx={{ flexGrow: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2, p: 4 }}>
                                <IconButton sx={{ bgcolor: cardStyle.iconColor, color: '#fff', mb: 1 }}>
                                    <GroupIcon /> {/* Icon for managing tutors */}
                                </IconButton>
                                <Typography variant="h5" fontWeight="bold" color="text.primary">
                                    Manage Tutors
                                </Typography>
                                <Typography variant="body2" align="center" color="text.secondary">
                                    Add, edit, approve, and delete tutor accounts.
                                </Typography>
                            </CardContent>
                            <Box sx={{ p: 2, pt: 0, textAlign: 'center' }}>
                                <Button
                                    variant="contained"
                                    onClick={() => navigate("/tutor-admin-manage-tutors")} // Navigate to the new management page
                                    sx={{
                                        bgcolor: cardStyle.iconColor,
                                        '&:hover': { bgcolor: '#2980B9' },
                                        color: '#fff',
                                        fontWeight: 'bold',
                                        borderRadius: '12px',
                                        py: 1.5,
                                    }}
                                >
                                    Go to Management
                                </Button>
                            </Box>
                        </Card>
                    </Grid>
                </Grid>
            </Box>
        </Box>
    );
};

export default TutorAdminDashboard;