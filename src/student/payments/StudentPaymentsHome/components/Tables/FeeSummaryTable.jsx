// src/student/payments/StudentPaymentsHome/components/Tables/FeeSummaryTable.jsx
import React from "react";
import {
    Paper, Table, TableHead, TableRow, TableCell, TableBody, TableContainer, Typography, Stack
} from "@mui/material";

export default function FeeSummaryTable({ rows, currency }) {
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
                        <TableCell>Course / Intake</TableCell>
                        <TableCell align="right">Total Fee ({currency})</TableCell>
                        <TableCell align="right">Paid ({currency})</TableCell>
                        <TableCell align="right">Remaining ({currency})</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {rows.map((e) => {
                        const remaining = Math.max(0, Number(e.fee) - Number(e.paid));
                        return (
                            <TableRow key={e.id} hover>
                                <TableCell>
                                    <Stack spacing={0.5}>
                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                            {e.courseName}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {e.intakeName}
                                        </Typography>
                                    </Stack>
                                </TableCell>
                                <TableCell align="right">{Number(e.fee).toFixed(2)}</TableCell>
                                <TableCell align="right">{Number(e.paid).toFixed(2)}</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 700 }}>
                                    {remaining.toFixed(2)}
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </TableContainer>
    );
}
