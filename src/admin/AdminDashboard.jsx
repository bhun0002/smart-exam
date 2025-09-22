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
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import SchoolIcon from '@mui/icons-material/School';
import DescriptionIcon from '@mui/icons-material/Description'; // 📄 For document management
import MenuBookIcon from '@mui/icons-material/MenuBook';          // Courses
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn'; // Fees
import PaymentIcon from '@mui/icons-material/Payment'; // 💳 Payments 
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn'; // ✅ Payment Claims (NEW)
import { useAuth } from "../AuthContext";

const AdminDashboard = () => {
    const navigate = useNavigate();
    const { logout, user } = useAuth();

    // Added a 6th palette entry for Payments (NEW)
    const cardStyles = [
        { backgroundColor: "#FFF5E1", hover: "#FFEBCC", iconColor: "#F39C12" }, // Admin Management
        { backgroundColor: "#E1F5FE", hover: "#B3E5FC", iconColor: "#3498DB" }, // Intake Management
        { backgroundColor: "#F3E5F5", hover: "#E1BEE7", iconColor: "#8E24AA" }, // Document Management
        { backgroundColor: "#E8F5E9", hover: "#C8E6C9", iconColor: "#2E7D32" }, // Course Management
        { backgroundColor: "#FFF3E0", hover: "#FFE0B2", iconColor: "#EF6C00" }, // Fee Management
        { backgroundColor: "#E0F7FA", hover: "#B2EBF2", iconColor: "#00838F" }, // Payments 
        { backgroundColor: "#F1F8E9", hover: "#DCEDC8", iconColor: "#558B2F" }, // Payment Claims
    ];

    const handleLogout = () => {
        logout();
        navigate("/admin-login");
    };

    return (
        <Box
            sx={{
                background: 'linear-gradient(135deg, #FFDDC1, #C1FFD7)',
                minHeight: "100vh",
                display: "flex",
                flexDirection: "column",
            }}
        >
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
                    Centralized management for administrators, intakes, documents, and tutor panels.
                </Typography>

                <Grid container spacing={4} justifyContent="center" alignItems="stretch">
                    {/* Admin Management */}
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

                    {/* Intake Management */}
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

                    {/* Document Management */}
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
                                <DescriptionIcon sx={{ fontSize: 60, color: cardStyles[2].iconColor, mb: 1 }} />
                                <Typography variant="h5" fontWeight="bold" color="text.primary">
                                    Document Management
                                </Typography>
                                <Typography variant="body2" align="center" color="text.secondary">
                                    Define required student documents and upload reference files for them.
                                </Typography>
                            </CardContent>
                            <Box sx={{ p: 2, pt: 0, textAlign: 'center' }}>
                                <Button
                                    variant="contained"
                                    onClick={() => navigate("/admin-manage-docs")}
                                    sx={{
                                        bgcolor: cardStyles[2].iconColor,
                                        '&:hover': { bgcolor: '#6A1B9A' },
                                        color: '#fff',
                                        fontWeight: 'bold',
                                        borderRadius: '12px',
                                        py: 1.5,
                                    }}
                                >
                                    Manage Documents
                                </Button>
                            </Box>
                        </Card>
                    </Grid>

                    {/* Course Management */}
                    <Grid item xs={12} sm={6} md={4}>
                        <Card
                            elevation={6}
                            sx={{
                                borderRadius: '16px',
                                bgcolor: cardStyles[3].backgroundColor,
                                transition: "0.3s",
                                "&:hover": {
                                    bgcolor: cardStyles[3].hover,
                                    transform: "translateY(-8px)",
                                    boxShadow: '0 10px 20px rgba(0,0,0,0.15)',
                                },
                                display: 'flex',
                                flexDirection: 'column',
                                height: '100%',
                            }}
                        >
                            <CardContent sx={{ flexGrow: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2, p: 4 }}>
                                <MenuBookIcon sx={{ fontSize: 60, color: cardStyles[3].iconColor, mb: 1 }} />
                                <Typography variant="h5" fontWeight="bold" color="text.primary">
                                    Course Management
                                </Typography>
                                <Typography variant="body2" align="center" color="text.secondary">
                                    Create, edit, and archive courses.
                                </Typography>
                            </CardContent>
                            <Box sx={{ p: 2, pt: 0, textAlign: 'center' }}>
                                <Button
                                    variant="contained"
                                    onClick={() => navigate("/admin-manage-course")}
                                    sx={{
                                        bgcolor: cardStyles[3].iconColor,
                                        '&:hover': { bgcolor: cardStyles[3].iconColor },
                                        color: '#fff',
                                        fontWeight: 'bold',
                                        borderRadius: '12px',
                                        py: 1.5,
                                    }}
                                >
                                    Manage Courses
                                </Button>
                            </Box>
                        </Card>
                    </Grid>

                    {/* Fee Management */}
                    <Grid item xs={12} sm={6} md={4}>
                        <Card
                            elevation={6}
                            sx={{
                                borderRadius: '16px',
                                bgcolor: cardStyles[4].backgroundColor,
                                transition: "0.3s",
                                "&:hover": {
                                    bgcolor: cardStyles[4].hover,
                                    transform: "translateY(-8px)",
                                    boxShadow: '0 10px 20px rgba(0,0,0,0.15)',
                                },
                                display: 'flex',
                                flexDirection: 'column',
                                height: '100%',
                            }}
                        >
                            <CardContent sx={{ flexGrow: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2, p: 4 }}>
                                <MonetizationOnIcon sx={{ fontSize: 60, color: cardStyles[4].iconColor, mb: 1 }} />
                                <Typography variant="h5" fontWeight="bold" color="text.primary">
                                    Fee Management
                                </Typography>
                                <Typography variant="body2" align="center" color="text.secondary">
                                    Set fees per course and intake.
                                </Typography>
                            </CardContent>
                            <Box sx={{ p: 2, pt: 0, textAlign: 'center' }}>
                                <Button
                                    variant="contained"
                                    onClick={() => navigate("/admin-manage-fee")}
                                    sx={{
                                        bgcolor: cardStyles[4].iconColor,
                                        '&:hover': { bgcolor: cardStyles[4].iconColor },
                                        color: '#fff',
                                        fontWeight: 'bold',
                                        borderRadius: '12px',
                                        py: 1.5,
                                    }}
                                >
                                    Manage Fees
                                </Button>
                            </Box>
                        </Card>
                    </Grid>

                    {/* Payments (NEW) */}
                    <Grid item xs={12} sm={6} md={4}>
                        <Card
                            elevation={6}
                            sx={{
                                borderRadius: '16px',
                                bgcolor: cardStyles[5].backgroundColor,
                                transition: "0.3s",
                                "&:hover": {
                                    bgcolor: cardStyles[5].hover,
                                    transform: "translateY(-8px)",
                                    boxShadow: '0 10px 20px rgba(0,0,0,0.15)',
                                },
                                display: 'flex',
                                flexDirection: 'column',
                                height: '100%',
                            }}
                        >
                            <CardContent sx={{ flexGrow: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2, p: 4 }}>
                                <PaymentIcon sx={{ fontSize: 60, color: cardStyles[5].iconColor, mb: 1 }} />
                                <Typography variant="h5" fontWeight="bold" color="text.primary">
                                    Payments
                                </Typography>
                                <Typography variant="body2" align="center" color="text.secondary">
                                    View Interac e-Transfer payments and details.
                                </Typography>
                            </CardContent>
                            <Box sx={{ p: 2, pt: 0, textAlign: 'center' }}>
                                <Button
                                    variant="contained"
                                    onClick={() => navigate("/admin-manage-payments")}
                                    sx={{
                                        bgcolor: cardStyles[5].iconColor,
                                        '&:hover': { bgcolor: "#006064" },
                                        color: '#fff',
                                        fontWeight: 'bold',
                                        borderRadius: '12px',
                                        py: 1.5,
                                    }}
                                >
                                    View Payments
                                </Button>
                            </Box>
                        </Card>
                    </Grid>
                    {/* Payment Claims (NEW) */}
          <Grid item xs={12} sm={6} md={4}>
            <Card
              elevation={6}
              sx={{
                borderRadius: '16px',
                bgcolor: cardStyles[6].backgroundColor,
                transition: "0.3s",
                "&:hover": {
                  bgcolor: cardStyles[6].hover,
                  transform: "translateY(-8px)",
                  boxShadow: '0 10px 20px rgba(0,0,0,0.15)',
                },
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
              }}
            >
              <CardContent sx={{ flexGrow: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2, p: 4 }}>
                <AssignmentTurnedInIcon sx={{ fontSize: 60, color: cardStyles[6].iconColor, mb: 1 }} />
                <Typography variant="h5" fontWeight="bold" color="text.primary">
                  Payment Claims
                </Typography>
                <Typography variant="body2" align="center" color="text.secondary">
                  Review student payment claims and link to Interac payments.
                </Typography>
              </CardContent>
              <Box sx={{ p: 2, pt: 0, textAlign: 'center' }}>
                <Button
                  variant="contained"
                  onClick={() => navigate("/admin-manage-payment-claims")}
                  sx={{
                    bgcolor: cardStyles[6].iconColor,
                    '&:hover': { bgcolor: "#33691E" },
                    color: '#fff',
                    fontWeight: 'bold',
                    borderRadius: '12px',
                    py: 1.5,
                  }}
                >
                  Manage Claims
                </Button>
              </Box>
            </Card>
          </Grid>
                </Grid>
            </Box>
        </Box>
    );
};

export default AdminDashboard;
