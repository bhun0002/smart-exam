// src/AuthContext.js

import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  // Load user from session storage on initial load
  useEffect(() => {
    const storedUser = sessionStorage.getItem('masterAdminUser');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const login = (userData) => {
    setUser(userData);
    // Store user data in session storage to persist on page refresh
    sessionStorage.setItem('masterAdminUser', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    // Clear user data from session storage
    sessionStorage.removeItem('masterAdminUser');
  };

  const value = {
    user,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};