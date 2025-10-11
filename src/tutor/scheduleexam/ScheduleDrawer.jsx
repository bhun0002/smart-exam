// src/tutor/scheduleexam/ScheduleDrawer.jsx
// Drawer with Date + Hour + Minute pickers; supports CREATE + EDIT + DUPLICATE.
// Duration is read-only and taken from the selected exam document's `duration` field.

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Button,
  Divider,
  Drawer,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  createSchedule,
  createSchedulePayload,
  updateSchedule,
  getScheduleById,
} from "./hooks/useSchedules";

// helpers
function pad2(n) {
  return String(n).padStart(2, "0");
}
function toLocalDateInputValue(d = new Date()) {
  const y = d.getFullYear();
  const m = pad2(d.getMonth() + 1);
  const day = pad2(d.getDate());
  return `${y}-${m}-${day}`;
}
function parseLocalDateTimeString(local = "") {
  if (!local || local.length < 16) return null;
  const [date, time] = local.split("T");
  const [hh, mm] = (time || "").split(":");
  return { date, hour: pad2(Number(hh || 0)), minute: pad2(Number(mm || 0)) };
}
function normalizeSeconds(date = new Date()) {
  // snap seconds/ms to 0; no step rounding
  const d = new Date(date);
  d.setSeconds(0);
  d.setMilliseconds(0);
  return d;
}

