import * as React from "react";
import {
    Typography,
    Button,
    AppBar,
    Toolbar,
  } from "@mui/material";
import LogoutIcon from "@mui/icons-material/Logout";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../AuthContext";

export default function TopBar({ title }) {
  const navigate = useNavigate();
const { logout } = useAuth();
  const handleLogout = () => {
    logout();
    navigate("/student-login");
  };
  return (
    <AppBar
    position="static"
    elevation={0}
    sx={{
      bgcolor: "rgba(255, 255, 255, 0.8)",
      backdropFilter: "blur(10px)",
      borderBottom: "1px solid #e0e0e0",
    }}
  >
    <Toolbar>
      <Typography
        variant="h6"
        component="div"
        sx={{ flexGrow: 1, color: "#37474f", fontWeight: "bold" }}
      >
        {title}
      </Typography>
      <Button
        color="inherit"
        onClick={handleLogout}
        sx={{ color: "#e57373" }}
        startIcon={<LogoutIcon />}
      >
        Logout
      </Button>
    </Toolbar>
  </AppBar>
  );
}
