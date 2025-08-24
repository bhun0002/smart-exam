// src/admin/ManageAdmins.jsx
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
    Checkbox,
    FormControlLabel
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import PeopleIcon from '@mui/icons-material/People';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'; // For Approve
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ArrowBackIcon from '@mui/icons-material/ArrowBack'; // For back button
import SearchIcon from '@mui/icons-material/Search';

// --- AdminForm Component ---
const AdminForm = ({ onAddAdmin, onUpdateAdmin, editingAdmin, clearEditing, error, success }) => {
    const [name, setName] = useState(editingAdmin?.name || "");
    const [email, setEmail] = useState(editingAdmin?.email || "");
    const [password, setPassword] = useState("");
    const [isMasterAdmin, setIsMasterAdmin] = useState(editingAdmin?.isMasterAdmin || false);
    const [isTutorAdmin, setIsTutorAdmin] = useState(editingAdmin?.isTutorAdmin || false);
    const [localError, setLocalError] = useState("");

    useEffect(() => {
        if (editingAdmin) {
            setName(editingAdmin.name);
            setEmail(editingAdmin.email);
            setIsMasterAdmin(editingAdmin.isMasterAdmin);
            setIsTutorAdmin(editingAdmin.isTutorAdmin);
            setPassword(""); // Clear password field when editing for security
        } else {
            setName("");
            setEmail("");
            setPassword("");
            setIsMasterAdmin(false);
            setIsTutorAdmin(false);
        }
        setLocalError(""); // Clear local error on admin change
    }, [editingAdmin]);

    const validateEmail = (emailToCheck) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailToCheck);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLocalError("");

        if (!name.trim() || !email.trim()) {
            setLocalError("Name and Email cannot be empty.");
            return;
        }
        if (!validateEmail(email)) {
            setLocalError("Please enter a valid email address.");
            return;
        }
        if (!editingAdmin && !password.trim()) {
            setLocalError("Password cannot be empty for new admins.");
            return;
        }
        if (!editingAdmin && password.trim().length < 6) {
            setLocalError("Password must be at least 6 characters long.");
            return;
        }

        const adminData = { name, email, isMasterAdmin, isTutorAdmin };
        if (password.trim()) {
            adminData.password = password; // Should be hashed in a real app
        }

        if (editingAdmin) {
            await onUpdateAdmin(editingAdmin.id, adminData);
        } else {
            await onAddAdmin({ ...adminData, password: password.trim() });
        }
        
        // Clear local form states after successful submission
        setName("");
        setEmail("");
        setPassword("");
        setIsMasterAdmin(false);
        setIsTutorAdmin(false);
        clearEditing(); // Reset editing state in parent
    };

    return (
        <Paper elevation={3} sx={{ p: 3, borderRadius: '16px', bgcolor: '#fdfdfd', mb: 4 }}>
            <Typography variant="h6" fontWeight="bold" color="#455a64" sx={{ mb: 2 }}>
                {editingAdmin ? "Edit Admin" : "Add New Admin"}
            </Typography>
            <form onSubmit={handleSubmit}>
                {localError && <MuiAlert severity="error" sx={{ mb: 2 }}>{localError}</MuiAlert>}
                {error && <MuiAlert severity="error" sx={{ mb: 2 }}>{error}</MuiAlert>}
                {success && <MuiAlert severity="success" sx={{ mb: 2 }}>{success}</MuiAlert>}
                <TextField
                    label="Admin Name"
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
                    label={editingAdmin ? "New Password (leave blank to keep current)" : "Password"}
                    type="password"
                    fullWidth
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    margin="normal"
                    variant="outlined"
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                />
                <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                    <FormControlLabel
                        control={<Checkbox checked={isMasterAdmin} onChange={(e) => setIsMasterAdmin(e.target.checked)} />}
                        label="Master Admin"
                    />
                    <FormControlLabel
                        control={<Checkbox checked={isTutorAdmin} onChange={(e) => setIsTutorAdmin(e.target.checked)} />}
                        label="Tutor Admin"
                    />
                </Box>
                <Box sx={{ display: 'flex', gap: 2, mt: 3, justifyContent: 'flex-end' }}>
                    <Button
                        type="submit"
                        variant="contained"
                        startIcon={editingAdmin ? <EditIcon /> : <AddCircleOutlineIcon />}
                        sx={{
                            backgroundColor: editingAdmin ? '#FFB74D' : '#81C784',
                            color: editingAdmin ? '#E65100' : '#1B5E20',
                            '&:hover': { backgroundColor: editingAdmin ? '#FF9800' : '#66BB6A' },
                            borderRadius: '12px', fontWeight: 'bold'
                        }}
                    >
                        {editingAdmin ? "Update Admin" : "Add Admin"}
                    </Button>
                    {editingAdmin && (
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

// --- AdminList Component ---
const AdminList = ({ admins, onEditAdmin, onDeleteAdmin, onApproveAdmin, error }) => {
    const [searchTerm, setSearchTerm] = useState("");

    const filteredAdmins = admins.filter(admin =>
        admin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        admin.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <Paper elevation={3} sx={{ p: 3, borderRadius: '16px', bgcolor: '#fdfdfd' }}>
            <Typography variant="h6" fontWeight="bold" color="#455a64" sx={{ mb: 2 }}>
                Registered Admins
            </Typography>
            <TextField
                label="Search Admins"
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
            {filteredAdmins.length === 0 ? (
                <Typography textAlign="center" color="text.secondary" sx={{ py: 3 }}>
                    No admins found.
                </Typography>
            ) : (
                <TableContainer>
                    <Table>
                        <TableHead sx={{ bgcolor: '#e0f2f7' }}>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 'bold', color: '#263238' }}>Name</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', color: '#263238' }}>Email</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', color: '#263238' }}>Roles</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', color: '#263238' }}>Status</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', color: '#263238' }}>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredAdmins.map((admin) => (
                                <TableRow key={admin.id} sx={{ '&:nth-of-type(odd)': { bgcolor: '#fcfcfc' } }}>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            <Avatar sx={{ bgcolor: '#BBDEFB', color: '#1A237E', mr: 2, width: 32, height: 32, fontSize: '0.9rem' }}>
                                                {admin.name.charAt(0)}
                                            </Avatar>
                                            {admin.name}
                                        </Box>
                                    </TableCell>
                                    <TableCell>{admin.email}</TableCell>
                                    <TableCell>
                                        {admin.isMasterAdmin && <Chip label="Master" size="small" sx={{ mr: 1, bgcolor: '#FFC107', color: '#000', fontWeight: 'bold', borderRadius: '8px' }} />}
                                        {admin.isTutorAdmin && <Chip label="Tutor Admin" size="small" sx={{ bgcolor: '#03A9F4', color: '#fff', fontWeight: 'bold', borderRadius: '8px' }} />}
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={admin.isApproved ? "Approved" : "Pending"}
                                            color={admin.isApproved ? "success" : "warning"}
                                            size="small"
                                            sx={{ fontWeight: 'bold', borderRadius: '8px' }}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        {!admin.isApproved && (
                                            <Button
                                                variant="outlined"
                                                size="small"
                                                startIcon={<CheckCircleOutlineIcon />}
                                                onClick={() => onApproveAdmin(admin.id, true)}
                                                sx={{ mr: 1, borderColor: '#81C784', color: '#1B5E20', borderRadius: '8px' }}
                                            >
                                                Approve
                                            </Button>
                                        )}
                                        <Button
                                            variant="outlined"
                                            size="small"
                                            startIcon={<EditIcon />}
                                            onClick={() => onEditAdmin(admin)}
                                            sx={{ mr: 1, borderColor: '#FFB74D', color: '#E65100', borderRadius: '8px' }}
                                        >
                                            Edit
                                        </Button>
                                        <Button
                                            variant="outlined"
                                            size="small"
                                            color="error"
                                            startIcon={<DeleteOutlineIcon />}
                                            onClick={() => onDeleteAdmin(admin.id)}
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


// --- ManageAdmins Main Component ---
const ManageAdmins = () => {
    const [admins, setAdmins] = useState([]);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [editingAdmin, setEditingAdmin] = useState(null); // Admin being edited
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const adminsCollectionRef = collection(db, "admins");

    const clearMessages = () => {
        setError("");
        setSuccess("");
    };

    const validateEmail = (emailToCheck) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailToCheck);
    };

    // Fetch admins function
    const getAdmins = async () => {
        setLoading(true);
        try {
            const q = query(
                adminsCollectionRef,
                where("isDeleted", "==", false),
                orderBy("createdAt", "desc")
            );
            const data = await getDocs(q);
            setAdmins(data.docs.map((doc) => ({ ...doc.data(), id: doc.id })));
            clearMessages();
        } catch (err) {
            console.error("Error fetching admins:", err);
            setError("Failed to fetch admins. Check console for details.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        getAdmins();
    }, []);

    useEffect(() => {
        if (success) {
            const timer = setTimeout(() => {
                setSuccess("");
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [success]);

    const handleAddAdmin = async ({ name, email, password, isMasterAdmin, isTutorAdmin }) => {
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
            const q = query(adminsCollectionRef, where("email", "==", email));
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
                setError("An admin with this email already exists.");
                return;
            }
            await addDoc(adminsCollectionRef, {
                name,
                email,
                password, // NOTE: Insecure to store plaintext passwords. Hash them!
                isApproved: false,
                isDeleted: false,
                isMasterAdmin,
                isTutorAdmin,
                createdAt: serverTimestamp(),
            });
            setSuccess("Admin added successfully! They need to be approved.");
            getAdmins();
        } catch (err) {
            console.error("Error adding admin:", err);
            setError("Failed to register admin. " + err.message);
        }
    };

    const handleUpdateAdmin = async (id, updatedData) => {
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
            if (updatedData.email) {
                const q = query(
                    adminsCollectionRef,
                    where("email", "==", updatedData.email),
                    where("__name__", "!=", id)
                );
                const querySnapshot = await getDocs(q);
                if (!querySnapshot.empty) {
                    setError("Another admin with this email already exists.");
                    return;
                }
            }
            const adminDoc = doc(db, "admins", id);
            await updateDoc(adminDoc, updatedData);
            setSuccess("Admin updated successfully!");
            getAdmins();
            setEditingAdmin(null);
        } catch (err) {
            console.error("Error updating admin:", err);
            setError("Failed to update admin. " + err.message);
        }
    };

    const handleApproveAdmin = async (id, isApproved) => {
        clearMessages();
        try {
            const adminDoc = doc(db, "admins", id);
            await updateDoc(adminDoc, { isApproved: isApproved });
            setSuccess(`Admin ${isApproved ? 'approved' : 'unapproved'} successfully!`);
            getAdmins();
        } catch (err) {
            console.error("Error approving admin:", err);
            setError("Failed to change admin approval status. " + err.message);
        }
    };

    const handleDeleteAdmin = async (id) => {
        if (window.confirm("Are you sure you want to delete this admin?")) {
            clearMessages();
            try {
                const adminDoc = doc(db, "admins", id);
                await updateDoc(adminDoc, {
                    isDeleted: true,
                    deletedAt: serverTimestamp(),
                });
                setSuccess("Admin deleted successfully!");
                getAdmins();
            } catch (err) {
                console.error("Error deleting admin:", err);
                setError("Failed to delete admin. " + err.message);
            }
        }
    };

    return (
        <Box
            sx={{
                background: 'linear-gradient(135deg, #FFDDC1, #C1FFD7)', // Master Admin gradient
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
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                    <Button
                        variant="outlined"
                        startIcon={<ArrowBackIcon />}
                        onClick={() => navigate("/admin-dashboard")}
                        sx={{
                            borderColor: '#8d6e63', color: '#8d6e63', borderRadius: '12px', fontWeight: 'bold',
                            '&:hover': { backgroundColor: '#efebe9' }
                        }}
                    >
                        Back to Dashboard
                    </Button>
                    <Typography variant="h4" fontWeight="bold" color="#37474f" sx={{ flexGrow: 1, textAlign: 'center' }}>
                        Manage Admins
                    </Typography>
                    <Box sx={{ width: '150px' }} /> {/* Placeholder to balance title */}
                </Box>
                <Divider sx={{ mb: 4 }} />

                <AdminForm
                    onAddAdmin={handleAddAdmin}
                    onUpdateAdmin={handleUpdateAdmin}
                    editingAdmin={editingAdmin}
                    clearEditing={() => setEditingAdmin(null)}
                    error={error}
                    success={success}
                />

                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                        <CircularProgress />
                    </Box>
                ) : error ? (
                    <MuiAlert severity="error" sx={{ mb: 2 }}>{error}</MuiAlert>
                ) : (
                    <AdminList
                        admins={admins}
                        onEditAdmin={setEditingAdmin}
                        onDeleteAdmin={handleDeleteAdmin}
                        onApproveAdmin={handleApproveAdmin}
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

export default ManageAdmins;