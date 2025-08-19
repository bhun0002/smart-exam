import './App.css';
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import TutorDashboard from "./components/TutorDashboard";
import TutorForm from "./components/TutorForm";
import TutorExamList from "./components/TutorExamList";

// Admin Components
import AdminAuthPage from "./admin/AdminAuthPage"; // New import
import AdminForm from "./admin/AdminForm"; // To be used for a registration route
import AdminDashboard from "./admin/AdminDashboard";
import AdminLogin from "./admin/AdminLogin";
import ProtectedRoute from "./ProtectedRoute"; 

const App = () => {
  return (
    <Router>
      <Routes>
        {/* Tutor Routes */}
        {/* Default landing page */}
        {/* <Route path="/" element={<TutorDashboard />} /> */}

        {/* Dashboard page */}
        <Route path="/tutor-dashboard" element={<TutorDashboard />} />

        {/* Exam creation form */}
        <Route path="/tutor-create-exam" element={<TutorForm />} />

        {/* List of exams */}
        <Route path="/tutor-exam-list" element={<TutorExamList />} />

        {/* Admin Login as the Default Landing Page */}
        <Route path="/" element={<AdminAuthPage />} />

        {/* Dedicated Admin Routes */}
        <Route path="/admin-register" element={<AdminForm />} />
        <Route path="/admin-login" element={<AdminLogin />} />

        {/* Protected Master Admin Route */}
        <Route
          path="/admin-dashboard"
          element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
};

export default App;
