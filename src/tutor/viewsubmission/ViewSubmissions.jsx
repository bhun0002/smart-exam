import React, { useMemo, useState, useCallback } from "react";
import { Box, Typography, Paper, Button, Snackbar, Alert as MuiAlert } from "@mui/material";
import { db } from "../../firebaseConfig";
import { doc, setDoc, updateDoc, serverTimestamp, getDoc } from "firebase/firestore";
import { ArrowBack as ArrowBackIcon } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import FiltersBar from "./components/FiltersBar";
import SubmissionTable from "./components/SubmissionTable";
import SubmissionDrawer from "./components/SubmissionDrawer";
import GradingModal from "./components/GradingModal";
import useSubmissions from "./hooks/useSubmissions";

const ViewSubmissions = () => {
  const navigate = useNavigate();

  // filters / UI
  const [search, setSearch] = useState("");
  const [examIdFilter, setExamIdFilter] = useState("all");
  const [intakeIdFilter, setIntakeIdFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("submitted"); // submitted | inprogress | all
  const [page, setPage] = useState(1);
  const pageSize = 10;

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

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize);

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
      {/* header bar (matching TutorExamList style) */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 4,
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate("/tutor-dashboard")}
          sx={{
            borderColor: "#4A90E2",
            color: "#4A90E2",
            borderRadius: "12px",
            fontWeight: "bold",
            "&:hover": { backgroundColor: "#E3F2FD" },
          }}
        >
          Back to Dashboard
        </Button>

        <Typography variant="h4" sx={{ color: "#5d5c61", flexGrow: 1, textAlign: "center" }}>
          View Submissions
        </Typography>

        <Button
          variant="contained"
          sx={{
            bgcolor: "#a8dadc",
            color: "#1d3557",
            "&:hover": { bgcolor: "#81c0c2" },
            borderRadius: "12px",
          }}
          onClick={refresh}
        >
          Refresh
        </Button>
      </Box>

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
          reset={() => {
            setSearch(""); 
            setExamIdFilter("all"); 
            setIntakeIdFilter("all"); 
            setStatusFilter("submitted"); 
            setGradingFilter("all"); 
            setPage(1);
          }}
        />
      </Paper>

      <SubmissionTable
        loading={loading}
        rows={pageItems}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
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
