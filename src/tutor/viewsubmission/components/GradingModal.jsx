// src/tutor/viewsubmission/components/GradingModal.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  AppBar, Box, Button, Chip, Dialog, IconButton, Toolbar, Typography,
  Paper, TextField, Tooltip, Divider, Stack
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import RemoveCircleOutlineIcon from "@mui/icons-material/RemoveCircleOutline";
import ChangeCircleIcon from "@mui/icons-material/ChangeCircle";

// ---------- helpers ----------
const sum = (arr) => arr.reduce((a, b) => a + b, 0);
const toNum = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};
const clamp = (v, min, max) => Math.min(Math.max(toNum(v), min), max);
const normalize = (s) => String(s ?? "").trim().toLowerCase();

// ---------- styling helpers (same as before) ----------
const statusPalette = (status) => {
  switch (status) {
    case "correct":
      return { cardBorder: "#A5D6A7", cardBg: "#F1F8E9", studentBg: "#E8F5E9", studentBorder: "#81C784", correctBg: "#E3F2FD", correctBorder: "#90CAF9", badgeColor: "success" };
    case "partial":
      return { cardBorder: "#FFECB3", cardBg: "#FFF8E1", studentBg: "#FFF3E0", studentBorder: "#FFCC80", correctBg: "#EDE7F6", correctBorder: "#B39DDB", badgeColor: "warning" };
    case "incorrect":
      return { cardBorder: "#EF9A9A", cardBg: "#FFEBEE", studentBg: "#FFEBEE", studentBorder: "#EF9A9A", correctBg: "#E3F2FD", correctBorder: "#90CAF9", badgeColor: "error" };
    case "needs-review":
    default:
      return { cardBorder: "#B0BEC5", cardBg: "#ECEFF1", studentBg: "#F5F5F5", studentBorder: "#CFD8DC", correctBg: "#EDE7F6", correctBorder: "#B39DDB", badgeColor: "info" };
  }
};

// ---------- render helpers (same as before) ----------
const mcqText = (q, value) => {
  const opts = Array.isArray(q?.options) ? q.options : [];
  const byId = opts.find((o) => o.id && o.id === value);
  if (byId) return byId.text ?? String(value);
  const byText = opts.find((o) => normalize(o.text) === normalize(value));
  return byText ? byText.text : String(value ?? "—");
};
const renderStudentAnswer = (q, ans) => {
  if (ans === undefined || ans === null || ans === "") return "—";
  switch (q?.type) {
    case "multiple-choice":
      return mcqText(q, ans);
    case "true-false":
    case "short-answer":
    case "fill-blanks":
    case "reasoning":
      return String(ans);
    case "match":
      if (Array.isArray(ans)) {
        return (
          <Box sx={{ display: "grid", gap: 0.5 }}>
            {ans.map((p, i) => {
              if (p && typeof p === "object") {
                if ("left" in p || "right" in p) {
                  return <Typography key={i} variant="body2">{String(p.left ?? "—")} → {String(p.right ?? "—")}</Typography>;
                }
                if ("leftIndex" in p || "rightIndex" in p) {
                  const l = q.matchPairs?.[p.leftIndex]?.left ?? `#${p.leftIndex}`;
                  const r = q.matchPairs?.[p.rightIndex]?.right ?? `#${p.rightIndex}`;
                  return <Typography key={i} variant="body2">{String(l)} → {String(r)}</Typography>;
                }
              }
              return <Typography key={i} variant="body2">{String(p)}</Typography>;
            })}
          </Box>
        );
      }
      return typeof ans === "object" ? JSON.stringify(ans) : String(ans);
    default:
      return typeof ans === "object" ? JSON.stringify(ans) : String(ans);
  }
};
const renderCorrectAnswer = (q) => {
  const a = q?.answer;
  if (a === undefined || a === null || a === "") return "—";
  switch (q.type) {
    case "multiple-choice":
      return mcqText(q, a);
    case "true-false":
    case "short-answer":
    case "fill-blanks":
    case "reasoning":
      return String(a);
    case "match":
      return typeof a === "object" ? JSON.stringify(a, null, 0) : String(a);
    default:
      return String(a);
  }
};

