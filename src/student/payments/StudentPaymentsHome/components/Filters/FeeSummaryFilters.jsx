import React from "react";
import {
  Stack,
  TextField,
  MenuItem,
  FormControlLabel,
  Switch,
} from "@mui/material";

/**
 * Safe Fee Summary Filters
 *
 * Props:
 * - courseId, setCourseId
 * - intakeId, setIntakeId
 * - hideFullyPaid, setHideFullyPaid
 * - courses?: Array<{ id: string, name?: string }>
 * - intakes?: Array<{ id: string, name?: string }>
 *
 * This version tolerates undefined courses/intakes by defaulting to [].
 */
export default function FeeSummaryFilters({
  courseId,
  setCourseId,
  intakeId,
  setIntakeId,
  hideFullyPaid,
  setHideFullyPaid,
  courses = [],
  intakes = [],
}) {
  return (
    <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ width: "100%" }}>
      {/* Course */}
      <TextField
        select
        size="small"
        label="Course"
        value={courseId ?? "all"}
        onChange={(e) => setCourseId?.(e.target.value)}
        sx={{ minWidth: 200 }}
      >
        <MenuItem value="all">All</MenuItem>
        {(Array.isArray(courses) ? courses : []).map((c) => (
          <MenuItem key={c.id ?? c.value ?? c} value={c.id ?? c.value ?? c}>
            {c.name ?? c.label ?? c.id ?? String(c)}
          </MenuItem>
        ))}
      </TextField>

      {/* Intake */}
      <TextField
        select
        size="small"
        label="Intake"
        value={intakeId ?? "all"}
        onChange={(e) => setIntakeId?.(e.target.value)}
        sx={{ minWidth: 200 }}
      >
        <MenuItem value="all">All</MenuItem>
        {(Array.isArray(intakes) ? intakes : []).map((i) => (
          <MenuItem key={i.id ?? i.value ?? i} value={i.id ?? i.value ?? i}>
            {i.name ?? i.label ?? i.id ?? String(i)}
          </MenuItem>
        ))}
      </TextField>

      {/* Hide fully paid */}
      <FormControlLabel
        control={
          <Switch
            size="small"
            checked={!!hideFullyPaid}
            onChange={(e) => setHideFullyPaid?.(e.target.checked)}
          />
        }
        label="Hide fully paid"
        sx={{ ml: { xs: 0, sm: 1 } }}
      />
    </Stack>
  );
}
