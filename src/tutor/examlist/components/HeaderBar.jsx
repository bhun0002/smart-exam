// src/tutor/examlist/components/HeaderBar.jsx
import React from "react";
import { Box, Button, Typography } from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  Add as AddIcon,
} from "@mui/icons-material";

const HeaderBar = ({ onBack, onCreate }) => {
  const buttonStyle = {
    borderColor: "#4A90E2",
    color: "#4A90E2",
    borderRadius: "12px",
    fontWeight: "bold",
    px: 2.25,
    py: 1.1,
    "&:hover": { backgroundColor: "#E3F2FD" },
  };

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        mb: 4,
        flexWrap: "wrap",
        gap: 2,
      }}
    >
      {/* Back to Dashboard */}
      <Button
        variant="outlined"
        startIcon={<ArrowBackIcon />}
        onClick={onBack}
        sx={buttonStyle}
      >
        Back to Dashboard
      </Button>

      {/* Title */}
      <Typography
        variant="h4"
        sx={{
          color: "#5d5c61",
          flexGrow: 1,
          textAlign: "center",
          fontWeight: 700,
          letterSpacing: 0.2,
        }}
      >
        Exams List
      </Typography>

      {/* Add Exam — now matches Back button style */}
      <Button
        variant="outlined"
        startIcon={<AddIcon />}
        onClick={onCreate}
        sx={buttonStyle}
      >
        Add Exam
      </Button>
    </Box>
  );
};

export default HeaderBar;
