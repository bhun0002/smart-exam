import './App.css';
// import TutorForm from "./components/TutorForm";
// import TutorExamList from "./components/TutorExamList";

// function App() {
//   return (
//     <div className="App">
//       <h1>Smart Exam - Tutor Side</h1>
//       <TutorForm />
//     </div>
//   );
// }

// export default App;

import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import TutorDashboard from "./components/TutorDashboard";
import TutorForm from "./components/TutorForm";
import TutorExamList from "./components/TutorExamList";

const App = () => {
  return (
    <Router>
      <Routes>
        {/* Default landing page */}
        <Route path="/" element={<TutorDashboard />} />
        
        {/* Dashboard page */}
        <Route path="/dashboard" element={<TutorDashboard />} />

        {/* Exam creation form */}
        <Route path="/create-exam" element={<TutorForm />} />

        {/* List of exams */}
        <Route path="/exam-list" element={<TutorExamList />} />
      </Routes>
    </Router>
  );
};

export default App;
