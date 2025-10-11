import * as React from "react";
import { Card, CardContent, Stack, Box, Typography, Button, Divider } from "@mui/material";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { Link as RouterLink } from "react-router-dom";

export default function FinalCtaCard() {
  return (
    <Card
      sx={{
        borderRadius: 3,
        border: "1px solid #E5E7EB",
        background: "linear-gradient(180deg,#FFFFFF 0%,#FAFAFA 100%)",
        "&:hover": { boxShadow: 2 },
      }}
    >
      <CardContent>
        <Stack direction={{ xs: "column", sm: "row" }} alignItems={{ xs: "stretch", sm: "center" }} justifyContent="space-between" spacing={2}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>Ready to begin?</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Check your schedule for exams marked <b>Now</b>, then enter the password to start.
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} sx={{ "@media print": { display: "none" } }}>
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
              sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2, backgroundColor: "#4A90E2", ":hover": { backgroundColor: "#3E7CC5" } }}
            >
              Go to Available Exams
            </Button>
          </Stack>
        </Stack>
      </CardContent>
      <Divider />
      <Box component="nav" sx={{ p: 1.25, display: "flex", gap: 1, flexWrap: "wrap" }}>
        <Button href="#timing" size="small" variant="text" sx={{ textTransform: "none" }}>Timing</Button>
        <Button href="#password" size="small" variant="text" sx={{ textTransform: "none" }}>Password</Button>
        <Button href="#checklist" size="small" variant="text" sx={{ textTransform: "none" }}>Checklist</Button>
        <Button href="#integrity" size="small" variant="text" sx={{ textTransform: "none" }}>Integrity</Button>
        <Button href="#faqs" size="small" variant="text" sx={{ textTransform: "none" }}>FAQs</Button>
      </Box>
    </Card>
  );
}
