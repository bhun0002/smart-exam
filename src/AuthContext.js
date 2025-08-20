// src/AuthContext.js

import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const useAuth = () => {
    return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // Use a single, generic key for all authenticated users
    const userStorageKey = 'authenticatedUser';

    // Load user from session storage on initial load
    useEffect(() => {
        try {
            const storedUser = sessionStorage.getItem(userStorageKey);
            if (storedUser) {
                setUser(JSON.parse(storedUser));
            }
        } catch (error) {
            console.error("Failed to parse user data from session storage.", error);
            sessionStorage.removeItem(userStorageKey); // Clear corrupted data
        }
        setIsLoading(false);
    }, []);

    const login = (userData) => {
        setUser(userData);
        // Store user data (including their role) in session storage
        sessionStorage.setItem(userStorageKey, JSON.stringify(userData));
    };

    const logout = () => {
        setUser(null);
        // Clear user data from session storage
        sessionStorage.removeItem(userStorageKey);
    };

    const value = {
        user,
        login,
        logout,
        isLoading,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};