// src/student/ScheduleView/StudentSchedulesPage.jsx
import { useMemo, useState, useEffect } from "react";
import { Stack, Typography, IconButton, Button, Tooltip, Chip, Box } from "@mui/material";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import TodayIcon from "@mui/icons-material/Today";
import { useNavigate, useLocation } from "react-router-dom";

import {
  startOfMonth,
  endOfMonth,
} from "../../tutor/scheduleexam/helpers/time"; // identical helpers :contentReference[oaicite:0]{index=0}

import CalendarDayCard from "../../tutor/scheduleexam/components/CalendarDayCard"; // same UI card :contentReference[oaicite:1]{index=1}
import StudentDayInspector from "./components/DayInspector";
import { listStudentSchedulesByMonth, isNowInWindow } from "./hooks/useStudentSchedules";

function addDays(d, n) { return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n); }
function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

// crude cohort reader (align with your existing student context if you have one)
function readCohort() {
  try {
    const c = localStorage.getItem("student.courseId") || "";
    const i = localStorage.getItem("student.intakeId") || "";
    return { courseId: c || null, intakeId: i || null };
  } catch {
    return { courseId: null, intakeId: null };
  }
}

export default function StudentSchedulesPage() {
  const [monthRef, setMonthRef] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [schedules, setSchedules] = useState([]);
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [inspectorDate, setInspectorDate] = useState(null);
  const [inspectorRefresh, setInspectorRefresh] = useState(0);

  const cohort = readCohort();
  const navigate = useNavigate();
  const today = new Date();

  // same month grid logic as tutor page :contentReference[oaicite:2]{index=2}
  const weeks = useMemo(() => {
    const start = startOfMonth(monthRef);
    const end = endOfMonth(monthRef);
    const startWeekday = start.getDay();
    const gridStart = addDays(start, -startWeekday);
    const totalDays = Math.ceil(((end - gridStart) / (1000 * 60 * 60 * 24) + 1) / 7) * 7;
    const days = Array.from({ length: totalDays }, (_, i) => addDays(gridStart, i));
    return Array.from({ length: days.length / 7 }, (_, w) => days.slice(w * 7, w * 7 + 7));
  }, [monthRef]);

  async function refreshMonth() {
    const start = startOfMonth(monthRef);
    const end = endOfMonth(monthRef);
    const rows = await listStudentSchedulesByMonth(start, end, cohort);
    setSchedules(rows);
  }

  useEffect(() => { refreshMonth(); }, [monthRef]);

  function openInspectorForDate(dateObj) {
    setInspectorDate(new Date(dateObj));
    setInspectorOpen(true);
  }

  return (
    <Stack spacing={2} sx={{ p: 2 }}>
      {/* Header — matches tutor page */}
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Stack direction="row" spacing={1} alignItems="center">
          <IconButton size="small" onClick={() => setMonthRef(new Date(monthRef.getFullYear(), monthRef.getMonth() - 1, 1))}>
            <ArrowBackIosNewIcon />
          </IconButton>
          <Typography variant="h6">
            {monthRef.toLocaleString(undefined, { month: "long", year: "numeric" })}
          </Typography>
          <IconButton size="small" onClick={() => setMonthRef(new Date(monthRef.getFullYear(), monthRef.getMonth() + 1, 1))}>
            <ArrowForwardIosIcon />
          </IconButton>
          <Button size="small" startIcon={<TodayIcon />} onClick={() => setMonthRef(new Date(new Date().getFullYear(), new Date().getMonth(), 1))}>
            Today
          </Button>
        </Stack>

        <Stack direction="row" spacing={1} alignItems="center">
          <Tooltip title="Currently active schedule">
            <Chip size="small" label="Now" color="success" />
          </Tooltip>
          <Tooltip title="Upcoming / Past">
            <Chip size="small" label="Scheduled" variant="outlined" />
          </Tooltip>
        </Stack>

        {/* No "New Schedule" on student side */}
        <span />
      </Stack>

      {/* Weekday headers — same look */}
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0,1fr))", gap: 1 }}>
        {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((d)=>(
          <Box key={d} sx={{ px:1, py:0.5 }}>
            <Typography variant="subtitle2">{d}</Typography>
          </Box>
        ))}
      </Box>

      {/* Month grid — identical CSS grid; just no click-to-create, only inspector */}
      {weeks.map((week, wi) => (
        <Box key={wi} sx={{ display:"grid", gridTemplateColumns:"repeat(7, minmax(0,1fr))", gap:1, minWidth:0 }}>
          {week.map((day, di) => {
            const isCurrentMonth = day.getMonth() === monthRef.getMonth();
            const daySchedules = schedules.filter((s) => {
              const d = s.startAtUTC.toDate();
              return d.getFullYear()===day.getFullYear() && d.getMonth()===day.getMonth() && d.getDate()===day.getDate();
            });
            return (
              <Box key={di} sx={{ minWidth:0 }}>
                <CalendarDayCard
                  date={day}
                  isCurrentMonth={isCurrentMonth}
                  isToday={isSameDay(day, today)}
                  schedules={daySchedules}
                  isNowInWindow={isNowInWindow}
                  onClick={() => openInspectorForDate(day)}
                  onMoreClick={(d)=>openInspectorForDate(d)}
                />
              </Box>
            );
          })}
        </Box>
      ))}

      {/* Right-side Day Inspector (read-only) */}
      <StudentDayInspector
        open={inspectorOpen}
        date={inspectorDate}
        refreshSignal={inspectorRefresh}
        cohort={cohort}
        onClose={() => setInspectorOpen(false)}
        onChanged={async () => {
          await refreshMonth();       // keep tiles in sync after any change elsewhere
          setInspectorRefresh(n => n + 1);
        }}
        onGoToExam={(schedule) => {
          navigate("/student-exam-list", {
            state: { focusExamId: schedule.examId, focusScheduleId: schedule.id },
          });
        }}
      />
    </Stack>
  );
}
