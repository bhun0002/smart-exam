import React, { useState, useEffect } from "react";
import { db } from "../firebaseConfig";
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  query,
  orderBy,
  where,
} from "firebase/firestore";
import { Box, Typography, Button } from "@mui/material";
import AdminForm from "./AdminForm";
import AdminList from "./AdminList";
import { useAuth } from '../AuthContext';
import { useNavigate } from "react-router-dom";

const AdminDashboard = () => {
  const [admins, setAdmins] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const { logout } = useAuth();
  const navigate = useNavigate();

  const adminsCollectionRef = collection(db, "admins");

  const clearMessages = () => {
    setError("");
    setSuccess("");
  };

  // Add a logout function
  const handleLogout = () => {
    logout(); // This clears the user from state and session storage
    navigate("/admin-login"); // Redirect to login page
  };

  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const getAdmins = async () => {
    try {
      const q = query(
        adminsCollectionRef,
        where("isDeleted", "!=", true),
        orderBy("createdAt", "desc")
      );
      const data = await getDocs(q);
      setAdmins(data.docs.map((doc) => ({ ...doc.data(), id: doc.id })));
    } catch (err) {
      console.error("Error fetching admins:", err);
      setError("Failed to fetch admins.");
    }
  };

  useEffect(() => {
    getAdmins();
  }, []);

  const handleAddAdmin = async ({ name, email, password }) => {
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
        password,
        isApproved: false,
        createdAt: serverTimestamp(),
      });
      setSuccess("Admin registered successfully! They need to be approved.");
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
    } catch (err) {
      console.error("Error updating admin:", err);
      setError("Failed to update admin. " + err.message);
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
    <Box>
      <Box sx={{ display: "flex", justifyContent: "flex-end", padding: 2 }}>
        <Button variant="contained" color="secondary" onClick={handleLogout}>
          Logout
        </Button>
      </Box>
      <Box
        sx={{
          maxWidth: 800,
          margin: "20px auto",
          padding: 4,
          backgroundColor: "#f0f4c3",
          borderRadius: "16px",
          boxShadow: "0px 10px 30px rgba(0,0,0,0.08)",
        }}
      >
        <Typography
          variant="h4"
          gutterBottom
          textAlign="center"
          fontWeight="bold"
          color="#37474f"
          sx={{ mb: 4 }}
        >
          Admin Panel
        </Typography>
        <AdminForm
          onAddAdmin={handleAddAdmin}
          error={error}
          success={success}
          isDashboardForm={true}
        />
        <AdminList
          admins={admins}
          onUpdateAdmin={handleUpdateAdmin}
          onDeleteAdmin={handleDeleteAdmin}
          error={error}
          success={success}
        />
      </Box>
    </Box>
  );
};

export default AdminDashboard;
