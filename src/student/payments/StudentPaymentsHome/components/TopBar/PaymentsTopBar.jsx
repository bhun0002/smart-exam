import React from "react";
import { Box, Typography, Button, Stack } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import WalletIcon from "@mui/icons-material/Wallet";

/**
 * Clean top bar that matches your Admin pages:
 * - Left: Back button (optional)
 * - Center: Big title with icon
 * - Right: (intentionally empty; actions live in FiltersBar)
 *
 * Props:
 * - onBack?: () => void
 * - title: string
 */
export default function PaymentsTopBar({ onBack, title }) {
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
          visibility: onBack ? "visible" : "hidden",
        }}
      >
        Back to Dashboard
      </Button>

      <Box sx={{ flex: 1, textAlign: "center" }}>
        <Stack direction="row" spacing={1} justifyContent="center" alignItems="center">
          <Typography
            variant="h4"
            sx={{
              fontWeight: "bold",
              color: "#1A237E",
              display: "inline-flex",
              gap: 1,
              alignItems: "center",
            }}
          >
            <WalletIcon sx={{ fontSize: 28 }} />
            {title}
          </Typography>
        </Stack>
      </Box>

      {/* right side intentionally empty (actions live in FiltersBar) */}
      <Box sx={{ width: 148 }} />
    </Box>
  );
}
