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
} from "@mui/material";
import {
    Search as SearchIcon,
    ArrowBack as ArrowBackIcon, // For back button
    PlayCircleOutline as PlayCircleOutlineIcon, // For "Attempt Exam" button
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useAuth } from '../AuthContext'; // Import useAuth to get user context

const StudentExamList = () => {
    const { user, isLoading: isAuthLoading } = useAuth(); // Get user and auth loading state
    const [exams, setExams] = useState([]);
    const [intakes, setIntakes] = useState({});
    const [snackbarMessage, setSnackbarMessage] = useState("");
    const [isSnackbarOpen, setIsSnackbarOpen] = useState(false);
    const [snackbarSeverity, setSnackbarSeverity] = useState("success");
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(true); // Loading state for exams
    const pageSize = 10;
    const navigate = useNavigate();

    // New states for inline password input for "Attempt Exam"
    const [showAttemptPasswordInputForExamId, setShowAttemptPasswordInputForExamId] = useState(null);
    const [studentAttemptPassword, setStudentAttemptPassword] = useState("");
    const [studentAttemptPasswordError, setStudentAttemptPasswordError] = useState("");

    const examsCollectionRef = collection(db, "exams");
    const intakesCollectionRef = collection(db, "intakes");

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
     * Fetches exams based on student's intake and availability status.
     */
    const fetchExams = async (studentIntakeId) => {
        setLoading(true); // Start loading
        try {
            if (!studentIntakeId) {
                setSnackbarMessage("Student intake ID not found. Cannot load exams.");
                setSnackbarSeverity("error");
                setIsSnackbarOpen(true);
                setLoading(false);
                return;
            }

            const examsQuery = query(
                examsCollectionRef,
                where("isDeleted", "==", 0), // Not soft-deleted
                where("isAvailable", "==", true), // Only available exams
                where("intakeId", "==", studentIntakeId), // Filter by student's intake
                orderBy("createdAt", "desc") // Order by creation date
            );
            const snapshot = await getDocs(examsQuery);
            const examsData = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));
            
            // Map intake IDs to names using the fetched intakesMap
            const examsWithIntakeNames = examsData.map(exam => ({
                ...exam,
                intakeName: intakes[exam.intakeId] || 'Unknown Intake'
            }));
            setExams(examsWithIntakeNames);
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
     * Effect hook to fetch exams once intakes are loaded and studentIntakeId is available.
     */
    useEffect(() => {
        // Redirect if auth is not loading and no user is present
        if (!isAuthLoading && !user) {
            navigate("/student-login");
            return;
        }

        if (Object.keys(intakes).length > 0 && user?.intake) {
            fetchExams(user.intake);
        }
    }, [intakes, user, isAuthLoading, navigate]); // Depend on intakes, user, and isAuthLoading

    /**
     * Filters exams based on the search term.
     */
    const filteredExams = exams.filter(exam =>
        exam.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (exam.intakeName && exam.intakeName.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    /**
     * Calculates total pages and slices exams for current page.
     */
    const totalPages = Math.ceil(filteredExams.length / pageSize);
    const paginatedExams = filteredExams.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
    );

    /**
     * Handles the "Attempt Exam" action, showing password input or navigating directly.
     * @param {object} exam - The exam object to attempt.
     */
    const handleAttemptExam = (exam) => {
        console.log("[StudentExamList] handleAttemptExam - Current user state:", user); // Debug log
        // CHANGED: Using user.id instead of user.uid
        if (!user?.id) { 
            setSnackbarMessage(`Authentication required to attempt exam. Please log in. (User ID: ${user?.id || 'N/A'})`); 
            setSnackbarSeverity("error");
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
            // CHANGED: Using user.id instead of user.uid
            const unlockedKey = `examUnlocked-${user.id}-${exam.id}`;
            sessionStorage.setItem(unlockedKey, 'true'); // Store access flag
            console.log(`[StudentExamList] Set sessionStorage key: ${unlockedKey} = true`); // Debug log
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
        console.log("[StudentExamList] handleVerifyAndStartExam - Current user state:", user); // Debug log
        setStudentAttemptPasswordError(""); // Clear previous error

        // CHANGED: Using user.id instead of user.uid
        if (!user?.id) {
            setSnackbarMessage(`Authentication required to verify password. Please log in again. (User ID: ${user?.id || 'N/A'})`);
            setSnackbarSeverity("error");
            setIsSnackbarOpen(true);
            return;
        }

        if (studentAttemptPassword === correctPassword) {
            // CHANGED: Using user.id instead of user.uid
            const unlockedKey = `examUnlocked-${user.id}-${examId}`;
            sessionStorage.setItem(unlockedKey, 'true'); // Store access flag
            console.log(`[StudentExamList] Set sessionStorage key: ${unlockedKey} = true after password verification`); // Debug log
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
        <Box sx={{ padding: 4, bgcolor: "#e8f5e9", minHeight: "100vh" }}>
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
            </Box>

            <TableContainer component={Paper} sx={{ boxShadow: 3 }}>
                <Table>
                    <TableHead sx={{ bgcolor: "#c8e6c9" }}>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 'bold', color: '#1b5e20' }}>Title</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', color: '#1b5e20' }}>Intake</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', color: '#1b5e20' }}>Duration (min)</TableCell>
                            {/* Removed "Created At" column */}
                            <TableCell sx={{ fontWeight: 'bold', color: '#1b5e20' }}>Actions</TableCell>
                        </TableRow>
                    </TableHead>

                    <TableBody>
                        {paginatedExams.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} align="center"> {/* Adjusted colspan */}
                                    No exams found for your intake.
                                </TableCell>
                            </TableRow>
                        ) : (
                            paginatedExams.map((exam) => (
                                <React.Fragment key={exam.id}>
                                    <TableRow
                                        sx={{ "&:hover": { bgcolor: "#f1f8e9" } }}
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
                                        {/* Removed Created At Cell */}
                                        <TableCell>
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
