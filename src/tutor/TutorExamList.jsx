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
} from "@mui/material";
import {
    Add as AddIcon,
    Visibility as VisibilityIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Search as SearchIcon,
    ArrowBack as ArrowBackIcon, // NEW: Import ArrowBackIcon
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
    const [searchTerm, setSearchTerm] = useState("");
    const navigate = useNavigate();

    const examsCollectionRef = collection(db, "exams");
    const intakesCollectionRef = collection(db, "intakes");

    const handleCloseSnackbar = () => {
        setIsSnackbarOpen(false);
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
                // Optionally set an error state here
            }
        };
        fetchIntakes();
    }, []);

    useEffect(() => {
        const fetchExams = async () => {
            if (Object.keys(intakes).length === 0 && exams.length === 0) {
                return;
            }
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
            }
        };

        fetchExams();
    }, [intakes]);


    const handleSoftDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this exam?")) {
            try {
                const examRef = doc(db, "exams", id);
                await updateDoc(examRef, { isDeleted: 1 });
                setSnackbarMessage("Exam soft-deleted successfully! 🗑️");
                setIsSnackbarOpen(true);
                handleCloseModalAndRefresh();
            } catch (error) {
                console.error("Error deleting exam:", error);
                setSnackbarMessage("Failed to soft-delete exam. ❌");
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
                console.error("Error fetching exams after modal close:", error);
                setSnackbarMessage("Failed to refresh exam list. ❌");
                setIsSnackbarOpen(true);
            }
        }, 200);
    };

    const filteredExams = exams.filter(exam =>
        exam.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (exam.intakeName && exam.intakeName.toLowerCase().includes(searchTerm.toLowerCase()))
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
                {/* NEW: Back to Dashboard Button */}
                <Button
                    variant="outlined"
                    startIcon={<ArrowBackIcon />}
                    onClick={() => navigate("/tutor-dashboard")}
                    sx={{
                        borderColor: '#4A90E2', color: '#4A90E2', borderRadius: '12px', fontWeight: 'bold',
                        '&:hover': { backgroundColor: '#E3F2FD' },
                        // Adjust margin/position if needed to align with other elements
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
                    onChange={(e) => setSearchTerm(e.target.value)}
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
                            <TableCell>Title</TableCell>
                            <TableCell>Intake</TableCell>
                            <TableCell>Duration (min)</TableCell>
                            <TableCell>Created At</TableCell>
                            <TableCell>Actions</TableCell>
                        </TableRow>
                    </TableHead>

                    <TableBody>
                        {filteredExams.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} align="center">
                                    No exams found
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredExams.map((exam) => (
                                <TableRow
                                    key={exam.id}
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
                                            color="error"
                                            onClick={() => handleSoftDelete(exam.id)}
                                            startIcon={<DeleteIcon />}
                                            sx={{ borderRadius: '8px' }}
                                        >
                                            Delete
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            <Modal
                open={openModal}
                onClose={handleCloseModalAndRefresh}
                aria-labelledby="exam-modal-title"
                aria-describedby="exam-details-or-edit-form"
            >
                <Box sx={styleModal}>
                    {(selectedExam !== null || !isEditing) && ( // Adjusted condition to allow "Create New Exam" when selectedExam is null
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
                            <TutorExamForm // Corrected component name here
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
                    severity={snackbarMessage.includes("successfully") ? "success" : "error"}
                    elevation={6}
                    variant="filled"
                    sx={{
                        backgroundColor: snackbarMessage.includes("successfully") ? "#4CAF50" : "#F44336",
                    }}
                >
                    {snackbarMessage}
                </MuiAlert>
            </Snackbar>
        </Box>
    );
};

export default TutorExamList;