// src/student/payments/StudentPaymentsHome/components/Shared/SkeletonTable.jsx
import React from "react";
import { Paper, Skeleton, Stack } from "@mui/material";

export default function SkeletonTable({ rows = 4 }) {
  return (
    <Paper sx={{ p: 2, borderRadius: 2 }}>
      <Stack spacing={1}>
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} variant="rectangular" height={32} />
        ))}
      </Stack>
    </Paper>
  );
}
