import React, { useEffect, useState } from "react";
import { collection, getDocs, orderBy, query, doc, updateDoc, where } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, Modal } from "@mui/material";
import { useNavigate } from "react-router-dom";
import TutorForm from "./TutorForm"; // import your form component


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
};

const TutorExamList = () => {
  const [exams, setExams] = useState([]);
  const [openModal, setOpenModal] = useState(false);
  const [selectedExam, setSelectedExam] = useState(null);
  const navigate = useNavigate();

  // Fetch exams from Firestore
  useEffect(() => {
    const fetchExams = async () => {
      try {
        
        const examsCollection = query(collection(db, "exams"), where("isDeleted", "==", 0));
        const q = query(examsCollection, orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        const examsData = snapshot.docs.map(doc => ({
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

  // Delete exam
  const handleSoftDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this exam?")) {
        try {
            const examRef = doc(db, "exams", id);
            await updateDoc(examRef, { isDeleted: 1 }); // mark as deleted
            setExams((prev) => prev.filter((exam) => exam.id !== id)); // remove from UI
          } catch (error) {
            console.error("Error deleting exam:", error);
          }
      } 
  };
//   // 🔹 Fix missing isDeleted
//   const handleFix = async () => {
//     const snap = await getDocs(collection(db, "exams"));
//     for (const d of snap.docs) {
//       if (!d.data().hasOwnProperty("isDeleted")) {
//         await updateDoc(doc(db, "exams", d.id), { isDeleted: 0 });
//         console.log(`Fixed exam: ${d.id}`);
//       }
//     }
//     alert("All missing isDeleted fields are now set to 0 ✅");
//   };

  // Open modal to view exam
  const handleView = (exam) => {
    setSelectedExam(exam);
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setSelectedExam(null);
  };

  

  return (
    <Box sx={{ padding: 4, bgcolor: "#f7f5f2", minHeight: "100vh" }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4 }}>
        <Typography variant="h4" sx={{ color: "#5d5c61" }}>
          Exams List
        </Typography>
        <Button
          variant="contained"
          sx={{ bgcolor: "#a8dadc", color: "#1d3557", "&:hover": { bgcolor: "#81c0c2" } }}
          onClick={() => navigate("/create-exam")}
        >
          Add Exam
        </Button>
        {/* <Button
            variant="contained"
            sx={{ bgcolor: "green", color: "white" }}
            onClick={handleFix}
          >
            Fix Missing isDeleted
          </Button> */}
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
                <TableCell colSpan={3} align="center">No exams found</TableCell>
              </TableRow>
            ) : (
              exams.map((exam) => (
                <TableRow key={exam.id} sx={{ "&:hover": { bgcolor: "#f1f1f1" } }}>
                  <TableCell>{exam.title}</TableCell>
                  <TableCell>{exam.createdAt ? new Date(exam.createdAt.seconds * 1000).toLocaleString() : "-"}</TableCell>
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

      {/* Modal for viewing exam */}
      <Modal
        open={openModal}
        onClose={handleCloseModal}
        aria-labelledby="view-exam-modal"
        aria-describedby="view-exam-details"
      >
        <Box sx={styleModal}>
          <Typography variant="h5" sx={{ mb: 2, color: "#457b9d" }}>
            {selectedExam?.title}
          </Typography>
          {selectedExam && (
            <TutorForm
              examData={selectedExam} // pass exam data
              readonly={true}          // pass readonly prop
            />
          )}
          <Button sx={{ mt: 2 }} onClick={handleCloseModal} variant="contained" color="primary">
            Close
          </Button>
        </Box>
      </Modal>
    </Box>
  );
};

export default TutorExamList;
