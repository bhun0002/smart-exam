import React from "react";
import { AppBar, Toolbar, Typography, Button } from "@mui/material";
import LogoutIcon from "@mui/icons-material/Logout";

export default function HeaderBar({ onLogout }) {
  return (
    <AppBar
      position="static"
      sx={{
        bgcolor: "rgba(255,255,255,0.6)",
        backdropFilter: "blur(10px)",
        borderBottom: "1px solid #ccc",
        boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
      }}
    >
      <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
        <Typography variant="h6" sx={{ color: "#37474f", fontWeight: "bold" }}>
          Student Exam List
        </Typography>
        <Button
          color="inherit"
          onClick={onLogout}
          startIcon={<LogoutIcon />}
          sx={{ color: "#e57373", fontWeight: "bold" }}
        >
          Logout
        </Button>
      </Toolbar>
    </AppBar>
  );
}
