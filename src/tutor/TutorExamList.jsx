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
} from "@mui/material";
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
  const navigate = useNavigate();

  useEffect(() => {
    const fetchExams = async () => {
      try {
        const examsCollection = query(
          collection(db, "exams"),
          where("isDeleted", "==", 0)
        );
        const q = query(examsCollection, orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        const examsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setExams(examsData);
      } catch (error) {
        console.error("Error fetching exams:", error);
      }
    };

    fetchExams();
  }, []);

  const handleSoftDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this exam?")) {
      try {
        const examRef = doc(db, "exams", id);
        await updateDoc(examRef, { isDeleted: 1 });
        setExams((prev) => prev.filter((exam) => exam.id !== id));
      } catch (error) {
        console.error("Error deleting exam:", error);
      }
    }
  };

  const handleView = (exam) => {
    setSelectedExam(exam); // Set the exam data first
    setIsEditing(false);    // Then set the mode (viewing)
    setOpenModal(true);     // Finally, open the modal
  };

  const handleEdit = (exam) => {
    setSelectedExam(exam);  // Set the exam data first
    setIsEditing(true);     // Then set the mode (editing)
    setOpenModal(true);     // Finally, open the modal
  };

  // Callback to close modal and refresh list after TutorForm submission or manual close
  const handleCloseModalAndRefresh = async () => {
    setOpenModal(false);     // Close the modal visually

    // IMPORTANT: Clear selectedExam and isEditing after a short delay
    // This allows the Modal to start its unmount sequence gracefully without
    // its children suddenly becoming null.
    setTimeout(() => {
      setSelectedExam(null);   // Clear selected exam data
      setIsEditing(false);     // Reset edit mode
    }, 200); // A small delay (e.g., 200ms) typically works well

    // Re-fetch exams to reflect any changes made (update, delete, new creation)
    try {
      const examsCollection = query(
        collection(db, "exams"),
        where("isDeleted", "==", 0)
      );
      const q = query(examsCollection, orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      const examsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setExams(examsData);
    } catch (error) {
      console.error("Error fetching exams:", error);
    }
  };

  return (
    <Box sx={{ padding: 4, bgcolor: "#f7f5f2", minHeight: "100vh" }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 4,
        }}
      >
        <Typography variant="h4" sx={{ color: "#5d5c61" }}>
          Exams List
        </Typography>
        <Button
          variant="contained"
          sx={{
            bgcolor: "#a8dadc",
            color: "#1d3557",
            "&:hover": { bgcolor: "#81c0c2" },
          }}
          onClick={() => navigate("/tutor-create-exam")}
        >
          Add Exam
        </Button>
      </Box>

      <TableContainer component={Paper} sx={{ boxShadow: 3 }}>
        <Table>
          <TableHead sx={{ bgcolor: "#ffd6a5" }}>
            <TableRow>
              <TableCell>Title</TableCell>
              <TableCell>Created At</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {exams.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} align="center">
                  No exams found
                </TableCell>
              </TableRow>
            ) : (
              exams.map((exam) => (
                <TableRow
                  key={exam.id}
                  sx={{ "&:hover": { bgcolor: "#f1f1f1" } }}
                >
                  <TableCell>{exam.title}</TableCell>
                  <TableCell>
                    {exam.createdAt
                      ? new Date(exam.createdAt.seconds * 1000).toLocaleString()
                      : "-"}
                  </TableCell>
                  <TableCell>
                    <Button
                      size="small"
                      variant="outlined"
                      sx={{ mr: 1 }}
                      onClick={() => handleView(exam)}
                    >
                      View
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      sx={{ mr: 1, borderColor: "#ffc107", color: "#ffc107" }}
                      onClick={() => handleEdit(exam)}
                    >
                      Edit
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      color="error"
                      onClick={() => handleSoftDelete(exam.id)}
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

      {/*
        CRITICAL FIX: The Modal component itself is ALWAYS rendered.
        Its 'open' prop controls visibility.
        The content INSIDE the modal's Box is conditionally rendered
        only when selectedExam is available. This ensures the Modal
        always has a valid structure to operate on.
      */}
      <Modal
        open={openModal} // Controls modal visibility
        onClose={handleCloseModalAndRefresh} // Handled by backdrop click or escape key
        aria-labelledby="exam-modal-title"
        aria-describedby="exam-details-or-edit-form"
      >
        <Box sx={styleModal}>
          {/*
            Only render the content if selectedExam is present.
            This ensures TutorForm gets valid props and avoids errors.
          */}
          {selectedExam && (
            <>
              <Typography
                variant="h5"
                sx={{ mb: 2, color: "#457b9d" }}
                id="exam-modal-title"
              >
                {isEditing
                  ? `Edit: ${selectedExam?.title}`
                  : `View: ${selectedExam?.title}`}
              </Typography>
              <TutorForm
                examData={selectedExam}
                readonly={!isEditing}
                onSaveSuccess={handleCloseModalAndRefresh} // Pass callback for successful form submission
              />
              {/* This button acts purely as a 'Close' or 'Cancel' for the modal.
                  The actual 'Save' is handled by TutorForm's internal button. */}
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
    </Box>
  );
};

export default TutorExamList;