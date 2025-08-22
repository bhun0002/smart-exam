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
import AddIcon from '@mui/icons-material/Add';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import LogoutIcon from '@mui/icons-material/Logout';
import { useAuth } from '../AuthContext';

const TutorDashboard = () => {
    const navigate = useNavigate();
    const { logout } = useAuth(); // Assuming you have a logout function

    // Pastel colors for cards
    const cardStyles = [
        { backgroundColor: "#FFF5E1", hover: "#FFEBCC", iconColor: "#F39C12" }, // Add Exam - Soft Yellow
        { backgroundColor: "#E1F5FE", hover: "#B3E5FC", iconColor: "#3498DB" }, // List of Exams - Soft Blue
    ];

    const handleLogout = () => {
        logout();
        navigate("/");
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
                        Tutor Panel
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
                    Tutor Dashboard
                </Typography>
                <Typography
                    variant="h6"
                    align="center"
                    color="text.secondary"
                    sx={{ mb: 6 }}
                >
                    Manage your exams and student progress from one place.
                </Typography>

                <Grid container spacing={4} justifyContent="center" alignItems="stretch">
                    {/* Add Exam Card */}
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
                                <IconButton sx={{ bgcolor: cardStyles[0].iconColor, color: '#fff', mb: 1 }}>
                                    <AddIcon />
                                </IconButton>
                                <Typography variant="h5" fontWeight="bold" color="text.primary">
                                    Create a New Exam
                                </Typography>
                                <Typography variant="body2" align="center" color="text.secondary">
                                    Build a new examination with multiple question types and media.
                                </Typography>
                            </CardContent>
                            <Box sx={{ p: 2, pt: 0, textAlign: 'center' }}>
                                <Button
                                    variant="contained"
                                    onClick={() => navigate("/tutor-create-exam")}
                                    sx={{
                                        bgcolor: cardStyles[0].iconColor,
                                        '&:hover': { bgcolor: '#E67E22' },
                                        color: '#fff',
                                        fontWeight: 'bold',
                                        borderRadius: '12px',
                                        py: 1.5,
                                    }}
                                >
                                    Go to Form
                                </Button>
                            </Box>
                        </Card>
                    </Grid>

                    {/* List of Exams Card */}
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
                                <IconButton sx={{ bgcolor: cardStyles[1].iconColor, color: '#fff', mb: 1 }}>
                                    <FormatListBulletedIcon />
                                </IconButton>
                                <Typography variant="h5" fontWeight="bold" color="text.primary">
                                    View Exams List
                                </Typography>
                                <Typography variant="body2" align="center" color="text.secondary">
                                    Review, edit, and manage all your existing examinations.
                                </Typography>
                            </CardContent>
                            <Box sx={{ p: 2, pt: 0, textAlign: 'center' }}>
                                <Button
                                    variant="contained"
                                    onClick={() => navigate("/tutor-exam-list")}
                                    sx={{
                                        bgcolor: cardStyles[1].iconColor,
                                        '&:hover': { bgcolor: '#2980B9' },
                                        color: '#fff',
                                        fontWeight: 'bold',
                                        borderRadius: '12px',
                                        py: 1.5,
                                    }}
                                >
                                    View Exams
                                </Button>
                            </Box>
                        </Card>
                    </Grid>
                </Grid>
            </Box>
        </Box>
    );
};

export default TutorDashboard;