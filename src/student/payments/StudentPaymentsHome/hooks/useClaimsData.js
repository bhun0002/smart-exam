// src/student/payments/StudentPaymentsHome/hooks/useClaimsData.js
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getSignedClaimProofUrl,
  getStudentClaims,
} from "../../lib/firestore";

export default function useClaimsData(state, refreshKey = 0, studentId) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [status, setStatus] = useState("all");
  const [hasProof, setHasProof] = useState("all");
  const [reference, setReference] = useState("");

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);

  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    const handler = (e) => {
      if (e.detail?.tab === "claims") {
        setFrom(""); setTo(""); setStatus("all"); setHasProof("all"); setReference("");
        setPage(1);
      }
    };
    window.addEventListener("student-payments-reset-active-filters", handler);
    return () => window.removeEventListener("student-payments-reset-active-filters", handler);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (!studentId) { setRows([]); return; } // guard

      const items = await getStudentClaims(studentId);

      const filtered = (items || []).filter((c) => {
        const dt = c.claimedAt?.toDate?.() || (c.claimedAt ? new Date(c.claimedAt) : null);
        if (from && dt && dt < new Date(from)) return false;
        if (to && dt && dt > new Date(to + "T23:59:59")) return false;
        if (status !== "all" && (c.status || "pending") !== status) return false;
        if (hasProof !== "all") {
          const hp = c.proofMedia ? "yes" : "no";
          if (hp !== hasProof) return false;
        }
        if (reference && !(c.reference || "").toLowerCase().includes(reference.toLowerCase()))
          return false;
        return true;
      });

      const mapped = filtered.map((c) => ({
        ...c,
        claimedAtDisplay:
          c.claimedAt?.toDate?.().toLocaleString?.() ||
          (c.claimedAt ? new Date(c.claimedAt).toLocaleString() : "-"),
        amountDisplay:
          typeof c.amountClaimed === "number" ? c.amountClaimed.toFixed(2) : "-",
      }));
      setRows(mapped);
    } finally {
      setLoading(false);
    }
  }, [studentId, from, to, status, hasProof, reference]);

  useEffect(() => { load(); }, [load, refreshKey]);

  const pageRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return rows.slice(start, start + pageSize);
  }, [rows, page]);

  const prevPage = () => setPage((p) => Math.max(1, p - 1));
  const nextPage = () => setPage((p) => (p * pageSize >= rows.length ? p : p + 1));

  const openProof = async (c) => {
    try {
      const url = await getSignedClaimProofUrl(c.proofMedia);
      if (!url) return;
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (e) {
      console.error(e);
    }
  };

  const pendingCount = rows.filter((r) => (r.status || "pending") === "pending").length;

  return {
    loading,
    rows,
    pageRows,
    page,
    pageSize,
    prevPage,
    nextPage,
    count: rows.length,
    pendingCount,
    openProof,
    filters: {
      from, setFrom,
      to, setTo,
      status, setStatus,
      hasProof, setHasProof,
      reference, setReference,
    },
  };
}
