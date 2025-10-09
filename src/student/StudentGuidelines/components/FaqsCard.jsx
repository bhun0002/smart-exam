import * as React from "react";
import { Card, CardHeader, CardContent, Typography, Accordion, AccordionSummary, AccordionDetails, Divider } from "@mui/material";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

export default function FaqsCard() {
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
        avatar={<HelpOutlineIcon sx={{ color: "#4A90E2" }} />}
        title={<Typography variant="h6" sx={{ fontWeight: 800 }}>5. FAQs</Typography>}
        subheader={<Typography variant="body2" color="text.secondary">Quick answers to common situations.</Typography>}
      />
      <Divider />
      <CardContent sx={{ pt: 0 }}>
        <Accordion disableGutters>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}><Typography fontWeight={700}>I joined late. Do I lose time?</Typography></AccordionSummary>
          <AccordionDetails>Your timer starts when you begin. Even if you join late, you still get the full duration (once you start).</AccordionDetails>
        </Accordion>
        <Divider />
        <Accordion disableGutters>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}><Typography fontWeight={700}>My browser closed—can I resume?</Typography></AccordionSummary>
          <AccordionDetails>Yes. Re-open from the exam list; remaining time continues if your duration hasn’t ended.</AccordionDetails>
        </Accordion>
        <Divider />
        <Accordion disableGutters>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}><Typography fontWeight={700}>I can’t see the password prompt.</Typography></AccordionSummary>
          <AccordionDetails>In the schedule, if your exam shows <b>Now</b>, press <b>Go to Exam</b>. The exam list will open and the password field will be focused automatically.</AccordionDetails>
        </Accordion>
        <Divider />
        <Accordion disableGutters>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}><Typography fontWeight={700}>Why do I only see my course/intake?</Typography></AccordionSummary>
          <AccordionDetails>For privacy, you only see schedules for your assigned course and intake. Tutors manage the schedule.</AccordionDetails>
        </Accordion>
      </CardContent>
    </Card>
  );
}
