// src/admin/components/AdminDrawerForm.jsx
import React, { useEffect, useState } from "react";
import {
  Drawer, Box, Typography, Divider, TextField, FormControlLabel, Checkbox,
  Button, Stack, Alert as MuiAlert
} from "@mui/material";
import validateEmail from "../helpers/validateEmail";

export default function AdminDrawerForm({ open, onClose, onSubmit, editing }) {
  const isEdit = !!editing;
  const [name, setName] = useState(editing?.name || "");
  const [email, setEmail] = useState(editing?.email || "");
  const [password, setPassword] = useState("");
  const [isMasterAdmin, setIsMasterAdmin] = useState(!!editing?.isMasterAdmin);
  const [isTutorAdmin, setIsTutorAdmin] = useState(!!editing?.isTutorAdmin);
  const [err, setErr] = useState("");

  useEffect(() => {
    setName(editing?.name || "");
    setEmail(editing?.email || "");
    setPassword("");
    setIsMasterAdmin(!!editing?.isMasterAdmin);
    setIsTutorAdmin(!!editing?.isTutorAdmin);
    setErr("");
  }, [editing, open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    if (!name.trim() || !email.trim()) return setErr("Name and Email are required.");
    if (!validateEmail(email)) return setErr("Please enter a valid email.");
    if (!isEdit && (!password.trim() || password.length < 6)) return setErr("Password must be at least 6 characters.");

    const payload = {
      name: name.trim(),
      email: email.trim(),
      isMasterAdmin,
      isTutorAdmin
    };
    if (password.trim()) payload.password = password.trim();

    await onSubmit(payload);
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { width: { xs: "100%", sm: 560 }, borderLeft: "1px solid #eee" } }}
    >
      <Box sx={{ p: 3, display: "flex", flexDirection: "column", height: "100%", gap: 2, bgcolor: "#fff" }}>
        <Typography variant="h6" sx={{ color: "#1A237E", fontWeight: "bold" }}>
          {isEdit ? "Edit Admin" : "Add Admin"}
        </Typography>
        <Divider />

        <Box component="form" onSubmit={handleSubmit} sx={{ display: "grid", gap: 2 }}>
          {!!err && <MuiAlert severity="error">{err}</MuiAlert>}

          <TextField
            label="Admin Name *"
            value={name}
            onChange={(e) => setName(e.target.value)}
            InputProps={{ sx: { borderRadius: "12px" } }}
          />
          <TextField
            label="Email *"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            InputProps={{ sx: { borderRadius: "12px" } }}
          />
          <TextField
            label={isEdit ? "New Password (optional)" : "Password *"}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            InputProps={{ sx: { borderRadius: "12px" } }}
          />

          <FormControlLabel
            control={<Checkbox checked={isMasterAdmin} onChange={(e) => setIsMasterAdmin(e.target.checked)} />}
            label="Master Admin"
          />
          <FormControlLabel
            control={<Checkbox checked={isTutorAdmin} onChange={(e) => setIsTutorAdmin(e.target.checked)} />}
            label="Tutor Admin"
          />

          <Stack direction="row" gap={1} justifyContent="flex-end" sx={{ mt: 1 }}>
            <Button onClick={onClose} variant="outlined" sx={{ borderRadius: "12px" }}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" sx={{ borderRadius: "12px", fontWeight: "bold" }}>
              {isEdit ? "Save Changes" : "Add Admin"}
            </Button>
          </Stack>
        </Box>
      </Box>
    </Drawer>
  );
}
