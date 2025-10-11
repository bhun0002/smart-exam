// src/tutor/scheduleexam/SchedulesPage.jsx
import { useMemo, useState, useEffect } from "react";
import { Button, IconButton, Stack, Typography, Tooltip, Chip, Box } from "@mui/material";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import TodayIcon from "@mui/icons-material/Today";
import AddIcon from "@mui/icons-material/Add";
import { listSchedulesByMonth, useLoadBase, isNowInWindow } from "./hooks/useSchedules";
import { startOfMonth, endOfMonth, toLocalInputValue } from "./helpers/time";
import ScheduleDrawer from "./ScheduleDrawer";
import CalendarDayCard from "./components/CalendarDayCard";
import DayInspector from "./components/DayInspector";

function addDays(d, n) { return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n); }
function isSameDay(a, b) {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export default function SchedulesPage() {
    const [monthRef, setMonthRef] = useState(() => startOfMonth(new Date()));
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [drawerDate, setDrawerDate] = useState("");
    const [schedules, setSchedules] = useState([]);

    // Day Inspector state
    const [inspectorOpen, setInspectorOpen] = useState(false);
    const [inspectorDate, setInspectorDate] = useState(null);
    const [inspectorRefresh, setInspectorRefresh] = useState(0);

    const { intakes, courses, exams } = useLoadBase();

    // Small helper to refresh the month grid
    const refreshMonthGrid = async () => {
        const items = await listSchedulesByMonth(startOfMonth(monthRef), endOfMonth(monthRef));
        setSchedules(items);
    };

    useEffect(() => {
        refreshMonthGrid();
    }, [monthRef]);

    const weeks = useMemo(() => {
        const start = startOfMonth(monthRef);
        const end = endOfMonth(monthRef);
        const startWeekday = start.getDay();
        const gridStart = addDays(start, -startWeekday);
        const totalDays = Math.ceil(((end - gridStart) / (1000 * 60 * 60 * 24) + 1) / 7) * 7;
        const days = Array.from({ length: totalDays }, (_, i) => addDays(gridStart, i));
        return Array.from({ length: days.length / 7 }, (_, w) => days.slice(w * 7, w * 7 + 7));
    }, [monthRef]);

    function openDrawerForDate(dateObj) {
        setDrawerDate(toLocalInputValue(new Date(dateObj)));
        setDrawerOpen(true);
    }

    function openInspectorForDate(dateObj) {
        setInspectorDate(new Date(dateObj));
        setInspectorOpen(true);
    }

    const today = new Date();

    return (
        <Stack spacing={2} sx={{ p: 2 }}>
            {/* Header */}
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
                    <Button size="small" startIcon={<TodayIcon />} onClick={() => setMonthRef(startOfMonth(new Date()))}>
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

                <Button
                    variant="contained"
                    size="small"
                    startIcon={<AddIcon />}
                    onClick={() => {
                        const base = inspectorDate || new Date();
                        openDrawerForDate(base);
                    }}
                >
                    New Schedule
                </Button>
            </Stack>

            {/* Weekday headers */}
            <Box
                sx={{
                    display: "grid",
                    gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
                    gap: 1,
                }}
            >
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                    <Box key={d} sx={{ px: 1, py: 0.5 }}>
                        <Typography variant="subtitle2">{d}</Typography>
                    </Box>
                ))}
            </Box>

            {/* Month grid (CSS Grid for equal-width tiles) */}
            {weeks.map((week, wi) => (
                <Box
                    key={wi}
                    sx={{
                        display: "grid",
                        gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
                        gap: 1,
                        minWidth: 0,
                    }}
                >
                    {week.map((day, di) => {
                        const isCurrentMonth = day.getMonth() === monthRef.getMonth();
                        const daySchedules = schedules.filter((s) => isSameDay(s.startAtUTC.toDate(), day));

                        return (
                            <Box key={di} sx={{ minWidth: 0 }}>
                                <CalendarDayCard
                                    date={day}
                                    isCurrentMonth={isCurrentMonth}
                                    isToday={isSameDay(day, today)}
                                    schedules={daySchedules}
                                    isNowInWindow={isNowInWindow}
                                    // 👉 Single-click opens the Inspector (view all)
                                    onClick={() => openInspectorForDate(day)}
                                    // 👉 “+N more” also opens Inspector
                                    onMoreClick={(d) => openInspectorForDate(d)}
                                />
                            </Box>
                        );
                    })}
                </Box>
            ))}

            {/* Create / Edit drawer (reused) */}
            <ScheduleDrawer
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                defaultStartLocal={drawerDate}
                intakes={intakes}
                courses={courses}
                exams={exams}
                onSaved={async () => {
                    await refreshMonthGrid();
                    setInspectorRefresh((n) => n + 1);
                }}
            />

            {/* Day Inspector: view all items for the selected date */}
            <DayInspector
                open={inspectorOpen}
                date={inspectorDate}
                refreshSignal={inspectorRefresh}
                onClose={() => setInspectorOpen(false)}
                onChanged={async () => {              // 👈 called after delete
                    await refreshMonthGrid();
                    setInspectorRefresh((n) => n + 1);  // also nudge inspector if needed
                }}
                onNew={() => {
                    const base = inspectorDate || new Date();
                    openDrawerForDate(base);
                }}
                onEdit={(s) => {
                    // Open drawer in EDIT mode
                    setDrawerDate(s.startAtUTC.toDate().toISOString().slice(0, 16)); // not used in edit, but harmless
                    setDrawerOpen(false);
                    // open after a microtask to ensure prop change applies
                    setTimeout(() => {
                        setDrawerOpen(true);
                    }, 0);
                    window.__SCHEDULE_DRAWER_MODE__ = { mode: "edit", schedule: s };
                }}
                onDuplicate={(s) => {
                    // Open drawer in DUPLICATE mode (prefill with same values)
                    setDrawerDate(s.startAtUTC.toDate().toISOString().slice(0, 16));
                    setDrawerOpen(false);
                    setTimeout(() => {
                        setDrawerOpen(true);
                    }, 0);
                    window.__SCHEDULE_DRAWER_MODE__ = { mode: "duplicate", schedule: s };
                }}
            />
        </Stack>
    );
}
