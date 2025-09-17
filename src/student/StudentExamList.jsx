// src/student/StudentExamList.jsx
import React, { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { db } from "../firebaseConfig"; // Ensure this path is correct
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Chip,
  Snackbar,
  Alert as MuiAlert,
  TextField,
  InputAdornment,
  CircularProgress,
  Avatar,
  AppBar,
  Toolbar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import {
  Search as SearchIcon,
  ArrowBack as ArrowBackIcon,
  PlayCircleOutline as PlayCircleOutlineIcon,
  CheckCircleOutline as CheckCircleOutlineIcon,
  Logout as LogoutIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";

const StudentExamList = () => {
  const { user, isLoading: isAuthLoading, logout } = useAuth();
  const [exams, setExams] = useState([]);
  const [intakes, setIntakes] = useState({});
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [isSnackbarOpen, setIsSnackbarOpen] = useState(false);
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const pageSize = 10;
  const navigate = useNavigate();

  // Inline password UI
  const [showAttemptPasswordInputForExamId, setShowAttemptPasswordInputForExamId] = useState(null);
  const [studentAttemptPassword, setStudentAttemptPassword] = useState("");
  const [studentAttemptPasswordError, setStudentAttemptPasswordError] = useState("");

  const examsCollectionRef = collection(db, "exams");
  const intakesCollectionRef = collection(db, "intakes");
  const studentsCollectionRef = collection(db, "students");

  const handleLogout = () => {
    logout();
    navigate("/student-login");
  };

  const handleCloseSnackbar = (event, reason) => {
    if (reason === "clickaway") return;
    setIsSnackbarOpen(false);
    setSnackbarMessage("");
    setSnackbarSeverity("success");
  };

  // Load intake names for display
  useEffect(() => {
    const fetchIntakes = async () => {
      try {
        const q = query(intakesCollectionRef, orderBy("name", "asc"));
        const snapshot = await getDocs(q);
        const intakesMap = {};
        snapshot.docs.forEach((doc) => {
          intakesMap[doc.id] = doc.data().name;
        });
        setIntakes(intakesMap);
      } catch (err) {
        console.error("Error fetching intakes:", err);
        setSnackbarMessage("Failed to fetch intake data.");
        setSnackbarSeverity("error");
        setIsSnackbarOpen(true);
      }
    };
    fetchIntakes();
  }, []);

  /**
   * Fetch exams that match BOTH student's intake and course (when course available).
   * If courseId is missing, we fall back to intake-only to avoid blocking the list.
   */
  const fetchExams = async (studentIntakeId, studentCourseId, studentId) => {
    setLoading(true);
    try {
      if (!studentIntakeId || !studentId) {
        setSnackbarMessage("Student intake ID or User ID not found. Cannot load exams.");
        setSnackbarSeverity("error");
        setIsSnackbarOpen(true);
        setLoading(false);
        return;
      }

      // Build Firestore query with mandatory intake and optional course filter
      const constraints = [
        where("isDeleted", "==", 0),
        where("isAvailable", "==", true),
        where("intakeId", "==", studentIntakeId),
        orderBy("createdAt", "desc"),
      ];

      // Add course filter if we know the student's course
      let usingCourseFilter = false;
      if (studentCourseId) {
        // Insert courseId equality before orderBy
        constraints.splice(3, 0, where("courseId", "==", studentCourseId));
        usingCourseFilter = true;
      }

      // Compose query
      const examsQuery = query(examsCollectionRef, ...constraints);
      const examsSnapshot = await getDocs(examsQuery);
      const examsData = examsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Fetch submitted exam IDs for student
      const submissionsRef = collection(db, "examSubmissions");
      const submissionsQuery = query(
        submissionsRef,
        where("studentId", "==", studentId),
        where("isSubmitted", "==", true)
      );
      const submissionsSnapshot = await getDocs(submissionsQuery);
      const submittedExamIds = new Set(submissionsSnapshot.docs.map((d) => d.data().examId));

      // Decorate with intake name + submitted flag
      const examsWithStatus = examsData.map((exam) => ({
        ...exam,
        intakeName: intakes[exam.intakeId] || "Unknown Intake",
        isSubmitted: submittedExamIds.has(exam.id),
      }));

      setExams(examsWithStatus);

      // If we couldn't apply the course filter, let the user know once
      if (!usingCourseFilter) {
        // Not an error; just informative
        console.log("Course filter not applied (no courseId found on user). Showing intake-matched exams.");
      }
    } catch (error) {
      console.error("Error fetching exams:", error);
      setSnackbarMessage("Failed to fetch exams list.");
      setSnackbarSeverity("error");
      setIsSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Determine student's courseId (priority: user.courseId, then students collection by email)
   * and fetch exams when ready.
   */
  useEffect(() => {
    const load = async () => {
      if (!isAuthLoading && !user) {
        navigate("/student-login");
        return;
      }
      if (isAuthLoading || !user || Object.keys(intakes).length === 0) return;

      let studentCourseId = user.courseId || user.course || ""; // prefer courseId on auth object
      try {
        if (!studentCourseId && user.email) {
          // fallback: read from students collection by email
          const snap = await getDocs(query(studentsCollectionRef, where("email", "==", user.email)));
          if (!snap.empty) {
            const data = snap.docs[0].data();
            if (data?.courseId) studentCourseId = data.courseId;
          }
        }
      } catch (e) {
        console.warn("Could not resolve student's courseId from students collection:", e);
      }

      // user.intake should be the student's intakeId (as used before)
      fetchExams(user.intake, studentCourseId, user.id);
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intakes, user, isAuthLoading, navigate]);

  // Search/filter
  const filteredAndStatusExams = exams.filter((exam) => {
    const matchesSearch =
      exam.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (exam.intakeName && exam.intakeName.toLowerCase().includes(searchTerm.toLowerCase()));
    if (filterStatus === "submitted") return matchesSearch && exam.isSubmitted;
    if (filterStatus === "attemptable") return matchesSearch && !exam.isSubmitted;
    return matchesSearch;
  });

  // Pagination
  const totalPages = Math.ceil(filteredAndStatusExams.length / pageSize);
  const paginatedExams = filteredAndStatusExams.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Attempt flow
  const handleAttemptExam = (exam) => {
    if (!user?.id) {
      setSnackbarMessage(
        `Authentication required to attempt exam. Please log in. (User ID: ${user?.id || "N/A"})`
      );
      setSnackbarSeverity("error");
      setIsSnackbarOpen(true);
      return;
    }
    if (exam.isSubmitted) {
      setSnackbarMessage("This exam has already been submitted.");
      setSnackbarSeverity("info");
      setIsSnackbarOpen(true);
      return;
    }
    if (exam.examPassword) {
      setShowAttemptPasswordInputForExamId(exam.id);
      setStudentAttemptPassword("");
      setStudentAttemptPasswordError("");
    } else {
      const unlockedKey = `examUnlocked-${user.id}-${exam.id}`;
      sessionStorage.setItem(unlockedKey, "true");
      navigate(`/student-take-exam/${exam.id}`);
      setSnackbarMessage(`Navigating to Exam: ${exam.title}`);
      setSnackbarSeverity("info");
      setIsSnackbarOpen(true);
    }
  };

  const handleVerifyAndStartExam = (examId, correctPassword) => {
    setStudentAttemptPasswordError("");
    if (!user?.id) {
      setSnackbarMessage(
        `Authentication required to verify password. Please log in again. (User ID: ${user?.id || "N/A"})`
      );
      setSnackbarSeverity("error");
      setIsSnackbarOpen(true);
      return;
    }
    if (studentAttemptPassword === correctPassword) {
      const unlockedKey = `examUnlocked-${user.id}-${examId}`;
      sessionStorage.setItem(unlockedKey, "true");
      navigate(`/student-take-exam/${examId}`);
      const title = exams.find((e) => e.id === examId)?.title;
      setSnackbarMessage(`Starting Exam: ${title}`);
      setSnackbarSeverity("success");
      setIsSnackbarOpen(true);
      setShowAttemptPasswordInputForExamId(null);
      setStudentAttemptPassword("");
    } else {
      setStudentAttemptPasswordError("Incorrect password. Contact Tutor for updated password.");
      setSnackbarMessage("Incorrect password. Please try again or contact your tutor.");
      setSnackbarSeverity("error");
      setIsSnackbarOpen(true);
    }
  };

  const handleCancelAttemptPassword = () => {
    setShowAttemptPasswordInputForExamId(null);
    setStudentAttemptPassword("");
    setStudentAttemptPasswordError("");
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
    <Box sx={{ padding: 0, bgcolor: "#e8f5e9", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <AppBar
        position="static"
        sx={{
          bgcolor: "rgba(255,255,255,0.6)",
          backdropFilter: "blur(10px)",
          borderBottom: "1px solid #ccc",
          boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
        }}
      >
        <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
          <Typography variant="h6" sx={{ color: "#37474f", fontWeight: "bold" }}>
            Student Exam List
          </Typography>
          <Button color="inherit" onClick={handleLogout} startIcon={<LogoutIcon />} sx={{ color: "#e57373", fontWeight: "bold" }}>
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      <Box
        sx={{
          padding: 4,
          flexGrow: 1,
          display: "flex",
          flexDirection: "column",
        }}
      >
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
            onClick={() => navigate("/student-dashboard")}
            sx={{
              borderColor: "#4CAF50",
              color: "#4CAF50",
              borderRadius: "12px",
              fontWeight: "bold",
              "&:hover": { backgroundColor: "#E8F5E9" },
            }}
          >
            Back to Dashboard
          </Button>

          <Typography variant="h4" sx={{ color: "#388e3c", flexGrow: 1, textAlign: "center" }}>
            Available Exams
          </Typography>

          <TextField
            label="Search Exams"
            variant="outlined"
            size="small"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
              sx: { borderRadius: "12px" },
            }}
            sx={{ flexGrow: 1, maxWidth: 300 }}
          />

          <FormControl variant="outlined" size="small" sx={{ minWidth: 120 }}>
            <InputLabel id="exam-status-filter-label">Status</InputLabel>
            <Select
              labelId="exam-status-filter-label"
              id="exam-status-filter"
              value={filterStatus}
              label="Status"
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setCurrentPage(1);
              }}
              sx={{ borderRadius: "12px" }}
            >
              <MenuItem value="all">All Exams</MenuItem>
              <MenuItem value="attemptable">Attemptable</MenuItem>
              <MenuItem value="submitted">Submitted</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <TableContainer component={Paper} sx={{ boxShadow: 3, borderRadius: "12px" }}>
          <Table>
            <TableHead sx={{ bgcolor: "#c8e6c9" }}>
              <TableRow>
                <TableCell sx={{ fontWeight: "bold", color: "#1b5e20" }}>Title</TableCell>
                <TableCell sx={{ fontWeight: "bold", color: "#1b5e20" }}>Intake</TableCell>
                <TableCell sx={{ fontWeight: "bold", color: "#1b5e20" }}>Duration (min)</TableCell>
                <TableCell sx={{ fontWeight: "bold", color: "#1b5e20" }}>Actions</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {paginatedExams.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                    <Typography variant="body1" color="text.secondary">
                      No exams found for your intake/course or matching your criteria.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedExams.map((exam) => (
                  <React.Fragment key={exam.id}>
                    <TableRow
                      sx={{
                        "&:hover": { bgcolor: "#f1f8e9" },
                        ...(exam.isSubmitted && { bgcolor: "#e0e0e0", opacity: 0.9 }),
                      }}
                    >
                      <TableCell>
                        <Box sx={{ display: "flex", alignItems: "center" }}>
                          <Avatar
                            sx={{
                              bgcolor: "#A5D6A7",
                              color: "#1B5E20",
                              mr: 2,
                              width: 32,
                              height: 32,
                              fontSize: "0.9rem",
                            }}
                          >
                            {exam.title.charAt(0)}
                          </Avatar>
                          {exam.title}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={exam.intakeName}
                          color="success"
                          size="small"
                          sx={{ borderRadius: "8px", fontWeight: "bold" }}
                        />
                      </TableCell>
                      <TableCell>{exam.duration || "N/A"}</TableCell>
                      <TableCell>
                        {exam.isSubmitted ? (
                          <Chip
                            icon={<CheckCircleOutlineIcon />}
                            label="Exam Submitted"
                            size="medium"
                            color="success"
                            sx={{
                              fontWeight: "bold",
                              borderRadius: "8px",
                              bgcolor: "#81c784",
                              color: "white",
                            }}
                          />
                        ) : (
                          <Button
                            size="small"
                            variant="contained"
                            color="primary"
                            onClick={() => handleAttemptExam(exam)}
                            startIcon={<PlayCircleOutlineIcon />}
                            sx={{
                              borderRadius: "8px",
                              fontWeight: "bold",
                              bgcolor: "#388e3c",
                              "&:hover": { bgcolor: "#2e7d32" },
                            }}
                            disabled={
                              isAuthLoading ||
                              !user ||
                              showAttemptPasswordInputForExamId === exam.id
                            }
                          >
                            Attempt Exam
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>

                    {showAttemptPasswordInputForExamId === exam.id && (
                      <TableRow>
                        <TableCell colSpan={4}>
                          <Box
                            sx={{
                              p: 2,
                              bgcolor: "#e0f7fa",
                              borderRadius: "12px",
                              display: "flex",
                              alignItems: "center",
                              gap: 2,
                              flexWrap: "wrap",
                            }}
                          >
                            <Typography variant="body2" sx={{ mr: 1, color: "#37474f" }}>
                              Enter exam password:
                            </Typography>
                            <TextField
                              autoFocus
                              size="small"
                              label="Password"
                              type="password"
                              value={studentAttemptPassword}
                              onChange={(e) => setStudentAttemptPassword(e.target.value)}
                              error={!!studentAttemptPasswordError}
                              helperText={studentAttemptPasswordError}
                              sx={{ width: 200, "& .MuiOutlinedInput-root": { borderRadius: "8px" } }}
                              onKeyPress={(e) => {
                                if (e.key === "Enter" && studentAttemptPassword.trim()) {
                                  handleVerifyAndStartExam(exam.id, exam.examPassword);
                                }
                              }}
                            />
                            <Button
                              variant="contained"
                              color="success"
                              onClick={() => handleVerifyAndStartExam(exam.id, exam.examPassword)}
                              disabled={!studentAttemptPassword.trim()}
                              sx={{ borderRadius: "8px", fontWeight: "bold" }}
                            >
                              Start Exam
                            </Button>
                            <Button
                              variant="outlined"
                              color="secondary"
                              onClick={handleCancelAttemptPassword}
                              sx={{ borderRadius: "8px" }}
                            >
                              Cancel
                            </Button>
                          </Box>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {!loading && paginatedExams.length > 0 && (
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mt: 2,
            }}
          >
            <Button
              variant="outlined"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((prev) => prev - 1)}
              sx={{ borderRadius: "12px", borderColor: "#4CAF50", color: "#4CAF50" }}
            >
              Previous
            </Button>
            <Typography>Page {currentPage} of {totalPages || 1}</Typography>
            <Button
              variant="outlined"
              disabled={currentPage === totalPages || totalPages === 0}
              onClick={() => setCurrentPage((prev) => prev + 1)}
              sx={{ borderRadius: "12px", borderColor: "#4CAF50", color: "#4CAF50" }}
            >
              Next
            </Button>
          </Box>
        )}
      </Box>

      <Snackbar
        open={isSnackbarOpen}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <MuiAlert
          onClose={handleCloseSnackbar}
          severity={snackbarSeverity}
          elevation={6}
          variant="filled"
          sx={{
            backgroundColor:
              snackbarSeverity === "error"
                ? "#ef5350"
                : snackbarSeverity === "info"
                ? "#2196f3"
                : "#81c784",
            fontWeight: "bold",
            borderRadius: "8px",
          }}
        >
          {snackbarMessage}
        </MuiAlert>
      </Snackbar>
    </Box>
  );
};

export default StudentExamList;
