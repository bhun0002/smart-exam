import { useCallback, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

// central page state: active tab + helpers
export default function useStudentPaymentsState() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // read tab once from URL; fallback to 'fee'
  const initialTab = searchParams.get("tab") || "fee";
  const [tab, setTabState] = useState(initialTab);

  // When tab changes, keep URL clean: write ONLY the tab param.
  const setTab = useCallback(
    (next) => {
      setTabState(next);
      // If you want no query at all, comment out the next line.
      setSearchParams(next ? { tab: next } : {});
    },
    [setSearchParams]
  );

  // CSV helper
  const exportCsv = useCallback((rows, filename = "export.csv") => {
    const csv = [Object.keys(rows[0] || {}).join(",")]
      .concat(rows.map((r) => Object.values(r)
        .map((v) => (String(v).includes(",") ? `"${String(v).replace(/"/g, '""')}"` : v))
        .join(",")))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  // navigation to report
  const goReport = useCallback(() => {
    navigate("/student-payments-report");
  }, [navigate]);

  // a no-op placeholder, your tables/hooks can attach their own per-tab reset logic
  const resetActiveTabFilters = useCallback(() => {
    const event = new CustomEvent("student-payments-reset-active-filters", {
      detail: { tab },
    });
    window.dispatchEvent(event);
  }, [tab]);

  return useMemo(
    () => ({
      tab,
      setTab,
      exportCsv,
      goReport,
      resetActiveTabFilters,
    }),
    [tab, setTab, exportCsv, goReport, resetActiveTabFilters]
  );
}
