// src/tutor/viewsubmission/components/SubmissionDrawer.jsx
import React, { useMemo } from "react";
import {
  Drawer, Box, Typography, Divider, Chip, Paper
} from "@mui/material";

const CodeBlock = ({ value }) => (
  <Box
    component="pre"
    sx={{
      p: 1.5,
      bgcolor: "#f7f5f2",
      borderRadius: "8px",
      overflowX: "auto",
      fontSize: 12,
      m: 0,
    }}
  >
    {typeof value === "string" ? value : JSON.stringify(value ?? {}, null, 2)}
  </Box>
);

/** Try to resolve student's display answer for different question types */
const resolveStudentAnswer = (q, ans) => {
  if (ans === undefined || ans === null) return "—";

  switch (q?.type) {
    case "multiple-choice": {
      // Student might have saved the *option id* or the option text itself.
      const opts = Array.isArray(q.options) ? q.options : [];
      const byId = opts.find((o) => o.id && o.id === ans);
      if (byId) return byId.text ?? String(ans);
      const byText = opts.find((o) => (o.text ?? "").trim() === String(ans).trim());
      return byText ? byText.text : String(ans);
    }
    case "true-false":
      return String(ans);
    case "fill-blanks":
    case "short-answer":
    case "reasoning":
      return String(ans);
    case "match": {
      // Many ways to store a match answer — show structured if we recognize, else JSON.
      // Common shapes:
      // - [{left:"A", right:"1"}, ...]
      // - [{leftIndex:0, rightIndex:2}, ...] with q.matchPairs
      // - { "A": "1", ... }
      if (Array.isArray(ans)) {
        // If it's array of pairs/indices, render line-by-line
        return (
          <Box sx={{ display: "grid", gap: 0.5 }}>
            {ans.map((p, i) => {
              if (typeof p === "object" && p) {
                if ("left" in p || "right" in p) {
                  return (
                    <Typography key={i} variant="body2">
                      {String(p.left ?? "—")} → {String(p.right ?? "—")}
                    </Typography>
                  );
                }
                if ("leftIndex" in p || "rightIndex" in p) {
                  const left = q.matchPairs?.[p.leftIndex]?.left ?? `#${p.leftIndex}`;
                  const right = q.matchPairs?.[p.rightIndex]?.right ?? `#${p.rightIndex}`;
                  return (
                    <Typography key={i} variant="body2">
                      {String(left)} → {String(right)}
                    </Typography>
                  );
                }
              }
              return <CodeBlock key={i} value={p} />;
            })}
          </Box>
        );
      }
      if (typeof ans === "object") {
        return <CodeBlock value={ans} />;
      }
      return String(ans);
    }
    default:
      return typeof ans === "object" ? <CodeBlock value={ans} /> : String(ans);
  }
};

/** Show the correct answer (if present on the exam question) in a readable way */
const resolveCorrectAnswer = (q) => {
  if (!q) return null;
  const correct = q.answer;
  if (correct === undefined || correct === null || correct === "") return null;

  if (q.type === "multiple-choice") {
    const opts = Array.isArray(q.options) ? q.options : [];
    const byId = opts.find((o) => o.id && o.id === correct);
    if (byId) return byId.text ?? String(correct);
    const byText = opts.find((o) => (o.text ?? "").trim() === String(correct).trim());
    return byText ? byText.text : String(correct);
  }
  if (q.type === "true-false") return String(correct);

  // Text types
  if (["fill-blanks", "short-answer", "reasoning"].includes(q.type)) {
    return String(correct);
  }

  // For match, correct can be complex—show JSON compactly
  if (q.type === "match") return <CodeBlock value={correct} />;

  return String(correct);
};

const QAItem = ({ index, q, studentAns }) => {
  const displayStudent = resolveStudentAnswer(q, studentAns);
  const displayCorrect = resolveCorrectAnswer(q);
  const hasCorrect = displayCorrect !== null && displayCorrect !== undefined;

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        borderRadius: "12px",
        bgcolor: "#fafafa",
        "& + &": { mt: 1.5 },
      }}
    >
      <Box sx={{ display: "flex", alignItems: "baseline", gap: 1, mb: 1 }}>
        <Chip
          size="small"
          label={`Q${index + 1}`}
          sx={{ borderRadius: "8px", bgcolor: "#e3f2fd", color: "#0d47a1", fontWeight: "bold" }}
        />
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          {q?.question || "Untitled question"}
        </Typography>
      </Box>

      <Box sx={{ display: "grid", gap: 1 }}>
        <Box>
          <Typography variant="caption" color="text.secondary">
            Student’s answer
          </Typography>
          <Typography variant="body2" sx={{ mt: 0.25 }}>
            {typeof displayStudent === "string" ? displayStudent : displayStudent}
          </Typography>
        </Box>

        {hasCorrect && (
          <Box>
            <Typography variant="caption" color="text.secondary">
              Correct answer
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.25 }}>
              {typeof displayCorrect === "string" ? displayCorrect : displayCorrect}
            </Typography>
          </Box>
        )}

        {(q?.points || q?.points === 0) && (
          <Box>
            <Typography variant="caption" color="text.secondary">
              Points (max)
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.25 }}>{q.points}</Typography>
          </Box>
        )}
      </Box>
    </Paper>
  );
};

