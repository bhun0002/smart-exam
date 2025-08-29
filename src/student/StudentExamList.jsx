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
    CircularProgress, // For loading indicator
    Avatar, // FIXED: Import Avatar
    AppBar, // Import AppBar
    Toolbar, // Import Toolbar
    FormControl, // Import FormControl for select dropdown
    InputLabel, // Import InputLabel for select dropdown
    Select, // Import Select for dropdown
    MenuItem // Import MenuItem for select dropdown options
} from "@mui/material";
import {
    Search as SearchIcon,
    ArrowBack as ArrowBackIcon, // For back button
    PlayCircleOutline as PlayCircleOutlineIcon, // For "Attempt Exam" button
    CheckCircleOutline as CheckCircleOutlineIcon, // Import for 'Submitted' chip icon
    Logout as LogoutIcon // Import for logout button
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useAuth } from '../AuthContext'; // Import useAuth to get user context

const StudentExamList = () => {
    const { user, isLoading: isAuthLoading, logout } = useAuth(); // Get user, auth loading state, and logout
    const [exams, setExams] = useState([]);
    const [intakes, setIntakes] = useState({});
    const [snackbarMessage, setSnackbarMessage] = useState("");
    const [isSnackbarOpen, setIsSnackbarOpen] = useState(false);
    const [snackbarSeverity, setSnackbarSeverity] = useState("success");
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(true); // Loading state for exams
    const [filterStatus, setFilterStatus] = useState("all"); // New state for filtering by status: "all", "submitted", "attemptable"
    const pageSize = 10;
    const navigate = useNavigate();

    // New states for inline password input for "Attempt Exam"
    const [showAttemptPasswordInputForExamId, setShowAttemptPasswordInputForExamId] = useState(null);
    const [studentAttemptPassword, setStudentAttemptPassword] = useState("");
    const [studentAttemptPasswordError, setStudentAttemptPasswordError] = useState("");

    const examsCollectionRef = collection(db, "exams");
    const intakesCollectionRef = collection(db, "intakes");

    const handleLogout = () => {
        logout();
        navigate("/student-login");
    };

    /**
     * Handles closing the Snackbar notification.
     * @param {object} event - The event object.
     * @param {string} reason - The reason for closing.
     */
    const handleCloseSnackbar = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }
        setIsSnackbarOpen(false);
        setSnackbarMessage("");
        setSnackbarSeverity("success");
    };

    /**
     * Fetches all intake names to map intake IDs to human-readable names.
     */
    useEffect(() => {
        const fetchIntakes = async () => {
            try {
                const q = query(intakesCollectionRef, orderBy("name", "asc"));
                const snapshot = await getDocs(q);
                const intakesMap = {};
                snapshot.docs.forEach(doc => {
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
     * Fetches exams based on student's intake and availability status,
     * and also checks for submitted status.
     */
    const fetchExams = async (studentIntakeId, studentId) => {
        setLoading(true); // Start loading
        try {
            if (!studentIntakeId || !studentId) {
                setSnackbarMessage("Student intake ID or User ID not found. Cannot load exams.");
                setSnackbarSeverity("error");
                setIsSnackbarOpen(true);
                setLoading(false);
                return;
            }

            // Step 1: Fetch the list of available exams for the student's intake
            const examsQuery = query(
                examsCollectionRef,
                where("isDeleted", "==", 0), // Not soft-deleted
                where("isAvailable", "==", true), // Only available exams
                where("intakeId", "==", studentIntakeId), // Filter by student's intake
                orderBy("createdAt", "desc") // Order by creation date
            );
            const examsSnapshot = await getDocs(examsQuery);
            const examsData = examsSnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));
            
            // Step 2: Fetch the list of exams already submitted by the student
            const submissionsRef = collection(db, "examSubmissions");
            const submissionsQuery = query(
              submissionsRef,
              where("studentId", "==", studentId), // Use the student's ID for submissions
              where("isSubmitted", "==", true) // Filter for explicitly submitted exams
            );
            const submissionsSnapshot = await getDocs(submissionsQuery);
            const submittedExamIds = new Set(
              submissionsSnapshot.docs.map(doc => doc.data().examId)
            );

            // Step 3: Combine data, map intake IDs to names, and add 'isSubmitted' flag
            const examsWithStatus = examsData.map(exam => ({
                ...exam,
                intakeName: intakes[exam.intakeId] || 'Unknown Intake',
                isSubmitted: submittedExamIds.has(exam.id), // Add the submitted flag
            }));
            setExams(examsWithStatus);

        } catch (error) {
            console.error("Error fetching exams:", error);
            setSnackbarMessage("Failed to fetch exams list.");
            setSnackbarSeverity("error");
            setIsSnackbarOpen(true);
        } finally {
            setLoading(false); // End loading
        }
    };

    /**
     * Effect hook to fetch exams once intakes are loaded and student is authenticated.
     */
    useEffect(() => {
        // Redirect if auth is not loading and no user is present
        if (!isAuthLoading && !user) {
            navigate("/student-login");
            return;
        }

        // Only fetch exams if intakes are loaded and user object (with intake and id) is available
        if (Object.keys(intakes).length > 0 && user?.intake && user?.id) {
            fetchExams(user.intake, user.id); // Pass user.id to fetch submissions
        }
    }, [intakes, user, isAuthLoading, navigate]); // Depend on intakes, user, and isAuthLoading

    /**
     * Filters exams based on the search term and new filter status.
     */
    const filteredAndStatusExams = exams.filter(exam => {
        const matchesSearch = exam.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              (exam.intakeName && exam.intakeName.toLowerCase().includes(searchTerm.toLowerCase()));

        if (filterStatus === "submitted") {
            return matchesSearch && exam.isSubmitted;
        } else if (filterStatus === "attemptable") {
            return matchesSearch && !exam.isSubmitted;
        }
        return matchesSearch; // "all" or any other status
    });


    /**
     * Calculates total pages and slices exams for current page.
     */
    const totalPages = Math.ceil(filteredAndStatusExams.length / pageSize);
    const paginatedExams = filteredAndStatusExams.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
    );

    /**
     * Handles the "Attempt Exam" action, showing password input or navigating directly.
     * @param {object} exam - The exam object to attempt.
     */
    const handleAttemptExam = (exam) => {
        if (!user?.id) { 
            setSnackbarMessage(`Authentication required to attempt exam. Please log in. (User ID: ${user?.id || 'N/A'})`); 
            setSnackbarSeverity("error");
            setIsSnackbarOpen(true);
            return;
        }

        // Prevent attempting if already submitted
        if (exam.isSubmitted) {
            setSnackbarMessage("This exam has already been submitted.");
            setSnackbarSeverity("info");
            setIsSnackbarOpen(true);
            return;
        }

        if (exam.examPassword) {
            // Show inline password input
            setShowAttemptPasswordInputForExamId(exam.id);
            setStudentAttemptPassword(""); // Clear previous password
            setStudentAttemptPasswordError(""); // Clear previous error
        } else {
            // No password required, store access flag and navigate directly
            const unlockedKey = `examUnlocked-${user.id}-${exam.id}`;
            sessionStorage.setItem(unlockedKey, 'true'); // Store access flag
            navigate(`/student-take-exam/${exam.id}`);
            setSnackbarMessage(`Navigating to Exam: ${exam.title}`);
            setSnackbarSeverity("info");
            setIsSnackbarOpen(true);
        }
    };

    /**
     * Verifies the entered password and navigates to the exam if correct.
     * @param {string} examId - The ID of the exam.
     * @param {string} correctPassword - The correct password for the exam.
     */
    const handleVerifyAndStartExam = (examId, correctPassword) => {
        setStudentAttemptPasswordError(""); // Clear previous error

        if (!user?.id) {
            setSnackbarMessage(`Authentication required to verify password. Please log in again. (User ID: ${user?.id || 'N/A'})`);
            setSnackbarSeverity("error");
            setIsSnackbarOpen(true);
            return;
        }

        if (studentAttemptPassword === correctPassword) {
            const unlockedKey = `examUnlocked-${user.id}-${examId}`;
            sessionStorage.setItem(unlockedKey, 'true'); // Store access flag
            navigate(`/student-take-exam/${examId}`);
            setSnackbarMessage(`Starting Exam: ${exams.find(e => e.id === examId)?.title}`);
            setSnackbarSeverity("success");
            setIsSnackbarOpen(true);
            setShowAttemptPasswordInputForExamId(null); // Hide password input
            setStudentAttemptPassword(""); // Clear password
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

    // Show a loading spinner while authenticating or fetching exams
    if (isAuthLoading || loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh" bgcolor="#e8f5e9">
                <CircularProgress sx={{ color: '#4CAF50' }} />
                <Typography variant="body1" sx={{ ml: 2, color: '#4CAF50' }}>Loading exams...</Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ padding: 4, bgcolor: "#e8f5e9", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
            {/* Top AppBar with logout functionality */}
            <AppBar 
                position="static" 
                sx={{ 
                    bgcolor: 'rgba(255,255,255,0.8)', 
                    backdropFilter: 'blur(8px)', 
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)', 
                    borderRadius: '12px', 
                    mb: 4 
                }}
            >
                <Toolbar sx={{ justifyContent: 'space-between' }}>
                    <Typography variant="h6" sx={{ color: '#388e3c', fontWeight: 'bold' }}>
                        Student Exam List
                    </Typography>
                    <Button
                        color="inherit"
                        onClick={handleLogout}
                        startIcon={<LogoutIcon />}
                        sx={{ color: '#d32f2f', fontWeight: 'bold' }}
                    >
                        Logout
                    </Button>
                </Toolbar>
            </AppBar>

            <Box
                sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 4,
                    flexWrap: 'wrap',
                    gap: 2,
                }}
            >
                {/* Back to Student Dashboard Button */}
                <Button
                    variant="outlined"
                    startIcon={<ArrowBackIcon />}
                    onClick={() => navigate("/student-dashboard")}
                    sx={{
                        borderColor: '#4CAF50', color: '#4CAF50', borderRadius: '12px', fontWeight: 'bold',
                        '&:hover': { backgroundColor: '#E8F5E9' },
                    }}
                >
                    Back to Dashboard
                </Button>

                <Typography variant="h4" sx={{ color: "#388e3c", flexGrow: 1, textAlign: 'center' }}>
                    Available Exams
                </Typography>
                
                {/* Search Field */}
                <TextField
                    label="Search Exams"
                    variant="outlined"
                    size="small"
                    value={searchTerm}
                    onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setCurrentPage(1); // reset to first page on search
                    }}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon />
                            </InputAdornment>
                        ),
                        sx: { borderRadius: '12px' }
                    }}
                    sx={{ flexGrow: 1, maxWidth: 300 }}
                />

                {/* New Filter Dropdown */}
                <FormControl variant="outlined" size="small" sx={{ minWidth: 120 }}>
                    <InputLabel id="exam-status-filter-label">Status</InputLabel>
                    <Select
                        labelId="exam-status-filter-label"
                        id="exam-status-filter"
                        value={filterStatus}
                        label="Status"
                        onChange={(e) => {
                            setFilterStatus(e.target.value);
                            setCurrentPage(1); // Reset to first page when filter changes
                        }}
                        sx={{ borderRadius: '12px' }}
                    >
                        <MenuItem value="all">All Exams</MenuItem>
                        <MenuItem value="attemptable">Attemptable</MenuItem>
                        <MenuItem value="submitted">Submitted</MenuItem>
                    </Select>
                </FormControl>
            </Box>

            <TableContainer component={Paper} sx={{ boxShadow: 3, borderRadius: '12px' }}>
                <Table>
                    <TableHead sx={{ bgcolor: "#c8e6c9" }}>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 'bold', color: '#1b5e20' }}>Title</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', color: '#1b5e20' }}>Intake</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', color: '#1b5e20' }}>Duration (min)</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', color: '#1b5e20' }}>Actions</TableCell>
                        </TableRow>
                    </TableHead>

                    <TableBody>
                        {paginatedExams.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} align="center" sx={{ py: 3 }}> {/* Adjusted colspan */}
                                    <Typography variant="body1" color="text.secondary">
                                        No exams found for your intake or matching your criteria.
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            paginatedExams.map((exam) => (
                                <React.Fragment key={exam.id}>
                                    <TableRow
                                        sx={{ "&:hover": { bgcolor: "#f1f8e9" }, ...(exam.isSubmitted && { bgcolor: '#e0e0e0', opacity: 0.9 }) }}
                                    >
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                <Avatar sx={{ bgcolor: '#A5D6A7', color: '#1B5E20', mr: 2, width: 32, height: 32, fontSize: '0.9rem' }}>
                                                    {exam.title.charAt(0)}
                                                </Avatar>
                                                {exam.title}
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Chip label={exam.intakeName} color="success" size="small" sx={{ borderRadius: '8px', fontWeight: 'bold' }} />
                                        </TableCell>
                                        <TableCell>{exam.duration || 'N/A'}</TableCell>
                                        <TableCell>
                                            {exam.isSubmitted ? (
                                                <Chip
                                                    icon={<CheckCircleOutlineIcon />}
                                                    label="Exam Submitted"
                                                    size="medium"
                                                    color="success"
                                                    sx={{ 
                                                        fontWeight: 'bold', 
                                                        borderRadius: '8px', 
                                                        bgcolor: '#81c784', 
                                                        color: 'white' 
                                                    }}
                                                />
                                            ) : (
                                                <Button
                                                    size="small"
                                                    variant="contained"
                                                    color="primary"
                                                    onClick={() => handleAttemptExam(exam)} // Pass the whole exam object
                                                    startIcon={<PlayCircleOutlineIcon />}
                                                    sx={{ borderRadius: '8px', fontWeight: 'bold', bgcolor: '#388e3c', '&:hover': { bgcolor: '#2e7d32' } }}
                                                    disabled={isAuthLoading || !user || showAttemptPasswordInputForExamId === exam.id} // Disable if auth is loading, no user, or its password field is open
                                                >
                                                    Attempt Exam
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                    {showAttemptPasswordInputForExamId === exam.id && (
                                        <TableRow>
                                            <TableCell colSpan={4}> {/* Adjusted colspan */}
                                                <Box sx={{ p: 2, bgcolor: '#e0f7fa', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                                                    <Typography variant="body2" sx={{ mr: 1, color: '#37474f' }}>
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
                                                        sx={{ width: 200, '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                                                        onKeyPress={(e) => {
                                                            if (e.key === 'Enter' && studentAttemptPassword.trim()) {
                                                                handleVerifyAndStartExam(exam.id, exam.examPassword);
                                                            }
                                                        }}
                                                    />
                                                    <Button
                                                        variant="contained"
                                                        color="success"
                                                        onClick={() => handleVerifyAndStartExam(exam.id, exam.examPassword)}
                                                        disabled={!studentAttemptPassword.trim()}
                                                        sx={{ borderRadius: '8px', fontWeight: 'bold' }}
                                                    >
                                                        Start Exam
                                                    </Button>
                                                    <Button
                                                        variant="outlined"
                                                        color="secondary"
                                                        onClick={handleCancelAttemptPassword}
                                                        sx={{ borderRadius: '8px' }}
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

            {/* Pagination controls */}
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
                        onClick={() => setCurrentPage(prev => prev - 1)}
                        sx={{ borderRadius: "12px", borderColor: '#4CAF50', color: '#4CAF50' }}
                    >
                        Previous
                    </Button>
                    <Typography>
                        Page {currentPage} of {totalPages || 1}
                    </Typography>
                    <Button
                        variant="outlined"
                        disabled={currentPage === totalPages || totalPages === 0}
                        onClick={() => setCurrentPage(prev => prev + 1)}
                        sx={{ borderRadius: "12px", borderColor: '#4CAF50', color: '#4CAF50' }}
                    >
                        Next
                    </Button>
                </Box>
            )}

            {/* Snackbar for notifications */}
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
                        backgroundColor: snackbarSeverity === "error" ? "#ef5350" : (snackbarSeverity === "info" ? "#2196f3" : "#81c784"),
                        fontWeight: 'bold',
                        borderRadius: '8px',
                    }}
                >
                    {snackbarMessage}
                </MuiAlert>
            </Snackbar>
        </Box>
    );
};

export default StudentExamList;
