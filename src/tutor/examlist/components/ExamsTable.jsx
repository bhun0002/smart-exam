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

// Fallback helpers (for older exams without saved totalPoints)
const hasInvalidPoints = (questions = []) =>
  (questions || []).some(q => !Number.isFinite(Number(q?.points)));

const computeTotalPoints = (questions = []) =>
  (questions || []).reduce((sum, q) => {
    const n = Number(q?.points);
    return sum + (Number.isFinite(n) ? n : 0);
  }, 0);

// Deleted flag helper (compat)
const isDeletedTrue = (v) => v === true || v === "true" || v === 1;

// Tiered chip styling
const getPointsChipStyle = (pts) => {
  if (!Number.isFinite(pts)) return { bgcolor: "#fff3e0", color: "#e65100" };
  if (pts >= 80) return { bgcolor: "#e8f5e9", color: "#1b5e20" };
  if (pts >= 40) return { bgcolor: "#e3f2fd", color: "#0d47a1" };
  return { bgcolor: "#f3e5f5", color: "#4a148c" };
};

const ExamsTable = ({
  rows,
  intakesMap,
  showPasswordForExamId,
  editAvailabilityForExamId,
  tempExamPassword,
  tempExamPasswordError,
  setTempExamPassword,
  onTogglePasswordVisibility,
  onView,
  onEdit,
  onSoftDelete,            // NEW
  onRestore,               // NEW
  onToggleAvailability,
  onConfirmAvailability,
  onCancelAvailability,
  showingDeleted,          // NEW
}) => {
  return (
    <TableContainer component={Paper} sx={{ boxShadow: 3 }}>
      <Table>
        <TableHead sx={{ bgcolor: "#ffd6a5" }}>
          <TableRow>
            <TableCell sx={{ fontWeight: "bold" }}>Title</TableCell>
            <TableCell sx={{ fontWeight: "bold" }}>Intake</TableCell>
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
              <TableCell colSpan={8} align="center">No exams found</TableCell>
            </TableRow>
          ) : rows.map((exam) => {
              const del = isDeletedTrue(exam.isDeleted);

              // prefer saved total; fallback compute
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

                    <TableCell>{exam.duration ?? "N/A"}</TableCell>

                    <TableCell>
                      <Chip
                        label={exam.isAvailable ? "Available" : "Unavailable"}
                        color={exam.isAvailable ? "success" : "error"}
                        size="small"
                        sx={{ fontWeight: "bold", borderRadius: "8px" }}
                      />
                    </TableCell>

                    <TableCell>
                      {exam.examPassword ? (
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Typography variant="body2" sx={{ fontFamily: "monospace" }}>
                            {showPasswordForExamId === exam.id ? exam.examPassword : "********"}
                          </Typography>
                          <IconButton size="small" onClick={() => onTogglePasswordVisibility(exam.id)} color="info">
                            <KeyIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => copyToClipboard(exam.examPassword, (ok) => { if (!ok) alert("Copy failed."); })}
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
                          <Button
                            size="small"
                            variant="outlined"
                            color={exam.isAvailable ? "error" : "success"}
                            onClick={() => onToggleAvailability(exam.id, exam.isAvailable)}
                            startIcon={exam.isAvailable ? <BlockIcon /> : <CheckCircleOutlineIcon />}
                            sx={{ mr: 1, borderRadius: "8px" }}
                            disabled={!!editAvailabilityForExamId && editAvailabilityForExamId !== exam.id}
                          >
                            {exam.isAvailable ? "Mark Unavailable" : "Mark Available"}
                          </Button>
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

                  {editAvailabilityForExamId === exam.id && !del && (
                    <TableRow>
                      <TableCell colSpan={8}>
                        <Box
                          sx={{
                            p: 2,
                            bgcolor: "#e0f7fa",
                            borderRadius: "12px",
                            display: "flex",
                            alignItems: "center",
                            gap: 2,
                            flexWrap: "wrap",
                          }}
                        >
                          <Typography variant="body2">Enter password to make exam available:</Typography>
                          <TextField
                            autoFocus
                            size="small"
                            label="Exam Password"
                            type="password"
                            value={tempExamPassword}
                            onChange={(e) => setTempExamPassword(e.target.value)}
                            error={!!tempExamPasswordError}
                            helperText={tempExamPasswordError}
                            sx={{ width: 220, "& .MuiOutlinedInput-root": { borderRadius: "8px" } }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && tempExamPassword.trim()) {
                                onConfirmAvailability(exam.id, true);
                              }
                            }}
                          />
                          <Button
                            variant="contained"
                            color="success"
                            onClick={() => onConfirmAvailability(exam.id, true)}
                            disabled={!tempExamPassword.trim()}
                            sx={{ borderRadius: "8px", fontWeight: "bold" }}
                          >
                            Confirm
                          </Button>
                          <Button variant="outlined" color="secondary" onClick={onCancelAvailability} sx={{ borderRadius: "8px" }}>
                            Cancel
                          </Button>
                        </Box>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              );
            })}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default ExamsTable;
