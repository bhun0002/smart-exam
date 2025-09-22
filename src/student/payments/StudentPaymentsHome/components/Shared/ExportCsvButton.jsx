// src/student/payments/StudentPaymentsHome/components/Shared/ExportCsvButton.jsx
import React from "react";
import { Button } from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";

export default function ExportCsvButton({ onExport }) {
  return (
    <Button
      variant="outlined"
      startIcon={<DownloadIcon />}
      onClick={onExport}
      sx={{ borderRadius: 2 }}
    >
      Export CSV
    </Button>
  );
}
