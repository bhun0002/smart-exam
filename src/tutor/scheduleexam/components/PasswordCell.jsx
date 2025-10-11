// src/tutor/scheduleexam/components/PasswordCell.jsx
// Re-usable password display consistent with your Exams table: masked, reveal, copy, tooltip

import { useMemo, useState } from "react";
import { TextField, InputAdornment, IconButton, Tooltip, Snackbar } from "@mui/material";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import Visibility from "@mui/icons-material/Visibility";
import ContentCopy from "@mui/icons-material/ContentCopy";

export default function PasswordCell({ value = "", size = "small", fullWidth = false, disabled = false }) {
  const [show, setShow] = useState(false);
  const [snack, setSnack] = useState("");

  const display = useMemo(
    () => (show ? value : "•".repeat(Math.max(6, Math.min(12, value?.length || 6)))),
    [show, value]
  );

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value || "");
      setSnack("Password copied");
    } catch (e) {
      setSnack("Copy failed");
    }
  }

  return (
    <>
      <TextField
        value={display}
        size={size}
        fullWidth={fullWidth}
        disabled={disabled || !value}
        InputProps={{
          readOnly: true,
          sx: { "& .MuiInputBase-input.Mui-disabled": { WebkitTextFillColor: "inherit" } }, // keep color when disabled
          endAdornment: (
            <InputAdornment position="end">
              <Tooltip title={show ? "Hide" : "Reveal"}>
                <span>
                  <IconButton size="small" onClick={() => setShow((s) => !s)} disabled={!value}>
                    {show ? <Visibility /> : <VisibilityOff />}
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip title="Copy">
                <span>
                  <IconButton size="small" onClick={handleCopy} disabled={!value}>
                    <ContentCopy />
                  </IconButton>
                </span>
              </Tooltip>
            </InputAdornment>
          ),
        }}
        variant="outlined"
      />
      <Snackbar
        open={Boolean(snack)}
        autoHideDuration={2000}
        onClose={() => setSnack("")}
        message={snack}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      />
    </>
  );
}
