import * as React from "react";
import { Card, CardHeader, CardContent, List, ListItem, ListItemIcon, ListItemText, Typography, Divider, Box } from "@mui/material";
import AccessTimeFilledIcon from "@mui/icons-material/AccessTimeFilled";
import RuleIcon from "@mui/icons-material/Rule";
import TaskAltIcon from "@mui/icons-material/TaskAlt";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import stopwatchIllustration from "../assets/stopwatchIllustration.png";

export default function TimingCard() {
  return (
    <Card
      sx={{
        borderRadius: 3,
        border: "1px solid #E5E7EB",
        background: "linear-gradient(180deg,#FFFFFF 0%,#FAFAFA 100%)",
        position: "relative",
        overflow: "hidden",
        "&:hover": { boxShadow: 4, transform: "translateY(-2px)" },
        transition: "box-shadow .2s, transform .2s",
      }}
    >
      <CardHeader
        avatar={<AccessTimeFilledIcon sx={{ color: "#4A90E2" }} />}
        title={<Typography variant="h6" sx={{ fontWeight: 800 }}>1. Timing & Scheduling</Typography>}
        subheader={
          <Typography variant="body2" color="text.secondary">
            When you can start, and what happens if the window ends.
          </Typography>
        }
      />
      <Divider />
      <CardContent>
        <List dense>
          <ListItem>
            <ListItemIcon><RuleIcon color="primary" /></ListItemIcon>
            <ListItemText
              primary="Start only when the schedule shows Now."
              secondary="Open the calendar; if your exam shows Now, you can begin."
            />
          </ListItem>
          <ListItem>
            <ListItemIcon><TaskAltIcon color="success" /></ListItemIcon>
            <ListItemText
              primary="You get your full duration once you start."
              secondary="Even if the window ends while you’re in the exam, your personal timer continues until your duration finishes."
            />
          </ListItem>
          <ListItem>
            <ListItemIcon><ErrorOutlineIcon color="warning" /></ListItemIcon>
            <ListItemText
              primary="Accidentally closed? You can resume."
              secondary="Re-open from the exam list; your remaining time continues."
            />
          </ListItem>
        </List>
      </CardContent>

      {/* faint corner illustration */}
      <Box
        component="img"
        src={stopwatchIllustration}
        alt=""
        aria-hidden
        sx={{ position: "absolute", right: 16, bottom: 16, width: 88, opacity: 0.15, pointerEvents: "none" }}
      />
    </Card>
  );
}
