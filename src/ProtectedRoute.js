// src/ProtectedRoute.js

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  
  if (!user) {
    // User is not logged in, redirect them to the login page
    return <Navigate to="/admin-login" replace />;
  }

  return children;
};

export default ProtectedRoute;