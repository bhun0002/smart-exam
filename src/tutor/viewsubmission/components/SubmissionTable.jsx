// src/tutor/viewsubmission/components/SubmissionTable.jsx
import React from "react";
import {
  Box, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Button, Avatar, Chip, Typography
} from "@mui/material";
import {
  Visibility as VisibilityIcon,
  Grade as GradeIcon,
  Delete as DeleteIcon
} from "@mui/icons-material";

const SubmissionTable = ({
  loading,
  rows,
  page,
  totalPages,
  onPageChange,
  examsMap,
  intakesMap,
  onView,
  onGrade,
  onDelete,
}) => {
  return (
    <>
      <TableContainer component={Paper} sx={{ boxShadow: 3 }}>
        <Table>
          <TableHead sx={{ bgcolor: "#ffd6a5" }}>
            <TableRow>
              <TableCell sx={{ fontWeight: "bold" }}>Student</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Exam</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Intake</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Status</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Start</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>End</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Duration (s)</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={8} align="center">Loading…</TableCell></TableRow>
            ) : rows.length === 0 ? (
              <TableRow><TableCell colSpan={8} align="center">No submissions found</TableCell></TableRow>
            ) : (
              rows.map(row => {
                const exam = examsMap[row.examId];
                const intakeName = exam ? (intakesMap[exam.intakeId] || "Unknown") : "-";
                const startStr = row.startTime?.seconds ? new Date(row.startTime.seconds * 1000).toLocaleString() : "-";
                const endStr = row.endTime?.seconds ? new Date(row.endTime.seconds * 1000).toLocaleString() : "-";
                const initial = (row.studentName || row.studentId || "?").toString().charAt(0);

                return (
                  <TableRow key={row.id} sx={{ "&:hover": { bgcolor: "#f1f1f1" } }}>
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center" }}>
                        <Avatar sx={{ bgcolor: "#BBDEFB", color: "#1A237E", mr: 2, width: 32, height: 32, fontSize: "0.9rem" }}>
                          {initial}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                            {row.studentName || "-"}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            ID: {row.humanStudentId || "—"}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>{exam ? exam.title : "-"}</TableCell>
                    <TableCell>
                      <Chip label={intakeName} color="info" size="small" sx={{ borderRadius: "8px", fontWeight: "bold" }} />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={row.isSubmitted ? "Submitted" : "In Progress"}
                        color={row.isSubmitted ? "success" : "warning"}
                        size="small"
                        sx={{ borderRadius: "8px", fontWeight: "bold" }}
                      />
                    </TableCell>
                    <TableCell>{startStr}</TableCell>
                    <TableCell>{endStr}</TableCell>
                    <TableCell>{row.durationTaken ?? "-"}</TableCell>
                    <TableCell>
                      <Button size="small" variant="outlined" sx={{ mr: 1, borderRadius: "8px" }} onClick={() => onView(row)} startIcon={<VisibilityIcon />}>
                        View
                      </Button>
                      <Button size="small" variant="outlined" sx={{ mr: 1, borderColor: "#ffc107", color: "#ffc107", borderRadius: "8px" }} onClick={() => onGrade(row)} startIcon={<GradeIcon />}>
                        Grade
                      </Button>
                      <Button size="small" variant="outlined" color="error" sx={{ borderRadius: "8px" }} onClick={() => onDelete(row)} startIcon={<DeleteIcon />}>
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 2 }}>
        <Button variant="outlined" disabled={page === 1} onClick={() => onPageChange(p => p - 1)} sx={{ borderRadius: "12px" }}>
          Previous
        </Button>
        <Typography>Page {page} of {totalPages}</Typography>
        <Button variant="outlined" disabled={page === totalPages} onClick={() => onPageChange(p => p + 1)} sx={{ borderRadius: "12px" }}>
          Next
        </Button>
      </Box>
    </>
  );
};

export default SubmissionTable;
