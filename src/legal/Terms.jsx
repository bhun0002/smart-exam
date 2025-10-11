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

// Match Help layout: same left Quick links
const toc = [
  { id: "intro", title: "Terms of Use" },
  { id: "accept", title: "Acceptance of terms" },
  { id: "accounts", title: "Accounts & eligibility" },
  { id: "conduct", title: "User conduct" },
  { id: "proctor", title: "Exams & proctoring" },
  { id: "content", title: "Your content & IP" },
  { id: "privacy", title: "Privacy & data" },
  { id: "thirdparty", title: "Third-party services" },
  { id: "disclaimer", title: "Disclaimers" },
  { id: "liability", title: "Limitation of liability" },
  { id: "indemnity", title: "Indemnity" },
  { id: "changes", title: "Changes to service/terms" },
  { id: "termination", title: "Suspension & termination" },
  { id: "law", title: "Governing law" },
  { id: "contact", title: "Contact" },
];

export default function Terms() {
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
          {/* LEFT: Quick links (exactly like Help.jsx) */}
          <Grid item xs={12} md={4} lg={3}>
            <Paper
              elevation={6}
              sx={{
                position: { md: "sticky" },
                top: 88,
                p: 2,
                borderRadius: `${TOKENS.radius}px`,
              }}
              aria-label="Terms sections navigation"
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
            </Paper>
          </Grid>

          {/* RIGHT: Content (same Paper/padding/radius as Help.jsx) */}
          <Grid item xs={12} md={8} lg={9}>
            <Paper elevation={6} sx={{ p: { xs: 3, md: 4 }, borderRadius: `${TOKENS.radius}px`, "& li": { marginBottom: 0.5 } }}>
              <Typography variant="h3" sx={{ fontWeight: 800, mb: 1 }}>
                Terms of Use
              </Typography>
              <Typography sx={{ color: "text.secondary", mb: 3 }}>
                Read carefully—using EduBridge – CICC means you agree to these terms.
              </Typography>

              {/* Overview */}
              <section id="intro" aria-labelledby="intro-h">
                <Typography id="intro-h" variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
                  Overview
                </Typography>
                <ul>
                  <li>These Terms govern your access to and use of EduBridge – CICC (the “Service”).</li>
                  <li>“We”, “us”, and “our” refer to EduBridge – CICC.</li>
                  <li>If you use the Service on behalf of CICC or another institution, you have authority to do so.</li>
                </ul>
              </section>

              <Divider sx={{ my: 3 }} />

              {/* Acceptance */}
              <section id="accept" aria-labelledby="accept-h">
                <Typography id="accept-h" variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
                  Acceptance of terms
                </Typography>
                <ul>
                  <li>By using the Service, you accept these Terms and our <MUILink href="/privacy">Privacy Policy</MUILink>.</li>
                  <li>If you do not agree, do not use the Service.</li>
                </ul>
              </section>

              <Divider sx={{ my: 3 }} />

              {/* Accounts */}
              <section id="accounts" aria-labelledby="accounts-h">
                <Typography id="accounts-h" variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
                  Accounts & eligibility
                </Typography>
                <ul>
                  <li>Accounts are provisioned by CICC administrators or by invitation.</li>
                  <li>Provide accurate information and keep your credentials secure.</li>
                  <li>You are responsible for all activity under your account.</li>
                  <li>We may refuse/suspend/revoke accounts to protect integrity or security.</li>
                </ul>
              </section>

              <Divider sx={{ my: 3 }} />

              {/* Conduct */}
              <section id="conduct" aria-labelledby="conduct-h">
                <Typography id="conduct-h" variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
                  User conduct
                </Typography>
                <ul>
                  <li>No cheating, plagiarism, or unauthorized collaboration.</li>
                  <li>No bypassing proctoring, tampering with exams, or disrupting the Service.</li>
                  <li>No sharing copyrighted materials without rights.</li>
                  <li>No harmful code, scraping, reverse engineering, or undue load.</li>
                </ul>
              </section>

              <Divider sx={{ my: 3 }} />

              {/* Proctoring */}
              <section id="proctor" aria-labelledby="proctor-h">
                <Typography id="proctor-h" variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
                  Exams & proctoring
                </Typography>
                <ul>
                  <li>Some courses/exams use proctoring or monitoring to protect academic integrity.</li>
                  <li>When enabled, you will be told what is captured (camera, microphone, screen, room scans).</li>
                  <li>Grant required permissions and follow all exam instructions and program policies.</li>
                </ul>
              </section>

              <Divider sx={{ my: 3 }} />

              {/* Content & IP */}
              <section id="content" aria-labelledby="content-h">
                <Typography id="content-h" variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
                  Your content & intellectual property
                </Typography>
                <ul>
                  <li>You retain ownership of your submissions and uploads.</li>
                  <li>You grant us a limited license to host/process/display content to operate the Service </li>
                  <li>Course materials, software, and branding are protected.</li>
                </ul>
              </section>

              <Divider sx={{ my: 3 }} />

              {/* Privacy */}
              <section id="privacy" aria-labelledby="privacy-h">
                <Typography id="privacy-h" variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
                  Privacy & data
                </Typography>
                <ul>
                  <li>See our <MUILink href="/privacy">Privacy Policy</MUILink> for collection, use, and retention of personal information.</li>
                  <li>By using the Service, you consent to those practices.</li>
                </ul>
              </section>

              <Divider sx={{ my: 3 }} />

              {/* Third-party */}
              <section id="thirdparty" aria-labelledby="thirdparty-h">
                <Typography id="thirdparty-h" variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
                  Third-party services
                </Typography>
                <ul>
                  <li>We rely on providers (e.g., Firebase) for hosting/authentication.</li>
                  <li>Their terms and privacy practices apply in addition to ours.</li>
                </ul>
              </section>

              <Divider sx={{ my: 3 }} />

              {/* Disclaimers */}
              <section id="disclaimer" aria-labelledby="disclaimer-h">
                <Typography id="disclaimer-h" variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
                  Disclaimers
                </Typography>
                <ul>
                  <li>The Service is provided “as is” and “as available”.</li>
                  <li>No guarantee of uninterrupted or error-free operation.</li>
                  <li>We disclaim all implied warranties to the maximum extent permitted by law.</li>
                </ul>
              </section>

              <Divider sx={{ my: 3 }} />

              {/* Liability */}
              <section id="liability" aria-labelledby="liability-h">
                <Typography id="liability-h" variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
                  Limitation of liability
                </Typography>
                <ul>
                  <li>No liability for indirect, incidental, special, consequential, or punitive damages.</li>
                  <li>No liability for lost profits, data, or goodwill arising from use of the Service.</li>
                </ul>
              </section>

              <Divider sx={{ my: 3 }} />

              {/* Indemnity */}
              <section id="indemnity" aria-labelledby="indemnity-h">
                <Typography id="indemnity-h" variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
                  Indemnity
                </Typography>
                <ul>
                  <li>You will indemnify EduBridge – CICC and CICC staff against claims/losses from your use.</li>
                </ul>
              </section>

              <Divider sx={{ my: 3 }} />

              {/* Changes */}
              <section id="changes" aria-labelledby="changes-h">
                <Typography id="changes-h" variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
                  Changes to service/terms
                </Typography>
                <ul>
                  <li>We may modify the Service or these Terms.</li>
                  <li>Material changes are posted in-app and take effect upon posting unless stated otherwise.</li>
                  <li>Continued use = acceptance of changes.</li>
                </ul>
              </section>

              <Divider sx={{ my: 3 }} />

              {/* Termination */}
              <section id="termination" aria-labelledby="termination-h">
                <Typography id="termination-h" variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
                  Suspension & termination
                </Typography>
                <ul>
                  <li>We may suspend/terminate access for violations, security risks, or threats to academic integrity.</li>
                  <li>Some obligations (record retention, IP rights, disclaimers) survive termination.</li>
                </ul>
              </section>

              <Divider sx={{ my: 3 }} />

              {/* Governing law */}
              <section id="law" aria-labelledby="law-h">
                <Typography id="law-h" variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
                  Governing law
                </Typography>
                <ul>
                  <li>These Terms are governed by the laws of <b>Ontario, Canada</b></li>
                  <li>Jurisdiction and venue lie in the courts of that region.</li>
                </ul>
              </section>

              <Divider sx={{ my: 3 }} />

              {/* Contact */}
              <section id="contact" aria-labelledby="contact-h">
                <Typography id="contact-h" variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
                  Contact
                </Typography>
                <ul>
                  <li>Email: <MUILink href="mailto:ciccedubridge@gmail.com">ciccedubridge@gmail.com</MUILink></li>
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
