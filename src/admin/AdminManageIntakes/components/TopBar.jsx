import React from "react";
import { Box, Button, Typography } from "@mui/material";
import HomeIcon from "@mui/icons-material/Home";
import AddIcon from "@mui/icons-material/Add";
import SchoolIcon from '@mui/icons-material/School';

export default function TopBar({ onBack, onAdd }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2, flexWrap: "wrap" }}>
      <Button
        variant="outlined"
        startIcon={<HomeIcon />}
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
          <SchoolIcon sx={{ fontSize: 28 }} />
          Manage Intakes
        </Typography>
      </Box>

      {onAdd && (
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={onAdd}
          sx={{
            borderRadius: "12px",
            fontWeight: "bold",
            backgroundColor: "#81C784",
            color: "#1B5E20",
            "&:hover": { backgroundColor: "#66BB6A" },
          }}
        >
          Add Intake
        </Button>
      )}
    </Box>
  );
}
