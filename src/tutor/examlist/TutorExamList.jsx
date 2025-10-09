// src/tutor/examlist/TutorExamList.jsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  collection,
  getDocs,
  orderBy,
  query,
  doc,
  updateDoc,
  where,
  deleteField,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { Box, Snackbar, Typography, Paper } from "@mui/material";
import MuiAlert from "@mui/material/Alert";
import { useNavigate } from "react-router-dom";

import TopBar from "./components/TopBar";
import ExamsTable from "./components/ExamsTable";
import ExamModal from "./components/ExamModal";
import PaginationBar from "../../shared/PaginationBar";
import FiltersBar from "./components/FiltersBar";

const PAGE_SIZE = 10;

// treat true / "true" / 1 as deleted (compat for older data)
const isDeletedTrue = (v) => v === true || v === "true" || v === 1;

const TutorExamList = () => {
  const navigate = useNavigate();

  // data
  const [intakes, setIntakes] = useState({});
  const [courses, setCourses] = useState({});
  const [exams, setExams] = useState([]);

  // 🔹 active schedules (computed availability/password)
  const [activeByExamId, setActiveByExamId] = useState({}); // { [examId]: { password, scheduleId } }

  // ui
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);

  // filters
  const [intakeId, setIntakeId] = useState("all");
  const [courseId, setCourseId] = useState("all");
  const [availability, setAvailability] = useState("all"); // 'all'|'available'|'unavailable'
  const [hasPassword, setHasPassword] = useState("all");   // 'all'|'with'|'without'
  const [minTotalPoints, setMinTotalPoints] = useState(""); // '' | number-string
  const [showDeleted, setShowDeleted] = useState(false);

  // modal
  const [openModal, setOpenModal] = useState(false);
  const [selectedExam, setSelectedExam] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  // availability inline state (kept for compatibility; button will be disabled in table)
  const [showPasswordForExamId, setShowPasswordForExamId] = useState(null);
  const [editAvailabilityForExamId, setEditAvailabilityForExamId] = useState(null);
  const [tempExamPassword, setTempExamPassword] = useState("");
  const [tempExamPasswordError, setTempExamPasswordError] = useState("");

  // snackbar
  const [snack, setSnack] = useState({ open: false, msg: "", severity: "success" });
  const closeSnack = (_, r) => (r === "clickaway" ? null : setSnack((s) => ({ ...s, open: false })));

  // --- data fetch ---
  const fetchIntakes = useCallback(async () => {
    const qIntakes = query(collection(db, "intakes"), orderBy("name", "asc"));
    const snapshot = await getDocs(qIntakes);
    const map = {};
    snapshot.docs.forEach((d) => (map[d.id] = d.data().name));
    setIntakes(map);
  }, []);

  const fetchCourses = useCallback(async () => {
    const qCourses = query(collection(db, "courses"), orderBy("name", "asc"));
    const snapshot = await getDocs(qCourses);
    const map = {};
    snapshot.docs.forEach((d) => (map[d.id] = d.data().name));
    setCourses(map);
  }, []);

  const fetchExams = useCallback(async () => {
    const examsQuery = query(collection(db, "exams"), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(examsQuery);
    const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    setExams(data);
  }, []);

  // 🔹 fetch active schedules (now ∈ [startAtUTC, endAtUTC), status='published')
  const fetchActiveSchedulesNow = useCallback(async () => {
    const now = new Date();
    const qActive = query(
      collection(db, "scheduled_exams"),
      where("status", "==", "published"),
      where("startAtUTC", "<=", now),
      where("endAtUTC", ">", now)
    );
    const snap = await getDocs(qActive);
    const map = {};
    snap.docs.forEach((d) => {
      const row = d.data();
      if (!row?.examId) return;
      // If multiple active for same exam, prefer the earliest end time (deterministic)
      if (!map[row.examId]) {
        map[row.examId] = { password: row.password || "", scheduleId: d.id, endAtUTC: row.endAtUTC };
      } else {
        try {
          const prev = map[row.examId];
          if (row.endAtUTC?.toMillis?.() < prev.endAtUTC?.toMillis?.()) {
            map[row.examId] = { password: row.password || "", scheduleId: d.id, endAtUTC: row.endAtUTC };
          }
        } catch {}
      }
    });
    setActiveByExamId(map);
  }, []);

  useEffect(() => { fetchIntakes(); fetchCourses(); }, [fetchIntakes, fetchCourses]);
  useEffect(() => { if (Object.keys(intakes).length) fetchExams(); }, [intakes, fetchExams]);

  // fetch active schedules when list loads and every time you refresh exams
  useEffect(() => { fetchActiveSchedulesNow(); }, [fetchActiveSchedulesNow, exams.length]);

  const refresh = async () => {
    await fetchIntakes();
    await fetchCourses();
    await fetchExams();
    await fetchActiveSchedulesNow();
  };

  // Active / Deleted counts (total, not filtered)
  const counts = useMemo(() => {
    let active = 0, deleted = 0;
    exams.forEach((ex) => {
      if (isDeletedTrue(ex.isDeleted)) deleted++;
      else active++;
    });
    return { active, deleted };
  }, [exams]);

  // --- filtered + paginated ---
  const filtered = useMemo(() => {
    const t = searchTerm.trim().toLowerCase();
    return exams
      .map((ex) => {
        const intakeName = intakes[ex.intakeId] || "Unknown Intake";
        const courseName = ex.courseName || courses[ex.courseId] || "-";

        // 🔹 derive availability/password from active schedules
        const active = activeByExamId[ex.id];
        const computedIsAvailable = !!active;
        const computedPassword = active?.password || "";

        return { ...ex, intakeName, courseName, computedIsAvailable, computedPassword };
      })
      .filter((ex) => {
        const del = isDeletedTrue(ex.isDeleted);
        if (!showDeleted && del) return false;
        if (showDeleted && !del) return false;

        // search by title OR intake name OR course name
        const searchOk =
          !t ||
          ex.title?.toLowerCase().includes(t) ||
          (ex.intakeName || "").toLowerCase().includes(t) ||
          (ex.courseName || "").toLowerCase().includes(t);

        // intake filter
        const intakeOk = intakeId === "all" || ex.intakeId === intakeId;

        // course filter
        const courseOk = courseId === "all" || ex.courseId === courseId;

        // 🔹 availability filter (now based on schedule)
        const availOk =
          availability === "all" ||
          (availability === "available" && ex.computedIsAvailable) ||
          (availability === "unavailable" && !ex.computedIsAvailable);

        // 🔹 password filter (only meaningful when active)
        const hasPwd = ex.computedIsAvailable && typeof ex.computedPassword === "string" && ex.computedPassword.trim().length > 0;
        const passwordOk =
          hasPassword === "all" ||
          (hasPassword === "with" && hasPwd) ||
          (hasPassword === "without" && !hasPwd);

        // min total points filter (if provided)
        let pointsOk = true;
        if (minTotalPoints !== "" && !Number.isNaN(Number(minTotalPoints))) {
          const min = Number(minTotalPoints);
          const total =
            Number.isFinite(Number(ex.totalPoints))
              ? Number(ex.totalPoints)
              : (ex.questions || []).reduce((sum, q) => {
                  const n = Number(q?.points);
                  return sum + (Number.isFinite(n) ? n : 0);
                }, 0);

          pointsOk = Number.isFinite(total) && total >= min;
        }

        return searchOk && intakeOk && courseOk && availOk && passwordOk && pointsOk;
      });
  }, [
    exams, intakes, courses, activeByExamId,
    searchTerm, intakeId, courseId, availability, hasPassword, minTotalPoints, showDeleted
  ]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = useMemo(
    () => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filtered, page]
  );

  const handleResetFilters = () => {
    setSearchTerm("");
    setIntakeId("all");
    setCourseId("all");
    setAvailability("all");
    setHasPassword("all");
    setMinTotalPoints("");
    setShowDeleted(false);
    setPage(1);
  };

  // --- modal open/close ---
  const handleView = (exam) => {
    setSelectedExam(exam);
    setIsEditing(false);
    setOpenModal(true);
  };
  const handleEdit = (exam) => {
    setSelectedExam(exam);
    setIsEditing(true);
    setOpenModal(true);
  };
  const handleCreate = () => {
    setSelectedExam(null);
    setIsEditing(true);
    setOpenModal(true);
  };
  const closeModalAndRefresh = async () => {
    setOpenModal(false);
    setTimeout(async () => {
      setSelectedExam(null);
      setIsEditing(false);
      setEditAvailabilityForExamId(null);
      setShowPasswordForExamId(null);
      await refresh(); // also refresh active schedules
    }, 150);
  };

  // --- actions (kept for compatibility; toggle will be disabled in Table) ---
  const softDeleteExam = async (id) => {
    if (!window.confirm("Move this exam to trash?")) return;
    try {
      await updateDoc(doc(db, "exams", id), {
        isDeleted: 1,
        updatedAt: serverTimestamp(),
      });
      setSnack({ open: true, msg: "Exam moved to trash.", severity: "success" });
      await refresh();
    } catch (e) {
      console.error(e);
      setSnack({ open: true, msg: "Failed to delete.", severity: "error" });
    }
  };

  const restoreExam = async (id) => {
    try {
      await updateDoc(doc(db, "exams", id), {
        isDeleted: 0,
        updatedAt: serverTimestamp(),
      });
      setSnack({ open: true, msg: "Exam restored.", severity: "success" });
      await refresh();
    } catch (e) {
      console.error(e);
      setSnack({ open: true, msg: "Failed to restore.", severity: "error" });
    }
  };

  // These edit-availability handlers remain but won’t be reachable because the button is disabled.
  const toggleAvailability = (examId, current) => {
    setSnack({ open: true, msg: "Availability is controlled by Schedule Exam.", severity: "info" });
  };
  const confirmAvailabilityChange = async () => {};
  const cancelAvailabilityEdit = () => {
    setEditAvailabilityForExamId(null);
    setTempExamPassword("");
    setTempExamPasswordError("");
  };

  const togglePasswordVisibility = (id) =>
    setShowPasswordForExamId((prev) => (prev === id ? null : id));

  return (
    <Box sx={{ p: 4, bgcolor: "#f7f5f2", minHeight: "100vh" }}>
      <TopBar onBack={() => navigate("/tutor-dashboard")} />
      <Paper elevation={3} sx={{ p: 2, mb: 2, borderRadius: "12px" }}>
        <FiltersBar
          loading={false}
          intakesMap={intakes}
          coursesMap={courses}
          search={searchTerm}
          setSearch={(v) => { setSearchTerm(v); setPage(1); }}
          intakeId={intakeId}
          setIntakeId={(v) => { setIntakeId(v); setPage(1); }}
          courseId={courseId}
          setCourseId={(v) => { setCourseId(v); setPage(1); }}
          availability={availability}
          setAvailability={(v) => { setAvailability(v); setPage(1); }}
          hasPassword={hasPassword}
          setHasPassword={(v) => { setHasPassword(v); setPage(1); }}
          minTotalPoints={minTotalPoints}
          setMinTotalPoints={(v) => { setMinTotalPoints(v); setPage(1); }}
          showDeleted={showDeleted}
          setShowDeleted={(v) => { setShowDeleted(v); setPage(1); }}
          activeCount={filtered.filter((s) => !isDeletedTrue(s.isDeleted)).length}
          deletedCount={filtered.filter((s) => isDeletedTrue(s.isDeleted)).length}
          onReset={handleResetFilters}
        />
      </Paper>

      <ExamsTable
        rows={pageItems}
        intakesMap={intakes}
        coursesMap={courses}
        showPasswordForExamId={showPasswordForExamId}
        editAvailabilityForExamId={editAvailabilityForExamId}
        tempExamPassword={tempExamPassword}
        tempExamPasswordError={tempExamPasswordError}
        setTempExamPassword={setTempExamPassword}
        onTogglePasswordVisibility={togglePasswordVisibility}
        onView={handleView}
        onEdit={handleEdit}
        onSoftDelete={softDeleteExam}
        onRestore={restoreExam}
        onToggleAvailability={toggleAvailability}
        onConfirmAvailability={confirmAvailabilityChange}
        onCancelAvailability={cancelAvailabilityEdit}
        showingDeleted={showDeleted}
      />

      <Typography variant="body2" sx={{ mt: 1, color: "text.secondary" }}>
        Showing {filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}
        –
        {Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
      </Typography>

      <PaginationBar
        page={page}
        totalPages={totalPages}
        onPrev={() => setPage((p) => Math.max(1, p - 1))}
        onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
      />

      <ExamModal open={openModal} exam={selectedExam} isEditing={isEditing} onClose={closeModalAndRefresh} />

      <Snackbar
        open={snack.open}
        autoHideDuration={4000}
        onClose={closeSnack}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <MuiAlert
          onClose={closeSnack}
          severity={snack.severity}
          elevation={6}
          variant="filled"
          sx={{
            backgroundColor:
              snack.severity === "error" ? "#ef5350"
                : snack.severity === "warning" ? "#ffb74d"
                  : "#81c784",
            fontWeight: "bold",
            borderRadius: "8px",
          }}
        >
          {snack.msg}
        </MuiAlert>
      </Snackbar>
    </Box>
  );
};

export default TutorExamList;
