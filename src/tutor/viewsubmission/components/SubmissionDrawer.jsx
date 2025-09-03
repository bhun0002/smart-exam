import React, { useMemo } from "react";
import {
  Drawer, Box, Typography, Divider, Chip
} from "@mui/material";

const PrettyJson = ({ value }) => (
  <Box component="pre" sx={{ p: 2, bgcolor: "#f7f5f2", borderRadius: "12px", overflowX: "auto", fontSize: 12 }}>
    {JSON.stringify(value ?? {}, null, 2)}
  </Box>
);

const SubmissionDrawer = ({ open, onClose, submission, exam, intakeName }) => {
  const meta = useMemo(() => {
    if (!submission) return null;
    const startStr = submission.startTime?.seconds ? new Date(submission.startTime.seconds * 1000).toLocaleString() : "-";
    const endStr = submission.endTime?.seconds ? new Date(submission.endTime.seconds * 1000).toLocaleString() : "-";
    return { startStr, endStr };
  }, [submission]);

  return (
    <Drawer anchor="right" open={open} onClose={onClose} PaperProps={{ sx: { width: { xs: "100%", sm: 520 } } }}>
      <Box sx={{ p: 3, bgcolor: "#fff", height: "100%", display: "flex", flexDirection: "column", gap: 2 }}>
        <Typography variant="h6" sx={{ color: "#457b9d" }}>Submission Details</Typography>

        {submission ? (
          <>
            <Typography variant="subtitle2" color="text.secondary">Student</Typography>
            <Typography sx={{ mb: 1, fontWeight: "bold" }}>
              {submission.studentName} <Typography component="span" variant="caption">({submission.studentId})</Typography>
            </Typography>

            <Typography variant="subtitle2" color="text.secondary">Exam</Typography>
            <Typography sx={{ mb: 1 }}>{exam?.title || "-"}</Typography>

            <Typography variant="subtitle2" color="text.secondary">Intake</Typography>
            <Chip label={intakeName || "-"} color="info" size="small" sx={{ width: "fit-content", borderRadius: "8px" }} />

            <Divider sx={{ my: 2 }} />

            <Typography variant="subtitle2" color="text.secondary">Status</Typography>
            <Chip
              label={submission.isSubmitted ? "Submitted" : "In Progress"}
              color={submission.isSubmitted ? "success" : "warning"}
              size="small"
              sx={{ width: "fit-content", borderRadius: "8px", mb: 1 }}
            />

            <Typography variant="subtitle2" color="text.secondary">Timing</Typography>
            <Typography variant="body2">Start: {meta?.startStr}</Typography>
            <Typography variant="body2">End: {meta?.endStr}</Typography>
            <Typography variant="body2">Duration Taken (s): {submission.durationTaken ?? "-"}</Typography>

            <Divider sx={{ my: 2 }} />

            <Typography variant="subtitle2" color="text.secondary">Answers</Typography>
            <PrettyJson value={submission.answers} />
          </>
        ) : (
          <Typography variant="body2" color="text.secondary">No submission selected.</Typography>
        )}
      </Box>
    </Drawer>
  );
};

export default SubmissionDrawer;
