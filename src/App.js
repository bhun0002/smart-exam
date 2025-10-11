import './App.css';
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import NoPageFound from "./components/NoPageFound";
import CICCLanding from "./landing/CICCLanding";
import Privacy from "./legal/Privacy";
import Help  from "./help/Help";
import Terms  from "./legal/Terms";

// Tutor Components
import TutorLogin from "./tutor/TutorLogin";
import TutorDashboard from "./tutor/TutorDashboard";
import TutorExamForm from "./tutor/examform/TutorExamForm";
import TutorExamList from "./tutor/examlist/TutorExamList";
import ManageStudents from './tutor/ManageStudents/ManageStudents';
import ViewSubmissions from "./tutor/viewsubmission/ViewSubmissions";
import TutorLogsList from "./tutor/logs/TutorLogsList";
import TutorLogDetail from "./tutor/logs/TutorLogDetail";
import SchedulesPage from "./tutor/scheduleexam/SchedulesPage";

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
import Payments from "./admin/AdminPaymentManager/Payments";
import AdminPaymentClaims from "./admin/AdminPaymentClaims/AdminPaymentClaims";
// import AdminPaymentsDashboard from "./admin/AdminPaymentsDashboard/AdminPaymentsDashboard";
// import Student360 from "./admin/Student360/Student360";

// Tutor Admin Components
import TutorAdminLogin from "./tutoradmin/TutorAdminLogin";
import TutorAdminDashboard from "./tutoradmin/TutorAdminDashboard";
//import TutorAdminLandingPage from "./tutoradmin/TutorAdminLandingPage";
import ManageTutorAdmin from './tutoradmin/ManageTutorAdmin/ManageTutorAdmin';

// Student Components
import StudentLogin from "./student/StudentLogin";
import StudentDashboard from "./student/StudentDashboard";
import StudentTakeExam from "./student/StudentTakeExam/StudentTakeExam";
import StudentExamList from './student/StudentExamlist/StudentExamlist';
import StudentPaymentsHome from "./student/payments/StudentPaymentsHome/StudentPaymentsHome";
import ReportPaymentClaim from "./student/payments/pages/ReportPaymentClaim";
import StudentSchedulesPage from "./student/ScheduleView/StudentSchedulesPage";
import StudentGuidelines from "./student/StudentGuidelines/StudentGuidelines";

const App = () => {
  return (
    <Router>
      <Routes>
        {/* Catch-all Route for 404 - MUST be the last route */}
        <Route path="*" element={<NoPageFound />} />

        {/* Landing Page Route */}
        <Route path="/" element={<CICCLanding />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/help" element={<Help />} />
        <Route path="/terms" element={<Terms />} />

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
              <TutorLogsList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tutor-view-logs/:submissionId"
          element={
            <ProtectedRoute requiredRole="tutor">
              <TutorLogDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tutor-schedule-exams"
          element={
            <ProtectedRoute requiredRole="tutor">
              <SchedulesPage />
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
        <Route
          path="/admin-manage-payments"
          element={
            <ProtectedRoute requiredRole="masterAdmin">
              <Payments />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin-manage-payment-claims"
          element={
            <ProtectedRoute requiredRole="masterAdmin">
              <AdminPaymentClaims />
            </ProtectedRoute>
          }
        />
        {/* <Route
          path="/admin-payments-dashboard"
          element={
            <ProtectedRoute requiredRole="masterAdmin">
              <AdminPaymentsDashboard />
            </ProtectedRoute>
          }
        /> */}
        {/* <Route
          path="/student-360"
          element={
            <ProtectedRoute requiredRole="masterAdmin">
              <Student360 />
            </ProtectedRoute>
          }
        /> */}

        {/* Tutor Admin Routes */}
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
        <Route
          path="/student-payments"
          element={
            <ProtectedRoute requiredRole="student">
              <StudentPaymentsHome />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student-payments-report"
          element={
            <ProtectedRoute requiredRole="student">
              <ReportPaymentClaim />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student-schedule"
          element={
            <ProtectedRoute requiredRole="student">
              <StudentSchedulesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student-guidelines"
          element={
            <ProtectedRoute requiredRole="student">
              <StudentGuidelines />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
};

export default App;
