// src/student/payments/StudentPaymentsHome/components/Filters/PaymentsFiltersBar.jsx
import React from "react";
import {
  Paper,
  Tabs,
  Tab,
  Stack,
  IconButton,
  Tooltip,
  Divider,
  Chip,
  Box,
  Button,
} from "@mui/material";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import RefreshIcon from "@mui/icons-material/Refresh";
import FeeSummaryFilters from "./FeeSummaryFilters";
import ConfirmedFilters from "./ConfirmedFilters";
import ClaimsFilters from "./ClaimsFilters";
import ExportCsvButton from "../Shared/ExportCsvButton";

/**
 * Tabs + filters + counters + reset/refresh in the main row.
 * Export CSV + Report a Payment are anchored to the **bottom-right corner** of the bar.
 *
 * Props:
 * - state: { tab, setTab, onRefresh }
 * - feeFilters / confFilters / claimFilters
 * - counts: { feeCount?: number; paymentsCount?: number; claimsPending?: number }
 * - onReset: () => void
 * - onExport: () => void
 * - onReport: () => void
 */
export default function PaymentsFiltersBar({
  state,
  feeFilters,
  confFilters,
  claimFilters,
  counts,
  onReset,
  onExport,
  onReport,
}) {
  const { tab, setTab, onRefresh } = state;

  const chipLabel =
    tab === "fee"
      ? typeof counts?.feeCount === "number" && `${counts.feeCount} Enrollments`
      : tab === "payments"
      ? typeof counts?.paymentsCount === "number" && `${counts.paymentsCount} Items`
      : typeof counts?.claimsPending === "number" && `${counts.claimsPending} Pending`;

  const chipColor =
    tab === "claims" && (counts?.claimsPending ?? 0) > 0 ? "warning" : "default";

  return (
    <Paper
      elevation={3}
      sx={{
        p: 1.5,
        borderRadius: 2,
        position: "relative", // allow absolute children
        pb: { xs: 7.5, md: 6 }, // extra bottom padding so buttons don’t overlay content
      }}
    >
      <Stack direction="row" alignItems="center" spacing={2} sx={{ flexWrap: "wrap" }}>
        {/* Tabs */}
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          aria-label="payments tabs"
          textColor="primary"
          indicatorColor="primary"
          sx={{
            minHeight: 40,
            "& .MuiTab-root": { textTransform: "none", minHeight: 40, px: 1.5 },
          }}
        >
          <Tab value="fee" label="Fee Summary" />
          <Tab value="payments" label="Confirmed Payments" />
          <Tab value="claims" label="My Claims" />
        </Tabs>

        <Divider flexItem sx={{ mx: 1 }} />

        {/* Tab-specific filters */}
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1}
          sx={{ flex: 1, alignItems: { sm: "center" } }}
        >
          {tab === "fee" && <FeeSummaryFilters {...feeFilters} />}
          {tab === "payments" && <ConfirmedFilters {...confFilters} />}
          {tab === "claims" && <ClaimsFilters {...claimFilters} />}
        </Stack>

        {/* Right-side counters + quick actions */}
        {chipLabel && (
          <Chip
            label={chipLabel}
            size="small"
            color={chipColor}
            variant={chipColor === "default" ? "outlined" : "filled"}
            sx={{ borderRadius: "8px", fontWeight: "bold" }}
          />
        )}

        <Tooltip title="Reset filters for current tab">
          <IconButton onClick={onReset}>
            <RestartAltIcon />
          </IconButton>
        </Tooltip>

        <Tooltip title="Refresh">
          <IconButton onClick={onRefresh}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Stack>

      {/* Anchored actions: bottom-right INSIDE the filter bar */}
      <Box
        sx={{
          position: "absolute",
          right: { xs: 8, md: 12 },
          bottom: { xs: 8, md: 10 },
          display: "flex",
          gap: 1,
        }}
      >
        <ExportCsvButton onExport={onExport} />
        <Button
          variant="contained"
          onClick={onReport}
          sx={{ borderRadius: "12px", fontWeight: "bold", px: 2 }}
        >
          REPORT A PAYMENT
        </Button>
      </Box>
    </Paper>
  );
}
