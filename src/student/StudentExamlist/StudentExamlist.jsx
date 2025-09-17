import React, { useEffect, useMemo, useState } from "react";
import {
  collection,
  getDocs,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { Box, Snackbar, Alert as MuiAlert, CircularProgress, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";

import { db } from "../../firebaseConfig";            // path from /src/student/StudentExamlist/
import { useAuth } from "../../AuthContext";

import HeaderBar from "./components/HeaderBar";
import ControlsBar from "./components/ControlsBar";
import ExamsTable from "./components/ExamsTable";

const PAGE_SIZE = 10;

export default function StudentExamlist() {
  const navigate = useNavigate();
  const { user, isLoading: isAuthLoading, logout } = useAuth();

  const [loading, setLoading] = useState(true);
  const [exams, setExams] = useState([]);
  const [intakesMap, setIntakesMap] = useState({});
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all"); // all | attemptable | submitted
  const [page, setPage] = useState(1);

  // Attempt password inline UI
  const [showPwdForExamId, setShowPwdForExamId] = useState(null);
  const [attemptPwd, setAttemptPwd] = useState("");
  const [attemptPwdErr, setAttemptPwdErr] = useState("");

  // snackbar
  const [snack, setSnack] = useState({ open: false, msg: "", severity: "success" });
  const closeSnack = (_, r) => (r === "clickaway" ? null : setSnack((s) => ({ ...s, open: false })));

  const examsCol = collection(db, "exams");
  const intakesCol = collection(db, "intakes");
  const studentsCol = collection(db, "students");
  const submissionsCol = collection(db, "examSubmissions");

  // Load intake names
  useEffect(() => {
    const loadIntakes = async () => {
      try {
        const snap = await getDocs(query(intakesCol, orderBy("name", "asc")));
        const map = {};
        snap.docs.forEach((d) => (map[d.id] = d.data().name));
        setIntakesMap(map);
      } catch (e) {
        console.error("Failed to fetch intakes:", e);
        setSnack({ open: true, msg: "Failed to fetch intake data.", severity: "error" });
      }
    };
    loadIntakes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Resolve student's courseId (prefer auth, else students collection by email)
  const resolveStudentCourseId = async () => {
    if (user?.courseId || user?.course) return user.courseId || user.course;
    if (!user?.email) return "";
    try {
      const snap = await getDocs(query(studentsCol, where("email", "==", user.email)));
      if (!snap.empty) {
        const data = snap.docs[0].data();
        return data?.courseId || "";
      }
    } catch (e) {
      console.warn("Could not resolve student's courseId from students collection:", e);
    }
    return "";
  };

  // Fetch exams matching both intake & course (when course available)
  const fetchExams = async (studentIntakeId, maybeCourseId, studentId) => {
    setLoading(true);
    try {
      if (!studentIntakeId || !studentId) {
        setSnack({ open: true, msg: "Missing student intake or ID.", severity: "error" });
        setLoading(false);
        return;
      }

      // Build constraints: required intake + available, optional course
      const constraints = [
        where("isDeleted", "==", 0),
        where("isAvailable", "==", true),
        where("intakeId", "==", studentIntakeId),
        orderBy("createdAt", "desc"),
      ];
      if (maybeCourseId) {
        // Insert course filter right before orderBy
        constraints.splice(3, 0, where("courseId", "==", maybeCourseId));
      }

      const exSnap = await getDocs(query(examsCol, ...constraints));
      const examsRaw = exSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

      // Fetch submitted exam IDs for student
      const subSnap = await getDocs(
        query(submissionsCol, where("studentId", "==", studentId), where("isSubmitted", "==", true))
      );
      const submittedIds = new Set(subSnap.docs.map((d) => d.data().examId));

      const hydrated = examsRaw.map((e) => ({
        ...e,
        intakeName: intakesMap[e.intakeId] || "Unknown Intake",
        isSubmitted: submittedIds.has(e.id),
      }));

      setExams(hydrated);
      setPage(1);
    } catch (e) {
      console.error("Failed to fetch exams:", e);
      setSnack({ open: true, msg: "Failed to fetch exams list.", severity: "error" });
    } finally {
      setLoading(false);
    }
  };

  // Kickoff
  useEffect(() => {
    const run = async () => {
      if (!isAuthLoading && !user) {
        navigate("/student-login");
        return;
      }
      if (isAuthLoading || !user || Object.keys(intakesMap).length === 0) return;

      const courseId = await resolveStudentCourseId();
      // Assuming user.intake stores the student's intakeId
      await fetchExams(user.intake, courseId, user.id);
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isAuthLoading, intakesMap]);

  // Client-side filtering
  const filtered = useMemo(() => {
    const t = search.trim().toLowerCase();
    return exams.filter((ex) => {
      const matches =
        (ex.title || "").toLowerCase().includes(t) ||
        (ex.intakeName || "").toLowerCase().includes(t);
      if (status === "submitted") return matches && ex.isSubmitted;
      if (status === "attemptable") return matches && !ex.isSubmitted;
      return matches;
    });
  }, [exams, search, status]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = useMemo(
    () => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filtered, page]
  );

  // Attempt Exam handlers
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
    <Box sx={{ bgcolor: "#e8f5e9", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <HeaderBar onLogout={() => { logout(); navigate("/student-login"); }} />

      <Box sx={{ p: 4, flexGrow: 1, display: "flex", flexDirection: "column" }}>
        <ControlsBar
          search={search}
          setSearch={(v) => { setSearch(v); setPage(1); }}
          status={status}
          setStatus={(v) => { setStatus(v); setPage(1); }}
          onBack={() => navigate("/student-dashboard")}
        />

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
      </Box>

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
