// src/admin/components/CoursesTable.jsx
import React from "react";
import {
  Paper, Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
  Stack, Chip, Button, Tooltip, CircularProgress
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import RestoreIcon from "@mui/icons-material/Restore";

const isDeletedTrue = (v) => v === true || v === "true" || v === 1;

export default function CoursesTable({
  rows,
  loading,
  onEdit,
  onSoftDelete,
  onRestore,
  showingDeleted,
}) {
  return (
    <TableContainer component={Paper} sx={{boxShadow: 3, overflow: "hidden" }}>
      <Table stickyHeader size="medium">
        <TableHead
          sx={{
            bgcolor: "#ffd6a5",
            "& .MuiTableCell-head": { backgroundColor: "#ffd6a5", fontWeight: 700, fontSize: "0.95rem", py: 1.25 },
          }}
        >
          <TableRow>
            <TableCell width={120}>Course ID</TableCell>
            <TableCell>Name</TableCell>
            <TableCell width={220}>Created</TableCell>
            <TableCell width={220}>Updated</TableCell>
            <TableCell width={260}>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody sx={{ "& .MuiTableCell-root": { py: 1.1, fontSize: "0.92rem" } }}>
          {loading ? (
            <TableRow><TableCell colSpan={5} align="center" sx={{ py: 6 }}><CircularProgress size={26} /></TableCell></TableRow>
          ) : rows.length === 0 ? (
            <TableRow><TableCell colSpan={5} align="center" sx={{ py: 6, color: "text.secondary" }}>No courses found.</TableCell></TableRow>
          ) : (
            rows.map((r) => {
              const created = r.createdAt?.seconds ? new Date(r.createdAt.seconds * 1000) : null;
              const updated = r.updatedAt?.seconds ? new Date(r.updatedAt.seconds * 1000) : null;
              const del = isDeletedTrue(r.isDeleted);

              return (
                <TableRow key={r.id} sx={{ "&:hover": { bgcolor: "#f1f1f1" } }}>
                  <TableCell>
                    <Chip
                      label={r.courseId || "—"}
                      size="small"
                      sx={{ bgcolor: "#FFFDE7", color: "#795548", fontWeight: 700, borderRadius: "8px" }}
                    />
                  </TableCell>

                  <TableCell>
                    <Stack direction="row" alignItems="center" gap={1}>
                      <Chip
                        label={r.name}
                        sx={{ borderRadius: "8px", fontWeight: 700, ...(del ? { bgcolor: "#fff3e0" } : {}) }}
                      />
                      {del && <Chip label="Deleted" size="small" color="warning" sx={{ borderRadius: "8px" }} />}
                    </Stack>
                  </TableCell>

                  <TableCell>{created ? created.toLocaleString() : "—"}</TableCell>
                  <TableCell>{updated ? updated.toLocaleString() : "—"}</TableCell>

                  <TableCell>
                    {del || showingDeleted ? (
                      <Tooltip title="Restore">
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<RestoreIcon />}
                          onClick={() => onRestore(r.id)}
                          sx={{ borderRadius: "10px", borderColor: "#81C784", color: "#1B5E20" }}
                        >
                          Restore
                        </Button>
                      </Tooltip>
                    ) : (
                      <>
                        <Tooltip title="Edit">
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<EditIcon />}
                            onClick={() => onEdit(r)}
                            sx={{ borderRadius: "10px", borderColor: "#FFB74D", color: "#E65100", mr: 1 }}
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
                            onClick={() => onSoftDelete(r.id)}
                            sx={{ borderRadius: "10px" }}
                          >
                            Delete
                          </Button>
                        </Tooltip>
                      </>
                    )}
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
