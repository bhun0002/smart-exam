// src/student/StudentExamlist/components/ExamsTable.jsx
import React from "react";
import {
  Avatar,
  Box,
  Button,
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Divider,
} from "@mui/material";
import PlayCircleOutlineIcon from "@mui/icons-material/PlayCircleOutline";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";

/** UI-only: neutral table like Tutor list (tan header, white rows, subtle borders) */
export default function ExamsTable({
  rows,
  page,
  totalPages,
  onPrev,
  onNext,
  onAttempt,
  showPwdForExamId,
  attemptPwd,
  setAttemptPwd,
  attemptPwdErr,
  onVerify,
  onCancelPwd,
}) {
  return (
    <>
      <TableContainer component={Paper} sx={{ boxShadow: 3 }}>
        <Table>
          <TableHead sx={{ bgcolor: "#ffd6a5" }}>
            <TableRow>
              <TableCell sx={{ fontWeight: "bold" }}>Title</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Intake</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Duration (min)</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>
                Actions
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align="center">No exams found</TableCell>
              </TableRow>
            ) : (
              rows.map((exam) => (
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
                        <Typography sx={{ fontWeight: 600, color: "#111827" }}>
                          {exam.title || "Untitled"}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={exam.intakeName || "Unknown Intake"}
                        color="info"
                        size="small"
                        sx={{ borderRadius: "8px", fontWeight: "bold" }}
                      />
                    </TableCell>

                    <TableCell>
                      <Typography sx={{ color: "#374151" }}>
                        {exam.duration ?? "N/A"}
                      </Typography>
                    </TableCell>

                    <TableCell align="right">
                      {exam.isSubmitted ? (
                        <Chip
                          icon={<CheckCircleOutlineIcon />}
                          label="Exam Submitted"
                          size="medium"
                          color="success"
                          sx={{ fontWeight: 800, borderRadius: 2 }}
                        />
                      ) : (
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => onAttempt(exam)}
                          startIcon={<PlayCircleOutlineIcon />}
                          sx={{
                            borderRadius: 2,
                            fontWeight: 800,
                            textTransform: "none",
                            color: "#374151",
                            borderColor: "#9ca3af",
                            "&:hover": { bgcolor: "#f3f4f6", borderColor: "#6b7280" },
                          }}
                          disabled={showPwdForExamId === exam.id && !attemptPwdErr}
                        >
                          Attempt
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>

                  {showPwdForExamId === exam.id && (
                    <TableRow>
                      <TableCell colSpan={4} sx={{ p: 0 }}>
                        <Divider />
                        <Box
                          sx={{
                            p: 2,
                            display: "flex",
                            alignItems: "center",
                            gap: 2,
                            flexWrap: "wrap",
                            bgcolor: "#f9fafb",
                          }}
                        >
                          <Typography variant="body2" sx={{ color: "#374151", fontWeight: 700 }}>
                            Enter exam password:
                          </Typography>

                          <TextField
                            autoFocus
                            size="small"
                            label="Password"
                            type="password"
                            value={attemptPwd}
                            onChange={(e) => setAttemptPwd(e.target.value)}
                            error={!!attemptPwdErr}
                            helperText={attemptPwdErr}
                            sx={{
                              width: 240,
                              "& .MuiOutlinedInput-root": { borderRadius: 2 },
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && attemptPwd.trim()) {
                                onVerify(exam.id, exam.examPassword);
                              }
                            }}
                          />

                          <Button
                            variant="contained"
                            onClick={() => onVerify(exam.id, exam.examPassword)}
                            disabled={!attemptPwd.trim()}
                            sx={{
                              borderRadius: 2,
                              fontWeight: 800,
                              textTransform: "none",
                              bgcolor: "#2563eb",
                              "&:hover": { bgcolor: "#1d4ed8" },
                            }}
                          >
                            Start Exam
                          </Button>

                          <Button
                            variant="outlined"
                            color="inherit"
                            onClick={onCancelPwd}
                            sx={{
                              borderRadius: 2,
                              fontWeight: 700,
                              textTransform: "none",
                              borderColor: "#9ca3af",
                              color: "#374151",
                              "&:hover": { bgcolor: "#f3f4f6", borderColor: "#6b7280" },
                            }}
                          >
                            Cancel
                          </Button>
                        </Box>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
}
