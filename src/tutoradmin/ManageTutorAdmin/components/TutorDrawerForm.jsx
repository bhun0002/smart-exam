import React, { useEffect, useState } from "react";
import {
    Drawer, Box, Typography, Divider, TextField,
    Button, Stack, Alert as MuiAlert
} from "@mui/material";
import validateEmail from "../helpers/validateEmail";

export default function TutorDrawerForm({ open, onClose, onSubmit, editing }) {
    const isEdit = !!editing;
    const [name, setName] = useState(editing?.name || "");
    const [email, setEmail] = useState(editing?.email || "");
    const [password, setPassword] = useState("");
    const [err, setErr] = useState("");

    useEffect(() => {
        setName(editing?.name || "");
        setEmail(editing?.email || "");
        setPassword("");
        setErr("");
    }, [editing, open]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErr("");

        if (!name.trim() || !email.trim()) return setErr("Name and Email are required.");
        if (!validateEmail(email)) return setErr("Please enter a valid email address.");
        if (!isEdit && (!password.trim() || password.trim().length < 6)) {
            return setErr("Password must be at least 6 characters for a new tutor.");
        }
        const payload = { name: name.trim(), email: email.trim() };
        if (password.trim()) payload.password = password.trim();
        await onSubmit(payload);
    };

    return (
        <Drawer anchor="right" open={open} onClose={onClose} PaperProps={{ sx: { width: { xs: "100%", sm: 420 } } }}>
            <Box sx={{ p: 3, display: "flex", flexDirection: "column", height: "100%" }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                    {isEdit ? "Edit Tutor" : "Add New Tutor"}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {isEdit ? "Update tutor details and save changes." : "Create a tutor account for your team."}
                </Typography>
                <Divider sx={{ mb: 2 }} />

                <Box component="form" onSubmit={handleSubmit} sx={{ display: "grid", gap: 2 }}>
                    {!!err && <MuiAlert severity="error">{err}</MuiAlert>}
                    <TextField
                        label="Tutor Name *"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px" } }}
                    />
                    <TextField
                        label="Email *"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px" } }}
                    />
                    <TextField
                        label={isEdit ? "New Password (optional)" : "Password *"}
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px" } }}
                    />

                    <Stack direction="row" gap={1} justifyContent="flex-end" sx={{ mt: 1 }}>
                        <Button onClick={onClose} variant="outlined" sx={{ borderRadius: "12px" }}>
                            Cancel
                        </Button>
                        <Button type="submit" variant="contained" sx={{ borderRadius: "12px", fontWeight: "bold" }}>
                            {isEdit ? "Save Changes" : "Add Tutor"}
                        </Button>
                    </Stack>
                </Box>
            </Box>
        </Drawer>
    );
}
