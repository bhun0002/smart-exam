// src/ProtectedRoute.js

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, isLoading  } = useAuth();

  if (isLoading) {
    // Show a loading message or spinner while checking session storage
    return <div>Loading...</div>; 
  }
  
  if (!user) {
    // User is not logged in, redirect them to the login page
    return <Navigate to="/admin-login" replace />;
  }

  // If user is logged in but doesn't have the required role, redirect to a different page or show an error
  if (requiredRole && user.role !== requiredRole) {
    // Redirect a master admin trying to access a tutor page, or vice-versa
    if (user.role === 'masterAdmin') {
      return <Navigate to="/admin-dashboard" replace />;
    } else if (user.role === 'tutorAdmin') {
      return <Navigate to="/tutor-dashboard" replace />;
    }
    return <Navigate to="/" replace />; // Default redirect
  } // Added closing curly brace for the if statement

  return children;
};

export default ProtectedRoute;