// ---------- autograde ----------
const gradeQuestion = (q, ans) => {
  const max = toNum(q.points);
  if (!q || max <= 0) return { earned: 0, status: "none" };
  if (ans === undefined || ans === null || ans === "") return { earned: 0, status: "incorrect" };

  switch (q.type) {
    case "multiple-choice": {
      const correct = normalize(renderCorrectAnswer(q));
      const student = normalize(renderStudentAnswer(q, ans));
      const ok = correct !== "—" && student === correct;
      return { earned: ok ? max : 0, status: ok ? "correct" : "incorrect" };
    }
    case "true-false": {
      const correct = normalize(renderCorrectAnswer(q));
      const student = normalize(renderStudentAnswer(q, ans));
      const ok = correct !== "—" && student === correct;
      return { earned: ok ? max : 0, status: ok ? "correct" : "incorrect" };
    }
    case "short-answer":
    case "fill-blanks": {
      const correct = normalize(q.answer);
      const student = normalize(ans);
      const ok = !!correct && !!student && student === correct;
      return { earned: ok ? max : 0, status: ok ? "correct" : "incorrect" };
    }
    case "reasoning":
      return { earned: 0, status: "needs-review" };
    case "match": {
      const pairs = Array.isArray(q.matchPairs) ? q.matchPairs : [];
      let correctCount = 0;
      if (Array.isArray(ans)) {
        ans.forEach((p) => {
          if (p && typeof p === "object") {
            let l, r;
            if ("left" in p || "right" in p) {
              l = normalize(p.left);
              r = normalize(p.right);
            } else if ("leftIndex" in p || "rightIndex" in p) {
              l = normalize(q.matchPairs?.[p.leftIndex]?.left);
              r = normalize(q.matchPairs?.[p.rightIndex]?.right);
            }
            const found = pairs.find(
              (pp) => normalize(pp.left) === l && normalize(pp.right) === r
            );
            if (found) correctCount++;
          }
        });
      }
      const total = pairs.length || 0;
      const ratio = total > 0 ? correctCount / total : 0;
      const earned = Math.round(ratio * max);
      let status = "incorrect";
      if (earned === max) status = "correct";
      else if (earned > 0) status = "partial";
      return { earned, status };
    }
    default:
      return { earned: 0, status: "needs-review" };
  }
};

const StatusChip = ({ status }) => {
  switch (status) {
    case "correct":   return <Chip icon={<CheckCircleOutlineIcon />} label="Correct"   color="success" size="small" sx={{ borderRadius: "8px" }} />;
    case "partial":   return <Chip icon={<ChangeCircleIcon />}       label="Partial"   color="warning" size="small" sx={{ borderRadius: "8px" }} />;
    case "incorrect": return <Chip icon={<RemoveCircleOutlineIcon />} label="Incorrect" color="error"   size="small" sx={{ borderRadius: "8px" }} />;
    default:          return <Chip                                   label="Needs review" color="info" size="small" sx={{ borderRadius: "8px" }} />;
  }
};

const PointsQuick = ({ max, value, onChange, showError }) => {
  const half = Math.max(0, Math.round(max / 2));
  return (
    <Stack direction="column" spacing={1} alignItems="flex-end">
      <Stack direction="row" spacing={1}>
        <Tooltip title="Zero points"><Chip label="0"   size="small" onClick={() => onChange(0)}   sx={{ borderRadius: "8px" }} /></Tooltip>
        <Tooltip title="Half points"><Chip label={half} size="small" onClick={() => onChange(half)} sx={{ borderRadius: "8px" }} /></Tooltip>
        <Tooltip title="Full points"><Chip label={max}  size="small" color="success" onClick={() => onChange(max)} sx={{ borderRadius: "8px" }} /></Tooltip>
      </Stack>
      <TextField
        label="Awarded"
        size="small"
        type="number"
        value={value}
        onChange={(e) => onChange(clamp(e.target.value, 0, max))}
        inputProps={{ min: 0, max }}
        error={!!showError}
        helperText={showError ? `Must be between 0 and ${max}` : ""}
        sx={{ width: 140, "& .MuiOutlinedInput-root": { borderRadius: "10px" } }}
      />
    </Stack>
  );
};