export default function ScheduleDrawer({
  open,
  onClose,
  defaultStartLocal, // e.g., "2025-10-04T09:00" optional (create/duplicate)
  intakes = [],
  courses = [],
  exams = [],
  onSaved,
}) {
  // Form state
  const [courseId, setCourseId] = useState("");
  const [intakeId, setIntakeId] = useState("");
  const [examId, setExamId] = useState("");

  const [dateStr, setDateStr] = useState("");       // "YYYY-MM-DD"
  const [hourStr, setHourStr] = useState("09");     // "00"-"23"
  const [minuteStr, setMinuteStr] = useState("00"); // "00"-"59"

  // NOTE: duration is read-only from exam; we keep a local var for payload building
  // but do not expose an editable input.

  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);

  // Mode/read-in (simple global the page sets before opening)
  const [mode, setMode] = useState("create"); // "create" | "edit" | "duplicate"
  const [editing, setEditing] = useState(null); // schedule object when editing

  const prevOpenRef = useRef(false);

  useEffect(() => {
    const run = async () => {
      const justOpened = open && !prevOpenRef.current;
      if (!justOpened) {
        prevOpenRef.current = open;
        return;
      }

      // Read mode payload (set in SchedulesPage before opening)
      const payload = window.__SCHEDULE_DRAWER_MODE__ || null;

      if (payload?.mode === "edit" && payload.schedule) {
        // ✅ EDIT MODE — fetch freshest schedule by id
        const fresh = await getScheduleById(payload.schedule.id).catch(() => null);
        const s = fresh || payload.schedule;

        setMode("edit");
        setEditing(s);

        // seed from schedule
        setCourseId(s.courseId || "");
        setIntakeId(s.intakeId || "");
        setExamId(s.examId || "");
        const start = s.startAtUTC.toDate();
        setDateStr(toLocalDateInputValue(start));
        setHourStr(pad2(start.getHours()));
        setMinuteStr(pad2(start.getMinutes()));

        // password: respect your current policy
        setPassword(s.password || "");
      } else {
        // ✅ CREATE / DUPLICATE MODE
        setMode(payload?.mode === "duplicate" ? "duplicate" : "create");
        setEditing(null);

        // seed date/time
        let d;
        if (defaultStartLocal) {
          const parsed = parseLocalDateTimeString(defaultStartLocal);
          if (parsed) {
            setDateStr(parsed.date);
            setHourStr(parsed.hour);
            setMinuteStr(parsed.minute);
          } else {
            d = normalizeSeconds();
            setDateStr(toLocalDateInputValue(d));
            setHourStr(pad2(d.getHours()));
            setMinuteStr(pad2(d.getMinutes()));
          }
        } else {
          d = normalizeSeconds();
          setDateStr(toLocalDateInputValue(d));
          setHourStr(pad2(d.getHours()));
          setMinuteStr(pad2(d.getMinutes()));
        }

        if (payload?.mode === "duplicate" && payload.schedule) {
          // copy fields from the schedule
          const s = payload.schedule;
          setCourseId(s.courseId || "");
          setIntakeId(s.intakeId || "");
          setExamId(s.examId || "");
          setPassword(s.password || "");
        } else {
          // default create
          setCourseId("");
          setIntakeId("");
          setExamId("");
          setPassword("");
        }
      }

      // clear global to avoid reusing stale mode next time
      window.__SCHEDULE_DRAWER_MODE__ = null;

      prevOpenRef.current = open;
    };

    run();
  }, [open, defaultStartLocal]);

  // Lists
  const hours = useMemo(() => Array.from({ length: 24 }, (_, h) => pad2(h)), []);
  const minutes = useMemo(() => Array.from({ length: 60 }, (_, m) => pad2(m)), []);

  const filteredExams = useMemo(
    () => exams.filter((e) => (!courseId || e.courseId === courseId) && (!intakeId || e.intakeId === intakeId)),
    [exams, courseId, intakeId]
  );

  const selectedExam = useMemo(() => exams.find((e) => e.id === examId) || null, [exams, examId]);
  const selectedCourse = useMemo(() => courses.find((c) => c.id === courseId) || null, [courses, courseId]);
  const selectedIntake = useMemo(() => intakes.find((i) => i.id === intakeId) || null, [intakes, intakeId]);

  // Build startLocal string for payload
  const startLocal = dateStr && hourStr && minuteStr ? `${dateStr}T${hourStr}:${minuteStr}` : "";

  // Duration comes from selected exam
  const durationFromExam = selectedExam && typeof selectedExam.duration === "number"
    ? selectedExam.duration
    : 0;

  const canSave =
    !!examId && !!startLocal && durationFromExam > 0 && password.trim().length >= 1;

  async function handleSave() {
    if (!canSave || saving) return;
    setSaving(true);
    try {
      const payload = createSchedulePayload({
        exam: selectedExam,
        course: selectedCourse,
        intake: selectedIntake,
        startLocal,
        // Use exam.duration (minutes) as the canonical duration
        durationMin: durationFromExam,
        password
      });

      if (mode === "edit" && editing) {
        const { createdAt, isDeleted, deletedAt, ...updates } = payload;
        await updateSchedule(editing.id, payload); // update existing doc
      } else {
        await createSchedule(payload); // create new (create or duplicate)
      }

      onSaved?.();
      onClose?.();
    } catch (err) {
      console.error(err);
      alert(err.message || "Failed to save schedule");
    } finally {
      setSaving(false);
    }
  }

  // Shared MenuProps to cap dropdown height (~10 items)
  const menuProps = { PaperProps: { sx: { maxHeight: 360 } } };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { width: 420, borderTopLeftRadius: 16, borderBottomLeftRadius: 16 } }}
    >
      <Stack sx={{ p: 2, height: "100%" }} spacing={2}>
        <Typography variant="h6">
          {mode === "edit" ? "Edit Schedule" : mode === "duplicate" ? "Duplicate Schedule" : "Schedule Exam"}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Availability and password are controlled by this schedule window.
        </Typography>

        {/* Course */}
        <FormControl fullWidth size="small">
          <InputLabel id="course-label">Course</InputLabel>
          <Select labelId="course-label" label="Course" value={courseId} onChange={(e) => setCourseId(e.target.value)}>
            <MenuItem value="">
              <em>All</em>
            </MenuItem>
            {courses.map((c) => (
              <MenuItem key={c.id} value={c.id}>
                {c.name || c.id}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Intake */}
        <FormControl fullWidth size="small">
          <InputLabel id="intake-label">Intake</InputLabel>
          <Select labelId="intake-label" label="Intake" value={intakeId} onChange={(e) => setIntakeId(e.target.value)}>
            <MenuItem value="">
              <em>All</em>
            </MenuItem>
            {intakes.map((i) => (
              <MenuItem key={i.id} value={i.id}>
                {i.name || i.id}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Exam */}
        <FormControl fullWidth size="small">
          <InputLabel id="exam-label">Exam</InputLabel>
          <Select labelId="exam-label" label="Exam" value={examId} onChange={(e) => setExamId(e.target.value)}>
            {filteredExams.map((e) => (
              <MenuItem key={e.id} value={e.id}>
                {e.title || e.name || e.id}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Divider />

        {/* Date + Time */}
        <Stack direction="row" spacing={1}>
          <TextField
            label="Date"
            type="date"
            value={dateStr}
            onChange={(e) => setDateStr(e.target.value)}
            InputLabelProps={{ shrink: true }}
            fullWidth
            size="small"
          />
          <FormControl sx={{ minWidth: 90 }} size="small">
            <InputLabel id="hour-label">Hour</InputLabel>
            <Select
              labelId="hour-label"
              label="Hour"
              value={hourStr}
              onChange={(e) => setHourStr(e.target.value)}
              MenuProps={menuProps}
            >
              {Array.from({ length: 24 }, (_, h) => pad2(h)).map((h) => (
                <MenuItem key={h} value={h}>{h}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl sx={{ minWidth: 90 }} size="small">
            <InputLabel id="minute-label">Minute</InputLabel>
            <Select
              labelId="minute-label"
              label="Minute"
              value={minuteStr}
              onChange={(e) => setMinuteStr(e.target.value)}
              MenuProps={menuProps}
            >
              {Array.from({ length: 60 }, (_, m) => pad2(m)).map((m) => (
                <MenuItem key={m} value={m}>{m}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>

        {/* Duration (read-only from exam) */}
        <TextField
          label="Duration (minutes)"
          value={selectedExam ? selectedExam.duration : ""}
          fullWidth
          size="small"
          InputProps={{ readOnly: true }}
          helperText={selectedExam ? "Duration is defined in the exam settings." : "Select an exam to view duration."}
        />

        {/* Password */}
        <TextField
          label="Schedule Password"
          type="text"
          helperText="This is the only password tutors see during the window"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          fullWidth
          size="small"
        />

        {/* Actions */}
        <Stack direction="row" spacing={1} sx={{ mt: "auto" }}>
          <Button onClick={onClose} color="inherit" variant="outlined">
            Cancel
          </Button>
          <Button variant="contained" onClick={handleSave} disabled={!canSave || saving}>
            {mode === "edit" ? "Save Changes" : "Save Schedule"}
          </Button>
        </Stack>
      </Stack>
    </Drawer>
  );
}
