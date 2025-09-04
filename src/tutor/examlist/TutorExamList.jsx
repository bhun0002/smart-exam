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
import { Box, Snackbar } from "@mui/material";
import MuiAlert from "@mui/material/Alert";
import { useNavigate } from "react-router-dom";

import HeaderBar from "./components/HeaderBar";
import ExamsTable from "./components/ExamsTable";
import ExamModal from "./components/ExamModal";
import PaginationBar from "./components/PaginationBar";
import FiltersBar from "./components/FiltersBar"; // ⬅️ NEW

const PAGE_SIZE = 10;

const TutorExamList = () => {
  const navigate = useNavigate();

  // data
  const [intakes, setIntakes] = useState({});
  const [exams, setExams] = useState([]);

  // ui
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);

  // NEW: extra filters
  const [intakeId, setIntakeId] = useState("all");
  const [availability, setAvailability] = useState("all"); // 'all'|'available'|'unavailable'
  const [hasPassword, setHasPassword] = useState("all");   // 'all'|'with'|'without'
  const [minTotalPoints, setMinTotalPoints] = useState(""); // string or number

  // modal
  const [openModal, setOpenModal] = useState(false);
  const [selectedExam, setSelectedExam] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  // availability inline state
  const [showPasswordForExamId, setShowPasswordForExamId] = useState(null);
  const [editAvailabilityForExamId, setEditAvailabilityForExamId] = useState(null);
  const [tempExamPassword, setTempExamPassword] = useState("");
  const [tempExamPasswordError, setTempExamPasswordError] = useState("");

  // snackbar
  const [snack, setSnack] = useState({
    open: false,
    msg: "",
    severity: "success",
  });
  const closeSnack = (_, r) =>
    r === "clickaway" ? null : setSnack((s) => ({ ...s, open: false }));

  // --- data fetch ---
  const fetchIntakes = useCallback(async () => {
    const qIntakes = query(collection(db, "intakes"), orderBy("name", "asc"));
    const snapshot = await getDocs(qIntakes);
    const map = {};
    snapshot.docs.forEach((d) => (map[d.id] = d.data().name));
    setIntakes(map);
  }, []);

  const fetchExams = useCallback(async () => {
    const examsQuery = query(
      collection(db, "exams"),
      where("isDeleted", "==", 0),
      orderBy("createdAt", "desc")
    );
    const snapshot = await getDocs(examsQuery);
    const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    setExams(data);
  }, []);

  useEffect(() => {
    fetchIntakes();
  }, [fetchIntakes]);

  useEffect(() => {
    if (Object.keys(intakes).length) fetchExams();
  }, [intakes, fetchExams]);

  const refresh = async () => {
    await fetchIntakes();
    await fetchExams();
  };

  // --- filtered + paginated ---
  const filtered = useMemo(() => {
    const t = searchTerm.trim().toLowerCase();
    return exams
      .map((ex) => ({
        ...ex,
        intakeName: intakes[ex.intakeId] || "Unknown Intake",
      }))
      .filter((ex) => {
        // search by title OR intake name
        const searchOk =
          !t ||
          ex.title?.toLowerCase().includes(t) ||
          (ex.intakeName || "").toLowerCase().includes(t);

        // intake filter
        const intakeOk = intakeId === "all" || ex.intakeId === intakeId;

        // availability filter
        const availOk =
          availability === "all" ||
          (availability === "available" && ex.isAvailable) ||
          (availability === "unavailable" && !ex.isAvailable);

        // has password filter
        const hasPwd =
          ex.examPassword && typeof ex.examPassword === "string" && ex.examPassword.trim().length > 0;
        const passwordOk =
          hasPassword === "all" ||
          (hasPassword === "with" && hasPwd) ||
          (hasPassword === "without" && !hasPwd);

        // min total points filter (if provided)
        let pointsOk = true;
        if (minTotalPoints !== "" && !Number.isNaN(Number(minTotalPoints))) {
          const min = Number(minTotalPoints);
          // prefer precomputed totalPoints if present; else compute on the fly
          const total =
            Number.isFinite(Number(ex.totalPoints))
              ? Number(ex.totalPoints)
              : (ex.questions || []).reduce((sum, q) => {
                  const n = Number(q?.points);
                  return sum + (Number.isFinite(n) ? n : 0);
                }, 0);

          pointsOk = Number.isFinite(total) && total >= min;
        }

        return searchOk && intakeOk && availOk && passwordOk && pointsOk;
      });
  }, [exams, intakes, searchTerm, intakeId, availability, hasPassword, minTotalPoints]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = useMemo(
    () => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filtered, page]
  );

  const handleResetFilters = () => {
    setSearchTerm("");
    setIntakeId("all");
    setAvailability("all");
    setHasPassword("all");
    setMinTotalPoints("");
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
      await fetchExams();
    }, 150);
  };

  // --- actions ---
  const softDeleteExam = async (id) => {
    if (!window.confirm("Are you sure you want to delete this exam?")) return;
    try {
      await updateDoc(doc(db, "exams", id), {
        isDeleted: 1,
        updatedAt: serverTimestamp(),
      });
      setSnack({ open: true, msg: "Exam soft-deleted.", severity: "success" });
      await fetchExams();
    } catch (e) {
      console.error(e);
      setSnack({ open: true, msg: "Failed to delete.", severity: "error" });
    }
  };

  const toggleAvailability = (examId, current) => {
    if (editAvailabilityForExamId && editAvailabilityForExamId !== examId) {
      setSnack({
        open: true,
        msg: "Finish the current availability action first.",
        severity: "warning",
      });
      return;
    }
    if (!current) {
      // going to Available -> need password
      setEditAvailabilityForExamId(examId);
      setTempExamPassword("");
      setTempExamPasswordError("");
    } else {
      // going to Unavailable
      confirmAvailabilityChange(examId, false);
    }
  };

  const confirmAvailabilityChange = async (examId, newStatus) => {
    setTempExamPasswordError("");
    let password = deleteField();

    if (newStatus) {
      const p = (tempExamPassword || "").trim();
      if (!p) {
        setTempExamPasswordError("Password is required.");
        setSnack({ open: true, msg: "Password is required.", severity: "error" });
        return;
      }
      if (p.length < 6) {
        setTempExamPasswordError("Password must be at least 6 characters.");
        setSnack({
          open: true,
          msg: "Password must be at least 6 characters.",
          severity: "error",
        });
        return;
      }
      password = p;
    }

    try {
      await updateDoc(doc(db, "exams", examId), {
        isAvailable: newStatus,
        examPassword: password,
        updatedAt: serverTimestamp(),
      });
      setSnack({
        open: true,
        msg: `Exam marked ${newStatus ? "Available" : "Unavailable"}.`,
        severity: "success",
      });
      setEditAvailabilityForExamId(null);
      setTempExamPassword("");
      setShowPasswordForExamId(null);
      await fetchExams();
    } catch (e) {
      console.error(e);
      setSnack({ open: true, msg: "Failed to update availability.", severity: "error" });
    }
  };

  const cancelAvailabilityEdit = () => {
    setEditAvailabilityForExamId(null);
    setTempExamPassword("");
    setTempExamPasswordError("");
  };

  const togglePasswordVisibility = (id) =>
    setShowPasswordForExamId((prev) => (prev === id ? null : id));

  return (
    <Box sx={{ p: 4, bgcolor: "#f7f5f2", minHeight: "100vh" }}>
      <HeaderBar
        onBack={() => navigate("/tutor-dashboard")}
        onCreate={handleCreate}
      />

      {/* NEW: FiltersBar (Intake + Availability + a second Search if you want it) */}
      <FiltersBar
        loading={false}
        intakesMap={intakes}
        search={searchTerm}
        setSearch={(v) => { setSearchTerm(v); setPage(1); }}
        intakeId={intakeId}
        setIntakeId={(v) => { setIntakeId(v); setPage(1); }}
        availability={availability}
        setAvailability={(v) => { setAvailability(v); setPage(1); }}
        hasPassword={hasPassword}
        setHasPassword={(v) => { setHasPassword(v); setPage(1); }}
        minTotalPoints={minTotalPoints}
        setMinTotalPoints={(v) => { setMinTotalPoints(v); setPage(1); }}
        onReset={handleResetFilters}
      />

      <ExamsTable
        rows={pageItems}
        intakesMap={intakes}
        showPasswordForExamId={showPasswordForExamId}
        editAvailabilityForExamId={editAvailabilityForExamId}
        tempExamPassword={tempExamPassword}
        tempExamPasswordError={tempExamPasswordError}
        setTempExamPassword={setTempExamPassword}
        onTogglePasswordVisibility={togglePasswordVisibility}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={softDeleteExam}
        onToggleAvailability={toggleAvailability}
        onConfirmAvailability={confirmAvailabilityChange}
        onCancelAvailability={cancelAvailabilityEdit}
      />

      <PaginationBar
        page={page}
        totalPages={totalPages}
        onPrev={() => setPage((p) => Math.max(1, p - 1))}
        onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
      />

      <ExamModal
        open={openModal}
        exam={selectedExam}
        isEditing={isEditing}
        onClose={closeModalAndRefresh}
      />

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
              snack.severity === "error"
                ? "#ef5350"
                : snack.severity === "warning"
                ? "#ffb74d"
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
