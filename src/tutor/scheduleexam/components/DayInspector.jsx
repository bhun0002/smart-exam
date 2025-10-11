// src/tutor/scheduleexam/components/DayInspector.jsx
// Right-side panel to view/manage ALL schedules for a selected date.
// Shows list with status, time, title (20-char clamp), course/intake, and actions (Edit/Duplicate/Delete).

import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Chip,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import CopyAllIcon from "@mui/icons-material/CopyAll";
import { startOfDay, endOfDay } from "../helpers/time";
import { listSchedulesToday, isNowInWindow, deleteSchedule } from "../hooks/useSchedules";

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

export default function DayInspector({
  open,
  date,                  // JS Date (selected day)
  onClose,
  onNew,                 // () => void     (open drawer prefilled to this date)
  onEdit,                // (schedule) => void
  onDuplicate,           // (schedule) => void
  refreshSignal = 0,
  onChanged,
}) {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);

  // Load all schedules for the given date
  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!date) return;
      setLoading(true);
      try {
        const rows = await listSchedulesToday(startOfDay(date), endOfDay(date));
        if (mounted) setItems(rows);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    if (open) load();
    return () => { mounted = false; };
  }, [open, date, refreshSignal]);

  const count = items.length;
  const sorted = useMemo(
    () => [...items].sort((a, b) => a.startAtUTC.toMillis() - b.startAtUTC.toMillis()),
    [items]
  );

  async function handleDelete(s) {
    const ok = window.confirm("Delete this schedule?");
    if (!ok) return;
    await deleteSchedule(s.id);
    // Refresh
    const rows = await listSchedulesToday(startOfDay(date), endOfDay(date));
    setItems(rows);
    onChanged?.();
  }

  const header = date ? fmtHeaderDate(date) : "";

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { width: 480, borderTopLeftRadius: 16, borderBottomLeftRadius: 16 } }}
    >
      <Stack spacing={1.5} sx={{ p: 2, height: "100%" }}>
        {/* Header */}
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="h6">{header}</Typography>
            {count > 0 && (
              <Chip size="small" label={count} variant="outlined" />
            )}
          </Stack>
          <Button size="small" variant="contained" startIcon={<AddIcon />} onClick={onNew}>
            New Schedule
          </Button>
        </Stack>

        <Typography variant="body2" color="text.secondary">
          View and manage all schedules for this date. <b>Now</b> means it’s currently active.
        </Typography>

        <Divider />

        {/* List */}
        <Box sx={{ overflow: "auto" }}>
          {loading ? (
            <Typography variant="body2" color="text.secondary">Loading…</Typography>
          ) : sorted.length === 0 ? (
            <Stack spacing={1.5} alignItems="flex-start">
              <Typography variant="body2" color="text.secondary">No schedules for this date.</Typography>
              <Button size="small" variant="outlined" startIcon={<AddIcon />} onClick={onNew}>
                New Schedule
              </Button>
            </Stack>
          ) : (
            <List dense>
              {sorted.map((s) => {
                const active = isNowInWindow(s);
                const primary = clamp20(s.examTitle || "Exam");
                const secondary = `${fmtTime(s.startAtUTC)} – ${fmtTime(s.endAtUTC)} • ${s.courseName || ""} ${s.intakeName || ""}`.trim();
                return (
                  <ListItem
                    key={s.id}
                    disableGutters
                    secondaryAction={
                      <Stack direction="row" spacing={0.5}>
                        <Tooltip title="Edit">
                          <IconButton size="small" onClick={() => onEdit?.(s)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Duplicate">
                          <IconButton size="small" onClick={() => onDuplicate?.(s)}>
                            <CopyAllIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton size="small" onClick={() => handleDelete(s)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
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
                          ) : (
                            <Chip size="small" label="Scheduled" variant="outlined" />
                          )}
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
