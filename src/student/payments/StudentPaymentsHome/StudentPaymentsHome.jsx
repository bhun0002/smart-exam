// src/student/payments/StudentPaymentsHome/StudentPaymentsHome.jsx
import React, { useState } from "react";
import { Box, Stack } from "@mui/material";
import { useNavigate } from "react-router-dom";

import PaymentsTopBar from "./components/TopBar/PaymentsTopBar";
import PaymentsFiltersBar from "./components/Filters/PaymentsFiltersBar";
import {
  FeeSummaryTable,
  ConfirmedPaymentsTable,
  ClaimsTable,
} from "./components/Tables";
import PaginationBar from "../../../shared/PaginationBar";
import SkeletonTable from "./components/Shared/SkeletonTable";
import EmptyState from "./components/Shared/EmptyState";

import { useStudentPaymentsState } from "./hooks";
import {
  useFeeSummaryData,
  useConfirmedPaymentsData,
  useClaimsData,
} from "./hooks";
import { headerTokens } from "./styles/tokens";
import { getAuthUser } from "./hooks/utilAuth";

export default function StudentPaymentsHome() {
  const navigate = useNavigate();

  // global page state (tab + per-tab filters + CSV helper + router helpers)
  const state = useStudentPaymentsState();
  const activeTab = state.tab;
  

  // local refresh key so FiltersBar "Refresh" can force re-pull
  const [refreshKey, setRefreshKey] = useState(0);
  const handleRefresh = () => setRefreshKey((k) => k + 1);
  const { uid: studentId } = getAuthUser();
  // data hooks (they refetch when refreshKey changes)
  const fee = useFeeSummaryData(state, refreshKey, studentId);
  const conf = useConfirmedPaymentsData(state, refreshKey, studentId);
  const claims = useClaimsData(state, refreshKey, studentId);

  

  // CSV export for active tab (keeps your existing shape)
  const handleExport = () => {
    if (activeTab === "fee") {
      const rows = fee.rows.map((r) => ({
        studentId,
        courseId: r.courseId,
        courseName: r.courseName,
        intakeId: r.intakeId,
        intakeName: r.intakeName,
        fee: Number(r.fee ?? 0).toFixed(2),
        paid: Number(r.paid ?? 0).toFixed(2),
        remaining: Math.max(0, Number(r.fee ?? 0) - Number(r.paid ?? 0)).toFixed(2),
      }));
      state.exportCsv(rows, "fee_summary.csv");
      return;
    }

    if (activeTab === "payments") {
      const rows = conf.rows.map((r) => ({
        date: r.createdAtDisplay,
        amount: Number(r.amountApplied ?? r.amountAppliedDisplay ?? 0).toFixed(2),
        txnId: r.paymentId || "",
      }));
      state.exportCsv(rows, "confirmed_payments.csv");
      return;
    }

    const rows = claims.rows.map((c) => ({
      claimedAt: c.claimedAtDisplay,
      reference: c.reference || "",
      amount:
        typeof c.amount === "number"
          ? Number(c.amount).toFixed(2)
          : (c.amountDisplay ?? ""),
      status: c.status || "pending",
      hasProof: c.proofMedia ? "Yes" : "No",
    }));
    state.exportCsv(rows, "my_claims.csv");
  };

  const renderTable = () => {
    if (activeTab === "fee") {
      if (fee.loading) return <SkeletonTable rows={4} />;
      if (fee.rows.length === 0) return <EmptyState title="No active enrollments." />;
      return (
        <>
          <FeeSummaryTable
            rows={fee.pageRows}
            currency={fee.currency}
          />
          <PaginationBar
            page={fee.page}
            total={fee.rows.length}
            pageSize={fee.pageSize}
            onPrev={fee.prevPage}
            onNext={fee.nextPage}
          />
        </>
      );
    }

    if (activeTab === "payments") {
      if (conf.loading) return <SkeletonTable rows={5} />;
      if (conf.rows.length === 0) return <EmptyState title="No confirmed payments found." />;
      return (
        <>
          <ConfirmedPaymentsTable
            rows={conf.pageRows}
            currency={conf.currency}
          />
          <PaginationBar
            page={conf.page}
            total={conf.rows.length}
            pageSize={conf.pageSize}
            onPrev={conf.prevPage}
            onNext={conf.nextPage}
          />
        </>
      );
    }

    if (claims.loading) return <SkeletonTable rows={5} />;
    if (claims.rows.length === 0) return <EmptyState title="No claims yet." />;
    return (
      <>
        <ClaimsTable
          rows={claims.pageRows}
          onOpenProof={claims.openProof}
        />
        <PaginationBar
          page={claims.page}
          total={claims.rows.length}
          pageSize={claims.pageSize}
          onPrev={claims.prevPage}
          onNext={claims.nextPage}
        />
      </>
    );
  };

  return (
    <Box sx={{ p: 3, bgcolor: "#f7f5f2", minHeight: "100vh" }}>
      {/* TopBar now matches Admin: back + centered title only */}
      <PaymentsTopBar
        onBack={() => navigate("/student-dashboard")}
        title="My Payments & Dues"
      />

      {/* Filters bar holds tabs + chips + Reset/Refresh + Export + Report */}
      <Stack spacing={2}>
        <PaymentsFiltersBar
          state={{ ...state, onRefresh: handleRefresh }}
          feeFilters={fee.filters}
          confFilters={conf.filters}
          claimFilters={claims.filters}
          counts={{
            feeCount: fee.count,
            paymentsCount: conf.count,
            claimsPending: claims.pendingCount,
          }}
          onReset={state.resetActiveTabFilters}
          onExport={handleExport}
          onReport={state.goReport}
        />
        {renderTable()}
      </Stack>
    </Box>
  );
}
