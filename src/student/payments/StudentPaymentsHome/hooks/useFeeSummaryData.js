// src/student/payments/StudentPaymentsHome/hooks/useFeeSummaryData.js
import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchStudentEnrollments, fetchStudentLinks } from "../../lib/firestore";

export default function useFeeSummaryData(state, refreshKey = 0, studentId) {
  const currency = "CAD";

  const [courseId, setCourseId] = useState("all");
  const [intakeId, setIntakeId] = useState("all");
  const [hideFullyPaid, setHideFullyPaid] = useState(false);

  const [loading, setLoading] = useState(true);
  const [enrollments, setEnrollments] = useState([]);
  const [links, setLinks] = useState([]);

  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    const handler = (e) => {
      if (e.detail?.tab === "fee") {
        setCourseId("all");
        setIntakeId("all");
        setHideFullyPaid(false);
        setPage(1);
      }
    };
    window.addEventListener("student-payments-reset-active-filters", handler);
    return () => window.removeEventListener("student-payments-reset-active-filters", handler);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (!studentId) { // guard
        setEnrollments([]);
        setLinks([]);
        return;
      }
      const [enrs, lks] = await Promise.all([
        fetchStudentEnrollments(studentId),
        fetchStudentLinks(studentId),
      ]);
      setEnrollments(enrs || []);
      setLinks(lks || []);
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => { load(); }, [load, refreshKey]);

  const rows = useMemo(() => {
    const paidMap = new Map();
    links.forEach((lk) => {
      const key = lk.enrollmentId || lk.courseId || "default";
      paidMap.set(key, (paidMap.get(key) || 0) + Number(lk.amountApplied || 0));
    });

    let list = (enrollments || []).map((e) => {
      const paid = paidMap.get(e.id) || 0;
      return {
        id: e.id,
        courseId: e.courseId,
        courseName: e.courseName,
        intakeId: e.intakeId,
        intakeName: e.intakeName,
        fee: Number(e.assignedFeeAmount || 0),
        paid,
      };
    });

    if (courseId !== "all") list = list.filter((r) => r.courseId === courseId);
    if (intakeId !== "all") list = list.filter((r) => r.intakeId === intakeId);
    if (hideFullyPaid) list = list.filter((r) => Number(r.fee) > Number(r.paid));

    return list;
  }, [enrollments, links, courseId, intakeId, hideFullyPaid]);

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
      courseId, setCourseId,
      intakeId, setIntakeId,
      hideFullyPaid, setHideFullyPaid,
      // (optional) supply dropdown options if you want
      // courses: courseOptions, intakes: intakeOptions
    },
  };
}
