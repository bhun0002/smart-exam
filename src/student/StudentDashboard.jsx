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

import AssignmentIcon from "@mui/icons-material/Assignment";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import ListAltIcon from "@mui/icons-material/ListAlt";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import LogoutIcon from "@mui/icons-material/Logout";
import { useAuth } from "../AuthContext";

/**
 * Student Dashboard
 * Visual parity with TutorDashboard (same gradient, card shells, hover, spacing),
 * but with student actions & routes.
 */
export default function StudentDashboard() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  // Same pastel card style pattern used on Tutor dashboard
  const cardStyles = [
    { backgroundColor: "#E1F5FE", hover: "#B3E5FC", iconColor: "#3498DB" }, // Available Exams
    { backgroundColor: "#E0FFD1", hover: "#CCFFB3", iconColor: "#4CAF50" }, // My Schedule
    { backgroundColor: "#FDE2E4", hover: "#FAD2D7", iconColor: "#E57373" }, // My Submissions
    { backgroundColor: "#F3E5F5", hover: "#E1BEE7", iconColor: "#6A1B9A" }, // Exam Guidelines
  ];

  const CardShell = ({ i, icon, title, subtitle, cta, onClick }) => (
    <Card
      elevation={6}
      sx={{
        borderRadius: "16px",
        bgcolor: cardStyles[i].backgroundColor,
        transition: "0.3s",
        "&:hover": {
          bgcolor: cardStyles[i].hover,
          transform: "translateY(-8px)",
          boxShadow: "0 10px 20px rgba(0,0,0,0.15)",
        },
        display: "flex",
        flexDirection: "column",
        height: "100%",
      }}
    >
      <CardContent
        sx={{
          flexGrow: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 2,
          p: 4,
          textAlign: "center",
        }}
      >
        <Box
          sx={{
            bgcolor: cardStyles[i].iconColor,
            color: "#fff",
            width: 48,
            height: 48,
            borderRadius: "50%",
            display: "grid",
            placeItems: "center",
          }}
        >
          {icon}
        </Box>

        <Typography variant="h5" fontWeight="bold" color="text.primary">
          {title}
        </Typography>

        <Typography variant="body2" color="text.secondary">
          {subtitle}
        </Typography>
      </CardContent>

      <Box sx={{ p: 2, pt: 0, textAlign: "center" }}>
        <Button
          variant="contained"
          onClick={onClick}
          sx={{
            bgcolor: cardStyles[i].iconColor,
            "&:hover": { bgcolor: cardStyles[i].iconColor },
            color: "#fff",
            fontWeight: "bold",
            borderRadius: "12px",
            py: 1.5,
          }}
        >
          {cta}
        </Button>
      </Box>
    </Card>
  );

  const handleLogout = () => {
    logout();
    navigate("/student-login");
  };

  return (
    <Box
      sx={{
        background: "linear-gradient(135deg, #FFD1DC, #B2EBF2)",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Top AppBar — same placement and feel as tutor */}
      <AppBar
        position="static"
        elevation={0}
        sx={{
          bgcolor: "rgba(255, 255, 255, 0.8)",
          backdropFilter: "blur(10px)",
          borderBottom: "1px solid #e0e0e0",
          color: "#37474f",
        }}
      >
        <Toolbar>
          <Typography
            variant="h6"
            component="div"
            sx={{ flexGrow: 1, color: "#37474f", fontWeight: "bold" }}
          >
            Student Panel
          </Typography>
          <Button
            color="inherit"
            onClick={handleLogout}
            sx={{ color: "#e57373" }}
            startIcon={<LogoutIcon />}
          >
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      {/* Main Content — title + subtitle with same rhythm */}
      <Box sx={{ flexGrow: 1, p: { xs: 2, md: 4 } }}>
        <Typography
          variant="h3"
          align="center"
          gutterBottom
          fontWeight="bold"
          sx={{ mb: 2, mt: 4, color: "#37474f" }}
        >
          Student Dashboard
        </Typography>

        <Typography variant="h6" align="center" color="text.secondary" sx={{ mb: 6 }}>
          Access your exams, schedules and results from one place.
        </Typography>

        {/* Grid — identical sizing/spacing to tutor (centered, stretch) */}
        <Grid container spacing={4} justifyContent="center" alignItems="stretch">
          {/* Available Exams */}
          <Grid item xs={12} sm={6} md={3}>
            <CardShell
              i={0}
              icon={<AssignmentIcon />}
              title="Available Exams"
              subtitle="See exams you can take right now."
              cta="Go to List"
              onClick={() => navigate("/student-exam-list")}
            />
          </Grid>

          {/* My Schedule */}
          <Grid item xs={12} sm={6} md={3}>
            <CardShell
              i={1}
              icon={<EventAvailableIcon />}
              title="My Schedule"
              subtitle="View scheduled exams for your course & intake."
              cta="Open Schedule"
              onClick={() => navigate("/student-schedule")}
            />
          </Grid>

          {/* My Submissions */}
          <Grid item xs={12} sm={6} md={3}>
            <CardShell
              i={2}
              icon={<ListAltIcon />}
              title="My Submissions"
              subtitle="Review your submitted exams and results."
              cta="Open Submissions"
              onClick={() => navigate("/student-submissions")}
            />
          </Grid>

          {/* Exam Guidelines */}
          <Grid item xs={12} sm={6} md={3}>
            <CardShell
              i={3}
              icon={<HelpOutlineIcon />}
              title="Exam Guidelines"
              subtitle="Read rules, tips and best practices."
              cta="Open Guide"
              onClick={() => navigate("/student-guidelines")}
            />
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}
