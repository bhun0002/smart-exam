// src/student/payments/StudentPaymentsHome/components/Tables/ConfirmedPaymentsTable.jsx
import React from "react";
import {
  Paper, Table, TableHead, TableRow, TableCell, TableBody, TableContainer
} from "@mui/material";

export default function ConfirmedPaymentsTable({ rows, currency }) {
  return (
    <TableContainer component={Paper} elevation={3} sx={{ borderRadius: 2 }}>
          <Table size="medium" stickyHeader>
            {/* Force the sticky header to the cream color */}
            <TableHead
              sx={{
                bgcolor: "#ffd6a5",
                "& .MuiTableCell-head": { backgroundColor: "#ffd6a5", fontWeight: 700, fontSize: "0.95rem", py: 1.25 },
              }}
            >
          <TableRow>
            <TableCell>Date</TableCell>
            <TableCell align="right">Amount ({currency})</TableCell>
            <TableCell>Txn ID</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={r.id} hover>
              <TableCell>{r.createdAtDisplay}</TableCell>
              <TableCell align="right">{r.amountAppliedDisplay}</TableCell>
              <TableCell>{r.paymentId || "-"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
