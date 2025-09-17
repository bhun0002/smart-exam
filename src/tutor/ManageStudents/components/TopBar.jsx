import React from "react";
import { Box, Typography, Button } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";

export default function TopBar({ onBack, onCreate }) {
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
      <Button
        variant="outlined"
        startIcon={<ArrowBackIcon />}
        onClick={onBack}
        sx={{
          borderColor: "#4A90E2",
          color: "#4A90E2",
          borderRadius: "12px",
          fontWeight: "bold",
          "&:hover": { backgroundColor: "#E3F2FD" },
        }}
      >
        Back to Dashboard
      </Button>

      <Box sx={{ flex: 1, textAlign: "center" }}>
        <Typography
          variant="h4"
          sx={{ fontWeight: "bold", color: "#1A237E", display: "inline-flex", gap: 1, alignItems: "center" }}
        >
          <PeopleAltIcon sx={{ fontSize: 28 }} />
          Manage Students
        </Typography>
      </Box>
    </Box>
  );
}
