import React from "react";
import { Box, Button, Typography } from "@mui/material";
import { Home as HomeIcon, Add as AddIcon } from "@mui/icons-material";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";

export default function TopBar({ onBack, onCreate }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2, flexWrap: "wrap" }}>
      <Button
        variant="outlined"
        startIcon={<HomeIcon />}
        onClick={onBack}
        sx={{
          borderColor: "#4A90E2", color: "#4A90E2", borderRadius: "12px",
          fontWeight: "bold", "&:hover": { backgroundColor: "#E3F2FD" },
        }}
      >
        Back to Dashboard
      </Button>

      <Box sx={{ flex: 1, textAlign: "center" }}>
        <Typography variant="h4" sx={{ fontWeight: "bold", color: "#1A237E", display: "inline-flex", gap: 1, alignItems: "center" }}>
          <AdminPanelSettingsIcon sx={{ fontSize: 28 }} />
          Manage Admins
        </Typography>
      </Box>

      <Button
        variant="contained"
        startIcon={<AddIcon />}
        onClick={onCreate}
        sx={{
          borderRadius: "12px", fontWeight: "bold",
          backgroundColor: "#81C784", color: "#1B5E20",
          "&:hover": { backgroundColor: "#66BB6A" },
        }}
      >
        Add Admin
      </Button>
    </Box>
  );
}
