import React, { useEffect, useState } from "react";
import { db } from "../firebaseConfig";
import { collection, getDocs, query, where } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { Box, Typography, Card, CardContent, Button, CircularProgress, AppBar, Toolbar } from "@mui/material";
import LogoutIcon from '@mui/icons-material/Logout';
import { useAuth } from '../AuthContext';

const StudentDashboard = () => {
  const { user, isLoading, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [hasExam, setHasExam] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // If auth state is not loading and there's no user, redirect to login
    if (!isLoading && !user) {
      navigate("/student-login");
      return;
    }

    // Fetch exams only if a user is authenticated
    if (user) {
      const fetchExams = async () => {
        try {
          // Create a query to find exams for the user's specific intake
          const q = query(
            collection(db, "exams"),
            where("intakeId", "==", user.intake),
            where("isDeleted", "==", 0)
          );
          const snapshot = await getDocs(q);
          console.log("Fetched exams:", snapshot.docs.map(doc => doc.data()));
          // Check if any exams were found and update state
          setHasExam(!snapshot.empty);
        } catch (err) {
          console.error("Error fetching exams:", err);
        } finally {
          setLoading(false);
        }
      };

      fetchExams();
    }
  }, [user, isLoading, navigate]);

  const handleLogout = () => {
    logout();
    navigate("/student-login"); // Redirect to login after logout
  };

  // Show a loading spinner while fetching data or authenticating
  if (isLoading || loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box 
      sx={{ 
        minHeight: "100vh", 
        display: "flex", 
        flexDirection: "column", 
        background: 'linear-gradient(135deg, #D1C4E9, #B3E5FC)', 
        fontFamily: 'Roboto, sans-serif'
      }}
    >
      {/* Top AppBar with frosted glass effect */}
      <AppBar 
        position="static" 
        sx={{ 
          bgcolor: 'rgba(255,255,255,0.6)', // Updated for more transparency
          backdropFilter: 'blur(10px)', 
          borderBottom: '1px solid #ccc', 
          boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
        }}
      >
        <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="h6" sx={{ color: '#37474f', fontWeight: 'bold' }}>
            Student Dashboard
          </Typography>
          <Button
            color="inherit"
            onClick={handleLogout}
            startIcon={<LogoutIcon />}
            sx={{ color: '#e57373', fontWeight: 'bold' }}
          >
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Box 
        sx={{ 
          flexGrow: 1, 
          p: { xs: 2, md: 4 }, 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center' 
        }}
      >
        <Typography 
          variant="h4" 
          gutterBottom 
          sx={{ 
            fontWeight: 'bold', 
            color: '#37474f',
            textShadow: '1px 1px 2px rgba(0,0,0,0.1)' 
          }}
        >
          Welcome, {user?.name || "Student"} 👋
        </Typography>

        <Card 
          sx={{ 
            maxWidth: 500, 
            width: '100%',
            mt: 4, 
            borderRadius: 4, // More rounded corners
            p: { xs: 2, md: 3 },
            boxShadow: '0 10px 30px rgba(0,0,0,0.1)', // More pronounced shadow
            transition: 'transform 0.3s ease-in-out',
            '&:hover': {
              transform: 'translateY(-5px)' // Subtle lift on hover
            }
          }}
        >
          <CardContent sx={{ textAlign: "center" }}>
            {hasExam ? (
              <Button 
                variant="contained" 
                color="primary" 
                onClick={() => navigate("/student-exam-list")}
                sx={{
                  borderRadius: '25px', // Pill-shaped button
                  p: '12px 24px',
                  fontWeight: 'bold',
                  background: 'linear-gradient(45deg, #7E57C2 30%, #5C6BC0 90%)', // Gradient for a richer look
                  boxShadow: '0 3px 5px 2px rgba(92, 107, 192, .3)',
                  '&:hover': {
                    transform: 'scale(1.05)',
                    boxShadow: '0 5px 10px 3px rgba(92, 107, 192, .4)',
                  }
                }}
              >
                View Exam List
              </Button>
            ) : (
              <Typography variant="body1" color="textSecondary" sx={{ color: '#757575' }}>
                No exams available for your intake yet.
              </Typography>
            )}
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default StudentDashboard;
