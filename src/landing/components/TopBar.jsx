import * as React from "react";
import { AppBar, Toolbar, Typography, Box, Link } from "@mui/material";

export default function TopBar({ title = "EduBridge – CICC", helpHref = "/help" }) {
  return (
    <AppBar
      position="sticky"
      elevation={0}
      color="transparent"
      sx={{
        backdropFilter: "saturate(180%) blur(8px)",
        backgroundColor: "rgba(255,255,255,0.4)",
        borderBottom: "1px solid rgba(0,0,0,0.06)",
      }}
    >
      <Toolbar sx={{ minHeight: 64 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, flexGrow: 1 }}>
          {title}
        </Typography>
        <Box>
          <Link href={helpHref} underline="hover" sx={{ fontWeight: 600 }}>
            Help
          </Link>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
