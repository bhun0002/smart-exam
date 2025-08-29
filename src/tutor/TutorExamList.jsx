// src/tutor/TutorExamList.jsx
import React, { useEffect, useState } from "react";
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
    Modal,
    Avatar,
    Chip,
    Snackbar,
    Alert as MuiAlert,
    TextField,
    InputAdornment,
    IconButton,
} from "@mui/material";
import {
    Add as AddIcon,
    Visibility as VisibilityIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Search as SearchIcon,
    ArrowBack as ArrowBackIcon,
    Key as KeyIcon,
    CheckCircleOutline as CheckCircleOutlineIcon, // For Mark as Available button
    Block as BlockIcon, // For Mark as Unavailable button
    ContentCopy as ContentCopyIcon // For copying password
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import TutorExamForm from "./TutorExamForm"; // Ensure this path is correct

const styleModal = {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: "90%",
    maxWidth: 800,
    bgcolor: "#fefae0",
    borderRadius: 2,
    boxShadow: 24,
    p: 4,
    maxHeight: "90vh",
    overflowY: "auto",
    outline: 'none', // Important for accessibility and avoiding focus issues
};

const TutorExamList = () => {
    const [exams, setExams] = useState([]);
    const [openModal, setOpenModal] = useState(false);
    const [selectedExam, setSelectedExam] = useState(null); // Holds the exam data for the modal
    const [isEditing, setIsEditing] = useState(false);
    const [intakes, setIntakes] = useState({});
    const [snackbarMessage, setSnackbarMessage] = useState("");
    const [isSnackbarOpen, setIsSnackbarOpen] = useState(false);
    const [snackbarSeverity, setSnackbarSeverity] = useState("success");
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10;
    const navigate = useNavigate();

    // New states for inline availability management
    const [showPasswordForExamId, setShowPasswordForExamId] = useState(null); // ID of exam whose password is shown
    const [editAvailabilityForExamId, setEditAvailabilityForExamId] = useState(null); // ID of exam where inline password input is visible
    const [tempExamPassword, setTempExamPassword] = useState(""); // Value of the inline password input
    const [tempExamPasswordError, setTempExamPasswordError] = useState(""); // Error for the inline password input

    const examsCollectionRef = collection(db, "exams");
    const intakesCollectionRef = collection(db, "intakes");

    const handleCloseSnackbar = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }
        setIsSnackbarOpen(false);
        setSnackbarMessage("");
        setSnackbarSeverity("success");
    };

    const copyToClipboard = (text) => {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(() => {
                setSnackbarMessage("Password copied to clipboard!");
                setSnackbarSeverity("info");
                setIsSnackbarOpen(true);
            }).catch(err => {
                console.error("Failed to copy text: ", err);
                setSnackbarMessage("Failed to copy password. Please copy manually.");
                setSnackbarSeverity("error");
                setIsSnackbarOpen(true);
            });
        } else {
            // Fallback for browsers that don't support navigator.clipboard
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.position = 'fixed'; // Avoid scrolling to bottom
            document.body.appendChild(textarea);
            textarea.focus();
            textarea.select();
            try {
                document.execCommand('copy');
                setSnackbarMessage("Password copied to clipboard!");
                setSnackbarSeverity("info");
                setIsSnackbarOpen(true);
            } catch (err) {
                console.error("Fallback: Failed to copy text: ", err);
                setSnackbarMessage("Failed to copy password. Please copy manually.");
                setSnackbarSeverity("error");
                setIsSnackbarOpen(true);
            } finally {
                document.body.removeChild(textarea);
            }
        }
    };


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

    const fetchExams = async () => {
        try {
            const examsQuery = query(
                collection(db, "exams"),
                where("isDeleted", "==", 0),
                orderBy("createdAt", "desc")
            );
            const snapshot = await getDocs(examsQuery);
            const examsData = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));
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
        }
    };

    useEffect(() => {
        if (Object.keys(intakes).length > 0) {
            fetchExams();
        }
    }, [intakes]);


    const handleSoftDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this exam?")) {
            try {
                const examRef = doc(db, "exams", id);
                await updateDoc(examRef, { isDeleted: 1 });
                setSnackbarMessage("Exam soft-deleted successfully! 🗑️");
                setSnackbarSeverity("success");
                setIsSnackbarOpen(true);
                handleCloseModalAndRefresh();
            } catch (error) {
                console.error("Error deleting exam:", error);
                setSnackbarMessage("Failed to soft-delete exam. ❌");
                setSnackbarSeverity("error");
                setIsSnackbarOpen(true);
            }
        }
    };

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

    const handleCloseModalAndRefresh = async () => {
        setOpenModal(false);
        setTimeout(async () => {
            setSelectedExam(null);
            setIsEditing(false);
            setEditAvailabilityForExamId(null); // Clear any pending inline edit
            setShowPasswordForExamId(null); // Hide any shown password
            await fetchExams();
        }, 200);
    };

    // New: Handle toggling exam availability directly in the list
    const handleToggleExamAvailability = (examId, currentAvailabilityStatus) => {
        // If an inline password input is already open for another exam, prevent new actions
        if (editAvailabilityForExamId && editAvailabilityForExamId !== examId) {
            setSnackbarMessage("Please complete or cancel the current availability action first.");
            setSnackbarSeverity("warning");
            setIsSnackbarOpen(true);
            return;
        }

        // If currently unavailable, initiate password input for marking available
        if (!currentAvailabilityStatus) {
            setEditAvailabilityForExamId(examId);
            setTempExamPassword("");
            setTempExamPasswordError("");
        } else {
            // If currently available, mark as unavailable without password
            handleConfirmAvailabilityChange(examId, false);
        }
    };

    const handleConfirmAvailabilityChange = async (examId, newAvailabilityStatus) => {
        setTempExamPasswordError("");

        let passwordToSave = deleteField(); // Default to removing password

        if (newAvailabilityStatus) { // If marking as AVAILABLE, password is required
            if (!tempExamPassword.trim()) {
                setTempExamPasswordError("Password is required.");
                setSnackbarMessage("Password is required to make the exam available.");
                setSnackbarSeverity("error");
                setIsSnackbarOpen(true);
                return;
            }
            if (tempExamPassword.trim().length < 6) { // Example password strength check
                setTempExamPasswordError("Password must be at least 6 characters.");
                setSnackbarMessage("Password must be at least 6 characters.");
                setSnackbarSeverity("error");
                setIsSnackbarOpen(true);
                return;
            }
            passwordToSave = tempExamPassword.trim();
        }

        try {
            const examRef = doc(db, "exams", examId);
            await updateDoc(examRef, {
                isAvailable: newAvailabilityStatus,
                examPassword: passwordToSave, // Save new password or delete field
                updatedAt: serverTimestamp(),
            });

            setSnackbarMessage(`Exam successfully marked as ${newAvailabilityStatus ? 'Available' : 'Unavailable'}!`);
            setSnackbarSeverity("success");
            setIsSnackbarOpen(true);

            // Clear inline edit states
            setEditAvailabilityForExamId(null);
            setTempExamPassword("");
            setShowPasswordForExamId(null); // Hide password if it was revealed

            fetchExams(); // Refresh list to reflect changes
        } catch (error) {
            console.error("Error updating exam availability:", error);
            setSnackbarMessage("Failed to update exam availability. ❌");
            setSnackbarSeverity("error");
            setIsSnackbarOpen(true);
        }
    };

    const handleCancelAvailabilityEdit = () => {
        setEditAvailabilityForExamId(null);
        setTempExamPassword("");
        setTempExamPasswordError("");
    };

    const handleTogglePasswordVisibility = (examId) => {
        setShowPasswordForExamId(prevId => prevId === examId ? null : examId);
    };


    const filteredExams = exams.filter(exam =>
        exam.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (exam.intakeName && exam.intakeName.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const totalPages = Math.ceil(filteredExams.length / pageSize);
    const paginatedExams = filteredExams.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
    );

    return (
        <Box sx={{ padding: 4, bgcolor: "#f7f5f2", minHeight: "100vh" }}>
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
                <Button
                    variant="outlined"
                    startIcon={<ArrowBackIcon />}
                    onClick={() => navigate("/tutor-dashboard")}
                    sx={{
                        borderColor: '#4A90E2', color: '#4A90E2', borderRadius: '12px', fontWeight: 'bold',
                        '&:hover': { backgroundColor: '#E3F2FD' },
                    }}
                >
                    Back to Dashboard
                </Button>

                <Typography variant="h4" sx={{ color: "#5d5c61", flexGrow: 1, textAlign: 'center' }}>
                    Exams List
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
                        sx: { borderRadius: '12px' }
                    }}
                    sx={{ flexGrow: 1, maxWidth: 300 }}
                />
                <Button
                    variant="contained"
                    sx={{
                        bgcolor: "#a8dadc",
                        color: "#1d3557",
                        "&:hover": { bgcolor: "#81c0c2" },
                        borderRadius: '12px',
                    }}
                    onClick={() => handleView(null)}
                    startIcon={<AddIcon />}
                >
                    Add Exam
                </Button>
            </Box>

            <TableContainer component={Paper} sx={{ boxShadow: 3 }}>
                <Table>
                    <TableHead sx={{ bgcolor: "#ffd6a5" }}>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 'bold' }}>Title</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Intake</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Duration (min)</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Availability</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Password</TableCell> {/* New column for password */}
                            <TableCell sx={{ fontWeight: 'bold' }}>Created At</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                        </TableRow>
                    </TableHead>

                    <TableBody>
                        {paginatedExams.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} align="center"> {/* Adjusted colspan */}
                                    No exams found
                                </TableCell>
                            </TableRow>
                        ) : (
                            paginatedExams.map((exam) => (
                                <React.Fragment key={exam.id}>
                                    <TableRow
                                        sx={{ "&:hover": { bgcolor: "#f1f1f1" } }}
                                    >
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                <Avatar sx={{ bgcolor: '#BBDEFB', color: '#1A237E', mr: 2, width: 32, height: 32, fontSize: '0.9rem' }}>
                                                    {exam.title.charAt(0)}
                                                </Avatar>
                                                {exam.title}
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Chip label={exam.intakeName} color="info" size="small" sx={{ borderRadius: '8px', fontWeight: 'bold' }} />
                                        </TableCell>
                                        <TableCell>{exam.duration || 'N/A'}</TableCell>
                                        <TableCell>
                                            <Chip
                                                label={exam.isAvailable ? "Available" : "Unavailable"}
                                                color={exam.isAvailable ? "success" : "error"}
                                                size="small"
                                                sx={{ fontWeight: 'bold', borderRadius: '8px' }}
                                            />
                                        </TableCell>
                                        <TableCell> {/* New cell for Password display */}
                                            {exam.examPassword ? (
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                                                        {showPasswordForExamId === exam.id ? exam.examPassword : '********'}
                                                    </Typography>
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleTogglePasswordVisibility(exam.id)}
                                                        color="info"
                                                    >
                                                        <VisibilityIcon fontSize="small" />
                                                    </IconButton>
                                                     <IconButton
                                                        size="small"
                                                        onClick={() => copyToClipboard(exam.examPassword)}
                                                        color="primary"
                                                    >
                                                        <ContentCopyIcon fontSize="small" />
                                                    </IconButton>
                                                </Box>
                                            ) : (
                                                <Chip label="N/A" size="small" color="default" sx={{ borderRadius: '8px' }} />
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {exam.createdAt
                                                ? new Date(exam.createdAt.seconds * 1000).toLocaleDateString()
                                                : "-"}
                                        </TableCell>
                                        <TableCell>
                                            <Button
                                                size="small"
                                                variant="outlined"
                                                sx={{ mr: 1, borderRadius: '8px' }}
                                                onClick={() => handleView(exam)}
                                                startIcon={<VisibilityIcon />}
                                            >
                                                View
                                            </Button>
                                            <Button
                                                size="small"
                                                variant="outlined"
                                                sx={{ mr: 1, borderColor: "#ffc107", color: "#ffc107", borderRadius: '8px' }}
                                                onClick={() => handleEdit(exam)}
                                                startIcon={<EditIcon />}
                                            >
                                                Edit
                                            </Button>
                                            <Button
                                                size="small"
                                                variant="outlined"
                                                color={exam.isAvailable ? "error" : "success"}
                                                onClick={() => handleToggleExamAvailability(exam.id, exam.isAvailable)}
                                                startIcon={exam.isAvailable ? <BlockIcon /> : <CheckCircleOutlineIcon />}
                                                sx={{ mr: 1, borderRadius: '8px' }}
                                                disabled={!!editAvailabilityForExamId && editAvailabilityForExamId !== exam.id}
                                            >
                                                {exam.isAvailable ? "Mark Unavailable" : "Mark Available"}
                                            </Button>
                                            <Button
                                                size="small"
                                                variant="outlined"
                                                color="error"
                                                onClick={() => handleSoftDelete(exam.id)}
                                                startIcon={<DeleteIcon />}
                                                sx={{ borderRadius: '8px' }}
                                            >
                                                Delete
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                    {editAvailabilityForExamId === exam.id && (
                                        <TableRow>
                                            <TableCell colSpan={7}> {/* Adjusted colspan for password input row */}
                                                <Box sx={{ p: 2, bgcolor: '#e0f7fa', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                                                    <Typography variant="body2" sx={{ mr: 1 }}>
                                                        Enter password to make exam available:
                                                    </Typography>
                                                    <TextField
                                                        autoFocus
                                                        size="small"
                                                        label="Exam Password"
                                                        type="password"
                                                        value={tempExamPassword}
                                                        onChange={(e) => setTempExamPassword(e.target.value)}
                                                        error={!!tempExamPasswordError}
                                                        helperText={tempExamPasswordError}
                                                        sx={{ width: 200, '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                                                        onKeyPress={(e) => {
                                                            if (e.key === 'Enter' && tempExamPassword.trim()) {
                                                                handleConfirmAvailabilityChange(exam.id, true);
                                                            }
                                                        }}
                                                    />
                                                    <Button
                                                        variant="contained"
                                                        color="success"
                                                        onClick={() => handleConfirmAvailabilityChange(exam.id, true)}
                                                        disabled={!tempExamPassword.trim()}
                                                        sx={{ borderRadius: '8px', fontWeight: 'bold' }}
                                                    >
                                                        Confirm
                                                    </Button>
                                                    <Button
                                                        variant="outlined"
                                                        color="secondary"
                                                        onClick={handleCancelAvailabilityEdit}
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
                    sx={{ borderRadius: "12px" }}
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
                    sx={{ borderRadius: "12px" }}
                >
                    Next
                </Button>
            </Box>

            <Modal
                open={openModal}
                onClose={handleCloseModalAndRefresh}
                aria-labelledby="exam-modal-title"
                aria-describedby="exam-details-or-edit-form"
            >
                <Box sx={styleModal}>
                    {(selectedExam !== null || !isEditing) && (
                        <>
                            <Typography
                                variant="h5"
                                sx={{ mb: 2, color: "#457b9d" }}
                                id="exam-modal-title"
                            >
                                {selectedExam?.id
                                    ? (isEditing ? `Edit: ${selectedExam.title}` : `View: ${selectedExam.title}`)
                                    : "Create New Exam"}
                            </Typography>
                            <TutorExamForm
                                examData={selectedExam?.id ? selectedExam : null}
                                readonly={!isEditing && selectedExam?.id !== undefined}
                                onSaveSuccess={handleCloseModalAndRefresh}
                            />
                            <Button
                                sx={{ mt: 2 }}
                                onClick={handleCloseModalAndRefresh}
                                variant="contained"
                                color="primary"
                            >
                                Close
                            </Button>
                        </>
                    )}
                </Box>
            </Modal>

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

export default TutorExamList;
