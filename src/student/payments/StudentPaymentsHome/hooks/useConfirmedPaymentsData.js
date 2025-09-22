import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchStudentLinks } from "../../lib/firestore"; // switched to links

export default function useConfirmedPaymentsData(state, refreshKey = 0, studentId) {
  const currency = "CAD";

  // same filter state as before
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [min, setMin] = useState("");
  const [max, setMax] = useState("");
  const [txn, setTxn] = useState("");

  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);

  // keep the same reset-on-tab behavior
  useEffect(() => {
    const handler = (e) => {
      if (e.detail?.tab === "payments") {
        setFrom(""); setTo(""); setMin(""); setMax(""); setTxn("");
        setPage(1);
      }
    };
    window.addEventListener("student-payments-reset-active-filters", handler);
    return () => window.removeEventListener("student-payments-reset-active-filters", handler);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (!studentId) { setRows([]); return; }

      // ✅ ONLY approved/linked allocations
      const links = await fetchStudentLinks(studentId);

      // Normalize shape for table
      const normalized = (links || []).map((lk) => {
        const created =
          lk.createdAt?.toDate?.() ??
          lk.updatedAt?.toDate?.() ??
          (lk.linkedAt?.toDate?.() || null);

        const amount = Number(lk.amountApplied ?? lk.amount?.value ?? 0);
        const paymentId = lk.paymentId || ""; // admin link should set this

        return {
          id: lk.id,
          raw: lk,
          createdAt: created,
          createdAtDisplay: created ? created.toLocaleString() : "-",
          amountApplied: amount,
          amountAppliedDisplay: amount.toFixed(2),
          paymentId,
        };
      });

      // Apply filters client-side (same UX as before)
      let filtered = normalized;

      if (from) {
        const fromStart = new Date(from);
        fromStart.setHours(0, 0, 0, 0);
        filtered = filtered.filter((r) => !r.createdAt || r.createdAt.getTime() >= fromStart.getTime());
      }
      if (to) {
        const toEnd = new Date(to);
        toEnd.setHours(23, 59, 59, 999);
        filtered = filtered.filter((r) => !r.createdAt || r.createdAt.getTime() <= toEnd.getTime());
      }

      if (min !== "" && !Number.isNaN(Number(min))) {
        filtered = filtered.filter((r) => r.amountApplied >= Number(min));
      }
      if (max !== "" && !Number.isNaN(Number(max))) {
        filtered = filtered.filter((r) => r.amountApplied <= Number(max));
      }

      if (txn) {
        const q = String(txn).trim().toLowerCase();
        filtered = filtered.filter((r) => (r.paymentId || "").toLowerCase().includes(q));
      }

      // Optional guard: only show links that reference a real payment id
      // filtered = filtered.filter((r) => !!r.paymentId);

      // newest first
      filtered.sort((a, b) => {
        const aT = a.createdAt ? a.createdAt.getTime() : 0;
        const bT = b.createdAt ? b.createdAt.getTime() : 0;
        return bT - aT;
      });

      setRows(filtered);
    } finally {
      setLoading(false);
    }
  }, [studentId, from, to, min, max, txn]);

  useEffect(() => { load(); }, [load, refreshKey]);

  const pageRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return rows.slice(start, start + pageSize);
  }, [rows, page]);

  const prevPage = () => setPage((p) => Math.max(1, p - 1));
  const nextPage = () => setPage((p) => (p * pageSize >= rows.length ? p : p + 1));

  return {
    loading,
    rows,
    pageRows,
    page,
    pageSize,
    prevPage,
    nextPage,
    count: rows.length,
    currency,
    filters: {
      from, setFrom,
      to, setTo,
      min, setMin,
      max, setMax,
      txn, setTxn,
    },
  };
}
