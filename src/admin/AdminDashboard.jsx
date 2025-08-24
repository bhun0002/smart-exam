// src/admin/AdminDashboard.jsx
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
} from "@mui/material";
import LogoutIcon from '@mui/icons-material/Logout';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings'; // Icon for admin management
import SchoolIcon from '@mui/icons-material/School'; // Icon for intake management
import SupervisorAccountIcon from '@mui/icons-material/SupervisorAccount'; // Icon for Tutor Admin Panel
import { useAuth } from "../AuthContext";

const AdminDashboard = () => {
    const navigate = useNavigate();
    const { logout, user } = useAuth(); // Assuming 'user' contains role information

    const cardStyles = [
        { backgroundColor: "#FFF5E1", hover: "#FFEBCC", iconColor: "#F39C12" }, // Admin Management - Soft Yellow
        { backgroundColor: "#E1F5FE", hover: "#B3E5FC", iconColor: "#3498DB" }, // Intake Management - Soft Blue
        { backgroundColor: "#E0FFD1", hover: "#CCFFB3", iconColor: "#4CAF50" }, // Go to Tutor Panel - Soft Green
    ];

    const handleLogout = () => {
        logout();
        navigate("/admin-login");
    };

    const handleTutorPanelRedirect = () => {
        navigate("/tutor-admin-dashboard");
    };

    return (
        <Box
            sx={{
                background: 'linear-gradient(135deg, #FFDDC1, #C1FFD7)', // Master Admin Gradient
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
                        Master Admin Panel
                    </Typography>
                    <Button
                        color="inherit"
                        onClick={handleLogout}
                        sx={{ color: '#e57373' }}
                        startIcon={<LogoutIcon />}
                    >
                        Logout
                    </Button>
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
                    Master Admin Dashboard
                </Typography>
                <Typography
                    variant="h6"
                    align="center"
                    color="text.secondary"
                    sx={{ mb: 6 }}
                >
                    Centralized management for administrators, intakes, and tutor panels.
                </Typography>

                <Grid container spacing={4} justifyContent="center" alignItems="stretch">
                    {/* Admin Management Card */}
                    <Grid item xs={12} sm={6} md={4}>
                        <Card
                            elevation={6}
                            sx={{
                                borderRadius: '16px',
                                bgcolor: cardStyles[0].backgroundColor,
                                transition: "0.3s",
                                "&:hover": {
                                    bgcolor: cardStyles[0].hover,
                                    transform: "translateY(-8px)",
                                    boxShadow: '0 10px 20px rgba(0,0,0,0.15)',
                                },
                                display: 'flex',
                                flexDirection: 'column',
                                height: '100%',
                            }}
                        >
                            <CardContent sx={{ flexGrow: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2, p: 4 }}>
                                <AdminPanelSettingsIcon sx={{ fontSize: 60, color: cardStyles[0].iconColor, mb: 1 }} />
                                <Typography variant="h5" fontWeight="bold" color="text.primary">
                                    Admin Management
                                </Typography>
                                <Typography variant="body2" align="center" color="text.secondary">
                                    Manage master and tutor admin accounts, their roles and statuses.
                                </Typography>
                            </CardContent>
                            <Box sx={{ p: 2, pt: 0, textAlign: 'center' }}>
                                <Button
                                    variant="contained"
                                    onClick={() => navigate("/admin-manage-admins")}
                                    sx={{
                                        bgcolor: cardStyles[0].iconColor,
                                        '&:hover': { bgcolor: '#E67E22' },
                                        color: '#fff',
                                        fontWeight: 'bold',
                                        borderRadius: '12px',
                                        py: 1.5,
                                    }}
                                >
                                    Manage Admins
                                </Button>
                            </Box>
                        </Card>
                    </Grid>

                    {/* Intake Management Card */}
                    <Grid item xs={12} sm={6} md={4}>
                        <Card
                            elevation={6}
                            sx={{
                                borderRadius: '16px',
                                bgcolor: cardStyles[1].backgroundColor,
                                transition: "0.3s",
                                "&:hover": {
                                    bgcolor: cardStyles[1].hover,
                                    transform: "translateY(-8px)",
                                    boxShadow: '0 10px 20px rgba(0,0,0,0.15)',
                                },
                                display: 'flex',
                                flexDirection: 'column',
                                height: '100%',
                            }}
                        >
                            <CardContent sx={{ flexGrow: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2, p: 4 }}>
                                <SchoolIcon sx={{ fontSize: 60, color: cardStyles[1].iconColor, mb: 1 }} />
                                <Typography variant="h5" fontWeight="bold" color="text.primary">
                                    Intake Management
                                </Typography>
                                <Typography variant="body2" align="center" color="text.secondary">
                                    Create and organize student intake periods.
                                </Typography>
                            </CardContent>
                            <Box sx={{ p: 2, pt: 0, textAlign: 'center' }}>
                                <Button
                                    variant="contained"
                                    onClick={() => navigate("/admin-manage-intakes")}
                                    sx={{
                                        bgcolor: cardStyles[1].iconColor,
                                        '&:hover': { bgcolor: '#2980B9' },
                                        color: '#fff',
                                        fontWeight: 'bold',
                                        borderRadius: '12px',
                                        py: 1.5,
                                    }}
                                >
                                    Manage Intakes
                                </Button>
                            </Box>
                        </Card>
                    </Grid>

                    {/* Go to Tutor Admin Panel Card (only if masterAdmin) */}
                    {user?.role === 'masterAdmin' && (
                        <Grid item xs={12} sm={6} md={4}>
                            <Card
                                elevation={6}
                                sx={{
                                    borderRadius: '16px',
                                    bgcolor: cardStyles[2].backgroundColor,
                                    transition: "0.3s",
                                    "&:hover": {
                                        bgcolor: cardStyles[2].hover,
                                        transform: "translateY(-8px)",
                                        boxShadow: '0 10px 20px rgba(0,0,0,0.15)',
                                    },
                                    display: 'flex',
                                    flexDirection: 'column',
                                    height: '100%',
                                }}
                            >
                                <CardContent sx={{ flexGrow: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2, p: 4 }}>
                                    <SupervisorAccountIcon sx={{ fontSize: 60, color: cardStyles[2].iconColor, mb: 1 }} />
                                    <Typography variant="h5" fontWeight="bold" color="text.primary">
                                        Go to Tutor Panel
                                    </Typography>
                                    <Typography variant="body2" align="center" color="text.secondary">
                                        Access the dashboard for managing tutor accounts.
                                    </Typography>
                                </CardContent>
                                <Box sx={{ p: 2, pt: 0, textAlign: 'center' }}>
                                    <Button
                                        variant="contained"
                                        onClick={handleTutorPanelRedirect}
                                        sx={{
                                            bgcolor: cardStyles[2].iconColor,
                                            '&:hover': { bgcolor: '#4CAF50' },
                                            color: '#fff',
                                            fontWeight: 'bold',
                                            borderRadius: '12px',
                                            py: 1.5,
                                        }}
                                    >
                                        Tutor Dashboard
                                    </Button>
                                </Box>
                            </Card>
                        </Grid>
                    )}
                </Grid>
            </Box>
        </Box>
    );
};

export default AdminDashboard;