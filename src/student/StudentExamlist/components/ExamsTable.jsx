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
} from "@mui/material";
import PlayCircleOutlineIcon from "@mui/icons-material/PlayCircleOutline";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";

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
          <TableHead sx={{ bgcolor: "#c8e6c9" }}>
            <TableRow>
              <TableCell sx={{ fontWeight: "bold", color: "#1b5e20" }}>Title</TableCell>
              <TableCell sx={{ fontWeight: "bold", color: "#1b5e20" }}>Intake</TableCell>
              <TableCell sx={{ fontWeight: "bold", color: "#1b5e20" }}>Duration (min)</TableCell>
              <TableCell sx={{ fontWeight: "bold", color: "#1b5e20" }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                  <Typography variant="body1" color="text.secondary">
                    No exams found for your intake/course or matching your criteria.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              rows.map((exam) => (
                <React.Fragment key={exam.id}>
                  <TableRow
                    sx={{
                      "&:hover": { bgcolor: "#f1f8e9" },
                      ...(exam.isSubmitted && { bgcolor: "#e0e0e0", opacity: 0.9 }),
                    }}
                  >
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center" }}>
                        <Avatar
                          sx={{
                            bgcolor: "#A5D6A7",
                            color: "#1B5E20",
                            mr: 2,
                            width: 32,
                            height: 32,
                            fontSize: "0.9rem",
                          }}
                        >
                          {exam.title?.charAt(0) || "E"}
                        </Avatar>
                        {exam.title || "Untitled"}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={exam.intakeName || "Unknown Intake"}
                        color="success"
                        size="small"
                        sx={{ borderRadius: "8px", fontWeight: "bold" }}
                      />
                    </TableCell>
                    <TableCell>{exam.duration || "N/A"}</TableCell>
                    <TableCell>
                      {exam.isSubmitted ? (
                        <Chip
                          icon={<CheckCircleOutlineIcon />}
                          label="Exam Submitted"
                          size="medium"
                          color="success"
                          sx={{
                            fontWeight: "bold",
                            borderRadius: "8px",
                            bgcolor: "#81c784",
                            color: "white",
                          }}
                        />
                      ) : (
                        <Button
                          size="small"
                          variant="contained"
                          color="primary"
                          onClick={() => onAttempt(exam)}
                          startIcon={<PlayCircleOutlineIcon />}
                          sx={{
                            borderRadius: "8px",
                            fontWeight: "bold",
                            bgcolor: "#388e3c",
                            "&:hover": { bgcolor: "#2e7d32" },
                          }}
                          disabled={showPwdForExamId === exam.id && !attemptPwdErr}
                        >
                          Attempt Exam
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>

                  {showPwdForExamId === exam.id && (
                    <TableRow>
                      <TableCell colSpan={4}>
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
                          <Typography variant="body2" sx={{ mr: 1, color: "#37474f" }}>
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
                            sx={{ width: 220, "& .MuiOutlinedInput-root": { borderRadius: "8px" } }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && attemptPwd.trim()) {
                                onVerify(exam.id, exam.examPassword);
                              }
                            }}
                          />
                          <Button
                            variant="contained"
                            color="success"
                            onClick={() => onVerify(exam.id, exam.examPassword)}
                            disabled={!attemptPwd.trim()}
                            sx={{ borderRadius: "8px", fontWeight: "bold" }}
                          >
                            Start Exam
                          </Button>
                          <Button
                            variant="outlined"
                            color="secondary"
                            onClick={onCancelPwd}
                            sx={{ borderRadius: "8px" }}
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

      {/* Pager */}
      {rows.length > 0 && (
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mt: 2,
          }}
        >
          <Button
            variant="outlined"
            disabled={page <= 1}
            onClick={onPrev}
            sx={{ borderRadius: "12px", borderColor: "#4CAF50", color: "#4CAF50" }}
          >
            Previous
          </Button>
          <Typography>Page {page} of {totalPages || 1}</Typography>
          <Button
            variant="outlined"
            disabled={page >= totalPages}
            onClick={onNext}
            sx={{ borderRadius: "12px", borderColor: "#4CAF50", color: "#4CAF50" }}
          >
            Next
          </Button>
        </Box>
      )}
    </>
  );
}
