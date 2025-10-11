import * as React from "react";
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  Button,
  Link as MUILink,
  Divider,
  Chip,
  Stack,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import TopBar from "../landing/components/TopBar";
import Footer from "../landing/components/Footer";

const TOKENS = {
  radius: 24,
  gradientBg:
    "linear-gradient(135deg, rgba(232,244,255,0.9) 0%, rgba(222,246,240,0.9) 100%)",
};

const toc = [
  { id: "start", title: "Getting started" },
  { id: "checklist", title: "Exam day checklist" },
  { id: "troubleshoot", title: "Troubleshooting" },
  { id: "account", title: "Account & access" },
  { id: "support", title: "Contact & support" },
  { id: "system", title: "System requirements" },
  { id: "policies", title: "Policies" },
];

export default function Help() {
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

      <Container maxWidth="lg" sx={{ pt: { xs: 5, md: 8 }, pb: 6 }}>
        <Grid container spacing={3}>
          {/* LEFT: TOC */}
          <Grid item xs={12} md={4} lg={3}>
            <Paper
              elevation={6}
              sx={{
                position: { md: "sticky" },
                top: 88,
                p: 2,
                borderRadius: `${TOKENS.radius}px`,
              }}
              aria-label="Help sections navigation"
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                Quick links
              </Typography>
              <List dense>
                {toc.map((s) => (
                  <ListItem key={s.id} disablePadding>
                    <ListItemButton
                      component="a"
                      href={`#${s.id}`}
                      sx={{ borderRadius: 1 }}
                    >
                      <ListItemText primary={s.title} />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>

              <Divider sx={{ my: 1.5 }} />
              <Stack direction="column" spacing={1}>
                <Button
                  fullWidth
                  variant="contained"
                  href="/student-login"
                  sx={{ textTransform: "none" }}
                >
                  Student Login
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  href="/tutor-login"
                  sx={{ textTransform: "none" }}
                >
                  Tutor Login
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  href="/tutor-admin-login"
                  sx={{ textTransform: "none" }}
                >
                  Tutor Admin Login
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  href="/admin-login"
                  sx={{ textTransform: "none" }}
                >
                  Admin Login
                </Button>
              </Stack>
            </Paper>
          </Grid>

          {/* RIGHT: CONTENT */}
          <Grid item xs={12} md={8} lg={9}>
            <Paper elevation={6} sx={{ p: { xs: 3, md: 4 }, borderRadius: `${TOKENS.radius}px` }}>
              <Typography variant="h3" sx={{ fontWeight: 800, mb: 1 }}>
                Help & Support
              </Typography>
              <Typography sx={{ color: "text.secondary", mb: 3 }}>
                Short guides, FAQs and contact options for EduBridge – CICC.
              </Typography>

              {/* Getting started */}
              <section id="start" aria-labelledby="start-h">
                <Typography id="start-h" variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
                  Getting started
                </Typography>
                <Typography sx={{ mb: 1.5 }}>
                  Choose your role and sign in. If you’re unsure which role you have,
                  ask your program coordinator.
                </Typography>
                <ul>
                  <li><b>Students:</b> Use <MUILink href="/student-login">/student-login</MUILink> to join exams and view results.</li>
                  <li><b>Tutors:</b> Use <MUILink href="/tutor-login">/tutor-login</MUILink> to create/schedule exams and review submissions.</li>
                  <li><b>Tutor Admins:</b> Use <MUILink href="/tutor-admin-login">/tutor-admin-login</MUILink> to manage tutors/exams/cohorts.</li>
                  <li><b>Admins:</b> Use <MUILink href="/admin-login">/admin-login</MUILink> to manage settings, users and billing.</li>
                </ul>
                <Alert severity="info" sx={{ mt: 1 }}>
                  New user? Your account is created by CICC staff or via invitation.
                  If you can’t sign in, see <MUILink href="#account">Account & access</MUILink>.
                </Alert>
              </section>

              <Divider sx={{ my: 3 }} />

              {/* Exam Day Checklist */}
              <section id="checklist" aria-labelledby="checklist-h">
                <Typography id="checklist-h" variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
                  Exam day checklist
                </Typography>
                <ul>
                  <li>Stable internet; plug in your device or ensure battery &gt; 50%.</li>
                  <li>Supported browser (Chrome/Edge/Firefox recent version).</li>
                  <li>Disable VPNs, pop-up blockers, and tab auto-suspenders.</li>
                  <li>If proctoring is enabled: allow camera/mic/screen-share permissions.</li>
                  <li>Close other tabs/apps; keep only EduBridge open.</li>
                  <li>Join the exam a few minutes early to pass system checks.</li>
                </ul>
                <Alert severity="success" sx={{ mt: 1 }}>
                  Tip: Press <b>Ctrl +</b> / <b>Ctrl -</b> to zoom if UI looks small/large.
                </Alert>
              </section>

              <Divider sx={{ my: 3 }} />

              {/* Troubleshooting */}
              <section id="troubleshoot" aria-labelledby="troubleshoot-h">
                <Typography id="troubleshoot-h" variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
                  Troubleshooting
                </Typography>

                <Accordion disableGutters>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography fontWeight={700}>
                      “Missing or insufficient permissions” when registering or saving
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Typography sx={{ mb: 1 }}>
                      This means your account doesn’t have rights to write to Firestore for that action.
                    </Typography>
                    <ul>
                      <li>Sign in with the correct role (e.g., only <b>Master Admin</b> can create admins).</li>
                      <li>Ask CICC IT to confirm your role and Firestore rules for the collection.</li>
                      <li>Avoid storing plaintext passwords—use Firebase Auth for credentials.</li>
                    </ul>
                    <Alert severity="info" sx={{ mt: 1 }}>
                      If you’re testing locally, an admin must grant temporary access or run an approved seeding script.
                    </Alert>
                  </AccordionDetails>
                </Accordion>

                <Accordion disableGutters>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography fontWeight={700}>
                      Dev server won’t start: “Cannot find module '../scripts/start'”
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Typography sx={{ mb: 1 }}>
                      Your <code>react-scripts</code> install is corrupted.
                    </Typography>
                    <ol>
                      <li>Delete <code>node_modules</code> and <code>package-lock.json</code>.</li>
                      <li>Run <code>npm install</code>, then <code>npm install react-scripts@5.0.1</code>.</li>
                      <li>Start the app: <code>npm start</code>.</li>
                    </ol>
                    <Typography>If it persists, run <code>npm cache clean --force</code> and reinstall.</Typography>
                  </AccordionDetails>
                </Accordion>

                <Accordion disableGutters>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography fontWeight={700}>I can’t see the exam or it says “not available”.</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <ul>
                      <li>Check the scheduled window and your time zone.</li>
                      <li>Ensure you’re logged into the correct student account/intake.</li>
                      <li>Ask your tutor to confirm you’re added to the cohort and the exam is published.</li>
                    </ul>
                  </AccordionDetails>
                </Accordion>

                <Accordion disableGutters>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography fontWeight={700}>Camera/mic/screen permission blocked.</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <ul>
                      <li>Refresh and allow permissions when prompted.</li>
                      <li>In Chrome: <i>Site settings</i> → Allow Camera/Microphone.</li>
                      <li>On Windows/macOS: check OS privacy settings for camera/mic/screen recording.</li>
                    </ul>
                  </AccordionDetails>
                </Accordion>
              </section>

              <Divider sx={{ my: 3 }} />

              {/* Account & Access */}
              <section id="account" aria-labelledby="account-h">
                <Typography id="account-h" variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
                  Account & access
                </Typography>
                <ul>
                  <li><b>Forgot password:</b> use the link on your login page.</li>
                  <li><b>Role incorrect:</b> contact your program coordinator to update your role.</li>
                  <li><b>New user:</b> accounts are created by CICC; self-registration may be disabled.</li>
                </ul>
                <Alert severity="warning" sx={{ mt: 1 }}>
                  For security, we cannot discuss accounts over public chat. Use your CICC email.
                </Alert>
              </section>

              <Divider sx={{ my: 3 }} />

              {/* Contact & Support */}
              <section id="support" aria-labelledby="support-h">
                <Typography id="support-h" variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
                  Contact & support
                </Typography>
                <Typography sx={{ mb: 1 }}>
                  Best way to reach us is by email. Include your name, role, intake, course, and a screenshot.
                </Typography>
                <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                  <Chip label="Weekdays 9:00–17:00 ET" />
                  <Chip label="Urgent during exams: +[hotline]" />
                </Stack>
                <ul>
                  <li>Email: <MUILink href="mailto:[support@cicc.edu]">[support@cicc.edu]</MUILink></li>
                  <li>Ticket form: <MUILink href="/support-form">/support-form</MUILink> (optional)</li>
                </ul>
                <Button
                  variant="contained"
                  sx={{ textTransform: "none", mt: 1 }}
                  href="mailto:[support@cicc.edu]?subject=EduBridge%20Support&body=Name:%0ARole:%0AIntake/Course:%0AIssue:%0ASteps%20to%20reproduce:%0AScreenshot%20link:%0A"
                >
                  Email Support
                </Button>
              </section>

              <Divider sx={{ my: 3 }} />

              {/* System requirements */}
              <section id="system" aria-labelledby="system-h">
                <Typography id="system-h" variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
                  System requirements
                </Typography>
                <ul>
                  <li>Modern browser (Chrome/Edge/Firefox latest 2 versions).</li>
                  <li>Minimum 2 Mbps up/down; 720p camera for proctored exams.</li>
                  <li>Allow cookies and pop-ups for edubridge.cicc.</li>
                  <li>Disable conflicting extensions (ad-blockers, tab suspenders) during exams.</li>
                </ul>
              </section>

              <Divider sx={{ my: 3 }} />

              {/* Policies */}
              <section id="policies" aria-labelledby="policies-h">
                <Typography id="policies-h" variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
                  Policies
                </Typography>
                <Typography>
                  See our <MUILink href="/privacy">Privacy Policy</MUILink> and{" "}
                  <MUILink href="/terms">Terms of Use</MUILink>. If your course uses
                  proctoring, your tutor will share specific rules.
                </Typography>
              </section>
            </Paper>
          </Grid>
        </Grid>
      </Container>

      <Footer />
    </Box>
  );
}
