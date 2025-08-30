import './App.css';
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import NoPageFound from "./components/NoPageFound";

// Tutor Components
import TutorLogin from "./tutor/TutorLogin";
import TutorDashboard from "./tutor/TutorDashboard";
import TutorForm from "./tutor/TutorForm";
import TutorExamList from "./tutor/TutorExamList";

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
        <Route path="/tutor-login" element={<TutorLogin />} />
        {/* Protected Tutor Route */}
        <Route
          path="/tutor-dashboard"
          element={
            <ProtectedRoute requiredRole="tutor">
              <TutorDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tutor-create-exam"
          element={
            <ProtectedRoute requiredRole="tutor">
              <TutorForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tutor-exam-list"
          element={
            <ProtectedRoute requiredRole="tutor">
              <TutorExamList />
            </ProtectedRoute>
          }
        />

        {/* Master Admin Routes */}
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
