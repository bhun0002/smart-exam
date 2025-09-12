import React from "react";
import { Box, Button, Typography } from "@mui/material";
import { Home as HomeIcon, Add as AddIcon, Description as DescriptionIcon } from "@mui/icons-material";
import { brandPrimary, brandAccent, brandAccentHover } from "../constants/ui";

export default function TopBar({ onBack, onCreate }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2, flexWrap: "wrap" }}>
      <Button
        variant="outlined"
        startIcon={<HomeIcon />}
        onClick={onBack}
        sx={{
          borderColor: brandPrimary,
          color: brandPrimary,
          borderRadius: "12px",
          fontWeight: "bold",
          "&:hover": { backgroundColor: "#E3F2FD" },
        }}
      >
        Back to Dashboard
      </Button>

      <Box sx={{ flex: 1, textAlign: "center" }}>
        <Typography variant="h4" sx={{ fontWeight: "bold", color: "#1A237E", display: "inline-flex", gap: 1, alignItems: "center" }}>
          <DescriptionIcon sx={{ fontSize: 28 }} />
          Document Requirements
        </Typography>
      </Box>

      <Button
        variant="contained"
        startIcon={<AddIcon />}
        onClick={onCreate}
        sx={{
          borderRadius: "12px",
          fontWeight: "bold",
          backgroundColor: brandAccent,
          color: "#1B5E20",
          "&:hover": { backgroundColor: brandAccentHover },
        }}
      >
        Add Requirement
      </Button>
    </Box>
  );
}
