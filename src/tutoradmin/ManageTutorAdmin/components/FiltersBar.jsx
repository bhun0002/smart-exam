import React from "react";
import {
    Paper, Box, TextField, InputAdornment, FormControl, InputLabel, Select, MenuItem,
    Stack, Chip, Button, FormControlLabel, Switch
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";

export default function FiltersBar({
    search, setSearch,
    status, setStatus,
    showDeleted, setShowDeleted,      // NEW
    loading,
    onReset
}) {
    return (
        <Paper elevation={2} sx={{ p: 2, mb: 2, borderRadius: "14px", bgcolor: "#fff", border: "1px solid #eef2f6" }}>
            <Box sx={{ display: "grid", gridTemplateColumns: "1.5fr 1fr auto auto", gap: 1.5, alignItems: "center" }}>
                <TextField
                    label="Search (name, email)"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    disabled={loading}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon />
                            </InputAdornment>
                        ),
                        sx: { borderRadius: "12px" },
                    }}
                />

                <FormControl disabled={loading}>
                    <InputLabel id="status-filter-label">Status</InputLabel>
                    <Select
                        labelId="status-filter-label"
                        value={status}
                        label="Status"
                        onChange={(e) => setStatus(e.target.value)}
                        sx={{ borderRadius: "12px" }}
                    >
                        <MenuItem value="all">All</MenuItem>
                        <MenuItem value="approved">Approved</MenuItem>
                        <MenuItem value="pending">Pending</MenuItem>
                    </Select>
                </FormControl>

                <FormControlLabel
                    control={<Switch checked={!!showDeleted} onChange={(e) => setShowDeleted(e.target.checked)} />}
                    label="Show deleted"
                />

                <Stack direction="row" gap={1} justifyContent="flex-end">
                    <Chip
                        label={showDeleted ? "Deleted" : status === "approved" ? "Approved" : status === "pending" ? "Pending" : "All"}
                        color={showDeleted ? "warning" : status === "approved" ? "success" : status === "pending" ? "warning" : "default"}
                        sx={{ borderRadius: "8px", fontWeight: "bold", alignSelf: "center" }}
                    />
                    <Button variant="outlined" onClick={onReset} disabled={loading} sx={{ borderRadius: "12px" }}>
                        Reset
                    </Button>
                </Stack>
            </Box>
        </Paper>
    );
}
