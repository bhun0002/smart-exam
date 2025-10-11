import * as React from "react";
import { Box, Container, Link } from "@mui/material";

export default function Footer() {
  return (
    <Box component="footer" sx={{ py: 3, mt: 4 }}>
      <Container
        maxWidth="lg"
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          color: "text.secondary",
          fontSize: 14,
          opacity: 0.9,
        }}
      >
        <span>© EduBridge – CICC</span>
        <Box sx={{ display: "flex", gap: 3 }}>
          <Link href="/privacy" underline="hover">
            Privacy
          </Link>
          <Link href="/terms" underline="hover">
            Terms
          </Link>
        </Box>
      </Container>
    </Box>
  );
}
