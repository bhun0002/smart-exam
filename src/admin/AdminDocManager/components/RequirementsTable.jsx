import React from "react";
import {
  Paper, Table, TableHead, TableRow, TableCell, TableBody, TableContainer,
  Chip, Tooltip, IconButton, Typography, Stack, Button, CircularProgress
} from "@mui/material";
import {
  Edit as EditIcon,
  DeleteOutline as DeleteOutlineIcon,
  RestoreFromTrash as RestoreIcon,
  InsertDriveFile as FileIcon,
} from "@mui/icons-material";

export default function RequirementsTable({
  rows, onEdit, onSoftDelete, onRestore, onOpenRef, loading, showingDeleted
}) {
  return (
    <TableContainer component={Paper} sx={{ borderRadius: "14px", border: "1px solid #eef2f6" }}>
      <Table stickyHeader size="medium">
        <TableHead sx={{ bgcolor: "#f7f9fc" }}>
          <TableRow>
            <TableCell sx={{ fontWeight: 700 }}>Title</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Description</TableCell>
            <TableCell sx={{ fontWeight: 700, width: 120 }}>Mandatory</TableCell>
            <TableCell sx={{ fontWeight: 700, width: 120 }}>Reference</TableCell>
            <TableCell sx={{ fontWeight: 700, width: 340 }}>Actions</TableCell>
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
                {showingDeleted ? "No deleted requirements." : "No requirements found."}
              </TableCell>
            </TableRow>
          ) : (
            rows.map((r) => {
              const muted = r.isDeleted === true;
              return (
                <TableRow key={r.id} sx={{ "&:nth-of-type(odd)": { bgcolor: "#fafafa" } }}>
                  <TableCell sx={{ fontWeight: 600, ...(muted && { textDecoration: "line-through", color: "text.disabled" }) }}>
                    {r.title}
                  </TableCell>
                  <TableCell
                    sx={{
                      maxWidth: 520,
                      whiteSpace: "nowrap",
                      textOverflow: "ellipsis",
                      overflow: "hidden",
                      color: muted ? "text.disabled" : "text.secondary",
                      ...(muted && { textDecoration: "line-through" }),
                    }}
                    title={r.description || ""}
                  >
                    {r.description || "—"}
                  </TableCell>
                  <TableCell>
                    {r.isMandatory ? (
                      <Chip
                        label="Yes"
                        size="small"
                        sx={{ bgcolor: "#E3F2FD", color: "#1565C0", fontWeight: 700, borderRadius: "8px" }}
                      />
                    ) : (
                      <Chip
                        label="No"
                        size="small"
                        sx={{ bgcolor: "#FFF3E0", color: "#E65100", fontWeight: 700, borderRadius: "8px" }}
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    {r.refMedia ? (
                      <Tooltip title="Open reference">
                        <span>
                          <IconButton size="small" onClick={() => onOpenRef(r)} aria-label="Open reference file" disabled={muted}>
                            <FileIcon />
                          </IconButton>
                        </span>
                      </Tooltip>
                    ) : (
                      <Typography variant="body2" color="text.disabled">
                        —
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1}>
                      {!muted ? (
                        <>
                          <Tooltip title="Edit">
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<EditIcon />}
                              onClick={() => onEdit(r)}
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
                              onClick={() => onSoftDelete(r.id)}
                              sx={{ borderRadius: "10px" }}
                            >
                              Delete
                            </Button>
                          </Tooltip>
                        </>
                      ) : (
                        <Tooltip title="Restore from trash">
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
