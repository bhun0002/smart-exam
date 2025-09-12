import React from "react";
import {
    Paper, Table, TableHead, TableRow, TableCell, TableBody, TableContainer,
    Chip, Tooltip, Typography, Stack, Button, CircularProgress, Box
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import RestoreIcon from "@mui/icons-material/Restore";

const isDeletedTrue = (v) => v === true || v === "true" || v === 1;

export default function AdminsTable({
    rows,
    onApprove,
    onEdit,
    onSoftDelete,     // NEW
    onRestore,        // NEW
    showingDeleted,   // NEW
    loading
}) {
    return (
        <TableContainer component={Paper} sx={{ borderRadius: "14px", border: "1px solid #eef2f6" }}>
            <Table stickyHeader size="medium">
                <TableHead sx={{ bgcolor: "#f7f9fc" }}>
                    <TableRow>
                        <TableCell sx={{ fontWeight: 700 }}>Name</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Email</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Roles</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                        <TableCell sx={{ fontWeight: 700, width: 300 }}>Actions</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {loading ? (
                        <TableRow>
                            <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                                <CircularProgress size={26} />
                            </TableCell>
                        </TableRow>
                    ) : rows.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={5} align="center" sx={{ py: 6, color: "text.secondary" }}>
                                No admins found.
                            </TableCell>
                        </TableRow>
                    ) : (
                        rows.map((a) => {
                            const del = isDeletedTrue(a.isDeleted);
                            return (
                                <TableRow key={a.id} sx={{ "&:nth-of-type(odd)": { bgcolor: "#fafafa" } }}>
                                    <TableCell>
                                        <Stack direction="row" spacing={1.5} alignItems="center">
                                            <Box
                                                sx={{
                                                    width: 32, height: 32, borderRadius: "10px",
                                                    bgcolor: "#BBDEFB", color: "#0D47A1",
                                                    display: "grid", placeItems: "center", fontWeight: 700,
                                                }}
                                            >
                                                {(a.name || "A")[0].toUpperCase()}
                                            </Box>
                                            <Box>
                                                <Typography sx={{ fontWeight: 600, lineHeight: 1.1 }}>{a.name}</Typography>
                                                {del && <Chip label="Deleted" size="small" color="warning" sx={{ mt: 0.5, borderRadius: "8px" }} />}
                                            </Box>
                                        </Stack>
                                    </TableCell>

                                    <TableCell>{a.email}</TableCell>

                                    <TableCell>
                                        {!!a.isMasterAdmin && (
                                            <Chip label="Master" size="small" sx={{ mr: 1, bgcolor: "#FFC107", color: "#000", fontWeight: 700, borderRadius: "8px" }} />
                                        )}
                                        {!!a.isTutorAdmin && (
                                            <Chip label="Tutor Admin" size="small" sx={{ bgcolor: "#03A9F4", color: "#fff", fontWeight: 700, borderRadius: "8px" }} />
                                        )}
                                    </TableCell>

                                    <TableCell>
                                        <Chip
                                            label={a.isApproved ? "Approved" : "Pending"}
                                            color={a.isApproved ? "success" : "warning"}
                                            size="small"
                                            sx={{ fontWeight: 700, borderRadius: "8px" }}
                                        />
                                    </TableCell>

                                    <TableCell>
                                        <Stack direction="row" spacing={1}>
                                            {del || showingDeleted ? (
                                                <Tooltip title="Restore">
                                                    <Button
                                                        size="small"
                                                        variant="outlined"
                                                        startIcon={<RestoreIcon />}
                                                        onClick={() => onRestore(a.id)}
                                                        sx={{ borderRadius: "10px", borderColor: "#81C784", color: "#1B5E20" }}
                                                    >
                                                        Restore
                                                    </Button>
                                                </Tooltip>
                                            ) : (
                                                <>
                                                    {!a.isApproved && (
                                                        <Tooltip title="Approve">
                                                            <Button
                                                                size="small"
                                                                variant="outlined"
                                                                startIcon={<CheckCircleOutlineIcon />}
                                                                onClick={() => onApprove(a.id, true)}
                                                                sx={{ borderRadius: "10px", borderColor: "#81C784", color: "#1B5E20" }}
                                                            >
                                                                Approve
                                                            </Button>
                                                        </Tooltip>
                                                    )}
                                                    <Tooltip title="Edit">
                                                        <Button
                                                            size="small"
                                                            variant="outlined"
                                                            startIcon={<EditIcon />}
                                                            onClick={() => onEdit(a)}
                                                            sx={{ borderRadius: "10px", borderColor: "#FFB74D", color: "#E65100" }}
                                                        >
                                                            Edit
                                                        </Button>
                                                    </Tooltip>
                                                    <Tooltip title="Move to trash">
                                                        <Button
                                                            size="small"
                                                            variant="outlined"
                                                            color="error"
                                                            startIcon={<DeleteOutlineIcon />}
                                                            onClick={() => onSoftDelete(a.id)}
                                                            sx={{ borderRadius: "10px" }}
                                                        >
                                                            Delete
                                                        </Button>
                                                    </Tooltip>
                                                </>
                                            )}
                                        </Stack>
                                    </TableCell>
                                </TableRow>
                            );
                        })
                    )}
                </TableBody>
            </Table>
        </TableContainer>
    );
}
