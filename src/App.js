import './App.css';
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import NoPageFound from "./components/NoPageFound";

// Tutor Components
import TutorLogin from "./tutor/TutorLogin";
import TutorDashboard from "./tutor/TutorDashboard";
import TutorExamForm from "./tutor/examform/TutorExamForm";
import TutorExamList from "./tutor/examlist/TutorExamList";
import ManageStudents from './tutor/ManageStudents/ManageStudents';
import ViewSubmissions from "./tutor/viewsubmission/ViewSubmissions";
import TutorLogsList from "./tutor/logs/TutorLogsList";
import TutorLogDetail from "./tutor/logs/TutorLogDetail";

// Admin Components
import AdminForm from "./admin/AdminForm"; // To be used for a registration route
import AdminDashboard from "./admin/AdminDashboard";
import ManageAdmins from './admin/ManageAdmin/ManageAdmins';
import ManageIntakes from './admin/AdminManageIntakes/ManageIntakes';
import ManageCourse from './admin/AdminManageCourse/AdminManageCourse';
import ManageFee from './admin/AdminManageFee/AdminManageFee';
import AdminLogin from "./admin/AdminLogin";
import ProtectedRoute from "./ProtectedRoute";
import AdminDocManager from "./admin/AdminDocManager/AdminDocManager";

// Tutor Admin Components
import TutorAdminLogin from "./tutoradmin/TutorAdminLogin";
import TutorAdminDashboard from "./tutoradmin/TutorAdminDashboard";
import TutorAdminLandingPage from "./tutoradmin/TutorAdminLandingPage";
import ManageTutorAdmin from './tutoradmin/ManageTutorAdmin/ManageTutorAdmin';

// Student Components
import StudentLogin from "./student/StudentLogin";
import StudentDashboard from "./student/StudentDashboard";
import StudentExamList from "./student/StudentExamList";
import StudentTakeExam from "./student/StudentTakeExam/StudentTakeExam";

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
              <TutorExamForm />
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
        <Route
          path="/tutor-manage-students"
          element={
            <ProtectedRoute requiredRole="tutor">
              <ManageStudents />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tutor-view-submissions"
          element={
            <ProtectedRoute requiredRole="tutor">
              <ViewSubmissions />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tutor-view-logs"
          element={
            <ProtectedRoute requiredRole="tutor">
              <TutorLogsList  />
            </ProtectedRoute>
          }
        />
         <Route
          path="/tutor-view-logs/:submissionId"
          element={
            <ProtectedRoute requiredRole="tutor">
              <TutorLogDetail  />
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
        <Route
          path="/admin-manage-admins"
          element={
            <ProtectedRoute requiredRole="masterAdmin">
              <ManageAdmins />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin-manage-intakes"
          element={
            <ProtectedRoute requiredRole="masterAdmin">
              <ManageIntakes />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin-manage-course"
          element={
            <ProtectedRoute requiredRole="masterAdmin">
              <ManageCourse />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin-manage-fee"
          element={
            <ProtectedRoute requiredRole="masterAdmin">
              <ManageFee />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin-manage-docs"
          element={
            <ProtectedRoute requiredRole="masterAdmin">
              <AdminDocManager />
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
        <Route
          path="/tutor-admin-manage-tutors"
          element={
            <ProtectedRoute requiredRole="tutorAdmin">
              <ManageTutorAdmin />
            </ProtectedRoute>
          }
        />

        {/* Student Routes */}
        <Route path="/student-login" element={<StudentLogin />} />
        <Route
          path="/student-dashboard"
          element={
            <ProtectedRoute requiredRole="student">
              <StudentDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student-exam-list"
          element={
            <ProtectedRoute requiredRole="student">
              <StudentExamList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student-take-exam/:examId"
          element={
            <ProtectedRoute requiredRole="student">
              <StudentTakeExam />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
};

export default App;
