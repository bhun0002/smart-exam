import * as React from "react";
import { Card, CardHeader, CardContent, List, ListItem, ListItemIcon, ListItemText, Typography, Stack, Chip, Divider } from "@mui/material";
import DevicesIcon from "@mui/icons-material/Devices";
import WifiIcon from "@mui/icons-material/Wifi";
import DoNotDisturbOnIcon from "@mui/icons-material/DoNotDisturbOn";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

export default function ChecklistCard() {
  return (
    <Card
      sx={{
        borderRadius: 3,
        border: "1px solid #E5E7EB",
        background: "linear-gradient(180deg,#FFFFFF 0%,#FAFAFA 100%)",
        "&:hover": { boxShadow: 4, transform: "translateY(-2px)" },
        transition: "box-shadow .2s, transform .2s",
      }}
    >
      <CardHeader
        avatar={<DevicesIcon sx={{ color: "#4A90E2" }} />}
        title={<Typography variant="h6" sx={{ fontWeight: 800 }}>3. Before You Start (Checklist)</Typography>}
        subheader={<Typography variant="body2" color="text.secondary">Complete these steps for a smooth attempt.</Typography>}
      />
      <Divider />
      <CardContent>
        <List dense>
          <ListItem>
            <ListItemIcon><WifiIcon color="primary" /></ListItemIcon>
            <ListItemText primary="Stable internet & power" secondary="Reliable Wi-Fi and a charging device help you avoid interruptions." />
          </ListItem>
          <ListItem>
            <ListItemIcon><DoNotDisturbOnIcon color="primary" /></ListItemIcon>
            <ListItemText primary="Quiet environment" secondary="Close other tabs/apps. Don’t switch away from the exam window." />
          </ListItem>
          <ListItem>
            <ListItemIcon><CheckCircleIcon color="primary" /></ListItemIcon>
            <ListItemText primary="Allowed materials only" secondary="Bring anything the tutor allows. Nothing else." />
          </ListItem>
        </List>

        <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: "wrap" }}>
          <Chip size="small" label="No sharing answers" sx={{ backgroundColor: "#EAF3FF" }} />
          <Chip size="small" label="No copying content" sx={{ backgroundColor: "#EAF3FF" }} />
          <Chip size="small" label="Submit before time ends" sx={{ backgroundColor: "#EAF3FF" }} />
        </Stack>
      </CardContent>
    </Card>
  );
}
