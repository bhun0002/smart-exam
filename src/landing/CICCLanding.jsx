import * as React from "react";
import { Box, Container, Grid, Typography, Paper, Button, Link } from "@mui/material";
import TopBar from "./components/TopBar";
import RoleCard from "./components/RoleCard";
import Footer from "./components/Footer";

// Shared visual tokens (kept local to avoid breaking your theme)
const TOKENS = {
  radius: 24,
  cardShadow: "0 12px 24px rgba(0,0,0,0.12)",
  cardShadowHover: "0 20px 40px rgba(0,0,0,0.20)",
  gradientBg:
    "linear-gradient(135deg, rgba(232,244,255,0.9) 0%, rgba(222,246,240,0.9) 100%)",
};

export default function CICCLanding() {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#f6f9fc",
        backgroundImage: TOKENS.gradientBg,
        backgroundAttachment: "fixed",
      }}
    >
      <TopBar title="EduBridge – CICC" helpHref="/help" />

      <Container maxWidth="lg" sx={{ pt: { xs: 6, md: 10 }, pb: 6 }}>
        <Box sx={{ textAlign: "center", mb: 5 }}>
          <Typography variant="h3" component="h1" sx={{ fontWeight: 700, mb: 1 }}>
            Welcome to EduBridge – CICC
          </Typography>
          <Typography variant="subtitle1" sx={{ color: "text.secondary" }}>
            Select your role to continue to the login page.
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {/* Admin */}
          <Grid item xs={12} sm={6}>
            <RoleCard
              color="#2F80ED"
              icon="settings"
              title="Admin"
              description="Manage institution settings, users, and billing."
              ctaText="Go to /admin-login"
              to="/admin-login"
              tokens={TOKENS}
            />
          </Grid>

          {/* Tutor Admin */}
          <Grid item xs={12} sm={6}>
            <RoleCard
              color="#34495E"
              icon="shield"
              title="Tutor Admin"
              description="Manage tutors, exams, and cohorts."
              ctaText="Go to /tutor-admin-login"
              to="/tutor-admin-login"
              tokens={TOKENS}
            />
          </Grid>

          {/* Tutor */}
          <Grid item xs={12} sm={6}>
            <RoleCard
              color="#2FA79B"
              icon="person"
              title="Tutor"
              description="Create and schedule exams, review submissions."
              ctaText="Go to /tutor-login"
              to="/tutor-login"
              tokens={TOKENS}
            />
          </Grid>

          {/* Student */}
          <Grid item xs={12} sm={6}>
            <RoleCard
              color="#3B82F6"
              icon="cap"
              title="Student"
              description="Join exams and view results."
              ctaText="Go to /student-login"
              to="/student-login"
              tokens={TOKENS}
            />
          </Grid>
        </Grid>

        {/* Quick links */}
        <Paper
          elevation={0}
          sx={{
            mt: 4,
            px: 2,
            py: 1.5,
            display: "flex",
            gap: 3,
            justifyContent: "center",
            bgcolor: "transparent",
          }}
        >
          {/* <Link href="/forgot-password" underline="hover">
            Forgot password?
          </Link>
          <Link href="/support" underline="hover">
            I’m in the wrong place
          </Link> */}
        </Paper>
      </Container>

      <Footer />
    </Box>
  );
}
