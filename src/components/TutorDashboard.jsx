import React from "react";
import { useNavigate } from "react-router-dom";
import { Box, Typography, Card, CardContent, Button, Grid } from "@mui/material";

const TutorDashboard = () => {
  const navigate = useNavigate();

  // Pastel colors for cards
  const cardStyles = [
    { backgroundColor: "#FFDDC1", hover: "#FFC4A3" }, // Add Exam
    { backgroundColor: "#C1FFD7", hover: "#A3FFC4" }, // List of Exams
  ];

  return (
    <Box sx={{ p: 4, minHeight: "80vh", bgcolor: "#F9F9F9" }}>
      <Typography variant="h3" align="center" gutterBottom sx={{ mb: 6 }}>
        Tutor Dashboard
      </Typography>

      <Grid container spacing={4} justifyContent="center">
        {/* Add Exam Card */}
        <Grid item xs={12} sm={6} md={4}>
          <Card
            sx={{
              bgcolor: cardStyles[0].backgroundColor,
              transition: "0.3s",
              "&:hover": { bgcolor: cardStyles[0].hover, transform: "scale(1.05)" },
            }}
          >
            <CardContent sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
              <Typography variant="h5">Add Exam</Typography>
              <Typography variant="body2" align="center">
                Create a new exam for your students with questions and media.
              </Typography>
              <Button
                variant="contained"
                color="primary"
                onClick={() => navigate("/create-exam")}
              >
                Go to Form
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* List of Exams Card */}
        <Grid item xs={12} sm={6} md={4}>
          <Card
            sx={{
              bgcolor: cardStyles[1].backgroundColor,
              transition: "0.3s",
              "&:hover": { bgcolor: cardStyles[1].hover, transform: "scale(1.05)" },
            }}
          >
            <CardContent sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
              <Typography variant="h5">List of Exams</Typography>
              <Typography variant="body2" align="center">
                View all the exams you have created and manage them easily.
              </Typography>
              <Button
                variant="outlined"
                color="secondary"
                onClick={() => navigate("/exam-list")}
              >
                View Exams
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default TutorDashboard;
