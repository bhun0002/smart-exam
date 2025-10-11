import * as React from "react";
import { Card, CardHeader, CardContent, List, ListItem, ListItemIcon, ListItemText, Typography, Divider } from "@mui/material";
import GavelIcon from "@mui/icons-material/Gavel";
import BlockIcon from "@mui/icons-material/Block";

export default function IntegrityCard() {
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
        avatar={<GavelIcon sx={{ color: "#4A90E2" }} />}
        title={<Typography variant="h6" sx={{ fontWeight: 800 }}>4. Academic Integrity</Typography>}
        subheader={<Typography variant="body2" color="text.secondary">Keep it fair—your work must be your own.</Typography>}
      />
      <Divider />
      <CardContent>
        <List dense>
          <ListItem>
            <ListItemIcon><BlockIcon color="primary" /></ListItemIcon>
            <ListItemText primary="No collaborating or communicating with others during the exam." />
          </ListItem>
          <ListItem>
            <ListItemIcon><BlockIcon color="primary" /></ListItemIcon>
            <ListItemText primary="No copying, photographing, or sharing exam content." />
          </ListItem>
          <ListItem>
            <ListItemIcon><BlockIcon color="primary" /></ListItemIcon>
            <ListItemText primary="Follow any extra rules from your course/tutor." />
          </ListItem>
        </List>
      </CardContent>
    </Card>
  );
}
