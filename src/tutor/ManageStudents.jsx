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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
  Skeleton,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import PeopleIcon from "@mui/icons-material/People";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import EditIcon from "@mui/icons-material/Edit";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SearchIcon from "@mui/icons-material/Search";

// ------------------ Student Form ------------------
const StudentForm = ({
  onAddStudent,
  onUpdateStudent,
  editingStudent,
  clearEditing,
  error,
  success,
  intakes,
}) => {
  const [name, setName] = useState(editingStudent?.name || "");
  const [email, setEmail] = useState(editingStudent?.email || "");
  const [password, setPassword] = useState("");
  const [selectedIntakeId, setSelectedIntakeId] = useState(
    editingStudent?.intakeId || ""
  );
  const [localError, setLocalError] = useState("");

  useEffect(() => {
    if (editingStudent) {
      setName(editingStudent.name);
      setEmail(editingStudent.email);
      setSelectedIntakeId(editingStudent.intakeId || "");
      setPassword("");
    } else {
      setName("");
      setEmail("");
      setPassword("");
      setSelectedIntakeId("");
    }
    setLocalError("");
  }, [editingStudent]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError("");

    if (!name.trim() || !email.trim() || !selectedIntakeId) {
      setLocalError("Name, Email, and Intake are required.");
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

    const studentData = { name, email, intakeId: selectedIntakeId };
    if (password.trim()) studentData.password = password;

    if (editingStudent) {
      await onUpdateStudent(editingStudent.id, studentData);
    } else {
      await onAddStudent({ ...studentData, password: password.trim() });
    }
    clearEditing();
    setName("");
    setEmail("");
    setPassword("");
    setSelectedIntakeId("");
  };

  return (
    <Paper
      elevation={6}
      sx={{
        p: 4,
        mb: 5,
        borderRadius: "20px",
        backgroundColor: "#f9f9f9",
        boxShadow: "0 8px 20px rgba(0,0,0,0.1)",
      }}
    >
      <Typography
        variant="h6"
        fontWeight="bold"
        color="#1A237E"
        sx={{ mb: 3 }}
      >
        {editingStudent ? "Edit Student" : "Add New Student"}
      </Typography>

      {localError && <MuiAlert severity="error">{localError}</MuiAlert>}
      {error && <MuiAlert severity="error">{error}</MuiAlert>}
      {success && <MuiAlert severity="success">{success}</MuiAlert>}

      <form onSubmit={handleSubmit}>
        <TextField
          label="Student Name *"
          fullWidth
          value={name}
          onChange={(e) => setName(e.target.value)}
          margin="normal"
          variant="outlined"
          sx={{ mb: 2, "& .MuiOutlinedInput-root": { borderRadius: "12px" } }}
        />
        <TextField
          label="Email *"
          type="email"
          fullWidth
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          margin="normal"
          variant="outlined"
          sx={{ mb: 2, "& .MuiOutlinedInput-root": { borderRadius: "12px" } }}
        />
        <TextField
          label={
            editingStudent
              ? "New Password (leave blank to keep current)"
              : "Password *"
          }
          type="password"
          fullWidth
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          margin="normal"
          variant="outlined"
          sx={{ mb: 2, "& .MuiOutlinedInput-root": { borderRadius: "12px" } }}
        />

        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel id="intake-select-label">Intake *</InputLabel>
          <Select
            labelId="intake-select-label"
            value={selectedIntakeId}
            onChange={(e) => setSelectedIntakeId(e.target.value)}
            sx={{ borderRadius: "12px" }}
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

        <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end" }}>
          <Button
            type="submit"
            variant="contained"
            startIcon={editingStudent ? <EditIcon /> : <AddCircleOutlineIcon />}
            sx={{
              borderRadius: "12px",
              fontWeight: "bold",
              backgroundColor: editingStudent ? "#FFB74D" : "#81C784",
              color: editingStudent ? "#E65100" : "#1B5E20",
              "&:hover": {
                backgroundColor: editingStudent ? "#FF9800" : "#66BB6A",
              },
            }}
          >
            {editingStudent ? "Update Student" : "Add Student"}
          </Button>
          {editingStudent && (
            <Button
              variant="outlined"
              onClick={clearEditing}
              sx={{
                borderColor: "#90A4AE",
                color: "#455a64",
                borderRadius: "12px",
                fontWeight: "bold",
                "&:hover": { borderColor: "#78909C", color: "#263238" },
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

// ------------------ Student List with Pagination ------------------
const StudentList = ({
    students,
    onEditStudent,
    onDeleteStudent,
    onApproveStudent,
  }) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10;
  
    const filteredStudents = students.filter(
      (student) =>
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (student.intakeName &&
          student.intakeName.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  
    const totalPages = Math.ceil(filteredStudents.length / pageSize);
    const paginatedStudents = filteredStudents.slice(
      (currentPage - 1) * pageSize,
      currentPage * pageSize
    );
  
    const handleNext = () => {
      if (currentPage < totalPages) setCurrentPage((prev) => prev + 1);
    };
    const handlePrev = () => {
      if (currentPage > 1) setCurrentPage((prev) => prev - 1);
    };
  
    return (
      <Paper
        elevation={6}
        sx={{
          p: 3,
          mt: 4,
          borderRadius: "20px",
          backgroundColor: "#fdfdfd",
          boxShadow: "0 8px 20px rgba(0,0,0,0.1)",
        }}
      >
        <Typography variant="h6" fontWeight="bold" color="#1A237E" sx={{ mb: 2 }}>
          Registered Students
        </Typography>
  
        <TextField
          label="Search Students"
          variant="outlined"
          size="small"
          fullWidth
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
          }}
          sx={{ mb: 3, "& .MuiOutlinedInput-root": { borderRadius: "12px" } }}
        />
  
        {paginatedStudents.length === 0 ? (
          <Typography textAlign="center" color="text.secondary" sx={{ py: 3 }}>
            No students found.
          </Typography>
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead sx={{ bgcolor: "#e0f2f7" }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: "bold" }}>Name</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Email</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Intake</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedStudents.map((student) => (
                    <TableRow
                      key={student.id}
                      sx={{
                        "&:nth-of-type(odd)": { bgcolor: "#fcfcfc" },
                        "&:hover": { bgcolor: "#f1f8e9" },
                      }}
                    >
                      <TableCell>
                        <Box sx={{ display: "flex", alignItems: "center" }}>
                          <Avatar
                            sx={{
                              bgcolor: student.isApproved ? "#C8E6C9" : "#FFECB3",
                              color: student.isApproved ? "#1B5E20" : "#FF6F00",
                              mr: 2,
                              width: 32,
                              height: 32,
                              fontSize: "0.9rem",
                            }}
                          >
                            {student.name.charAt(0)}
                          </Avatar>
                          {student.name}
                        </Box>
                      </TableCell>
                      <TableCell>{student.email}</TableCell>
                      <TableCell>
                        <Chip
                          label={student.intakeName || "N/A"}
                          size="small"
                          sx={{
                            bgcolor: "#BBDEFB",
                            color: "#1A237E",
                            fontWeight: "bold",
                            borderRadius: "8px",
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={student.isApproved ? "Approved" : "Pending"}
                          color={student.isApproved ? "success" : "warning"}
                          size="small"
                          sx={{ fontWeight: "bold", borderRadius: "8px" }}
                        />
                      </TableCell>
                      <TableCell>
                        {!student.isApproved && (
                          <Tooltip title="Approve Student">
                            <Button
                              variant="outlined"
                              size="small"
                              startIcon={<CheckCircleOutlineIcon />}
                              onClick={() => onApproveStudent(student.id, true)}
                              sx={{
                                mr: 1,
                                borderColor: "#81C784",
                                color: "#1B5E20",
                                borderRadius: "8px",
                              }}
                            >
                              Approve
                            </Button>
                          </Tooltip>
                        )}
                        <Tooltip title="Edit Student">
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<EditIcon />}
                            onClick={() => onEditStudent(student)}
                            sx={{
                              mr: 1,
                              borderColor: "#FFB74D",
                              color: "#E65100",
                              borderRadius: "8px",
                            }}
                          >
                            Edit
                          </Button>
                        </Tooltip>
                        <Tooltip title="Delete Student">
                          <Button
                            variant="outlined"
                            size="small"
                            color="error"
                            startIcon={<DeleteOutlineIcon />}
                            onClick={() => onDeleteStudent(student.id)}
                            sx={{ borderRadius: "8px" }}
                          >
                            Delete
                          </Button>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
  
            {/* Pagination Buttons */}
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
                onClick={handlePrev}
                sx={{ borderRadius: "12px" }}
              >
                Previous
              </Button>
              <Typography>
                Page {currentPage} of {totalPages}
              </Typography>
              <Button
                variant="outlined"
                disabled={currentPage === totalPages}
                onClick={handleNext}
                sx={{ borderRadius: "12px" }}
              >
                Next
              </Button>
            </Box>
          </>
        )}
      </Paper>
    );
  };
  

// // ------------------ Student List ------------------
// const StudentList = ({
//   students,
//   onEditStudent,
//   onDeleteStudent,
//   onApproveStudent,
// }) => {
//   const [searchTerm, setSearchTerm] = useState("");

//   const filteredStudents = students.filter(
//     (student) =>
//       student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
//       student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
//       (student.intakeName &&
//         student.intakeName.toLowerCase().includes(searchTerm.toLowerCase()))
//   );

//   return (
//     <Paper
//       elevation={6}
//       sx={{
//         p: 3,
//         borderRadius: "20px",
//         backgroundColor: "#fdfdfd",
//         boxShadow: "0 8px 20px rgba(0,0,0,0.1)",
//       }}
//     >
//       <Typography variant="h6" fontWeight="bold" color="#1A237E" sx={{ mb: 2 }}>
//         Registered Students
//       </Typography>

//       <TextField
//         label="Search Students"
//         variant="outlined"
//         size="small"
//         fullWidth
//         value={searchTerm}
//         onChange={(e) => setSearchTerm(e.target.value)}
//         InputProps={{
//           startAdornment: (
//             <InputAdornment position="start">
//               <SearchIcon />
//             </InputAdornment>
//           ),
//         }}
//         sx={{ mb: 3, "& .MuiOutlinedInput-root": { borderRadius: "12px" } }}
//       />

//       {filteredStudents.length === 0 ? (
//         <Typography textAlign="center" color="text.secondary" sx={{ py: 3 }}>
//           No students found.
//         </Typography>
//       ) : (
//         <TableContainer>
//           <Table>
//             <TableHead sx={{ bgcolor: "#e0f2f7" }}>
//               <TableRow>
//                 <TableCell sx={{ fontWeight: "bold" }}>Name</TableCell>
//                 <TableCell sx={{ fontWeight: "bold" }}>Email</TableCell>
//                 <TableCell sx={{ fontWeight: "bold" }}>Intake</TableCell>
//                 <TableCell sx={{ fontWeight: "bold" }}>Status</TableCell>
//                 <TableCell sx={{ fontWeight: "bold" }}>Actions</TableCell>
//               </TableRow>
//             </TableHead>
//             <TableBody>
//               {filteredStudents.map((student) => (
//                 <TableRow
//                   key={student.id}
//                   sx={{
//                     "&:nth-of-type(odd)": { bgcolor: "#fcfcfc" },
//                     "&:hover": { bgcolor: "#f1f8e9" },
//                   }}
//                 >
//                   <TableCell>
//                     <Box sx={{ display: "flex", alignItems: "center" }}>
//                       <Avatar
//                         sx={{
//                           bgcolor: student.isApproved ? "#C8E6C9" : "#FFECB3",
//                           color: student.isApproved ? "#1B5E20" : "#FF6F00",
//                           mr: 2,
//                           width: 32,
//                           height: 32,
//                           fontSize: "0.9rem",
//                         }}
//                       >
//                         {student.name.charAt(0)}
//                       </Avatar>
//                       {student.name}
//                     </Box>
//                   </TableCell>
//                   <TableCell>{student.email}</TableCell>
//                   <TableCell>
//                     <Chip
//                       label={student.intakeName || "N/A"}
//                       size="small"
//                       sx={{
//                         bgcolor: "#BBDEFB",
//                         color: "#1A237E",
//                         fontWeight: "bold",
//                         borderRadius: "8px",
//                       }}
//                     />
//                   </TableCell>
//                   <TableCell>
//                     <Chip
//                       label={student.isApproved ? "Approved" : "Pending"}
//                       color={student.isApproved ? "success" : "warning"}
//                       size="small"
//                       sx={{ fontWeight: "bold", borderRadius: "8px" }}
//                     />
//                   </TableCell>
//                   <TableCell>
//                     {!student.isApproved && (
//                       <Tooltip title="Approve Student">
//                         <Button
//                           variant="outlined"
//                           size="small"
//                           startIcon={<CheckCircleOutlineIcon />}
//                           onClick={() =>
//                             onApproveStudent(student.id, true)
//                           }
//                           sx={{
//                             mr: 1,
//                             borderColor: "#81C784",
//                             color: "#1B5E20",
//                             borderRadius: "8px",
//                           }}
//                         >
//                           Approve
//                         </Button>
//                       </Tooltip>
//                     )}
//                     <Tooltip title="Edit Student">
//                       <Button
//                         variant="outlined"
//                         size="small"
//                         startIcon={<EditIcon />}
//                         onClick={() => onEditStudent(student)}
//                         sx={{
//                           mr: 1,
//                           borderColor: "#FFB74D",
//                           color: "#E65100",
//                           borderRadius: "8px",
//                         }}
//                       >
//                         Edit
//                       </Button>
//                     </Tooltip>
//                     <Tooltip title="Delete Student">
//                       <Button
//                         variant="outlined"
//                         size="small"
//                         color="error"
//                         startIcon={<DeleteOutlineIcon />}
//                         onClick={() => onDeleteStudent(student.id)}
//                         sx={{ borderRadius: "8px" }}
//                       >
//                         Delete
//                       </Button>
//                     </Tooltip>
//                   </TableCell>
//                 </TableRow>
//               ))}
//             </TableBody>
//           </Table>
//         </TableContainer>
//       )}
//     </Paper>
//   );
// };

// ------------------ Manage Students Page ------------------
const ManageStudents = () => {
  const [students, setStudents] = useState([]);
  const [intakes, setIntakes] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editingStudent, setEditingStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const studentsCollectionRef = collection(db, "students");
  const intakesCollectionRef = collection(db, "intakes");

  const clearMessages = () => {
    setError("");
    setSuccess("");
  };

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const getStudents = async () => {
    setLoading(true);
    try {
      const intakesData = await getDocs(
        query(intakesCollectionRef, orderBy("name", "asc"))
      );
      const fetchedIntakes = intakesData.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
      }));
      setIntakes(fetchedIntakes);

      const q = query(
        studentsCollectionRef,
        where("isDeleted", "==", false),
        orderBy("createdAt", "desc")
      );
      const data = await getDocs(q);

      const fetchedStudents = data.docs.map((studentDoc) => {
        const studentData = studentDoc.data();
        const intake = fetchedIntakes.find((i) => i.id === studentData.intakeId);
        return {
          ...studentData,
          id: studentDoc.id,
          intakeName: intake ? intake.name : "Unknown Intake",
        };
      });
      setStudents(fetchedStudents);
      clearMessages();
    } catch (err) {
      console.error(err);
      setError("Failed to fetch students.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getStudents();
  }, []);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const handleAddStudent = async ({ name, email, password, intakeId }) => {
    clearMessages();
    if (!name || !email || !password || !intakeId) {
      setError("All fields are required.");
      return;
    }
    if (!validateEmail(email)) {
      setError("Invalid email.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    try {
      const q = query(studentsCollectionRef, where("email", "==", email));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        setError("Email already exists.");
        return;
      }

      await addDoc(studentsCollectionRef, {
        name,
        email,
        password,
        intakeId,
        isApproved: false,
        isDeleted: false,
        createdAt: serverTimestamp(),
      });
      setSuccess("Student added successfully!");
      getStudents();
    } catch (err) {
      console.error(err);
      setError("Failed to add student.");
    }
  };

  const handleUpdateStudent = async (id, updatedData) => {
    clearMessages();
    if (updatedData.name && !updatedData.name.trim()) {
      setError("Name cannot be empty.");
      return;
    }
    if (updatedData.email && !validateEmail(updatedData.email)) {
      setError("Invalid email.");
      return;
    }
    if (updatedData.password && updatedData.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (!updatedData.intakeId) {
      setError("Intake cannot be empty.");
      return;
    }

    try {
      const studentDoc = doc(db, "students", id);
      await updateDoc(studentDoc, updatedData);
      setSuccess("Student updated successfully!");
      getStudents();
      setEditingStudent(null);
    } catch (err) {
      console.error(err);
      setError("Failed to update student.");
    }
  };

  const handleApproveStudent = async (id, isApproved) => {
    clearMessages();
    try {
      const studentDoc = doc(db, "students", id);
      await updateDoc(studentDoc, { isApproved });
      setSuccess(`Student ${isApproved ? "approved" : "unapproved"} successfully!`);
      getStudents();
    } catch (err) {
      console.error(err);
      setError("Failed to update approval status.");
    }
  };

  const handleDeleteStudent = async (id) => {
    if (!window.confirm("Are you sure you want to delete this student?")) return;
    clearMessages();
    try {
      const studentDoc = doc(db, "students", id);
      await updateDoc(studentDoc, { isDeleted: true, deletedAt: serverTimestamp() });
      setSuccess("Student deleted successfully!");
      getStudents();
    } catch (err) {
      console.error(err);
      setError("Failed to delete student.");
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        py: 5,
        px: 2,
        fontFamily: "Roboto, sans-serif",
        background: "linear-gradient(135deg, #A7C7E7, #D9E9F7)",
      }}
    >
      <Paper
        elevation={12}
        sx={{
          maxWidth: 1000,
          mx: "auto",
          p: { xs: 3, md: 5 },
          borderRadius: "24px",
          backgroundColor: "#ffffff",
        }}
      >
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 4 }}>
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
          <Typography variant="h4" fontWeight="bold" color="#1A237E">
            Manage Students
          </Typography>
          <Box sx={{ width: "150px" }} />
        </Box>
        <Divider sx={{ mb: 4 }} />

        <StudentForm
          onAddStudent={handleAddStudent}
          onUpdateStudent={handleUpdateStudent}
          editingStudent={editingStudent}
          clearEditing={() => setEditingStudent(null)}
          error={error}
          success={success}
          intakes={intakes}
        />

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <StudentList
            students={students}
            onEditStudent={setEditingStudent}
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
