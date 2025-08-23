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
  // CHANGE START: Added Snackbar and MuiAlert for notifications (consistent with TutorForm)
  Snackbar,
  Alert as MuiAlert,
  // CHANGE END
  // CHANGE START: Added TextField and InputAdornment for search functionality (consistent with earlier version)
  TextField,
  InputAdornment,
  // CHANGE END
} from "@mui/material";
import {
  Add as AddIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon, // CHANGE: Added SearchIcon for search input
  Restore as RestoreIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import TutorForm from "./TutorForm"; // Ensure this path is correct

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
  // CHANGE START: Added state for snackbar and search term (consistent with earlier version)
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [isSnackbarOpen, setIsSnackbarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  // CHANGE END
  const navigate = useNavigate();

  const examsCollectionRef = collection(db, "exams");
  const intakesCollectionRef = collection(db, "intakes");

  // CHANGE START: handleCloseSnackbar function
  const handleCloseSnackbar = () => {
    setIsSnackbarOpen(false);
  };
  // CHANGE END

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


  // CHANGE START: Modified useEffect for exams to depend on intakes being loaded.
  useEffect(() => {
    const fetchExams = async () => {
      // Only fetch exams if intakes are already loaded.
      // This prevents exams from being processed with an empty 'intakes' map initially.
      if (Object.keys(intakes).length === 0 && exams.length === 0) {
        return; // Skip fetching exams if intakes aren't ready yet and no exams are loaded
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
          intakeName: intakes[exam.intakeId] || 'N/A' // Look up name from fetched intakes
        }));
        setExams(examsWithIntakeNames);
        // Removed `setError("")` as there's no `error` state in your provided code
      } catch (error) {
        // Removed `setError("Failed to fetch exams.")` as there's no `error` state
        console.error("Error fetching exams:", error);
      }
    };

    fetchExams();
  }, [intakes]); // Depend on 'intakes' state. This effect will re-run when intakes are loaded.
  // CHANGE END


  const handleSoftDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this exam?")) {
      try {
        const examRef = doc(db, "exams", id);
        await updateDoc(examRef, { isDeleted: 1 });
        // CHANGE START: Show snackbar message on successful soft delete
        setSnackbarMessage("Exam soft-deleted successfully! 🗑️");
        setIsSnackbarOpen(true);
        // CHANGE END
        // CHANGE START: Instead of filtering locally, re-fetch exams to ensure consistency with Firestore
        // Also ensure intake names are re-mapped.
        handleCloseModalAndRefresh();
        // CHANGE END
      } catch (error) {
        console.error("Error deleting exam:", error);
        // CHANGE START: Show snackbar message for error
        setSnackbarMessage("Failed to soft-delete exam. ❌");
        setIsSnackbarOpen(true);
        // CHANGE END
      }
    }
  };

  const handleView = (exam) => {
    setSelectedExam(exam); // Set the exam data first
    setIsEditing(false);     // Then set the mode (viewing)
    setOpenModal(true);      // Finally, open the modal
  };

  const handleEdit = (exam) => {
    setSelectedExam(exam);   // Set the exam data first
    setIsEditing(true);      // Then set the mode (editing)
    setOpenModal(true);      // Finally, open the modal
  };

  // Callback to close modal and refresh list after TutorForm submission or manual close
  const handleCloseModalAndRefresh = async () => {
    setOpenModal(false);     // Close the modal visually

    // IMPORTANT: Clear selectedExam and isEditing after a short delay
    // This allows the Modal to start its unmount sequence gracefully without
    // its children suddenly becoming null.
    setTimeout(async () => { // CHANGE: Added async here to await fetchExams
      setSelectedExam(null);   // Clear selected exam data
      setIsEditing(false);     // Reset edit mode

      // Re-fetch exams to reflect any changes made (update, delete, new creation)
      try {
        const examsQuery = query( // CHANGE: Used `examsQuery` for consistency
          collection(db, "exams"),
          where("isDeleted", "==", 0),
          orderBy("createdAt", "desc")
        );
        const snapshot = await getDocs(examsQuery);
        const examsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        // CHANGE START: Map intakeId to intakeName for each exam when refreshing.
        const examsWithIntakeNames = examsData.map(exam => ({
          ...exam,
          intakeName: intakes[exam.intakeId] || 'N/A'
        }));
        setExams(examsWithIntakeNames);
        // CHANGE END
      } catch (error) {
        console.error("Error fetching exams after modal close:", error);
        // CHANGE START: Show snackbar message for error
        setSnackbarMessage("Failed to refresh exam list. ❌");
        setIsSnackbarOpen(true);
        // CHANGE END
      }
    }, 200); // A small delay (e.g., 200ms) typically works well
  };

  // CHANGE START: Filter exams based on searchTerm, including intakeName
  const filteredExams = exams.filter(exam =>
    exam.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (exam.intakeName && exam.intakeName.toLowerCase().includes(searchTerm.toLowerCase())) // Check if intakeName exists before including in search
  );
  // CHANGE END

  return (
    <Box sx={{ padding: 4, bgcolor: "#f7f5f2", minHeight: "100vh" }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 4,
          flexWrap: 'wrap', // CHANGE: Allow items to wrap on small screens
          gap: 2, // CHANGE: Add gap for spacing
        }}
      >
        <Typography variant="h4" sx={{ color: "#5d5c61" }}>
          Exams List
        </Typography>
        {/* CHANGE START: Add Search TextField */}
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
          sx={{ flexGrow: 1, maxWidth: 300 }} // Allow search to grow but max-width
        />
        {/* CHANGE END */}
        <Button
          variant="contained"
          sx={{
            bgcolor: "#a8dadc",
            color: "#1d3557",
            "&:hover": { bgcolor: "#81c0c2" },
            borderRadius: '12px', // CHANGE: Added border-radius for consistency
          }}
          // CHANGE START: Open modal for new exam creation instead of navigating to a separate page
          onClick={() => handleView(null)} // Pass null to TutorForm to indicate new exam
          startIcon={<AddIcon />} // Add icon
          // CHANGE END
        >
          Add Exam
        </Button>
      </Box>

      <TableContainer component={Paper} sx={{ boxShadow: 3 }}>
        <Table>
          <TableHead sx={{ bgcolor: "#ffd6a5" }}>
            <TableRow>
              <TableCell>Title</TableCell>
              {/* CHANGE START: New TableCell for Intake */}
              <TableCell>Intake</TableCell>
              {/* CHANGE END */}
              {/* CHANGE START: New TableCell for Duration */}
              <TableCell>Duration (min)</TableCell>
              {/* CHANGE END */}
              <TableCell>Created At</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {filteredExams.length === 0 ? ( // CHANGE: Use filteredExams
              <TableRow>
                <TableCell colSpan={5} align="center"> {/* CHANGE: colSpan to 5 for new columns */}
                  No exams found
                </TableCell>
              </TableRow>
            ) : (
              filteredExams.map((exam) => ( // CHANGE: Use filteredExams
                <TableRow
                  key={exam.id}
                  sx={{ "&:hover": { bgcolor: "#f1f1f1" } }}
                >
                  <TableCell>
                    {/* CHANGE START: Added Avatar for visual appeal (similar to AdminDashboard) */}
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar sx={{ bgcolor: '#BBDEFB', color: '#1A237E', mr: 2, width: 32, height: 32, fontSize: '0.9rem' }}>
                        {exam.title.charAt(0)}
                      </Avatar>
                      {exam.title}
                    </Box>
                    {/* CHANGE END */}
                  </TableCell>
                  {/* CHANGE START: Display Intake Name with Chip */}
                  <TableCell>
                    <Chip label={exam.intakeName} color="info" size="small" sx={{ borderRadius: '8px', fontWeight: 'bold' }} />
                  </TableCell>
                  {/* CHANGE END */}
                  {/* CHANGE START: Display Duration */}
                  <TableCell>{exam.duration || 'N/A'}</TableCell>
                  {/* CHANGE END */}
                  <TableCell>
                    {exam.createdAt
                      ? new Date(exam.createdAt.seconds * 1000).toLocaleDateString() // Changed to toLocaleDateString for cleaner date
                      : "-"}
                  </TableCell>
                  <TableCell>
                    <Button
                      size="small"
                      variant="outlined"
                      sx={{ mr: 1, borderRadius: '8px' }} // CHANGE: Added border-radius for consistency
                      onClick={() => handleView(exam)}
                      startIcon={<VisibilityIcon />} // CHANGE: Added icon
                    >
                      View
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      sx={{ mr: 1, borderColor: "#ffc107", color: "#ffc107", borderRadius: '8px' }} // CHANGE: Added border-radius
                      onClick={() => handleEdit(exam)}
                      startIcon={<EditIcon />} // CHANGE: Added icon
                    >
                      Edit
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      color="error"
                      onClick={() => handleSoftDelete(exam.id)}
                      startIcon={<DeleteIcon />} // CHANGE: Added icon
                      sx={{ borderRadius: '8px' }} // CHANGE: Added border-radius
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
          {selectedExam !== null && ( // CHANGE: Condition to check for null, allowing new exam creation (selectedExam is null for new)
            <>
              <Typography
                variant="h5"
                sx={{ mb: 2, color: "#457b9d" }}
                id="exam-modal-title"
              >
                {/* CHANGE START: Title for new exam creation */}
                {selectedExam?.id // Check if it's an existing exam
                  ? (isEditing ? `Edit: ${selectedExam.title}` : `View: ${selectedExam.title}`)
                  : "Create New Exam"}
                {/* CHANGE END */}
              </Typography>
              <TutorForm
                examData={selectedExam?.id ? selectedExam : null} // Pass null for new exam if selectedExam is null
                readonly={!isEditing && selectedExam?.id !== undefined} // Readonly if not editing and it's an existing exam
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

      {/* CHANGE START: Snackbar for notifications (copied from TutorForm for consistency) */}
      <Snackbar
        open={isSnackbarOpen}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <MuiAlert
          onClose={handleCloseSnackbar}
          severity={snackbarMessage.includes("successfully") ? "success" : "error"} // Dynamically set severity
          elevation={6}
          variant="filled"
          sx={{
            backgroundColor: snackbarMessage.includes("successfully") ? "#4CAF50" : "#F44336", // Green/Red background
          }}
        >
          {snackbarMessage}
        </MuiAlert>
      </Snackbar>
      {/* CHANGE END */}
    </Box>
  );
};

export default TutorExamList;