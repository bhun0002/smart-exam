// src/tutor/examlist/components/TopBar.jsx
import React from "react";
import { Box, Button, Typography } from "@mui/material";
import FormatListBulletedIcon from "@mui/icons-material/FormatListBulleted";
import {
  ArrowBack as ArrowBackIcon,
  Add as AddIcon,
} from "@mui/icons-material";

const TopBar = ({ onBack, onCreate }) => {
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

      <Box sx={{ flex: 1, textAlign: "center" }}>
        <Typography variant="h4" sx={{ fontWeight: "bold", color: "#1A237E", display: "inline-flex", gap: 1, alignItems: "center" }}>
          <FormatListBulletedIcon sx={{ fontSize: 28 }} />
          Exams List
        </Typography>
      </Box>

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

export default TopBar;
