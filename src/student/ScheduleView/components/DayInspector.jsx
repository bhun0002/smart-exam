// src/student/ScheduleView/components/DayInspector.jsx
// Read-only day inspector for students.
// UI is matched to tutor inspector, but without New/Edit/Duplicate/Delete.
// When a schedule is "Now", show a primary "Go to Exam" button.

import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Chip,
  Divider,
  Drawer,
  List,
  ListItem,
  ListItemText,
  Stack,
  Typography,
} from "@mui/material";

import { startOfDay, endOfDay } from "../../../tutor/scheduleexam/helpers/time"; // :contentReference[oaicite:3]{index=3}
import { listStudentSchedulesOnDay, isNowInWindow } from "../hooks/useStudentSchedules";

function clamp20(s = "") {
  const str = String(s || "");
  return str.length <= 20 ? str : str.slice(0, 19) + "…";
}
function fmtTime(ts) {
  const d = ts.toDate();
  return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}
function fmtHeaderDate(d) {
  return d.toLocaleDateString(undefined, { weekday: "short", year: "numeric", month: "short", day: "numeric" });
}

export default function StudentDayInspector({
  open,
  date,                // JS Date
  cohort,              // { courseId, intakeId }
  refreshSignal = 0,
  onClose,
  onChanged,
  onGoToExam,          // (schedule) => void
}) {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);

  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!date) return;
      setLoading(true);
      try {
        const rows = await listStudentSchedulesOnDay(startOfDay(date), endOfDay(date), cohort);
        if (mounted) setItems(rows);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    if (open) load();
    return () => { mounted = false; };
  }, [open, date, refreshSignal, cohort?.courseId, cohort?.intakeId]);

  const count = items.length;
  const sorted = useMemo(
    () => [...items].sort((a, b) => a.startAtUTC.toMillis() - b.startAtUTC.toMillis()),
    [items]
  );
  const header = date ? fmtHeaderDate(date) : "";

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { width: 480, borderTopLeftRadius: 16, borderBottomLeftRadius: 16 } }}
    >
      <Stack spacing={1.5} sx={{ p: 2, height: "100%" }}>
        {/* Header (no 'New Schedule' on student) */}
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="h6">{header}</Typography>
            {count > 0 && <Chip size="small" label={count} variant="outlined" />}
          </Stack>
          <span />
        </Stack>

        <Typography variant="body2" color="text.secondary">
          View all schedules for this date. <b>Now</b> means it’s currently active.
        </Typography>

        <Divider />

        <Box sx={{ overflow: "auto" }}>
          {loading ? (
            <Typography variant="body2" color="text.secondary">Loading…</Typography>
          ) : sorted.length === 0 ? (
            <Typography variant="body2" color="text.secondary">No schedules for this date.</Typography>
          ) : (
            <List dense>
              {sorted.map((s) => {
                const active = isNowInWindow(s);
                const primary = clamp20(s.examTitle || "Exam");
                const secondary = `${fmtTime(s.startAtUTC)} – ${fmtTime(s.endAtUTC)} • ${s.courseName || ""} ${s.intakeName || ""}`.trim();
                return (
                  <ListItem key={s.id} disableGutters
                    secondaryAction={
                      active ? (
                        <Button size="small" variant="contained" onClick={() => onGoToExam?.(s)}>
                          Go to Exam
                        </Button>
                      ) : (
                        <Chip size="small" label="Scheduled" variant="outlined" />
                      )
                    }
                  >
                    <ListItemText
                      primary={
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Typography variant="body2" noWrap title={s.examTitle || "Exam"}>
                            {primary}
                          </Typography>
                          {active ? (
                            <Chip size="small" color="success" label="Now" />
                          ) : null}
                        </Stack>
                      }
                      secondary={
                        <Typography variant="caption" color="text.secondary" noWrap title={secondary}>
                          {secondary}
                        </Typography>
                      }
                    />
                  </ListItem>
                );
              })}
            </List>
          )}
        </Box>
      </Stack>
    </Drawer>
  );
}