const SubmissionDrawer = ({ open, onClose, submission, exam, intakeName }) => {
  const meta = useMemo(() => {
    if (!submission) return null;
    const startStr = submission.startTime?.seconds
      ? new Date(submission.startTime.seconds * 1000).toLocaleString()
      : "-";
    const endStr = submission.endTime?.seconds
      ? new Date(submission.endTime.seconds * 1000).toLocaleString()
      : "-";
    return { startStr, endStr };
  }, [submission]);

  // Build Q&A list: align exam questions order with student's answers
  const qaList = useMemo(() => {
    if (!submission || !exam) return [];
    const ansMap = submission.answers || {};
    const list = Array.isArray(exam.questions)
      ? exam.questions.map((q, i) => ({
          index: i,
          q,
          studentAns: ansMap[q.id], // answers keyed by question id
        }))
      : [];
    // If there are answers to unknown question IDs, you could append them here as "extra"
    return list;
  }, [submission, exam]);

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { width: { xs: "100%", sm: 560 } } }}
    >
      <Box
        sx={{
          p: 3,
          bgcolor: "#fff",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
      >
        <Typography variant="h6" sx={{ color: "#457b9d" }}>
          Submission Details
        </Typography>

        {submission ? (
          <>
            <Typography variant="subtitle2" color="text.secondary">
              Student
            </Typography>
            <Typography sx={{ mb: 1, fontWeight: "bold" }}>
              {submission.studentName}{" "}
              <Typography component="span" variant="caption">
                ({submission.humanStudentId || submission.studentId || "—"})
              </Typography>
            </Typography>

            <Typography variant="subtitle2" color="text.secondary">
              Exam
            </Typography>
            <Typography sx={{ mb: 1 }}>{exam?.title || "-"}</Typography>

            <Typography variant="subtitle2" color="text.secondary">
              Intake
            </Typography>
            <Chip
              label={intakeName || "-"}
              color="info"
              size="small"
              sx={{ width: "fit-content", borderRadius: "8px" }}
            />

            <Divider sx={{ my: 2 }} />

            <Typography variant="subtitle2" color="text.secondary">
              Status
            </Typography>
            <Chip
              label={submission.isSubmitted ? "Submitted" : "In Progress"}
              color={submission.isSubmitted ? "success" : "warning"}
              size="small"
              sx={{ width: "fit-content", borderRadius: "8px", mb: 1 }}
            />

            <Typography variant="subtitle2" color="text.secondary">
              Timing
            </Typography>
            <Typography variant="body2">Start: {meta?.startStr}</Typography>
            <Typography variant="body2">End: {meta?.endStr}</Typography>
            <Typography variant="body2">
              Duration Taken (s): {submission.durationTaken ?? "-"}
            </Typography>

            <Divider sx={{ my: 2 }} />

            <Typography variant="subtitle2" color="text.secondary">
              Answers
            </Typography>

            {/* Q&A list cards */}
            <Box sx={{ display: "grid", gap: 1.5 }}>
              {qaList.length ? (
                qaList.map(({ index, q, studentAns }) => (
                  <QAItem key={q.id || index} index={index} q={q} studentAns={studentAns} />
                ))
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No questions to display.
                </Typography>
              )}
            </Box>

            {/* If there were unexpected answers (ids not in exam), show raw JSON for debugging */}
            {(!exam?.questions || !exam.questions.length) && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  Raw Answers
                </Typography>
                <CodeBlock value={submission.answers} />
              </Box>
            )}
          </>
        ) : (
          <Typography variant="body2" color="text.secondary">
            No submission selected.
          </Typography>
        )}
      </Box>
    </Drawer>
  );
};

export default SubmissionDrawer;