const QuestionGradeCard = ({ idx, q, ans, earned, setEarned }) => {
  const max = toNum(q.points);
  const initial = useMemo(() => gradeQuestion(q, ans), [q, ans]);
  const status = earned !== undefined ? (earned === max ? "correct" : earned > 0 ? "partial" : "incorrect") : initial.status;
  const palette = statusPalette(status);
  const invalid = earned < 0 || earned > max;

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        borderRadius: "16px",
        bgcolor: palette.cardBg,
        border: `1px solid ${palette.cardBorder}`,
        "& + &": { mt: 1.5 },
      }}
    >
      <Box sx={{ display: "flex", alignItems: "start", justifyContent: "space-between", gap: 2 }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: "flex", alignItems: "baseline", gap: 1, mb: 1 }}>
            <Chip size="small" label={`Q${idx + 1}`} sx={{ borderRadius: "8px", bgcolor: "#e3f2fd", color: "#0d47a1", fontWeight: "bold" }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              {q?.question || "Untitled question"}
            </Typography>
          </Box>

          <Typography variant="caption" color="text.secondary">Student Answer</Typography>
          <Box
            sx={{
              mt: 0.5, mb: 1.25, p: 1.25,
              bgcolor: palette.studentBg, border: `1px dashed ${palette.studentBorder}`,
              borderRadius: "12px", fontSize: 14, fontWeight: 600, lineHeight: 1.45, wordBreak: "break-word",
            }}
          >
            {renderStudentAnswer(q, ans)}
          </Box>

          <Typography variant="caption" color="text.secondary">Correct Answer</Typography>
          <Box
            sx={{
              mt: 0.5, p: 1,
              bgcolor: palette.correctBg, border: `1px solid ${palette.correctBorder}`,
              borderRadius: "10px", fontSize: 13, lineHeight: 1.45, wordBreak: "break-word",
            }}
          >
            {renderCorrectAnswer(q)}
          </Box>
        </Box>

        <Box sx={{ display: "grid", gap: 1, justifyItems: "end", minWidth: 220 }}>
          <StatusChip status={status} />
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, textAlign: "right" }}>
            Max: {max} pts
          </Typography>
          <PointsQuick
            max={max}
            value={earned}
            onChange={(v) => setEarned(v)}
            showError={invalid}
          />
        </Box>
      </Box>
    </Paper>
  );
};

