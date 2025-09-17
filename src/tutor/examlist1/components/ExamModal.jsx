// src/tutor/examlist/components/ExamModal.jsx
import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Typography,
  useMediaQuery,
  useTheme,
  Divider,
  ButtonGroup,
  Tooltip,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import EditIcon from "@mui/icons-material/Edit";
import VisibilityIcon from "@mui/icons-material/Visibility";
import TutorExamForm from "../../examform/TutorExamForm"; // ✅ path to your refactored form

const ExamModal = ({ open, exam, isEditing, onClose }) => {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("md"));

  // Local editing state (syncs with props, but lets user toggle inside the modal)
  const [localEditing, setLocalEditing] = useState(!!isEditing || !exam?.id);

  useEffect(() => {
    // If creating a new exam -> force Edit mode
    if (!exam?.id) {
      setLocalEditing(true);
    } else {
      setLocalEditing(!!isEditing);
    }
  }, [exam?.id, isEditing]);

  const titleText = exam?.id
    ? localEditing
      ? `Edit: ${exam.title}`
      : `View: ${exam.title}`
    : "Create New Exam";

  // Shared outlined style to match your header buttons
  const outlinedBtn = {
    borderColor: "#4A90E2",
    color: "#4A90E2",
    borderRadius: "12px",
    fontWeight: "bold",
    px: 2.25,
    py: 1.1,
    "&:hover": { backgroundColor: "#E3F2FD" },
  };

  // Toggle UI is disabled for "create new" (no exam to view)
  const canToggle = !!exam?.id;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen={fullScreen}
      maxWidth="lg"
      fullWidth
      scroll="paper"
      keepMounted
      slotProps={{
        backdrop: {
          sx: {
            backdropFilter: "blur(2px)",
            backgroundColor: "rgba(0,0,0,0.25)",
          },
        },
      }}
      PaperProps={{
        sx: {
          bgcolor: "#fefae0",
          borderRadius: fullScreen ? 0 : 2,
          overflow: "hidden",
        },
      }}
    >
      {/* Sticky header */}
      <DialogTitle
        sx={{
          position: "sticky",
          top: 0,
          zIndex: 1,
          bgcolor: "#fefae0",
          px: 3,
          py: 2,
        }}
      >
        <Box display="flex" alignItems="center" justifyContent="space-between" gap={2}>
          <Typography variant="h6" sx={{ color: "#457b9d", fontWeight: 700 }}>
            {titleText}
          </Typography>

          <Box display="flex" alignItems="center" gap={1.5}>
            {/* View/Edit toggle */}
            <Tooltip title={canToggle ? "Switch between view and edit" : "Create mode (edit only)"}>
              <span>
                <ButtonGroup
                  variant="outlined"
                  disabled={!canToggle}
                  sx={{
                    borderRadius: "12px",
                    "& .MuiButton-root": {
                      borderColor: "#4A90E2 !important",
                      color: "#4A90E2",
                      fontWeight: "bold",
                      px: 1.75,
                      "&:hover": { backgroundColor: "#E3F2FD" },
                    },
                  }}
                >
                  <Button
                    onClick={() => setLocalEditing(false)}
                    startIcon={<VisibilityIcon />}
                    sx={{
                      ...(localEditing
                        ? {}
                        : {
                            bgcolor: "#E3F2FD",
                          }),
                    }}
                  >
                    View
                  </Button>
                  <Button
                    onClick={() => setLocalEditing(true)}
                    startIcon={<EditIcon />}
                    sx={{
                      ...(localEditing
                        ? {
                            bgcolor: "#E3F2FD",
                          }
                        : {}),
                    }}
                  >
                    Edit
                  </Button>
                </ButtonGroup>
              </span>
            </Tooltip>

            <IconButton
              aria-label="close"
              onClick={onClose}
              sx={{
                ml: 0.5,
                borderRadius: "10px",
                border: "1px solid #4A90E2",
                color: "#4A90E2",
                "&:hover": { backgroundColor: "#E3F2FD" },
              }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>
        <Divider sx={{ mt: 1 }} />
      </DialogTitle>

      {/* Scrollable content */}
      <DialogContent dividers sx={{ px: { xs: 2, md: 3 }, py: 2 }}>
        <TutorExamForm
          examData={exam?.id ? exam : null}
          readonly={!localEditing && !!exam?.id}
          onSaveSuccess={onClose}
        />
      </DialogContent>

      {/* Sticky actions */}
      <DialogActions
        sx={{
          position: "sticky",
          bottom: 0,
          zIndex: 1,
          bgcolor: "#fefae0",
          px: 3,
          py: 2,
          borderTop: "1px solid rgba(0,0,0,0.08)",
        }}
      >
        <Button onClick={onClose} variant="outlined" sx={outlinedBtn}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ExamModal;
