import React from "react";
import { Box, Button, Typography, Zoom } from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  ArrowUpward as ArrowUpwardIcon,
  List as ListIcon,
  Save as SaveIcon,
} from "@mui/icons-material";
import BallotIcon from "@mui/icons-material/Ballot";

const TopBar = ({ readonly, examData, onBack }) => {
  return (
    <>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "auto 1fr auto",  // left / center / right
          alignItems: "center",
          mb: 4,
          columnGap: 2,
        }}
      >
        {/* Left: Back */}
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={onBack}
          sx={{
            borderColor: "#4A90E2",
            color: "#4A90E2",
            borderRadius: "12px",
            fontWeight: "bold",
            "&:hover": { backgroundColor: "#E3F2FD" },
            justifySelf: "start",
          }}
        >
          Back to Dashboard
        </Button>

        {/* Center: Title (now truly centered) */}
        <Typography
          variant="h4"
          sx={{
            fontWeight: "bold",
            color: "#1A237E",
            display: "inline-flex",
            gap: 1,
            alignItems: "center",
            justifySelf: "center",
            textAlign: "center",
          }}
        >
          <BallotIcon sx={{ fontSize: 28 }} />
          {readonly ? "View Exam" : examData ? "Edit Exam" : "Create a New Exam"}
        </Typography>

        {/* Right: invisible spacer to balance the Back button's width */}
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          sx={{
            visibility: "hidden",
            borderRadius: "12px",
            justifySelf: "end",
          }}
          aria-hidden
          tabIndex={-1}
        >
          Back to Dashboard
        </Button>
      </Box>

      <Typography
        variant="subtitle1"
        gutterBottom
        textAlign="center"
        color="text.secondary"
        sx={{ mb: 4 }}
      >
        {readonly
          ? "You are viewing this exam in read-only mode."
          : examData
          ? "Modify the exam details and questions."
          : "Fill in the details and add questions to build your exam."}
      </Typography>
    </>
  );
};

/* --- the rest of your exports stay the same --- */
export const ScrollTopFab = ({ show, onClick }) => (
  <Zoom in={show}>
    <Button
      onClick={onClick}
      variant="contained"
      sx={{
        position: "fixed",
        bottom: 24,
        right: 24,
        borderRadius: "50%",
        width: 56,
        height: 56,
        minWidth: 0,
        bgcolor: "#607d8b",
        "&:hover": { bgcolor: "#455a64" },
        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
      }}
    >
      <ArrowUpwardIcon sx={{ color: "white", fontSize: 32 }} />
    </Button>
  </Zoom>
);
TopBar.ScrollTopFab = ScrollTopFab;

export const GoToListButton = ({ onClick }) => (
  <Button
    variant="outlined"
    startIcon={<ListIcon />}
    onClick={onClick}
    size="large"
    sx={{
      py: 1.5,
      px: 5,
      borderRadius: "12px",
      borderColor: "#607d8b",
      color: "#607d8b",
      fontWeight: "bold",
      "&:hover": {
        borderColor: "#455a64",
        color: "#455a64",
        transform: "translateY(-2px)",
        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
      },
      transition: "all 0.3s ease-in-out",
    }}
  >
    Go to Exam List
  </Button>
);
TopBar.GoToListButton = GoToListButton;

export const SaveButton = ({ label = "Save Exam" }) => (
  <Button
    type="submit"
    variant="contained"
    startIcon={<SaveIcon />}
    size="large"
    sx={{
      py: 1.5,
      px: 5,
      borderRadius: "12px",
      bgcolor: "#607d8b",
      fontWeight: "bold",
      "&:hover": {
        bgcolor: "#455a64",
        transform: "translateY(-2px)",
        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
      },
      transition: "all 0.3s ease-in-out",
    }}
  >
    {label}
  </Button>
);
TopBar.SaveButton = SaveButton;

export default TopBar;
