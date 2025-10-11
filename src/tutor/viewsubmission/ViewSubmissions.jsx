import React, { useMemo, useState, useCallback } from "react";
import { Box, Typography, Paper, Button, Snackbar, Alert as MuiAlert } from "@mui/material";
import { db } from "../../firebaseConfig";
import { doc, setDoc, updateDoc, serverTimestamp, getDoc } from "firebase/firestore";
import TopBar from "./components/TopBar";
import { useNavigate } from "react-router-dom";
import FiltersBar from "./components/FiltersBar";
import SubmissionTable from "./components/SubmissionTable";
import SubmissionDrawer from "./components/SubmissionDrawer";
import GradingModal from "./components/GradingModal";
import useSubmissions from "./hooks/useSubmissions";
import PaginationBar from "../../shared/PaginationBar";

const ViewSubmissions = () => {
  const navigate = useNavigate();

  // filters / UI
  const [search, setSearch] = useState("");
  const [examIdFilter, setExamIdFilter] = useState("all");
  const [intakeIdFilter, setIntakeIdFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("submitted"); // submitted | inprogress | all
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  // snackbar
  const [snack, setSnack] = useState({ open: false, msg: "", severity: "success" });
  const handleCloseSnack = (_, r) => r === "clickaway" ? null : setSnack(s => ({ ...s, open: false }));

  // drawer (details)
  const [openDrawer, setOpenDrawer] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [gradingFilter, setGradingFilter] = useState("all"); // 'all' | 'graded' | 'ungraded'

  // grade dialog (optional)
  const [openGrade, setOpenGrade] = useState(false);

  const handleHookError = useCallback(
    (msg) => setSnack({ open: true, msg, severity: "error" }),
    []
  );

  const handlePersistGrade = async (payload) => {
    try {
      const gradeRef = doc(db, "grades", payload.submissionId);
      const existing = await getDoc(gradeRef);

      const baseGradeDoc = {
        ...payload,
        // denormalized fields:
        intakeId: examsMap[payload.examId]?.intakeId || null,
        studentName: selectedSubmission?.studentName || null,
        examTitle: examsMap[payload.examId]?.title || null,
        updatedAt: serverTimestamp(),
      };

      if (existing.exists()) {
        // Only update (preserves original createdAt)
        await setDoc(gradeRef, baseGradeDoc, { merge: true });
      } else {
        // First time write: add createdAt
        await setDoc(
          gradeRef,
          { ...baseGradeDoc, createdAt: serverTimestamp() },
          { merge: true }
        );
      }

      // Mark submission as graded
      const subRef = doc(db, "examSubmissions", payload.submissionId);
      await updateDoc(subRef, {
        isGraded: true,
        gradeId: payload.submissionId,   // same id as grades doc
        gradedTotal: payload.totalEarned,
        gradedMax: payload.maxTotal,
        gradedAt: serverTimestamp(),
      });

      setSnack({ open: true, msg: "Grade saved.", severity: "success" });
      setOpenGrade(false);
      refresh();
    } catch (e) {
      console.error("Save grade error:", e);
      setSnack({ open: true, msg: "Failed to save grade.", severity: "error" });
    }
  };

  const {
    loading,
    examsMap,        // { examId: {title, intakeId, duration,...} }
    intakesMap,      // { intakeId: name }
    submissions,     // raw submissions
    refresh,
    softDeleteSubmission,
  } = useSubmissions({ onError: handleHookError });

  // filter + search (client-side for now; can push to Firestore queries later)
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return submissions.filter((s) => {
      const exam = examsMap[s.examId];
      const intakeOk = intakeIdFilter === "all" || exam?.intakeId === intakeIdFilter;
      const examOk = examIdFilter === "all" || s.examId === examIdFilter;
      const statusOk =
        statusFilter === "all" ||
        (statusFilter === "submitted" ? s.isSubmitted : !s.isSubmitted);

      const gradedOk =
        gradingFilter === "all" ||
        (gradingFilter === "graded" ? !!s.isGraded : !s.isGraded);

      const hay =
        (s.studentName || "").toLowerCase() +
        " " +
        (s.studentId || "") +
        " " +
        (s.humanStudentId || "") +
        " " +
        (exam?.title || "").toLowerCase() +
        " " +
        (intakesMap[exam?.intakeId] || "").toLowerCase();

      const searchOk = term === "" || hay.includes(term);
      return intakeOk && examOk && statusOk && gradedOk && searchOk;
    });
  }, [submissions, search, examsMap, intakesMap, intakeIdFilter, examIdFilter, statusFilter, gradingFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = useMemo(
    () => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filtered, page]
  );

  const handleResetFilters = () => {
    setSearch("");
    setExamIdFilter("all");
    setIntakeIdFilter("all");
    setStatusFilter("submitted");
    setGradingFilter("all");
    setPage(1);
  };

  // actions
  const handleViewDetails = (row) => {
    setSelectedSubmission(row);
    setOpenDrawer(true);
  };

  const handleOpenGrade = (row) => {
    setSelectedSubmission(row);
    setOpenGrade(true);
  };

  const handleSoftDelete = async (row) => {
    const ok = window.confirm("Are you sure you want to delete this submission?");
    if (!ok) return;
    const res = await softDeleteSubmission(row.id);
    if (res.ok) {
      setSnack({ open: true, msg: "Submission deleted.", severity: "success" });
      refresh();
    } else {
      setSnack({ open: true, msg: res.error || "Failed to delete.", severity: "error" });
    }
  };

  return (
    <Box sx={{ padding: 4, bgcolor: "#f7f5f2", minHeight: "100vh" }}>
      <TopBar
        title="View Submissions"
        onBack={() => navigate("/tutor-dashboard")}
        onRefresh={refresh}
      />
      <Paper elevation={3} sx={{ p: 2, mb: 2, borderRadius: "12px" }}>
        <FiltersBar
          loading={loading}
          examsMap={examsMap}
          intakesMap={intakesMap}
          search={search}
          setSearch={setSearch}
          examId={examIdFilter}
          setExamId={setExamIdFilter}
          intakeId={intakeIdFilter}
          setIntakeId={setIntakeIdFilter}
          status={statusFilter}
          setStatus={setStatusFilter}
          grading={gradingFilter}
          setGrading={setGradingFilter}
          onReset={handleResetFilters}
        />
      </Paper>

      <SubmissionTable
        loading={loading}
        rows={pageItems}
        examsMap={examsMap}
        intakesMap={intakesMap}
        onView={handleViewDetails}
        onGrade={handleOpenGrade}
        onDelete={handleSoftDelete}
      />

      {/* Details drawer */}
      <SubmissionDrawer
        open={openDrawer}
        onClose={() => setOpenDrawer(false)}
        submission={selectedSubmission}
        exam={selectedSubmission ? examsMap[selectedSubmission.examId] : null}
        intakeName={
          selectedSubmission && examsMap[selectedSubmission.examId]
            ? intakesMap[examsMap[selectedSubmission.examId].intakeId]
            : ""
        }
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
      <GradingModal
        open={openGrade}
        onClose={() => setOpenGrade(false)}
        submission={selectedSubmission}
        exam={selectedSubmission ? examsMap[selectedSubmission.examId] : null}
        onSaved={handlePersistGrade}
      />
      <Snackbar
        open={snack.open}
        autoHideDuration={3500}
        onClose={handleCloseSnack}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <MuiAlert
          onClose={handleCloseSnack}
          severity={snack.severity}
          elevation={6}
          variant="filled"
          sx={{
            backgroundColor:
              snack.severity === "error" ? "#ef5350" : snack.severity === "info" ? "#2196f3" : "#81c784",
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

export default ViewSubmissions;
