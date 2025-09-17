import React from "react";
import { Box, Button, Typography } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import FormatListBulletedIcon from "@mui/icons-material/FormatListBulleted";

export default function TopBar({ onBack }) {
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
          px: 2.25,
          py: 1.1,
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
          <FormatListBulletedIcon sx={{ fontSize: 28 }} />
          Exams List
        </Typography>
      </Box>

      <Box sx={{ width: 140 }} />
    </Box>
  );
}