const GradingModal = ({ open, onClose, submission, exam, onSaved }) => {
  const rows = useMemo(() => {
    if (!submission || !exam) return [];
    const ansMap = submission.answers || {};
    const qs = Array.isArray(exam.questions) ? exam.questions : [];
    return qs.map((q, i) => ({ index: i, q, ans: ansMap[q.id] }));
  }, [submission, exam]);

  const maxTotal = useMemo(() => sum(rows.map(({ q }) => toNum(q.points))), [rows]);
  const [awarded, setAwarded] = useState([]);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (!open) return;
    const initial = rows.map(({ q, ans }) => gradeQuestion(q, ans).earned);
    setAwarded(initial);
    setDirty(false);
  }, [open, rows]);

  const setEarnedAt = (i, v) => {
    const max = toNum(rows[i]?.q?.points || 0);
    setAwarded((prev) => {
      const next = [...prev];
      next[i] = clamp(v, 0, max);
      return next;
    });
    setDirty(true);
  };

  const totalEarned = useMemo(() => sum(awarded.map(toNum)), [awarded]);
  const anyInvalid = rows.some((r, i) => {
    const max = toNum(r.q.points);
    const val = toNum(awarded[i]);
    return val < 0 || val > max;
  });

  const handleSave = () => {
    if (anyInvalid) return; // extra guard
    const perQuestion = rows.map(({ q }, i) => ({
      questionId: q.id,
      max: toNum(q.points),
      earned: toNum(awarded[i]),
    }));
    const payload = {
      submissionId: submission.id,
      studentId: submission.studentId,
      examId: submission.examId,
      totalEarned,
      maxTotal,
      perQuestion,
      gradedAt: new Date().toISOString(),
    };
    onSaved?.(payload);
  };

  const title = submission
    ? `${submission.studentName || "Student"} — ${exam?.title || "Exam"}`
    : "Grading";

  return (
    <Dialog fullScreen open={open} onClose={onClose}>
      <AppBar elevation={0} sx={{ position: "sticky", top: 0, bgcolor: "#ffffff", color: "#1d3557", borderBottom: "1px solid #eee" }}>
        <Toolbar sx={{ gap: 2 }}>
          <IconButton edge="start" onClick={onClose} aria-label="close"><CloseIcon /></IconButton>
          <Typography variant="h6" sx={{ flex: 1, fontWeight: 700 }}>{title}</Typography>
          <Chip label={`Total: ${totalEarned} / ${maxTotal} pts`} color="info" sx={{ borderRadius: "10px", bgcolor: "#e3f2fd", color: "#0d47a1", fontWeight: "bold" }} />
          <Button variant="contained" onClick={handleSave} disabled={!rows.length || anyInvalid} sx={{ ml: 2, borderRadius: "10px", fontWeight: "bold" }}>
            {dirty ? "Save Changes" : "Save"}
          </Button>
        </Toolbar>
      </AppBar>

      <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: "#fafafa", minHeight: "100%" }}>
        <Paper sx={{ p: 2, borderRadius: "14px", mb: 2 }}>
          <Stack direction={{ xs: "column", md: "row" }} gap={2} alignItems={{ xs: "flex-start", md: "center" }} justifyContent="space-between">
            <Stack direction="row" gap={1} alignItems="center" flexWrap="wrap">
              <Chip label={submission?.isSubmitted ? "Submitted" : "In Progress"} size="small" color={submission?.isSubmitted ? "success" : "warning"} sx={{ borderRadius: "8px" }} />
              <Chip label={exam?.title || "—"} size="small" sx={{ borderRadius: "8px" }} />
              {exam?.totalPoints != null && (<Chip label={`Exam Max: ${exam.totalPoints} pts`} size="small" sx={{ borderRadius: "8px" }} />)}
            </Stack>
            <Typography variant="body2" color="text.secondary">
              Started: {submission?.startTime?.seconds ? new Date(submission.startTime.seconds * 1000).toLocaleString() : "—"} &nbsp;|&nbsp; 
              Ended: {submission?.endTime?.seconds ? new Date(submission.endTime.seconds * 1000).toLocaleString() : "—"}
            </Typography>
          </Stack>
        </Paper>

        {rows.length ? rows.map(({ q, ans }, i) => (
          <QuestionGradeCard key={q.id || i} idx={i} q={q} ans={ans} earned={awarded[i]} setEarned={(v) => setEarnedAt(i, v)} />
        )) : (
          <Paper sx={{ p: 3, borderRadius: "14px" }}>
            <Typography variant="body2" color="text.secondary">No questions to grade.</Typography>
          </Paper>
        )}

        <Divider sx={{ my: 2 }} />

        <Box sx={{ display: "flex", alignItems: "center", gap: 2, justifyContent: "flex-end" }}>
          <Chip label={`Total: ${totalEarned} / ${maxTotal} pts`} color="info" sx={{ borderRadius: "10px", bgcolor: "#e3f2fd", color: "#0d47a1", fontWeight: "bold" }} />
          <Button variant="contained" onClick={handleSave} disabled={!rows.length || anyInvalid} sx={{ borderRadius: "10px", fontWeight: "bold" }}>
            {dirty ? "Save Changes" : "Save"}
          </Button>
        </Box>
      </Box>
    </Dialog>
  );
};

export default GradingModal;
