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
  Link as MUILink,
  Divider,
} from "@mui/material";
import TopBar from "../landing/components/TopBar";
import Footer from "../landing/components/Footer";

const TOKENS = {
  radius: 24,
  gradientBg:
    "linear-gradient(135deg, rgba(232,244,255,0.9) 0%, rgba(222,246,240,0.9) 100%)",
};

const toc = [
  { id: "overview", title: "Overview" },
  { id: "scope", title: "Scope & Application" },
  { id: "collect", title: "Information We Collect" },
  { id: "how-collect", title: "How Information is Collected" },
  { id: "purpose", title: "Purposes for Collection" },
  { id: "use", title: "Use of Information" },
  { id: "sharing", title: "Data Sharing & Disclosure" },
  { id: "crossborder", title: "Cross-Border Data Handling" },
  { id: "retention", title: "Retention & Disposal" },
  { id: "security", title: "Security & Safeguards" },
  { id: "records", title: "Student & Academic Records" },
  { id: "consent", title: "Consent & Access Rights" },
  { id: "accuracy", title: "Accuracy & Updates" },
  { id: "rights", title: "Your Rights & Requests" },
  { id: "changes", title: "Changes to This Policy" },
  { id: "contact", title: "Contact Information" },
];

export default function Privacy() {
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
          {/* LEFT: Quick Links */}
          <Grid item xs={12} md={4} lg={3}>
            <Paper
              elevation={6}
              sx={{
                position: { md: "sticky" },
                top: 88,
                p: 2,
                borderRadius: `${TOKENS.radius}px`,
              }}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                Information We Cover
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
            </Paper>
          </Grid>

          {/* RIGHT: Content */}
          <Grid item xs={12} md={8} lg={9}>
            <Paper
              elevation={6}
              sx={{
                p: { xs: 3, md: 4 },
                borderRadius: `${TOKENS.radius}px`,
                "& li": { marginBottom: 0.5 },
              }}
            >
              <Typography variant="h3" sx={{ fontWeight: 800, mb: 1 }}>
                Privacy Policy
              </Typography>
              <Typography sx={{ color: "text.secondary", mb: 3 }}>
                This Privacy Policy explains how EduBridge – CICC collects, uses, and protects
                personal information <br />in connection with academic, administrative, and technical
                operations.
                It reflects our commitment <br />to confidentiality, integrity, and responsible data handling.
              </Typography>

              {/* 1. Overview */}
              <section id="overview">
                <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
                  Overview
                </Typography>
                <ul>
                  <li>EduBridge – CICC is committed to safeguarding personal information under the <br /> <b>Personal Information Protection and Electronic Documents Act (PIPEDA)</b>.</li>
                  <li>This policy applies to all users including students, tutors, and administrators.</li>
                  <li>Personal information is collected only when necessary for academic or administrative purposes.</li>
                  <li>We maintain transparency about how and why your information is used.</li>
                </ul>
              </section>

              <Divider sx={{ my: 3 }} />

              {/* 2. Scope & Application */}
              <section id="scope">
                <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
                  Scope & Application
                </Typography>
                <ul>
                  <li>This policy applies to all digital platforms and systems operated by EduBridge – CICC.</li>
                  <li>It covers personal data collected through web portals, exam systems, cloud services, <br />and communication tools.</li>
                  <li>All users interacting with the platform agree to comply with this policy.</li>
                  <li>Third-party service providers supporting EduBridge – CICC are contractually bound to follow <br /> equivalent privacy standards.</li>
                </ul>
              </section>

              <Divider sx={{ my: 3 }} />

              {/* 3. Information We Collect */}
              <section id="collect">
                <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
                  Information We Collect
                </Typography>
                <ul>
                  <li><b>Identification data:</b> name, email, student or employee ID, and program details.</li>
                  <li><b>Authentication data:</b> login credentials, device identifiers, and session logs.</li>
                  <li><b>Academic records:</b> assignments, exams, scores, and participation records.</li>
                  <li><b>Communication data:</b> messages, feedback, or support requests.</li>
                  <li><b>Proctoring data:</b> screen capture, webcam, or microphone feeds (when applicable).</li>
                  <li><b>Technical data:</b> browser type, operating system, IP address, and access timestamps.</li>
                </ul>
              </section>

              <Divider sx={{ my: 3 }} />

              {/* 4. How Information is Collected */}
              <section id="how-collect">
                <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
                  How Information is Collected
                </Typography>
                <ul>
                  <li>Directly from users during registration, login, and exam participation.</li>
                  <li>Automatically through cookies, session analytics, and security logs.</li>
                  <li>From institutional records shared by authorized CICC staff or departments.</li>
                  <li>Through integration with secure third-party learning tools (e.g., Google Workspace, Firebase).</li>
                </ul>
              </section>

              <Divider sx={{ my: 3 }} />

              {/* 5. Purpose for Collection */}
              <section id="purpose">
                <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
                  Purposes for Collection
                </Typography>
                <ul>
                  <li>To deliver academic services and maintain accurate student records.</li>
                  <li>To authenticate users and provide personalized access.</li>
                  <li>To ensure academic integrity during exams and coursework.</li>
                  <li>To manage administrative workflows such as scheduling and communication.</li>
                  <li>To analyze performance and improve platform reliability.</li>
                </ul>
              </section>

              <Divider sx={{ my: 3 }} />

              {/* 6. Use of Information */}
              <section id="use">
                <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
                  Use of Information
                </Typography>
                <ul>
                  <li>Personal data is used strictly for educational and operational needs.</li>
                  <li>We do not use personal information for marketing or unrelated activities.</li>
                  <li>Aggregate data may be used for statistical or quality assurance reports.</li>
                  <li>Usage logs help monitor technical performance and detect unauthorized activity.</li>
                </ul>
              </section>

              <Divider sx={{ my: 3 }} />

              {/* 7. Data Sharing & Disclosure */}
              <section id="sharing">
                <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
                  Data Sharing & Disclosure
                </Typography>
                <ul>
                  <li>EduBridge – CICC does not sell or rent any user data.</li>
                  <li>Information may be shared internally with faculty or authorized staff for academic support.</li>
                  <li>Third-party vendors receive only limited data necessary to deliver secure services.</li>
                  <li>Data may be disclosed to legal authorities only when required by applicable law.</li>
                </ul>
              </section>

              <Divider sx={{ my: 3 }} />

              {/* 8. Cross-Border Data Handling */}
              <section id="crossborder">
                <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
                  Cross-Border Data Handling
                </Typography>
                <ul>
                  <li>Some cloud infrastructure may store or process data outside Canada.</li>
                  <li>All international transfers comply with privacy laws and institutional contracts.</li>
                  <li>We ensure equivalent protection measures through encryption and access control.</li>
                </ul>
              </section>

              <Divider sx={{ my: 3 }} />

              {/* 9. Retention & Disposal */}
              <section id="retention">
                <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
                  Retention & Disposal
                </Typography>
                <ul>
                  <li>Records are retained only as long as necessary to meet academic, administrative, or legal requirements.</li>
                  <li>Exam materials are typically deleted within six months unless required for review.</li>
                  <li>Backups are securely deleted or anonymized after retention periods expire.</li>
                </ul>
              </section>

              <Divider sx={{ my: 3 }} />

              {/* 10. Security & Safeguards */}
              <section id="security">
                <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
                  Security & Safeguards
                </Typography>
                <ul>
                  <li>EduBridge – CICC uses encryption, firewalls, and secure authentication to protect data.</li>
                  <li>Access to sensitive data is limited to authorized personnel.</li>
                  <li>Regular system audits and incident response plans are maintained.</li>
                  <li>Users are encouraged to maintain strong passwords and safeguard login credentials.</li>
                </ul>
              </section>

              <Divider sx={{ my: 3 }} />

              {/* 11. Student & Academic Records */}
              <section id="records">
                <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
                  Student & Academic Records
                </Typography>
                <ul>
                  <li>Academic data collected through EduBridge – CICC forms part of a student’s official record.</li>
                  <li>Only authorized educators and administrators may access student records.</li>
                  <li>Students may request a summary of their academic data held in the system.</li>
                </ul>
              </section>

              <Divider sx={{ my: 3 }} />

              {/* 12. Consent & Access Rights */}
              <section id="consent">
                <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
                  Consent & Access Rights
                </Typography>
                <ul>
                  <li>By using EduBridge – CICC, you consent to data collection and processing as described.</li>
                  <li>Users may withdraw consent for non-essential services at any time.</li>
                  <li>Consent withdrawal may limit access to certain educational features.</li>
                </ul>
              </section>

              <Divider sx={{ my: 3 }} />

              {/* 13. Accuracy & Updates */}
              <section id="accuracy">
                <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
                  Accuracy & Updates
                </Typography>
                <ul>
                  <li>We strive to maintain accurate and up-to-date information.</li>
                  <li>Users may update personal details through their account settings or administrative request.</li>
                  <li>Incorrect information may be corrected upon verified request.</li>
                </ul>
              </section>

              <Divider sx={{ my: 3 }} />

              {/* 14. Your Rights & Requests */}
              <section id="rights">
                <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
                  Your Rights & Requests
                </Typography>
                <ul>
                  <li>You have the right to access, correct, or request deletion of your personal data.</li>
                  <li>You may request clarification about how your information is used or stored.</li>
                  <li>Requests will be processed promptly in accordance with institutional policy.</li>
                </ul>
              </section>

              <Divider sx={{ my: 3 }} />

              {/* 15. Changes */}
              <section id="changes">
                <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
                  Changes to This Policy
                </Typography>
                <ul>
                  <li>EduBridge – CICC may update this Privacy Policy periodically.</li>
                  <li>Major revisions will be announced on the platform or via email notice.</li>
                  <li>Continued use of the service indicates acceptance of revised terms.</li>
                </ul>
              </section>

              <Divider sx={{ my: 3 }} />

              {/* 16. Contact */}
              <section id="contact">
                <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
                  Contact Information
                </Typography>
                <ul>
                  <li>
                    For privacy-related questions or concerns, contact our Privacy Officer:
                  </li>
                  <li>
                    <b>Deval Bhungaliya</b> – Privacy Officer, EduBridge – CICC
                  </li>
                  <li>
                    Email:{" "}
                    <MUILink href="mailto:ciccedubridge@gmail.com">
                      ciccedubridge@gmail.com
                    </MUILink>
                  </li>
                </ul>
              </section>
            </Paper>
          </Grid>
        </Grid>
      </Container>

      <Footer />
    </Box>
  );
}
