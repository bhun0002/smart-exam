import * as React from "react";
import { Paper, Box, Typography, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";

/**
 * Minimal inline icons to avoid adding new deps.
 * Alternatives: swap for @mui/icons-material if you already use it.
 */
function RoleIcon({ name }) {
  const base = { width: 28, height: 28, fill: "#fff" };
  if (name === "settings") {
    return (
      <svg viewBox="0 0 24 24" style={base} aria-hidden="true">
        <path d="M19.14,12.94a7.77,7.77,0,0,0,.05-.94,7.77,7.77,0,0,0-.05-.94l2.11-1.65a.5.5,0,0,0,.12-.65l-2-3.46a.5.5,0,0,0-.6-.22l-2.49,1a7.57,7.57,0,0,0-1.63-.94l-.38-2.65A.5.5,0,0,0,13.78,2H10.22a.5.5,0,0,0-.49.41L9.35,5.06a7.57,7.57,0,0,0-1.63.94l-2.49-1a.5.5,0,0,0-.6.22l-2,3.46a.5.5,0,0,0,.12.65L4.86,11.06a7.77,7.77,0,0,0-.05.94,7.77,7.77,0,0,0,.05.94L2.75,14.59a.5.5,0,0,0-.12.65l2,3.46a.5.5,0,0,0,.6.22l2.49-1a7.57,7.57,0,0,0,1.63.94l.38,2.65a.5.5,0,0,0,.49.41h3.56a.5.5,0,0,0,.49-.41l.38-2.65a7.57,7.57,0,0,0,1.63-.94l2.49,1a.5.5,0,0,0,.6-.22l2-3.46a.5.5,0,0,0-.12-.65ZM12,15.5A3.5,3.5,0,1,1,15.5,12,3.5,3.5,0,0,1,12,15.5Z" />
      </svg>
    );
  }
  if (name === "shield") {
    return (
      <svg viewBox="0 0 24 24" style={base} aria-hidden="true">
        <path d="M12 2l7 4v6c0 5-3.8 9.3-7 10-3.2-.7-7-5-7-10V6l7-4z" />
      </svg>
    );
  }
  if (name === "cap") {
    return (
      <svg viewBox="0 0 24 24" style={base} aria-hidden="true">
        <path d="M12 3L1 8l11 5 9-4.09V17h2V8L12 3zm-7 9v4.5c0 2.21 3.58 4 8 4s8-1.79 8-4V12l-8 3.64L5 12z" />
      </svg>
    );
  }
  // person
  return (
    <svg viewBox="0 0 24 24" style={base} aria-hidden="true">
      <path d="M12 12c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm0 2c-3.33 0-10 1.67-10 5v3h20v-3c0-3.33-6.67-5-10-5z" />
    </svg>
  );
}

export default function RoleCard({ color, icon, title, description, ctaText, to, tokens }) {
  const navigate = useNavigate();

  return (
    <Paper
      elevation={8}
      role="region"
      aria-label={`${title} card`}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          navigate(to);
        }
      }}
      sx={{
        p: 2.5,
        borderRadius: `${tokens.radius}px`,
        bgcolor: color,
        color: "#fff",
        boxShadow: tokens.cardShadow,
        transition: "transform .2s ease, box-shadow .2s ease",
        cursor: "pointer",
        outline: "none",
        "&:hover": { transform: "translateY(-3px)", boxShadow: tokens.cardShadowHover },
        "&:focus-visible": { boxShadow: `${tokens.cardShadowHover}, 0 0 0 3px rgba(59,130,246,.5)` },
      }}
      onClick={() => navigate(to)}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1 }}>
        <RoleIcon name={icon} />
        <Typography variant="h5" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
          {title}
        </Typography>
      </Box>

      <Typography sx={{ opacity: 0.9, mb: 2 }}>{description}</Typography>

      <Button
        variant="contained"
        disableElevation
        aria-label={`${title} login`}
        onClick={(e) => {
          e.stopPropagation();
          navigate(to);
        }}
        sx={{
          textTransform: "none",
          borderRadius: 2,
          fontWeight: 600,
          bgcolor: "rgba(0,0,0,0.25)",
          "&:hover": { bgcolor: "rgba(0,0,0,0.35)" },
        }}
      >
        {ctaText}
      </Button>
    </Paper>
  );
}
