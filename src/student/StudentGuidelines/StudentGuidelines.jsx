import * as React from "react";
import { Box, Stack, Divider, Paper, Button } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import TopBar from "./components/TopBar";
import IntroHeader from "./components/IntroHeader";
import TimingCard from "./components/TimingCard";
import PasswordCard from "./components/PasswordCard";
import ChecklistCard from "./components/ChecklistCard";
import IntegrityCard from "./components/IntegrityCard";
import FaqsCard from "./components/FaqsCard";
import FinalCtaCard from "./components/FinalCtaCard";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import { Link as RouterLink } from "react-router-dom";

export default function StudentGuidelines() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background:
          "radial-gradient(1200px 600px at 50% 0%, rgba(255,255,255,0.95) 0%, #F9FAFB 60%, #F3F4F6 100%)",
        "@media print": { background: "#fff" },
      }}
    >
      <TopBar title="Exam Guidelines" />

      <Box sx={{ px: { xs: 2, md: 4 }, py: 4, maxWidth: 1200, mx: "auto" }}>
        <IntroHeader />
        <Stack spacing={3.5} sx={{ mt: 4 }}>
          <Box id="timing"><TimingCard /></Box>
          <Box id="password"><PasswordCard /></Box>
          <Box id="checklist"><ChecklistCard /></Box>
          <Box id="integrity"><IntegrityCard /></Box>
          <Box id="faqs"><FaqsCard /></Box>
          <Divider sx={{ my: 1 }} />
          <Box id="final"><FinalCtaCard /></Box>
        </Stack>
      </Box>

      {/* Desktop quick actions (fixed right) */}
      <Paper
        elevation={6}
        sx={{
          position: "fixed",
          right: 24,
          top: 112,
          p: 1.5,
          borderRadius: 2,
          display: { xs: "none", md: "flex" },
          flexDirection: "column",
          gap: 1,
          border: "1px solid #E5E7EB",
          backgroundColor: "rgba(255,255,255,0.9)",
          backdropFilter: "blur(8px)",
          "@media print": { display: "none" },
        }}
      >
        <Button
          component={RouterLink}
          to="/student-schedule"
          size="small"
          variant="outlined"
          startIcon={<EventAvailableIcon />}
          sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2 }}
        >
          Open Schedule
        </Button>
        <Button
          component={RouterLink}
          to="/student-exam-list"
          size="small"
          variant="contained"
          endIcon={<ArrowForwardIcon />}
          sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2, backgroundColor: "#4A90E2", ":hover": { backgroundColor: "#3E7CC5" } }}
        >
          Available Exams
        </Button>
        <Button
          size="small"
          variant="text"
          startIcon={<KeyboardArrowUpIcon />}
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2 }}
        >
          Back to Top
        </Button>
      </Paper>

      {/* Mobile sticky actions (bottom) */}
      {isMobile && (
        <Paper
          elevation={8}
          sx={{
            position: "sticky",
            bottom: 0,
            left: 0,
            right: 0,
            p: 1.25,
            display: "flex",
            gap: 1,
            borderTop: "1px solid #E5E7EB",
            backgroundColor: "rgba(255,255,255,0.96)",
            backdropFilter: "blur(8px)",
            "@media print": { display: "none" },
          }}
        >
          <Button
            component={RouterLink}
            to="/student-schedule"
            fullWidth
            variant="outlined"
            startIcon={<EventAvailableIcon />}
            sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2 }}
          >
            Schedule
          </Button>
          <Button
            component={RouterLink}
            to="/student-exam-list"
            fullWidth
            variant="contained"
            endIcon={<ArrowForwardIcon />}
            sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2, backgroundColor: "#4A90E2", ":hover": { backgroundColor: "#3E7CC5" } }}
          >
            Exams
          </Button>
        </Paper>
      )}
    </Box>
  );
}
