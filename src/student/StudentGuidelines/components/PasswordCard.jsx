import * as React from "react";
import { Card, CardHeader, CardContent, List, ListItem, ListItemIcon, ListItemText, Typography, Divider } from "@mui/material";
import HttpsIcon from "@mui/icons-material/Https";
import ContentPasteSearchIcon from "@mui/icons-material/ContentPasteSearch";
import SecurityIcon from "@mui/icons-material/Security";

export default function PasswordCard() {
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
        avatar={<HttpsIcon sx={{ color: "#4A90E2" }} />}
        title={<Typography variant="h6" sx={{ fontWeight: 800 }}>2. Password & Availability</Typography>}
        subheader={
          <Typography variant="body2" color="text.secondary">
            Get in quickly when the exam starts.
          </Typography>
        }
      />
      <Divider />
      <CardContent>
        <List dense>
          <ListItem>
            <ListItemIcon><ContentPasteSearchIcon color="primary" /></ListItemIcon>
            <ListItemText
              primary="Use ‘Go to Exam’ when the schedule shows Now."
              secondary="In the Day Inspector, click Go to Exam—it opens the list and focuses the password field for you."
            />
          </ListItem>
          <ListItem>
            <ListItemIcon><SecurityIcon color="primary" /></ListItemIcon>
            <ListItemText
              primary="Type the password exactly as given by your tutor."
              secondary="Passwords can be per-schedule. If it fails, confirm with your tutor."
            />
          </ListItem>
        </List>
      </CardContent>
    </Card>
  );
}
