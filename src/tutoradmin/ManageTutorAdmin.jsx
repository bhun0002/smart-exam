// src/tutoradmin/ManageTutorAdmin.jsx
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
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import PeopleIcon from '@mui/icons-material/People'; // Icon for managing entities
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'; // For Approve
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ArrowBackIcon from '@mui/icons-material/ArrowBack'; // For back button
import SearchIcon from '@mui/icons-material/Search';

// --- TutorForm Component ---
const TutorForm = ({ onAddTutor, onUpdateTutor, editingTutor, clearEditing, error, success }) => {
    const [name, setName] = useState(editingTutor?.name || "");
    const [email, setEmail] = useState(editingTutor?.email || "");
    const [password, setPassword] = useState(""); // Never pre-fill passwords for security
    const [localError, setLocalError] = useState("");

    useEffect(() => {
        if (editingTutor) {
            setName(editingTutor.name);
            setEmail(editingTutor.email);
            setPassword(""); // Clear password field when editing for security
        } else {
            setName("");
            setEmail("");
            setPassword("");
        }
        setLocalError(""); // Clear local error on tutor change
    }, [editingTutor]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLocalError(""); // Clear previous local errors

        if (!name.trim() || !email.trim()) {
            setLocalError("Name and Email cannot be empty.");
            return;
        }
        if (!/\S+@\S+\.\S+/.test(email)) {
            setLocalError("Please enter a valid email address.");
            return;
        }

        if (!editingTutor && !password.trim()) {
            setLocalError("Password cannot be empty for new tutors.");
            return;
        }
        if (!editingTutor && password.trim().length < 6) {
            setLocalError("Password must be at least 6 characters long.");
            return;
        }

        const tutorData = { name, email };
        if (password.trim()) { // Only update password if it's explicitly provided
            tutorData.password = password;
        }

        if (editingTutor) {
            await onUpdateTutor(editingTutor.id, tutorData);
        } else {
            await onAddTutor({ ...tutorData, password: password.trim() }); // Pass password for new tutors
        }
        
        // Clear local form state after successful submission
        setName("");
        setEmail("");
        setPassword("");
        clearEditing(); // Reset editing state in parent (which might set editingTutor to null)
    };

    return (
        <Paper elevation={3} sx={{ p: 3, borderRadius: '16px', bgcolor: '#fdfdfd', mb: 4 }}>
            <Typography variant="h6" fontWeight="bold" color="#455a64" sx={{ mb: 2 }}>
                {editingTutor ? "Edit Tutor" : "Add New Tutor"}
            </Typography>
            <form onSubmit={handleSubmit}>
                {localError && <MuiAlert severity="error" sx={{ mb: 2 }}>{localError}</MuiAlert>}
                {error && <MuiAlert severity="error" sx={{ mb: 2 }}>{error}</MuiAlert>}
                {success && <MuiAlert severity="success" sx={{ mb: 2 }}>{success}</MuiAlert>}
                <TextField
                    label="Tutor Name"
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
                    label={editingTutor ? "New Password (leave blank to keep current)" : "Password"}
                    type="password"
                    fullWidth
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    margin="normal"
                    variant="outlined"
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                />
                <Box sx={{ display: 'flex', gap: 2, mt: 3, justifyContent: 'flex-end' }}>
                    <Button
                        type="submit"
                        variant="contained"
                        startIcon={editingTutor ? <EditIcon /> : <AddCircleOutlineIcon />}
                        sx={{
                            backgroundColor: editingTutor ? '#FFB74D' : '#81C784',
                            color: editingTutor ? '#E65100' : '#1B5E20',
                            '&:hover': {
                                backgroundColor: editingTutor ? '#FF9800' : '#66BB6A',
                            },
                            borderRadius: '12px', fontWeight: 'bold'
                        }}
                    >
                        {editingTutor ? "Update Tutor" : "Add Tutor"}
                    </Button>
                    {editingTutor && (
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

// --- TutorList Component ---
const TutorList = ({ tutors, onEditTutor, onDeleteTutor, onApproveTutor, error }) => {
    const [searchTerm, setSearchTerm] = useState("");

    const filteredTutors = tutors.filter(tutor =>
        tutor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tutor.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <Paper elevation={3} sx={{ p: 3, borderRadius: '16px', bgcolor: '#fdfdfd' }}>
            <Typography variant="h6" fontWeight="bold" color="#455a64" sx={{ mb: 2 }}>
                Registered Tutors
            </Typography>
            <TextField
                label="Search Tutors"
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
            {filteredTutors.length === 0 ? (
                <Typography textAlign="center" color="text.secondary" sx={{ py: 3 }}>
                    No tutors found.
                </Typography>
            ) : (
                <TableContainer>
                    <Table>
                        <TableHead sx={{ bgcolor: '#e0f2f7' }}>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 'bold', color: '#263238' }}>Name</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', color: '#263238' }}>Email</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', color: '#263238' }}>Status</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', color: '#263238' }}>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredTutors.map((tutor) => (
                                <TableRow key={tutor.id} sx={{ '&:nth-of-type(odd)': { bgcolor: '#fcfcfc' } }}>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            <Avatar sx={{ bgcolor: '#BBDEFB', color: '#1A237E', mr: 2, width: 32, height: 32, fontSize: '0.9rem' }}>
                                                {tutor.name.charAt(0)}
                                            </Avatar>
                                            {tutor.name}
                                        </Box>
                                    </TableCell>
                                    <TableCell>{tutor.email}</TableCell>
                                    <TableCell>
                                        <Chip
                                            label={tutor.isApproved ? "Approved" : "Pending"}
                                            color={tutor.isApproved ? "success" : "warning"}
                                            size="small"
                                            sx={{ fontWeight: 'bold', borderRadius: '8px' }}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        {!tutor.isApproved && (
                                            <Button
                                                variant="outlined"
                                                size="small"
                                                startIcon={<CheckCircleOutlineIcon />}
                                                onClick={() => onApproveTutor(tutor.id, true)}
                                                sx={{ mr: 1, borderColor: '#81C784', color: '#1B5E20', borderRadius: '8px' }}
                                            >
                                                Approve
                                            </Button>
                                        )}
                                        <Button
                                            variant="outlined"
                                            size="small"
                                            startIcon={<EditIcon />}
                                            onClick={() => onEditTutor(tutor)}
                                            sx={{ mr: 1, borderColor: '#FFB74D', color: '#E65100', borderRadius: '8px' }}
                                        >
                                            Edit
                                        </Button>
                                        <Button
                                            variant="outlined"
                                            size="small"
                                            color="error"
                                            startIcon={<DeleteOutlineIcon />}
                                            onClick={() => onDeleteTutor(tutor.id)}
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


// --- ManageTutorAdmin Main Component ---
const ManageTutorAdmin = () => {
    const [tutors, setTutors] = useState([]);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [editingTutor, setEditingTutor] = useState(null); // Tutor being edited
    const [loading, setLoading] = useState(true); // Added loading state
    const navigate = useNavigate();

    const tutorsCollectionRef = collection(db, "tutors");

    const clearMessages = () => {
        setError("");
        setSuccess("");
    };

    const validateEmail = (email) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    // Fetch tutors function
    const getTutors = async () => {
        setLoading(true); // Start loading
        try {
            const q = query(
                tutorsCollectionRef,
                where("isDeleted", "==", false), // Fetch only non-deleted tutors (consistent with students)
                orderBy("createdAt", "desc")
            );
            const data = await getDocs(q);
            setTutors(data.docs.map((doc) => ({ ...doc.data(), id: doc.id })));
            clearMessages(); // Clear messages after successful fetch
        } catch (err) {
            console.error("Error fetching tutors:", err);
            setError("Failed to fetch tutors. Check console for details.");
        } finally {
            setLoading(false); // Stop loading
        }
    };

    // Effect to fetch tutors on mount
    useEffect(() => {
        getTutors();
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

    const handleAddTutor = async ({ name, email, password }) => {
        clearMessages();
        if (!name.trim() || !email.trim() || !password.trim()) {
            setError("Please fill in all fields.");
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
            const q = query(tutorsCollectionRef, where("email", "==", email));
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
                setError("A tutor with this email already exists.");
                return;
            }
            await addDoc(tutorsCollectionRef, {
                name,
                email,
                password, // NOTE: Insecure to store plaintext passwords. Hash them!
                isApproved: false, // New tutors are pending by default
                isDeleted: false,
                createdAt: serverTimestamp(),
            });
            setSuccess("Tutor added successfully! They need to be approved.");
            getTutors(); // Refresh list
        } catch (err) {
            console.error("Error adding tutor:", err);
            setError("Failed to add tutor. " + err.message);
        }
    };

    const handleUpdateTutor = async (id, updatedData) => {
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
        try {
            // Check if email is being updated to an already existing email (excluding current tutor)
            if (updatedData.email) {
                const q = query(
                    tutorsCollectionRef,
                    where("email", "==", updatedData.email),
                    where("__name__", "!=", id) // Exclude the current tutor's document
                );
                const querySnapshot = await getDocs(q);
                if (!querySnapshot.empty) {
                    setError("Another tutor with this email already exists.");
                    return;
                }
            }
            const tutorDoc = doc(db, "tutors", id);
            await updateDoc(tutorDoc, updatedData);
            setSuccess("Tutor updated successfully!");
            getTutors(); // Refresh list
            setEditingTutor(null); // Exit editing mode
        } catch (err) {
            console.error("Error updating tutor:", err);
            setError("Failed to update tutor. " + err.message);
        }
    };

    const handleApproveTutor = async (id, isApproved) => {
        clearMessages();
        try {
            const tutorDoc = doc(db, "tutors", id);
            await updateDoc(tutorDoc, { isApproved: isApproved });
            setSuccess(`Tutor ${isApproved ? 'approved' : 'unapproved'} successfully!`);
            getTutors(); // Refresh list
        } catch (err) {
            console.error("Error approving tutor:", err);
            setError("Failed to change tutor approval status. " + err.message);
        }
    };

    const handleDeleteTutor = async (id) => {
        if (window.confirm("Are you sure you want to delete this tutor?")) {
            clearMessages();
            try {
                const tutorDoc = doc(db, "tutors", id);
                await updateDoc(tutorDoc, {
                    isDeleted: true,
                    deletedAt: serverTimestamp(),
                });
                setSuccess("Tutor deleted successfully!");
                getTutors(); // Refresh list
            } catch (err) {
                console.error("Error deleting tutor:", err);
                setError("Failed to delete tutor. " + err.message);
            }
        }
    };

    return (
        <Box
            sx={{
                background: 'linear-gradient(135deg, #FFD1DC, #B2EBF2)', // Pastel gradient
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
                    maxWidth: { xs: '95%', md: 1000 }, // Adjusted max-width for consistency
                    mx: 'auto',
                    boxShadow: '0px 15px 40px rgba(0,0,0,0.1)',
                }}
            >
                {/* Header with Back Button (if navigating from higher admin) and Title */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                     <Button
                        variant="outlined"
                        startIcon={<ArrowBackIcon />}
                        onClick={() => navigate("/tutor-admin-dashboard")} // Navigate back to the new TutorAdminDashboard
                        sx={{
                            borderColor: '#673ab7', color: '#673ab7', borderRadius: '12px', fontWeight: 'bold',
                            '&:hover': { backgroundColor: '#EDE7F6' }
                        }}
                    >
                        Back to Dashboard
                    </Button>
                    <Typography variant="h4" fontWeight="bold" color="#37474f" sx={{ flexGrow: 1, textAlign: 'center' }}>
                        Manage Tutors
                    </Typography>
                    <Box sx={{ width: '150px' }} /> {/* Placeholder to balance title */}
                </Box>
                <Divider sx={{ mb: 4 }} />

                {/* Add/Edit Tutor Form */}
                <TutorForm
                    onAddTutor={handleAddTutor}
                    onUpdateTutor={handleUpdateTutor}
                    editingTutor={editingTutor}
                    clearEditing={() => setEditingTutor(null)}
                    error={error}
                    success={success}
                />

                {/* Tutor List */}
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                        <CircularProgress />
                    </Box>
                ) : error ? (
                    <MuiAlert severity="error" sx={{ mb: 2 }}>{error}</MuiAlert>
                ) : (
                    <TutorList
                        tutors={tutors}
                        onEditTutor={setEditingTutor}
                        onDeleteTutor={handleDeleteTutor}
                        onApproveTutor={handleApproveTutor}
                    />
                )}
            </Paper>

            {/* Snackbar for general notifications */}
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

export default ManageTutorAdmin;