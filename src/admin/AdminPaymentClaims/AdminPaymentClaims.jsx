// src/admin/AdminPaymentClaims/PaymentClaims.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Box, Typography } from "@mui/material";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../AuthContext"; // adjust path if needed
import ClaimsFiltersBar from "./components/ClaimsFiltersBar";
import ClaimsTable from "./components/ClaimsTable";
import ClaimReviewDrawer from "./components/ClaimReviewDrawer";
import { listClaims } from "./lib/firestore";
import { claimsToCsv, downloadCsv } from "./lib/csv";
import TopBar from "./components/TopBar";

// ISO → local YYYY-MM-DD for your date inputs
const isoToYMD = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${day}`;
};

export default function PaymentClaims() {
  const { user } = useAuth(); // gate with your ProtectedRoute (masterAdmin)
  const [filters, setFilters] = useState({
    from: "", to: "", status: "pending", hasProof: "all", search: ""
  });
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sel, setSel] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Seed filters from navigation state (clean URL deep-links)
  useEffect(() => {
    if (!location.state) return;
    const { from, to, status } = location.state || {};
    setFilters((prev) => ({
      ...prev,
      from: from ? isoToYMD(from) : prev.from,
      to: to ? isoToYMD(to) : prev.to,
      status: typeof status === "string" ? status : prev.status,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);

  async function load() {
    setLoading(true);
    try {
      let data = await listClaims({ status: filters.status, from: filters.from, to: filters.to });
      // Client filters: hasProof + search
      if (filters.hasProof !== "all") {
        const want = filters.hasProof === "yes";
        data = data.filter(c => Boolean(c.proofMedia) === want);
      }
      if (filters.search.trim()) {
        const t = filters.search.trim().toLowerCase();
        data = data.filter(c =>
          (c.studentEmail || "").toLowerCase().includes(t) ||
          (c.studentName || "").toLowerCase().includes(t) ||
          (c.studentMintId || "").toLowerCase().includes(t) ||
          (c.reference || "").toLowerCase().includes(t)
        );
      }
      setRows(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [filters.status, filters.from, filters.to]);

  const counts = useMemo(() => ({
    pending: rows.filter(r => r.status === "pending").length
  }), [rows]);

  function onExport() {
    downloadCsv("payment_claims.csv", claimsToCsv(rows));
  }

  return (
    <Box sx={{ padding: 4, bgcolor: "#f7f5f2", minHeight: "100vh" }}>
      <TopBar onBack={() => navigate("/admin-dashboard")} />

      <ClaimsFiltersBar
        filters={filters}
        setFilters={setFilters}
        counts={counts}
        onRefresh={load}
        onExport={onExport}
        disabled={loading}
      />

      <ClaimsTable
        rows={rows}
        onReview={(c) => setSel(c)}
      />

      <ClaimReviewDrawer
        open={Boolean(sel)}
        claim={sel}
        onClose={() => setSel(null)}
        onDone={() => { setSel(null); load(); }}
      />
    </Box>
  );
}
