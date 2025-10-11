// src/tutor/scheduleexam/components/CalendarDayCard.jsx
import { Card, CardContent, Chip, Stack, Typography, Tooltip, Box } from "@mui/material";

function clampChars(str = "", max = 20) {
  if (!str) return "";
  const s = String(str);
  return s.length <= max ? s : s.slice(0, max - 1) + "…";
}

export default function CalendarDayCard({
  date,
  isCurrentMonth,
  isToday,
  schedules = [],
  onClick,        // open inspector for this day
  onMoreClick,    // open inspector for +N more
  isNowInWindow,
}) {
  const sorted = [...schedules].sort((a, b) => a.startAtUTC.toMillis() - b.startAtUTC.toMillis());
  const visible = sorted.slice(0, 3);
  const extraCount = Math.max(0, sorted.length - visible.length);

  return (
    <Card
      onClick={onClick}
      variant="outlined"
      sx={{
        cursor: "pointer",
        borderRadius: 2,
        opacity: isCurrentMonth ? 1 : 0.55,
        height: 140,
        width: "100%",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        boxShadow: isToday ? "inset 0 0 0 2px rgba(25,118,210,0.35)" : "none",
        bgcolor: isToday ? "rgba(25,118,210,0.04)" : "background.paper",
        ...(date.getDay() === 0 || date.getDay() === 6
          ? { backgroundImage: "linear-gradient(180deg, rgba(0,0,0,0.03), rgba(0,0,0,0.0))" }
          : null),
      }}
    >
      <CardContent sx={{ p: 1.25, display: "flex", flexDirection: "column", height: "100%", minWidth: 0 }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 0.5, minWidth: 0 }}>
          <Typography variant="caption" color="text.secondary">
            {date.getDate()}
          </Typography>
          {sorted.length > 0 && (
            <Chip size="small" label={sorted.length} sx={{ height: 20, "& .MuiChip-label": { px: 1, fontSize: 11 } }} variant="outlined" />
          )}
        </Box>

        <Stack spacing={0.5} sx={{ mt: 0.5, overflow: "hidden", minWidth: 0 }}>
          {sorted.length === 0 && (
            <Typography variant="caption" color="text.disabled">No schedules</Typography>
          )}

          {visible.map((s) => {
            const active = isNowInWindow(s);
            const label = clampChars(s.examTitle || "Exam", 20);
            return (
              <Tooltip
                key={s.id}
                title={`${s.examTitle || "Exam"} • ${s.courseName || ""} ${s.intakeName || ""}`.trim()}
                enterDelay={300}
              >
                <Chip
                  size="small"
                  label={label}
                  variant={active ? "filled" : "outlined"}
                  color={active ? "success" : "default"}
                  sx={{
                    height: 24,
                    width: "100%",
                    justifyContent: "flex-start",
                    borderRadius: 1.5,
                    "& .MuiChip-label": {
                      fontSize: 12,
                      px: 1,
                      width: "100%",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      display: "block",
                    },
                  }}
                />
              </Tooltip>
            );
          })}

          {extraCount > 0 && (
            <Chip
              size="small"
              label={`+${extraCount} more`}
              variant="outlined"
              onClick={(e) => { e.stopPropagation(); onMoreClick?.(date, sorted); }}
              sx={{ height: 24, width: "100%", "& .MuiChip-label": { fontSize: 12, px: 1, width: "100%" } }}
            />
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}
