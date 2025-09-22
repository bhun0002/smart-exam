// src/student/payments/StudentPaymentsHome/components/Tables/ClaimsTable.jsx
import React from "react";
import {
  Paper, Table, TableHead, TableRow, TableCell, TableBody, TableContainer, Button, Chip
} from "@mui/material";

export default function ClaimsTable({ rows, onOpenProof }) {
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
            <TableCell>Claimed At</TableCell>
            <TableCell>Reference</TableCell>
            <TableCell align="right">Amount</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Proof</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((c) => (
            <TableRow key={c.id} hover>
              <TableCell>{c.claimedAtDisplay}</TableCell>
              <TableCell>{c.reference || "-"}</TableCell>
              <TableCell align="right">{c.amountDisplay}</TableCell>
              <TableCell>
                <Chip
                  size="small"
                  color={
                    c.status === "linked"
                      ? "success"
                      : c.status === "rejected"
                      ? "error"
                      : "default"
                  }
                  label={c.status}
                />
              </TableCell>
              <TableCell>
                {c.proofMedia ? (
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => onOpenProof(c)}
                    sx={{ borderRadius: "10px" }}
                  >
                    Open proof
                  </Button>
                ) : (
                  "—"
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
