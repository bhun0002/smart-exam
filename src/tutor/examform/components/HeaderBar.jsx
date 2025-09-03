import React from "react";
import { Box, Button, Typography, Zoom } from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  ArrowUpward as ArrowUpwardIcon,
  List as ListIcon,
  Save as SaveIcon,
} from "@mui/icons-material";

const HeaderBar = ({ readonly, examData, onBack }) => {
  return (
    <>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 4,
        }}
      >
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
          }}
        >
          Back to Dashboard
        </Button>

        <Typography
          variant="h4"
          gutterBottom
          textAlign="center"
          fontWeight="bold"
          color="#37474f"
          sx={{ flexGrow: 1 }}
        >
          {readonly ? "View Exam" : examData ? "Edit Exam" : "Create a New Exam"}
        </Typography>

        <Box sx={{ width: 150 }} />
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
HeaderBar.ScrollTopFab = ScrollTopFab;

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
HeaderBar.GoToListButton = GoToListButton;

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
HeaderBar.SaveButton = SaveButton;

export default HeaderBar;
