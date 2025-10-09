import * as React from "react";
import { Box, Stack, Typography, Button } from "@mui/material";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { Link as RouterLink } from "react-router-dom";
import studentIllustration from "../assets/studentIllustration.png";

export default function IntroHeader() {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: { xs: "column", md: "row" },
        alignItems: "center",
        justifyContent: "space-between",
        p: { xs: 2.5, md: 3 },
        borderRadius: 3,
        background: "#FFFFFF",
        boxShadow: "0 2px 6px rgba(0,0,0,0.06)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* soft blue curved banner on right side */}
      <Box
        sx={{
          position: "absolute",
          right: -60,
          top: -60,
          width: 320,
          height: 320,
          borderRadius: "50%",
          background: "linear-gradient(135deg, #EAF3FF 0%, #F5FAFF 100%)",
          pointerEvents: "none",
        }}
      />
      <Box sx={{ maxWidth: 560, position: "relative", zIndex: 1 }}>
        <Typography variant="h5" sx={{ fontWeight: 800 }}>
          Read this before you start an exam
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Clear, quick instructions for timing, passwords, submissions, and what to do if anything goes wrong.
          New to this system? This page is for you.
        </Typography>
        <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
          <Button
            component={RouterLink}
            to="/student-schedule"
            variant="outlined"
            startIcon={<EventAvailableIcon />}
            sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2 }}
          >
            Open My Schedule
          </Button>
          <Button
            component={RouterLink}
            to="/student-exam-list"
            variant="contained"
            endIcon={<ArrowForwardIcon />}
            sx={{
              textTransform: "none",
              fontWeight: 700,
              borderRadius: 2,
              backgroundColor: "#4A90E2",
              ":hover": { backgroundColor: "#3E7CC5" },
            }}
          >
            Go to Available Exams
          </Button>
        </Stack>
      </Box>

      <Box
        component="img"
        src={studentIllustration}
        alt="Student illustration"
        sx={{
          mt: { xs: 3, md: 0 },
          width: { xs: "82%", md: 300 },
          maxWidth: 360,
          borderRadius: 2,
          alignSelf: { xs: "center", md: "flex-end" },
          zIndex: 1,
        }}
      />
    </Box>
  );
}
