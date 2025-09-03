import React, { useMemo, useState, useCallback } from "react";
import { Box, Typography, Paper, Button, Snackbar, Alert as MuiAlert } from "@mui/material";
import { ArrowBack as ArrowBackIcon } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import FiltersBar from "./components/FiltersBar";
import SubmissionTable from "./components/SubmissionTable";
import SubmissionDrawer from "./components/SubmissionDrawer";
import GradeDialog from "./components/GradeDialog";
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

  // grade dialog (optional)
  const [openGrade, setOpenGrade] = useState(false);

  const handleHookError = useCallback(
    (msg) => setSnack({ open: true, msg, severity: "error" }),
    []
  );

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
      return intakeOk && examOk && statusOk && searchOk;
    });
  }, [submissions, search, examsMap, intakesMap, intakeIdFilter, examIdFilter, statusFilter]);

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
          reset={() => {
            setSearch(""); setExamIdFilter("all"); setIntakeIdFilter("all"); setStatusFilter("submitted"); setPage(1);
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

      {/* Optional grading dialog (placeholder; wire up your grading here) */}
      <GradeDialog
        open={openGrade}
        onClose={() => setOpenGrade(false)}
        submission={selectedSubmission}
        onSaved={() => {
          setOpenGrade(false);
          setSnack({ open: true, msg: "Grade saved.", severity: "success" });
          refresh();
        }}
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
