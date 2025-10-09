// src/student/StudentExamlist/StudentExamlist.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  collection,
  getDocs,
  orderBy,
  query,
  where,
  doc,
  getDoc,
} from "firebase/firestore";
import { Box, Snackbar, Alert as MuiAlert, CircularProgress, Typography, Paper } from "@mui/material";
import { useNavigate } from "react-router-dom";

import { db } from "../../firebaseConfig";
import { useAuth } from "../../AuthContext";
import PaginationBar from "../../shared/PaginationBar";
import { useLocation } from "react-router-dom";
// ⬇️ same UI, just moved via re-exports so nothing visual changes
import FiltersBar from "./components/FiltersBar";
import TopBar from "./components/TopBar";
import ExamsTable from "./components/ExamsTable";

const PAGE_SIZE = 10;

/**
 * StudentExamList (refactored)
 * - Shows exams ONLY if there is an ACTIVE schedule now.
 * - Password shown/checked is the schedule password (overrides any legacy exam password).
 * - Visuals and UX (filters, search, pagination, prompts) remain unchanged.
 */
export default function StudentExamList() {
  const navigate = useNavigate();
  const { user, isLoading: isAuthLoading, logout } = useAuth();

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  // UI state (unchanged)
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all"); // 'all' | 'attemptable' | 'submitted'
  const [page, setPage] = useState(1);

  // intake chip labels
  const [intakesMap, setIntakesMap] = useState({});

  // password prompt (unchanged)
  const [showPwdForExamId, setShowPwdForExamId] = useState(null);
  const [attemptPwd, setAttemptPwd] = useState("");
  const [attemptPwdErr, setAttemptPwdErr] = useState("");

  // snackbar
  const [snack, setSnack] = useState({ open: false, msg: "", severity: "success" });
  const closeSnack = (_, r) => (r === "clickaway" ? null : setSnack((s) => ({ ...s, open: false })));

  // collections
  const examsCol = collection(db, "exams");
  const intakesCol = collection(db, "intakes");
  const studentsCol = collection(db, "students");
  const submissionsCol = collection(db, "examSubmissions");
  const schedulesCol = collection(db, "scheduled_exams");

  // When navigated from Student Schedule page, auto-open password prompt
useEffect(() => {
  const state = location?.state;
  if (!state?.focusExamId) return;

  // Make sure that the exam exists in the current list
  const exists = rows.some(r => r.id === state.focusExamId);
  if (!exists) return;

  // Open the inline password prompt for that exam
  setShowPwdForExamId(state.focusExamId);

  // (Optional) If you want to clear state so refreshing the page doesn’t reopen the prompt:
  // navigate(location.pathname, { replace: true });
}, [location?.state, rows]);

  // Load intake names (for chips) — unchanged behavior
  useEffect(() => {
    const loadIntakes = async () => {
      try {
        const snap = await getDocs(query(intakesCol, orderBy("name", "asc")));
        const map = {};
        snap.docs.forEach((d) => (map[d.id] = d.data().name));
        setIntakesMap(map);
      } catch {
        setIntakesMap({});
        setSnack({ open: true, msg: "Failed to fetch intake data.", severity: "error" });
      }
    };
    loadIntakes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Resolve student's courseId if your UI uses it in exam filtering
  const resolveStudentCourseId = async () => {
    if (user?.courseId || user?.course) return user.courseId || user.course;
    if (!user?.email) return "";
    try {
      const snap = await getDocs(query(studentsCol, where("email", "==", user.email)));
      if (!snap.empty) {
        const data = snap.docs[0].data();
        return data?.courseId || "";
      }
    } catch {
      /* ignore */
    }
    return "";
  };

  /**
   * Main loader: schedule-first
   * 1) Query scheduled_exams with single inequality (startAtUTC <= now), orderBy startAtUTC.
   * 2) Filter in JS for endAtUTC > now and NOT soft-deleted (true/1).
   * 3) From those examIds, fetch exams for student's intake (and course if used).
   * 4) Override examPassword with schedule.password; mark submitted via examSubmissions.
   */
  const loadRowsFromActiveSchedules = async () => {
    setLoading(true);
    try {
      if (!user?.id) {
        setSnack({ open: true, msg: "Please log in.", severity: "error" });
        setLoading(false);
        return;
      }

      const now = new Date();

      // 1) Active schedules (single inequality + orderBy)
      const qActive = query(
        schedulesCol,
        where("status", "==", "published"),
        where("startAtUTC", "<=", now),
        where("isDeleted", "==", false),
        orderBy("startAtUTC", "desc")
      );
      const schSnap = await getDocs(qActive);

      // Build examId -> best schedule (ends soonest)
      const byExam = {};
      const nowMs = now.getTime();
      schSnap.docs.forEach((d) => {
        const s = d.data();
        if (!s?.examId) return;
        const endMs = s?.endAtUTC?.toMillis?.() ?? 0;
        if (endMs <= nowMs) return; // no longer active
        const cur = byExam[s.examId];
        if (!cur || endMs < cur.endMs) {
          byExam[s.examId] = {
            scheduleId: d.id,
            endMs,
            password: String(s.password || ""),
            intakeId: s.intakeId || null,
            courseId: s.courseId || null,
          };
        }
      });
      const liveExamIds = new Set(Object.keys(byExam));

      // 2) Which exams has this student already submitted?
      const subSnap = await getDocs(
        query(submissionsCol, where("studentId", "==", user.id), where("isSubmitted", "==", true))
      );
      const submittedIds = new Set(subSnap.docs.map((d) => d.data().examId));

      // 3) Fetch exams for student's intake (+ course if your data uses it)
      const courseId = await resolveStudentCourseId();
      const constraints = [
        where("isDeleted", "==", 0),
        where("intakeId", "==", user.intake),
        orderBy("createdAt", "desc"),
      ];
      if (courseId) {
        constraints.splice(2, 0, where("courseId", "==", courseId));
      }
      const exSnap = await getDocs(query(examsCol, ...constraints));
      const examsByIntake = exSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

      // Keep exams that are live now (via schedule map)
      const scheduledNow = examsByIntake.filter((e) => liveExamIds.has(e.id));

      // 4) Bring back submitted exams not already present (could be past schedules)
      const missingSubmitted = [...submittedIds].filter((id) => !liveExamIds.has(id));
      const submittedExtras = [];
      for (const id of missingSubmitted) {
        // fetch exam doc by id; ignore if it doesn't exist or belongs to another intake
        try {
          const ref = doc(examsCol, id);
          const snap = await getDoc(ref);
          if (snap.exists()) {
            const ex = { id: snap.id, ...snap.data() };
            if (ex.isDeleted === 0 && ex.intakeId === user.intake && (!courseId || ex.courseId === courseId)) {
              submittedExtras.push(ex);
            }
          }
        } catch {
          /* ignore individual fetch errors */
        }
      }

      // 5) Hydrate rows
      const toHydrate = [...scheduledNow, ...submittedExtras];

      const hydrated = toHydrate.map((ex) => ({
        ...ex,
        intakeName: intakesMap[ex.intakeId] || "Unknown Intake",
        isSubmitted: submittedIds.has(ex.id),
        // If it's live now, use schedule password; if it's only submitted (not live), password is empty
        examPassword: liveExamIds.has(ex.id) ? (byExam[ex.id]?.password || "") : "",
        scheduleId: byExam[ex.id]?.scheduleId || null,
      }));

      setRows(hydrated);
      setPage(1);
    } catch (e) {
      console.error(e);
      setRows([]);
      setSnack({ open: true, msg: "Failed to load exams.", severity: "error" });
    } finally {
      setLoading(false);
    }
  };

  // // const loadRowsFromActiveSchedules = async () => {
  // //   setLoading(true);
  // //   try {
  // //     if (!user?.id) {
  // //       setSnack({ open: true, msg: "Please log in.", severity: "error" });
  // //       setLoading(false);
  // //       return;
  // //     }

  // //     const now = new Date();

  // //     // 1) Schedules (single inequality + orderBy), then JS-filter endAt
  // //     const qActive = query(
  // //       schedulesCol,
  // //       where("status", "==", "published"),

  // //       where("startAtUTC", "<=", now),
  // //       orderBy("startAtUTC", "desc")
  // //     );
  // //     const schSnap = await getDocs(qActive);

  // //     // Build examId → best schedule (the one that ends soonest)
  // //     const byExam = {};
  // //     const nowMs = now.getTime();

  // //     schSnap.docs.forEach((d) => {
  // //       const s = d.data();
  // //       if (!s?.examId) return;

  // //       // tolerate historical shapes: treat true/1 as deleted, else active
  // //       if (s.isDeleted === true || s.isDeleted === 1) return;

  // //       const endMs = s?.endAtUTC?.toMillis?.() ?? 0;
  // //       if (endMs <= nowMs) return; // not active anymore

  // //       const cur = byExam[s.examId];
  // //       if (!cur || endMs < cur.endMs) {
  // //         byExam[s.examId] = {
  // //           scheduleId: d.id,
  // //           endMs,
  // //           password: String(s.password || ""),
  // //           intakeId: s.intakeId || null,
  // //           courseId: s.courseId || null,
  // //         };
  // //       }
  // //     });

  // //     const liveExamIds = Object.keys(byExam);
  // //     if (liveExamIds.length === 0) {
  // //       setRows([]);
  // //       setPage(1);
  // //       setLoading(false);
  // //       return;
  // //     }

  //     // 2) Resolve course (if your list filters by it)
  //     const courseId = await resolveStudentCourseId();

  //     // 3) Fetch exam docs for student's intake (+ course if available)
  //     const constraints = [
  //       where("isDeleted", "==", 0),
  //       where("intakeId", "==", user.intake),
  //       orderBy("createdAt", "desc"),
  //     ];
  //     if (courseId) {
  //       constraints.splice(2, 0, where("courseId", "==", courseId));
  //     }

  //     const exSnap = await getDocs(query(examsCol, ...constraints));
  //     const examsRaw = exSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

  //     // keep only exams that are live now via schedules
  //     const filtered = examsRaw.filter((e) => liveExamIds.includes(e.id));

  //     // 4) mark submitted for current student
  //     const subSnap = await getDocs(
  //       query(submissionsCol, where("studentId", "==", user.id), where("isSubmitted", "==", true))
  //     );
  //     const submittedSet = new Set(subSnap.docs.map((d) => d.data().examId));

  //     // hydrate rows (override password with the schedule’s)
  //     const hydrated = filtered.map((ex) => ({
  //       ...ex,
  //       intakeName: intakesMap[ex.intakeId] || "Unknown Intake",
  //       isSubmitted: submittedSet.has(ex.id),
  //       examPassword: byExam[ex.id]?.password || "",
  //       scheduleId: byExam[ex.id]?.scheduleId || null,
  //     }));

  //     setRows(hydrated);
  //     setPage(1);
  //   } catch (e) {
  //     console.error(e);
  //     setRows([]);
  //     setSnack({ open: true, msg: "Failed to load exams.", severity: "error" });
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  // kick-off when auth + intakes ready
  useEffect(() => {
    if (isAuthLoading) return;
    if (!user) { navigate("/student-login"); return; }
    if (Object.keys(intakesMap).length === 0) return;
    loadRowsFromActiveSchedules();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isAuthLoading, intakesMap]);

  /** ---------------- UI (unchanged) ---------------- */

  const filtered = useMemo(() => {
    const t = search.trim().toLowerCase();
    return rows.filter((ex) => {
      const matches =
        (ex.title || "").toLowerCase().includes(t) ||
        (ex.intakeName || "").toLowerCase().includes(t);

      if (status === "submitted") return matches && ex.isSubmitted;
      if (status === "attemptable") return matches && !ex.isSubmitted;
      return matches;
    });
  }, [rows, search, status]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = useMemo(
    () => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filtered, page]
  );

  // Attempt flow (unchanged)
  const handleAttemptExam = (exam) => {
    if (!user?.id) {
      setSnack({ open: true, msg: "Please log in to attempt exams.", severity: "error" });
      return;
    }
    if (exam.isSubmitted) {
      setSnack({ open: true, msg: "This exam is already submitted.", severity: "info" });
      return;
    }
    if (exam.examPassword) {
      setShowPwdForExamId(exam.id);
      setAttemptPwd("");
      setAttemptPwdErr("");
    } else {
      const unlockedKey = `examUnlocked-${user.id}-${exam.id}`;
      sessionStorage.setItem(unlockedKey, "true");
      navigate(`/student-take-exam/${exam.id}`);
      setSnack({ open: true, msg: `Opening: ${exam.title}`, severity: "info" });
    }
  };

  const verifyAndStart = (examId, expectedPassword) => {
    setAttemptPwdErr("");
    if (!user?.id) {
      setSnack({ open: true, msg: "Please log in again.", severity: "error" });
      return;
    }
    if (attemptPwd === expectedPassword) {
      const unlockedKey = `examUnlocked-${user.id}-${examId}`;
      sessionStorage.setItem(unlockedKey, "true");
      navigate(`/student-take-exam/${examId}`);
      setSnack({ open: true, msg: "Starting exam…", severity: "success" });
      setShowPwdForExamId(null);
      setAttemptPwd("");
    } else {
      setAttemptPwdErr("Incorrect password.");
      setSnack({ open: true, msg: "Incorrect password.", severity: "error" });
    }
  };

  const cancelPwd = () => {
    setShowPwdForExamId(null);
    setAttemptPwd("");
    setAttemptPwdErr("");
  };

  if (isAuthLoading || loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh" bgcolor="#e8f5e9">
        <CircularProgress sx={{ color: "#4CAF50" }} />
        <Typography variant="body1" sx={{ ml: 2, color: "#4CAF50" }}>
          Loading exams...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 4, bgcolor: "#f7f5f2", minHeight: "100vh" }}>
      <TopBar onBack={() => navigate("/student-dashboard")} />
      <Paper elevation={3} sx={{ p: 2, mb: 2, borderRadius: "12px" }}>
        <FiltersBar
          search={search}
          setSearch={(v) => { setSearch(v); setPage(1); }}
          status={status}
          setStatus={(v) => { setStatus(v); setPage(1); }}
        />
      </Paper>
        
        <ExamsTable
          rows={pageItems}
          page={page}
          totalPages={totalPages}
          onPrev={() => setPage((p) => Math.max(1, p - 1))}
          onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
          onAttempt={handleAttemptExam}
          showPwdForExamId={showPwdForExamId}
          attemptPwd={attemptPwd}
          setAttemptPwd={setAttemptPwd}
          attemptPwdErr={attemptPwdErr}
          onVerify={verifyAndStart}
          onCancelPwd={cancelPwd}
        />
      <PaginationBar
            page={page}
            totalPages={totalPages}
            onPrev={() => setPage((p) => Math.max(1, p - 1))}
            onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
          />

      <Snackbar
        open={snack.open}
        autoHideDuration={4000}
        onClose={closeSnack}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <MuiAlert onClose={closeSnack} severity={snack.severity} elevation={6} variant="filled">
          {snack.msg}
        </MuiAlert>
      </Snackbar>
    </Box>
  );
}
