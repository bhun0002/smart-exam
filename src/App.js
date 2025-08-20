import './App.css';
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import NoPageFound from "./components/NoPageFound";

import TutorDashboard from "./components/TutorDashboard";
import TutorForm from "./components/TutorForm";
import TutorExamList from "./components/TutorExamList";

// Admin Components
import AdminAuthPage from "./admin/AdminAuthPage"; // New import
import AdminForm from "./admin/AdminForm"; // To be used for a registration route
import AdminDashboard from "./admin/AdminDashboard";
import AdminLogin from "./admin/AdminLogin";
import ProtectedRoute from "./ProtectedRoute";

// Tutor Admin Components
import TutorAdminLogin from "./tutoradmin/TutorAdminLogin";
import TutorAdminDashboard from "./tutoradmin/TutorAdminDashboard";
import TutorAdminLandingPage from "./tutoradmin/TutorAdminLandingPage";

const App = () => {
  return (
    <Router>
      <Routes>
        {/* Catch-all Route for 404 - MUST be the last route */}
        <Route path="*" element={<NoPageFound />} />

        {/* Tutor Routes */}
        {/* Default landing page */}
        {/* <Route path="/" element={<TutorDashboard />} /> */}

        {/* Dashboard page */}
        <Route path="/tutor-dashboard" element={<TutorDashboard />} />

        {/* Exam creation form */}
        <Route path="/tutor-create-exam" element={<TutorForm />} />

        {/* List of exams */}
        <Route path="/tutor-exam-list" element={<TutorExamList />} />

        {/* Master Admin Routes */}
        {/* Admin Login as the Default Landing Page */}
        {/* <Route path="/" element={<AdminLogin />} /> */}
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/admin-register" element={<AdminForm />} />

        {/* Protected Master Admin Route */}
        <Route
          path="/admin-dashboard"
          element={
            <ProtectedRoute requiredRole="masterAdmin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        {/* Tutor Admin Routes */}
        {/* Landing Page Route */}
        <Route path="/" element={<TutorAdminLandingPage />} />
        <Route path="/tutor-admin-login" element={<TutorAdminLogin />} />

        <Route
          path="/tutor-admin-dashboard"
          element={
            <ProtectedRoute requiredRole="tutorAdmin">
              <TutorAdminDashboard />
            </ProtectedRoute>
          }
        />

      </Routes>
    </Router>
  );
};

export default App;
