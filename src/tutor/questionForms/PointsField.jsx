// src/tutor/questionForms/PointsField.jsx
import React from "react";
import { Box, TextField, Chip, Stack, Typography } from "@mui/material";

export default function PointsField({
  id,                   // e.g., question-3-points
  value,
  onChange,             // event-style: (e) => ...
  onValueChange,        // value-style: (val) => ...
  index,                // optional, for id fallback
  fieldErrors = {},
  setFieldErrors = () => {},
  readonly = false,
  label = "Points / Grade",
  suggestions = [1, 2, 5, 10],
  inputProps,
}) {
  const inputId = id ?? (index != null ? `question-${index}-points` : undefined);

  const clearError = () => {
    if (inputId && fieldErrors[inputId]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[inputId];
        return next;
      });
    }
  };

  // Normalize and fan-out to both handlers
  const emitValue = (nextVal) => {
    // 1) raw value callback
    if (typeof onValueChange === "function") {
      onValueChange(nextVal);
    }
    // 2) event-style callback (wrap)
    if (typeof onChange === "function") {
      onChange({ target: { value: nextVal } });
    }
    clearError();
  };

  // TextField change → forward native event (for event-style),
  // and also fan-out a raw value (for value-style)
  const handleInputChange = (e) => {
    const nextVal = e?.target?.value ?? "";
    if (typeof onChange === "function") onChange(e); // pass the real event
    if (typeof onValueChange === "function") onValueChange(nextVal);
    clearError();
  };

  return (
    <Box sx={{ mt: 3 }}>
      <Stack direction="row" spacing={1} sx={{ mb: 1, flexWrap: "wrap" }}>
        <Typography variant="body2" sx={{ mr: 1, color: "text.secondary" }}>
          Quick set:
        </Typography>
        {suggestions.map((s) => (
          <Chip
            key={s}
            label={s}
            size="small"
            onClick={() => emitValue(String(s))}
            disabled={readonly}
            sx={{ borderRadius: "8px" }}
          />
        ))}
        <Chip
          label="Clear"
          size="small"
          onClick={() => emitValue("")}
          disabled={readonly}
          sx={{ borderRadius: "8px" }}
        />
      </Stack>

      <TextField
        id={inputId}
        label={label}
        type="number"
        value={value ?? ""}
        onChange={handleInputChange}
        inputProps={{ min: 0, step: "0.5", ...inputProps }}
        disabled={readonly}
        error={!!(inputId && fieldErrors[inputId])}
        helperText={(inputId && fieldErrors[inputId]) || ""}
        fullWidth
        variant="outlined"
        sx={{
          "& .MuiOutlinedInput-root": {
            borderRadius: "12px",
            backgroundColor: readonly ? "rgba(0,0,0,0.04)" : "#ffffff",
          },
          "& .MuiInputBase-input.Mui-disabled": {
            WebkitTextFillColor: "#424242 !important",
          },
        }}
      />
    </Box>
  );
}
