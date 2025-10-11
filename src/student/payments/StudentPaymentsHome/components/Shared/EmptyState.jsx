// src/student/payments/StudentPaymentsHome/components/Shared/EmptyState.jsx
import React from "react";
import { Paper, Typography } from "@mui/material";

export default function EmptyState({ title }) {
  return (
    <Paper variant="outlined" sx={{ p: 3, borderRadius: 2, color: "text.secondary" }}>
      <Typography variant="body2">{title}</Typography>
    </Paper>
  );
}
