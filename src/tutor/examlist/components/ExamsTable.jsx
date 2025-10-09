// src/tutor/examlist/components/ExamsTable.jsx
import React from "react";
import {
  Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Box, Avatar, Chip, Typography, IconButton, Button, TextField, Tooltip
} from "@mui/material";
import {
  Visibility as VisibilityIcon, Edit as EditIcon, Delete as DeleteIcon,
  Key as KeyIcon, CheckCircleOutline as CheckCircleOutlineIcon, Block as BlockIcon,
  ContentCopy as ContentCopyIcon, Restore as RestoreIcon
} from "@mui/icons-material";

const copyToClipboard = async (text, onResult) => {
  try {
    await navigator.clipboard.writeText(text);
    onResult?.(true);
  } catch {
    onResult?.(false);
  }
};

const hasInvalidPoints = (questions = []) =>
  (questions || []).some(q => !Number.isFinite(Number(q?.points)));

const computeTotalPoints = (questions = []) =>
  (questions || []).reduce((sum, q) => {
    const n = Number(q?.points);
    return sum + (Number.isFinite(n) ? n : 0);
  }, 0);

const isDeletedTrue = (v) => v === true || v === "true" || v === 1;

const getPointsChipStyle = (pts) => {
  if (!Number.isFinite(pts)) return { bgcolor: "#fff3e0", color: "#e65100" };
  if (pts >= 80) return { bgcolor: "#e8f5e9", color: "#1b5e20" };
  if (pts >= 40) return { bgcolor: "#e3f2fd", color: "#0d47a1" };
  return { bgcolor: "#f3e5f5", color: "#4a148c" };
};

