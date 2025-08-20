// src/tutoradmin/TutorAdminDashboard.jsx

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
import { Box, Typography, Button } from "@mui/material";
import TutorAdminForm from "./TutorAdminForm";
import TutorAdminList from "./TutorAdminList";
import { useAuth } from '../AuthContext';
import { useNavigate } from "react-router-dom";

const TutorAdminDashboard = () => {
  const [tutors, setTutors] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const tutorsCollectionRef = collection(db, "tutors");

  const clearMessages = () => {
    setError("");
    setSuccess("");
  };

  const handleLogout = () => {
    logout();
    navigate("/tutor-admin-login");
  };

  const handleMasterPanelRedirect = () => {
    navigate("/admin-dashboard");
  };

  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const getTutors = async () => {
    try {
      const q = query(
        tutorsCollectionRef,
        where("isDeleted", "!=", true),
        orderBy("createdAt", "desc")
      );
      const data = await getDocs(q);
      setTutors(data.docs.map((doc) => ({ ...doc.data(), id: doc.id })));
    } catch (err) {
      console.error("Error fetching tutors:", err);
      setError("Failed to fetch tutors.");
    }
  };

  useEffect(() => {
    getTutors();
  }, []);

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
        password,
        isApproved: false,
        isDeleted: false,
        createdAt: serverTimestamp(),
      });
      setSuccess("Tutor added successfully! They need to be approved.");
      getTutors();
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
    try {
      if (updatedData.email) {
        const q = query(
          tutorsCollectionRef,
          where("email", "==", updatedData.email),
          where("__name__", "!=", id)
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
      getTutors();
    } catch (err) {
      console.error("Error updating tutor:", err);
      setError("Failed to update tutor. " + err.message);
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
        getTutors();
      } catch (err) {
        console.error("Error deleting tutor:", err);
        setError("Failed to delete tutor. " + err.message);
      }
    }
  };

  return (
    <Box
      sx={{
        backgroundColor: '#e0f7fa',
        minHeight: '100vh',
        padding: '32px 0',
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "flex-end",
          padding: 2,
          gap: 2,
          position: 'sticky',
          top: 0,
          backgroundColor: '#f5f5f5',
          zIndex: 100,
        }}
      >
        {user?.role === 'masterAdmin' && (
          <Button
            variant="contained"
            onClick={handleMasterPanelRedirect}
            sx={{
              backgroundColor: '#607d8b', // Blue-grey for Master Admin button
              color: '#fff',
              borderRadius: '12px',
              fontWeight: 'bold',
              '&:hover': {
                backgroundColor: '#455a64',
              },
            }}
          >
            Go to Master Admin Panel
          </Button>
        )}
        <Button
          variant="contained"
          onClick={handleLogout}
          sx={{
            backgroundColor: '#ef5350', // Red for logout
            color: '#fff',
            borderRadius: '12px',
            fontWeight: 'bold',
            '&:hover': {
              backgroundColor: '#d32f2f',
            },
          }}
        >
          Logout
        </Button>
      </Box>
      <Box
        sx={{
          maxWidth: 900,
          margin: "20px auto",
          padding: 4,
          backgroundColor: "#ffffff", // Pure white for the main container
          borderRadius: "20px",
          boxShadow: "0px 10px 30px rgba(0,0,0,0.08)",
        }}
      >
        <Typography
          variant="h3"
          gutterBottom
          textAlign="center"
          fontWeight="bold"
          color="#37474f"
          sx={{ mb: 4 }}
        >
          Tutor Admin Dashboard
        </Typography>
        <TutorAdminForm
          onAddTutor={handleAddTutor}
          error={error}
          success={success}
        />
        <TutorAdminList
          tutors={tutors}
          onUpdateTutor={handleUpdateTutor}
          onDeleteTutor={handleDeleteTutor}
          error={error}
          success={success}
        />
      </Box>
    </Box>
  );
};

export default TutorAdminDashboard;