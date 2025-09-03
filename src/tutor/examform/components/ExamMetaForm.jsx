import React from "react";
import {
  Card,
  CardContent,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
} from "@mui/material";

const ExamMetaForm = ({
  readonly,
  title,
  setTitle,
  duration,
  setDuration,
  selectedIntake,
  setSelectedIntake,
  intakes,
  intakesError,
  fieldErrors,
  setFieldErrors,
}) => {
  return (
    <Card
      sx={{
        p: 3,
        mb: 4,
        boxShadow: "0px 4px 16px rgba(0,0,0,0.05)",
        borderRadius: "16px",
      }}
    >
      <CardContent>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField
              label="Exam Title"
              id="exam-title"
              fullWidth
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (fieldErrors["exam-title"])
                  setFieldErrors((p) => ({ ...p, "exam-title": "" }));
              }}
              required
              variant="outlined"
              disabled={readonly}
              error={!!fieldErrors["exam-title"]}
              helperText={fieldErrors["exam-title"]}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px" } }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              label="Duration (minutes)"
              id="exam-duration"
              fullWidth
              type="number"
              value={duration}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9]/g, "");
                setDuration(val);
                if (fieldErrors["exam-duration"])
                  setFieldErrors((p) => ({ ...p, "exam-duration": "" }));
              }}
              required
              variant="outlined"
              disabled={readonly}
              error={!!fieldErrors["exam-duration"]}
              helperText={fieldErrors["exam-duration"]}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px" } }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl
              fullWidth
              required
              variant="outlined"
              disabled={readonly}
              error={!!fieldErrors["exam-intake"]}
              sx={{ minWidth: 150 }}
              onKeyDown={(e) => {
                // prevent accidental typing into select
                e.preventDefault();
                e.stopPropagation();
              }}
            >
              <InputLabel id="intake-select-label">Intake</InputLabel>
              <Select
                labelId="intake-select-label"
                id="exam-intake"
                value={selectedIntake}
                label="Intake"
                onChange={(e) => {
                  setSelectedIntake(e.target.value);
                  if (fieldErrors["exam-intake"])
                    setFieldErrors((p) => ({ ...p, "exam-intake": "" }));
                }}
                sx={{ borderRadius: "12px" }}
              >
                <MenuItem value="">
                  <em>None</em>
                </MenuItem>
                {intakes.map((i) => (
                  <MenuItem key={i.id} value={i.id}>
                    {i.name}
                  </MenuItem>
                ))}
              </Select>
              {fieldErrors["exam-intake"] && (
                <Typography variant="caption" color="error">
                  {fieldErrors["exam-intake"]}
                </Typography>
              )}
              {intakesError && (
                <Typography variant="caption" color="error">
                  {intakesError}
                </Typography>
              )}
            </FormControl>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default ExamMetaForm;
