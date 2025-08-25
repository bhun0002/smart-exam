// src/tutor/ManageStudents.jsx
import React, { useState, useEffect } from "react";
import { db } from "../firebaseConfig";
import {
    collection,
    addDoc,
    getDocs,
    updateDoc,
    doc,
    serverTimestamp,
    query,
    orderBy,
    where,
} from "firebase/firestore";
import {
    Box,
    Typography,
    Button,
    Paper,
    Divider,
    Snackbar,
    Alert as MuiAlert,
    TextField,
    InputAdornment,
    CircularProgress,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Avatar,
    Chip,
    FormControl, // NEW: For the Select dropdown
    InputLabel, // NEW: For the Select dropdown label
    Select, // NEW: For the dropdown
    MenuItem, // NEW: For dropdown options
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import PeopleIcon from '@mui/icons-material/People';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'; // For Approve
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ArrowBackIcon from '@mui/icons-material/ArrowBack'; // For back button
import SearchIcon from '@mui/icons-material/Search';

// --- StudentForm Component ---
const StudentForm = ({ onAddStudent, onUpdateStudent, editingStudent, clearEditing, error, success, intakes }) => {
    const [name, setName] = useState(editingStudent?.name || "");
    const [email, setEmail] = useState(editingStudent?.email || "");
    const [password, setPassword] = useState(""); // Never pre-fill passwords for security
    const [selectedIntakeId, setSelectedIntakeId] = useState(editingStudent?.intakeId || ""); // NEW: For intake selection
    const [localError, setLocalError] = useState("");

    useEffect(() => {
        if (editingStudent) {
            setName(editingStudent.name);
            setEmail(editingStudent.email);
            setSelectedIntakeId(editingStudent.intakeId || ""); // Set selected intake for editing
            setPassword(""); // Clear password field when editing
        } else {
            setName("");
            setEmail("");
            setPassword("");
            setSelectedIntakeId(""); // Clear intake selection for new student
        }
        setLocalError(""); // Clear local error on student change
    }, [editingStudent]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLocalError(""); // Clear previous local errors

        if (!name.trim() || !email.trim() || !selectedIntakeId) { // NEW: Validate intake selection
            setLocalError("Name, Email, and Intake cannot be empty.");
            return;
        }
        if (!/\S+@\S+\.\S+/.test(email)) {
            setLocalError("Please enter a valid email address.");
            return;
        }

        if (!editingStudent && !password.trim()) {
            setLocalError("Password cannot be empty for new students.");
            return;
        }
        if (!editingStudent && password.trim().length < 6) {
            setLocalError("Password must be at least 6 characters long.");
            return;
        }

        const studentData = { name, email, intakeId: selectedIntakeId }; // NEW: Include intakeId
        if (password.trim()) { // Only update password if it's explicitly provided
            studentData.password = password;
        }

        if (editingStudent) {
            await onUpdateStudent(editingStudent.id, studentData);
        } else {
            await onAddStudent({ ...studentData, password: password.trim() }); // Pass password for new students
        }
        clearEditing(); // Reset form and editing state
        // Explicitly reset local form states after successful submission
        setName("");
        setEmail("");
        setPassword("");
        setSelectedIntakeId(""); // NEW: Clear intake selection after submission
    };

    return (
        <Paper elevation={3} sx={{ p: 3, borderRadius: '16px', bgcolor: '#fdfdfd', mb: 4 }}>
            <Typography variant="h6" fontWeight="bold" color="#455a64" sx={{ mb: 2 }}>
                {editingStudent ? "Edit Student" : "Add New Student"}
            </Typography>
            <form onSubmit={handleSubmit}>
                {localError && <MuiAlert severity="error" sx={{ mb: 2 }}>{localError}</MuiAlert>}
                {error && <MuiAlert severity="error" sx={{ mb: 2 }}>{error}</MuiAlert>}
                {success && <MuiAlert severity="success" sx={{ mb: 2 }}>{success}</MuiAlert>}
                <TextField
                    label="Student Name"
                    fullWidth
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    margin="normal"
                    variant="outlined"
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                />
                <TextField
                    label="Email"
                    type="email"
                    fullWidth
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    margin="normal"
                    variant="outlined"
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                />
                <TextField
                    label={editingStudent ? "New Password (leave blank to keep current)" : "Password"}
                    type="password"
                    fullWidth
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    margin="normal"
                    variant="outlined"
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                />
                {/* NEW: Intake Dropdown */}
                <FormControl fullWidth margin="normal" sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}>
                    <InputLabel id="intake-select-label">Intake</InputLabel>
                    <Select
                        labelId="intake-select-label"
                        id="intake-select"
                        value={selectedIntakeId}
                        label="Intake"
                        onChange={(e) => setSelectedIntakeId(e.target.value)}
                    >
                        <MenuItem value="">
                            <em>Select an Intake</em>
                        </MenuItem>
                        {intakes.map((intake) => (
                            <MenuItem key={intake.id} value={intake.id}>
                                {intake.name}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
                
                <Box sx={{ display: 'flex', gap: 2, mt: 3, justifyContent: 'flex-end' }}>
                    <Button
                        type="submit"
                        variant="contained"
                        startIcon={editingStudent ? <EditIcon /> : <AddCircleOutlineIcon />}
                        sx={{
                            backgroundColor: editingStudent ? '#FFB74D' : '#81C784',
                            color: editingStudent ? '#E65100' : '#1B5E20',
                            '&:hover': {
                                backgroundColor: editingStudent ? '#FF9800' : '#66BB6A',
                            },
                            borderRadius: '12px', fontWeight: 'bold'
                        }}
                    >
                        {editingStudent ? "Update Student" : "Add Student"}
                    </Button>
                    {editingStudent && (
                        <Button
                            variant="outlined"
                            onClick={clearEditing}
                            sx={{
                                borderColor: '#90A4AE', color: '#455a64', borderRadius: '12px', fontWeight: 'bold',
                                '&:hover': { borderColor: '#78909C', color: '#263238' }
                            }}
                        >
                            Cancel
                        </Button>
                    )}
                </Box>
            </form>
        </Paper>
    );
};

// --- StudentList Component ---
const StudentList = ({ students, onEditStudent, onDeleteStudent, onApproveStudent, error }) => {
    const [searchTerm, setSearchTerm] = useState("");

    const filteredStudents = students.filter(student =>
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (student.intakeName && student.intakeName.toLowerCase().includes(searchTerm.toLowerCase())) // NEW: Search by intake name
    );

    return (
        <Paper elevation={3} sx={{ p: 3, borderRadius: '16px', bgcolor: '#fdfdfd' }}>
            <Typography variant="h6" fontWeight="bold" color="#455a64" sx={{ mb: 2 }}>
                Registered Students
            </Typography>
            <TextField
                label="Search Students"
                variant="outlined"
                size="small"
                fullWidth
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
                sx={{ mb: 3 }}
            />
            {error && <MuiAlert severity="error" sx={{ mb: 2 }}>{error}</MuiAlert>}
            {filteredStudents.length === 0 ? (
                <Typography textAlign="center" color="text.secondary" sx={{ py: 3 }}>
                    No students found.
                </Typography>
            ) : (
                <TableContainer>
                    <Table>
                        <TableHead sx={{ bgcolor: '#e0f2f7' }}>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 'bold', color: '#263238' }}>Name</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', color: '#263238' }}>Email</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', color: '#263238' }}>Intake</TableCell> {/* NEW: Intake Column */}
                                <TableCell sx={{ fontWeight: 'bold', color: '#263238' }}>Status</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', color: '#263238' }}>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredStudents.map((student) => (
                                <TableRow key={student.id} sx={{ '&:nth-of-type(odd)': { bgcolor: '#fcfcfc' } }}>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            <Avatar sx={{ bgcolor: '#BBDEFB', color: '#1A237E', mr: 2, width: 32, height: 32, fontSize: '0.9rem' }}>
                                                {student.name.charAt(0)}
                                            </Avatar>
                                            {student.name}
                                        </Box>
                                    </TableCell>
                                    <TableCell>{student.email}</TableCell>
                                    <TableCell>
                                        <Chip
                                            label={student.intakeName || "N/A"} // NEW: Display intake name
                                            size="small"
                                            sx={{ bgcolor: '#BBDEFB', color: '#1A237E', fontWeight: 'bold', borderRadius: '8px' }}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={student.isApproved ? "Approved" : "Pending"}
                                            color={student.isApproved ? "success" : "warning"}
                                            size="small"
                                            sx={{ fontWeight: 'bold', borderRadius: '8px' }}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        {!student.isApproved && (
                                            <Button
                                                variant="outlined"
                                                size="small"
                                                startIcon={<CheckCircleOutlineIcon />}
                                                onClick={() => onApproveStudent(student.id, true)}
                                                sx={{ mr: 1, borderColor: '#81C784', color: '#1B5E20', borderRadius: '8px' }}
                                            >
                                                Approve
                                            </Button>
                                        )}
                                        <Button
                                            variant="outlined"
                                            size="small"
                                            startIcon={<EditIcon />}
                                            onClick={() => onEditStudent(student)}
                                            sx={{ mr: 1, borderColor: '#FFB74D', color: '#E65100', borderRadius: '8px' }}
                                        >
                                            Edit
                                        </Button>
                                        <Button
                                            variant="outlined"
                                            size="small"
                                            color="error"
                                            startIcon={<DeleteOutlineIcon />}
                                            onClick={() => onDeleteStudent(student.id)}
                                            sx={{ borderRadius: '8px' }}
                                        >
                                            Delete
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}
        </Paper>
    );
};


// --- ManageStudents Main Component ---
const ManageStudents = () => {
    const [students, setStudents] = useState([]);
    const [intakes, setIntakes] = useState([]); // NEW: State to store intakes
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [editingStudent, setEditingStudent] = useState(null); // Student being edited
    const [loading, setLoading] = useState(true); // Added loading state
    const navigate = useNavigate();

    const studentsCollectionRef = collection(db, "students");
    const intakesCollectionRef = collection(db, "intakes"); // NEW: Reference to intakes collection

    const clearMessages = () => {
        setError("");
        setSuccess("");
    };

    const validateEmail = (email) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    // NEW: Fetch intakes function
    const getIntakes = async () => {
        try {
            const q = query(intakesCollectionRef, orderBy("name", "asc"));
            const data = await getDocs(q);
            setIntakes(data.docs.map(doc => ({ ...doc.data(), id: doc.id })));
        } catch (err) {
            console.error("Error fetching intakes:", err);
            // Don't set global error here, let student fetch handle it or keep it separate
        }
    };

    // Fetch students function
    const getStudents = async () => {
        setLoading(true); // Start loading
        try {
            // Ensure intakes are fetched before students for mapping
            const intakesData = await getDocs(query(intakesCollectionRef, orderBy("name", "asc")));
            const fetchedIntakes = intakesData.docs.map(doc => ({ ...doc.data(), id: doc.id }));
            setIntakes(fetchedIntakes); // Update state for form as well

            const q = query(
                studentsCollectionRef,
                where("isDeleted", "==", false), // Fetch only non-deleted students
                orderBy("createdAt", "desc")
            );
            const data = await getDocs(q);
            
            const fetchedStudents = data.docs.map((studentDoc) => {
                const studentData = studentDoc.data();
                // Map intake name for display
                const intake = fetchedIntakes.find(int => int.id === studentData.intakeId);
                return {
                    ...studentData,
                    id: studentDoc.id,
                    intakeName: intake ? intake.name : "Unknown Intake" // NEW: Add intakeName
                };
            });
            setStudents(fetchedStudents);
            clearMessages(); // Clear messages after successful fetch
        } catch (err) {
            console.error("Error fetching students or intakes:", err);
            setError("Failed to fetch student data or available intakes. Check console for details.");
        } finally {
            setLoading(false); // Stop loading
        }
    };

    // Effect to fetch data on mount
    useEffect(() => {
        getStudents(); // This now fetches both students and intakes
    }, []);

    // Effect to clear success messages after a delay
    useEffect(() => {
        if (success) {
            const timer = setTimeout(() => {
                setSuccess("");
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [success]);


    const handleAddStudent = async ({ name, email, password, intakeId }) => { // NEW: Expect intakeId
        clearMessages();
        if (!name.trim() || !email.trim() || !password.trim() || !intakeId) {
            setError("Please fill in all required fields, including Intake.");
            return;
        }
        if (!validateEmail(email)) {
            setError("Please enter a valid email address.");
            return;
        }
        if (password.length < 6) {
            setError("Password must be at least 6 characters long.");
            return;
        }

        try {
            const q = query(studentsCollectionRef, where("email", "==", email));
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
                setError("A student with this email already exists.");
                return;
            }
            await addDoc(studentsCollectionRef, {
                name,
                email,
                password, // NOTE: Insecure to store plaintext passwords. Hash them!
                intakeId, // NEW: Save intakeId
                isApproved: false, // New students are pending by default
                isDeleted: false,
                createdAt: serverTimestamp(),
            });
            setSuccess("Student added successfully! They need to be approved.");
            getStudents(); // Refresh list
        } catch (err) {
            console.error("Error adding student:", err);
            setError("Failed to add student. " + err.message);
        }
    };

    const handleUpdateStudent = async (id, updatedData) => { // NEW: Expect intakeId
        clearMessages();
        if (updatedData.name && !updatedData.name.trim()) {
            setError("Name cannot be empty.");
            return;
        }
        if (
            updatedData.email &&
            (!updatedData.email.trim() || !validateEmail(updatedData.email))
        ) {
            setError("Please enter a valid email address.");
            return;
        }
        if (updatedData.password && updatedData.password.length < 6) {
            setError("Password must be at least 6 characters long.");
            return;
        }
        if (updatedData.intakeId && !updatedData.intakeId.trim()) { // NEW: Validate intakeId on update
             setError("Intake cannot be empty.");
             return;
        }

        try {
            // Check if email is being updated to an already existing email (excluding current student)
            if (updatedData.email) {
                const q = query(
                    studentsCollectionRef,
                    where("email", "==", updatedData.email),
                    where("__name__", "!=", id) // Exclude the current student's document
                );
                const querySnapshot = await getDocs(q);
                if (!querySnapshot.empty) {
                    setError("Another student with this email already exists.");
                    return;
                }
            }
            const studentDoc = doc(db, "students", id);
            await updateDoc(studentDoc, updatedData);
            setSuccess("Student updated successfully!");
            getStudents(); // Refresh list
            setEditingStudent(null); // Exit editing mode
        } catch (err) {
            console.error("Error updating student:", err);
            setError("Failed to update student. " + err.message);
        }
    };

    const handleApproveStudent = async (id, isApproved) => {
        clearMessages();
        try {
            const studentDoc = doc(db, "students", id);
            await updateDoc(studentDoc, { isApproved: isApproved });
            setSuccess(`Student ${isApproved ? 'approved' : 'unapproved'} successfully!`);
            getStudents(); // Refresh list
        } catch (err) {
            console.error("Error approving student:", err);
            setError("Failed to change student approval status. " + err.message);
        }
    };


    const handleDeleteStudent = async (id) => {
        if (window.confirm("Are you sure you want to delete this student?")) {
            clearMessages();
            try {
                const studentDoc = doc(db, "students", id);
                await updateDoc(studentDoc, {
                    isDeleted: true,
                    deletedAt: serverTimestamp(),
                });
                setSuccess("Student deleted successfully!");
                getStudents(); // Refresh list
            } catch (err) {
                console.error("Error deleting student:", err);
                setError("Failed to delete student. " + err.message);
            }
        }
    };

    return (
        <Box
            sx={{
                background: 'linear-gradient(135deg, #A7C7E7, #D9E9F7)', // Student-themed gradient
                minHeight: '100vh',
                padding: '32px 0',
                fontFamily: 'Roboto, sans-serif',
            }}
        >
            <Paper
                elevation={12}
                sx={{
                    padding: { xs: 3, md: 5 },
                    borderRadius: '24px',
                    backgroundColor: '#ffffff',
                    maxWidth: { xs: '95%', md: 1000 },
                    mx: 'auto',
                    boxShadow: '0px 15px 40px rgba(0,0,0,0.1)',
                }}
            >
                {/* Header with Back Button */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                    <Button
                        variant="outlined"
                        startIcon={<ArrowBackIcon />}
                        onClick={() => navigate("/tutor-dashboard")}
                        sx={{
                            borderColor: '#4A90E2', color: '#4A90E2', borderRadius: '12px', fontWeight: 'bold',
                            '&:hover': { backgroundColor: '#E3F2FD' }
                        }}
                    >
                        Back to Dashboard
                    </Button>
                    <Typography variant="h4" fontWeight="bold" color="#1A237E" sx={{ flexGrow: 1, textAlign: 'center' }}>
                        Manage Students
                    </Typography>
                    <Box sx={{ width: '150px' }} /> {/* Placeholder to balance title */}
                </Box>
                <Divider sx={{ mb: 4 }} />

                {/* Add/Edit Student Form */}
                <StudentForm
                    onAddStudent={handleAddStudent}
                    onUpdateStudent={handleUpdateStudent}
                    editingStudent={editingStudent}
                    clearEditing={() => setEditingStudent(null)}
                    error={error}
                    success={success}
                    intakes={intakes} // NEW: Pass intakes to the form
                />

                {/* Student List */}
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                        <CircularProgress />
                    </Box>
                ) : error ? (
                    <MuiAlert severity="error" sx={{ mb: 2 }}>{error}</MuiAlert>
                ) : (
                    <StudentList
                        students={students}
                        onEditStudent={setEditingStudent} // Pass setEditingStudent to load data into form
                        onDeleteStudent={handleDeleteStudent}
                        onApproveStudent={handleApproveStudent}
                    />
                )}
            </Paper>
            <Snackbar
                open={!!(error || success)}
                autoHideDuration={5000}
                onClose={clearMessages}
                anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
            >
                <MuiAlert
                    onClose={clearMessages}
                    severity={error ? "error" : "success"}
                    elevation={6}
                    variant="filled"
                    sx={{ backgroundColor: error ? "#F44336" : "#4CAF50" }}
                >
                    {error || success}
                </MuiAlert>
            </Snackbar>
        </Box>
    );
};

export default ManageStudents;