const ExamsTable = ({
  rows,
  intakesMap,
  coursesMap,
  showPasswordForExamId,
  editAvailabilityForExamId,         // kept for API compatibility
  tempExamPassword,
  tempExamPasswordError,
  setTempExamPassword,
  onTogglePasswordVisibility,
  onView,
  onEdit,
  onSoftDelete,
  onRestore,
  onToggleAvailability,
  onConfirmAvailability,
  onCancelAvailability,
  showingDeleted,
}) => {
  return (
    <TableContainer component={Paper} sx={{ boxShadow: 3 }}>
      <Table>
        <TableHead sx={{ bgcolor: "#ffd6a5" }}>
          <TableRow>
            <TableCell sx={{ fontWeight: "bold" }}>Title</TableCell>
            <TableCell sx={{ fontWeight: "bold" }}>Intake</TableCell>
            <TableCell sx={{ fontWeight: "bold" }}>Course</TableCell>
            <TableCell sx={{ fontWeight: "bold" }}>Duration (min)</TableCell>
            <TableCell sx={{ fontWeight: "bold" }}>Availability</TableCell>
            <TableCell sx={{ fontWeight: "bold" }}>Password</TableCell>
            <TableCell sx={{ fontWeight: "bold" }}>Total Points</TableCell>
            <TableCell sx={{ fontWeight: "bold" }}>Created At</TableCell>
            <TableCell sx={{ fontWeight: "bold" }}>Actions</TableCell>
          </TableRow>
        </TableHead>

        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} align="center">No exams found</TableCell>
            </TableRow>
          ) : rows.map((exam) => {
            const del = isDeletedTrue(exam.isDeleted);

            const savedTotal = Number.isFinite(Number(exam.totalPoints)) ? Number(exam.totalPoints) : null;
            const fallbackHasInvalid = hasInvalidPoints(exam.questions);
            const fallbackTotal = fallbackHasInvalid ? null : computeTotalPoints(exam.questions);
            const displayTotal = savedTotal ?? fallbackTotal;
            const chipStyle = getPointsChipStyle(Number.isFinite(displayTotal) ? displayTotal : NaN);
            const mismatch =
              Number.isFinite(savedTotal) && Number.isFinite(fallbackTotal) && savedTotal !== fallbackTotal;

            const totalCell =
              displayTotal == null ? (
                <Tooltip
                  title={
                    savedTotal == null
                      ? "Points not saved on this exam (older record) or a question has invalid points."
                      : "Points missing/invalid on questions. Open the exam to fix."
                  }
                >
                  <Chip label="N/A" size="small" sx={{ fontWeight: "bold", borderRadius: "8px", ...chipStyle }} />
                </Tooltip>
              ) : mismatch ? (
                <Tooltip title={`Saved: ${savedTotal} • Recomputed: ${fallbackTotal}. Re-open and save to sync.`}>
                  <Chip
                    label={`${displayTotal} pts ⚠`}
                    size="small"
                    sx={{ fontWeight: "bold", borderRadius: "8px", bgcolor: "#fff3e0", color: "#e65100" }}
                  />
                </Tooltip>
              ) : (
                <Chip label={`${displayTotal} pts`} size="small" sx={{ fontWeight: "bold", borderRadius: "8px", ...chipStyle }} />
              );

            // Course name (prefer denormalized exam.courseName)
            const courseName = exam.courseName || coursesMap?.[exam.courseId] || "-";

            // 🔹 Availability/password from schedules (falls back to legacy if not present)

            const isAvail = !!exam.computedIsAvailable;                 // only schedule-driven availability
            const pwd = isAvail ? (exam.computedPassword || "") : "";   // only show schedule password
            
            return (
              <React.Fragment key={exam.id}>
                <TableRow sx={{ "&:hover": { bgcolor: "#f1f1f1" } }}>
                  <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
                      <Avatar
                        sx={{
                          bgcolor: "#BBDEFB",
                          color: "#1A237E",
                          width: 32,
                          height: 32,
                          fontSize: "0.9rem",
                        }}
                      >
                        {exam.title?.charAt(0) || "E"}
                      </Avatar>
                      <Box>
                        <Typography sx={{ fontWeight: 600 }}>{exam.title}</Typography>
                        {del && <Chip label="Deleted" size="small" color="warning" sx={{ mt: 0.5, borderRadius: "8px" }} />}
                      </Box>
                    </Box>
                  </TableCell>

                  <TableCell>
                    <Chip
                      label={intakesMap[exam.intakeId] || "Unknown Intake"}
                      color="info"
                      size="small"
                      sx={{ borderRadius: "8px", fontWeight: "bold" }}
                    />
                  </TableCell>

                  <TableCell>
                    <Chip label={courseName} size="small" sx={{ borderRadius: "8px", fontWeight: "bold" }} />
                  </TableCell>

                  <TableCell>{exam.duration ?? "N/A"}</TableCell>

                  <TableCell>
                    <Chip
                      label={isAvail ? "Available" : "Unavailable"}
                      color={isAvail ? "success" : "error"}
                      size="small"
                      sx={{ fontWeight: "bold", borderRadius: "8px" }}
                    />
                  </TableCell>

                  <TableCell>
                    {isAvail && pwd ? (
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Typography variant="body2" sx={{ fontFamily: "monospace" }}>
                          {showPasswordForExamId === exam.id ? pwd : "********"}
                        </Typography>
                        <IconButton size="small" onClick={() => onTogglePasswordVisibility(exam.id)} color="info">
                          <KeyIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => copyToClipboard(pwd, (ok) => { if (!ok) alert("Copy failed."); })}
                          color="primary"
                        >
                          <ContentCopyIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    ) : (
                      <Chip label="N/A" size="small" color="default" sx={{ borderRadius: "8px" }} />
                    )}
                  </TableCell>

                  <TableCell>{totalCell}</TableCell>

                  <TableCell>
                    {exam.createdAt
                      ? new Date((exam.createdAt.seconds ?? 0) * 1000).toLocaleDateString()
                      : "-"}
                  </TableCell>

                  <TableCell>
                    {del || showingDeleted ? (
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<RestoreIcon />}
                        onClick={() => onRestore(exam.id)}
                        sx={{ borderRadius: "8px", borderColor: "#81C784", color: "#1B5E20" }}
                      >
                        Restore
                      </Button>
                    ) : (
                      <>
                        <Button
                          size="small"
                          variant="outlined"
                          sx={{ mr: 1, borderRadius: "8px" }}
                          onClick={() => onView(exam)}
                          startIcon={<VisibilityIcon />}
                        >
                          View
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          sx={{ mr: 1, borderColor: "#ffc107", color: "#ffc107", borderRadius: "8px" }}
                          onClick={() => onEdit(exam)}
                          startIcon={<EditIcon />}
                        >
                          Edit
                        </Button>

                        {/* 🔒 Availability is now controlled by Schedule Exam */}
                        <Tooltip title="Availability is controlled by Schedule Exam">
                          <span>
                            <Button
                              size="small"
                              variant="outlined"
                              color={isAvail ? "error" : "success"}
                              startIcon={isAvail ? <BlockIcon /> : <CheckCircleOutlineIcon />}
                              sx={{ mr: 1, borderRadius: "8px" }}
                              disabled
                            >
                              {isAvail ? "Mark Unavailable" : "Mark Available"}
                            </Button>
                          </span>
                        </Tooltip>

                        <Button
                          size="small"
                          variant="outlined"
                          color="error"
                          onClick={() => onSoftDelete(exam.id)}
                          startIcon={<DeleteIcon />}
                          sx={{ borderRadius: "8px" }}
                        >
                          Delete
                        </Button>
                      </>
                    )}
                  </TableCell>
                </TableRow>

                {/* ❌ Inline password entry row removed by making the button disabled; keeps layout intact */}
              </React.Fragment>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default ExamsTable;
