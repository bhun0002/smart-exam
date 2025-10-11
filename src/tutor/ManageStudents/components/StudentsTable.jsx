// src/admin/components/StudentsTable.jsx
import React from "react";
import {
  Paper, Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
  Stack, Chip, Button, Tooltip, Box, Avatar, Typography, IconButton
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import RestoreIcon from "@mui/icons-material/Restore";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";

const isDeletedTrue = (v) => v === true || v === "true" || v === 1;

const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text || "");
  } catch {
    alert("Copy failed.");
  }
};

export default function StudentsTable({
  rows,
  loading,
  onEdit,
  onSoftDelete,
  onRestore,
  onApprove,
  showingDeleted,
  page,
  totalPages,
  onPrev,
  onNext,
  onAddClick,
}) {
  return (
    <>
      <TableContainer component={Paper} sx={{ boxShadow: 3, borderRadius: "14px" }}>
        <Table stickyHeader size="medium">
          <TableHead
            sx={{
              bgcolor: "#ffd6a5",
              "& .MuiTableCell-head": {
                backgroundColor: "#ffd6a5",
              },
            }}
          >

            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>Student</TableCell>
              <TableCell sx={{ fontWeight: 700, width: 140 }}>Student ID</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Email</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Course</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Intake</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 700, width: 360 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={7} align="center">Loading…</TableCell></TableRow>
            ) : rows.length === 0 ? (
              <TableRow><TableCell colSpan={7} align="center">No students found.</TableCell></TableRow>
            ) : (
              rows.map((s) => {
                const del = isDeletedTrue(s.isDeleted);
                const initial = (s.name || s.email || "?").toString().charAt(0);
                return (
                  <TableRow key={s.id} sx={{ "&:hover": { bgcolor: "#f1f1f1" } }}>
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center" }}>
                        <Avatar sx={{ bgcolor: "#BBDEFB", color: "#1A237E", mr: 2, width: 32, height: 32, fontSize: "0.9rem" }}>
                          {initial}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                            {s.name || "Unknown"}
                          </Typography>
                          {del && (
                            <Chip label="Deleted" size="small" color="warning" sx={{ mt: 0.5, borderRadius: "8px" }} />
                          )}
                        </Box>
                      </Box>
                    </TableCell>

                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Chip
                          label={s.studentId || "—"}
                          size="small"
                          sx={{
                            bgcolor: "#FFFDE7",
                            color: "#5D4037",
                            fontWeight: 700,
                            borderRadius: "8px",
                            fontFamily:
                              "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
                          }}
                        />
                        {!!s.studentId && (
                          <Tooltip title="Copy Student ID">
                            <IconButton
                              size="small"
                              onClick={() => copyToClipboard(s.studentId)}
                              sx={{ p: 0.5 }}
                              aria-label="Copy Student ID"
                            >
                              <ContentCopyIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>

                    <TableCell>
                      <Box sx={{ display: "grid" }}>
                        <Typography variant="body2">{s.email || "—"}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {s.contactNumber || "—" /* ✅ show contact number */}
                        </Typography>
                      </Box>
                    </TableCell>

                    <TableCell>
                      <Chip
                        label={s.courseName || "N/A"}
                        size="small"
                        sx={{ bgcolor: "#F1F8E9", color: "#33691E", fontWeight: 700, borderRadius: "8px" }}
                      />
                    </TableCell>

                    <TableCell>
                      <Chip
                        label={s.intakeName || "N/A"}
                        size="small"
                        sx={{ bgcolor: "#E3F2FD", color: "#0D47A1", fontWeight: 700, borderRadius: "8px" }}
                      />
                    </TableCell>

                    <TableCell>
                      <Chip
                        label={s.isApproved ? "Approved" : "Pending"}
                        color={s.isApproved ? "success" : "warning"}
                        size="small"
                        sx={{ borderRadius: "8px", fontWeight: 700 }}
                      />
                    </TableCell>

                    <TableCell>
                      {del || showingDeleted ? (
                        <Tooltip title="Restore">
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<RestoreIcon />}
                            onClick={() => onRestore(s.id)}
                            sx={{ borderRadius: "10px", borderColor: "#81C784", color: "#1B5E20" }}
                          >
                            Restore
                          </Button>
                        </Tooltip>
                      ) : (
                        <Stack direction="row" spacing={1}>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => onApprove(s.id, !s.isApproved)}
                            sx={{
                              borderRadius: "10px",
                              borderColor: s.isApproved ? "#FFB74D" : "#81C784",
                              color: s.isApproved ? "#E65100" : "#1B5E20",
                            }}
                          >
                            {s.isApproved ? "Set Pending" : "Approve"}
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<EditIcon />}
                            onClick={() => onEdit(s)}
                            sx={{ borderRadius: "10px", borderColor: "#90CAF9", color: "#1565C0" }}
                          >
                            Edit
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            color="error"
                            startIcon={<DeleteOutlineIcon />}
                            onClick={() => onSoftDelete(s.id)}
                            sx={{ borderRadius: "10px" }}
                          >
                            Delete
                          </Button>
                        </Stack>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
}
