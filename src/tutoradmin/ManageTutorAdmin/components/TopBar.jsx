// src/tutoradmin/ManageTutorAdmin/components/TopBar.jsx
import React from "react";
import { Box, Button, Typography } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import GroupIcon from "@mui/icons-material/Group";

export default function TopBar({ onBack }) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 2,
        mb: 3,
        flexWrap: "wrap",
        justifyContent: "space-between",
      }}
    >
      <Button
        variant="outlined"
        startIcon={<ArrowBackIcon />}
        onClick={onBack}
        sx={{
          borderColor: "#4A90E2", color: "#4A90E2", borderRadius: "12px",
          fontWeight: "bold", "&:hover": { backgroundColor: "#E3F2FD" },
        }}
      >
        Back to Dashboard
      </Button>

      <Box sx={{ flex: 1, textAlign: "center" }}>
        <Typography
          variant="h4"
          sx={{ fontWeight: "bold", color: "#1A237E", display: "inline-flex", gap: 1, alignItems: "center" }}
        >
          <GroupIcon sx={{ fontSize: 28 }} />
          Manage Tutors
        </Typography>
      </Box>

      <Box sx={{ width: 120 }} /> {/* spacer to balance layout */}
    </Box>
  );
}
