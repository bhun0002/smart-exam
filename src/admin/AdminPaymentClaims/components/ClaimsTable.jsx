// src/admin/AdminPaymentClaims/ClaimsTable.jsx
import React from "react";
import {
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  Button,
  Paper,
  Chip,
  Typography,
  Stack,
} from "@mui/material";

export default function ClaimsTable({ rows = [], onReview }) {
  return (
    <TableContainer component={Paper} elevation={3} sx={{ borderRadius: 2 }}>
            <Table size="medium" stickyHeader>
                <TableHead
                    sx={{
                        bgcolor: "#ffd6a5",
                        "& .MuiTableCell-head": { backgroundColor: "#ffd6a5", fontWeight: 700, fontSize: "0.95rem", py: 1.25 },
                    }}
                >
      
        <TableRow>
          <TableCell>Student</TableCell>
          <TableCell>Claimed At</TableCell>
          <TableCell>Reference</TableCell>
          <TableCell align="right">Amount</TableCell>
          <TableCell>Status</TableCell>
          <TableCell>Actions</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {rows.length === 0 ? (
          <TableRow>
            <TableCell colSpan={6}>No claims.</TableCell>
          </TableRow>
        ) : (
          rows.map((r) => (
            <TableRow key={r.id} hover>
              <TableCell>
                <Stack spacing={0}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {r.studentName || r.studentId || "—"}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {r.studentMintId ? `ID: ${r.studentMintId}` : " "}
                  </Typography>
                </Stack>
              </TableCell>
              <TableCell>
                {r.claimedAt?.toDate?.().toLocaleString?.() || r.claimedAt || "—"}
              </TableCell>
              <TableCell>{r.reference || "—"}</TableCell>
              <TableCell align="right">
                {typeof r.amountClaimed === "number" ? r.amountClaimed.toFixed(2) : "—"}
              </TableCell>
              <TableCell>
                <Chip size="small" label={r.status || "pending"} />
              </TableCell>
              <TableCell>
                <Button size="small" variant="outlined" onClick={() => onReview(r)}>
                  REVIEW
                </Button>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
    </TableContainer>
  );
}
