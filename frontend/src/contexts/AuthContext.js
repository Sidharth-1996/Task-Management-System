import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');

    if (storedToken && storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        setToken(storedToken);
      } catch (error) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (credentials) => {
    try {
      const response = await authAPI.login(credentials);
      
      // Check if response has access token
      if (!response || !response.access) {
        return { 
          success: false, 
          error: 'Invalid response from server. Please check if backend is running.' 
        };
      }
      
      // Extract user data from response (backend includes user data)
      const userData = response.user || {
        id: response.user_id,
        username: credentials.username || credentials.email,
        email: credentials.email || credentials.username,
        role: 'user',
        name: credentials.username || credentials.email,
      };

      // Store token and user data
      localStorage.setItem('token', response.access);
      localStorage.setItem('refresh_token', response.refresh);
      localStorage.setItem('user', JSON.stringify(userData));

      // Update state
      setToken(response.access);
      setUser(userData);

      return { success: true, user: userData };
    } catch (error) {
      // Handle different types of errors
      let errorMessage = 'Login failed. Please check your credentials.';
      
      if (error.response) {
        // Server responded with error status
        const data = error.response.data;
        if (data.detail) {
          errorMessage = data.detail;
        } else if (data.message) {
          errorMessage = data.message;
        } else if (data.non_field_errors) {
          errorMessage = Array.isArray(data.non_field_errors) 
            ? data.non_field_errors[0] 
            : data.non_field_errors;
        } else if (data.username) {
          errorMessage = Array.isArray(data.username) 
            ? data.username[0] 
            : data.username;
        } else if (data.password) {
          errorMessage = Array.isArray(data.password) 
            ? data.password[0] 
            : data.password;
        }
      } else if (error.request) {
        // Request was made but no response received
        errorMessage = 'Cannot connect to server. Please check if the backend is running and accessible.';
      } else {
        // Something else happened
        errorMessage = error.message || 'An unexpected error occurred';
      }
      
      return { success: false, error: errorMessage };
    }
  };

  /**
   * Signup function
   * Registers a new user and automatically logs them in
   */
  const signup = async (userData) => {
    try {
      // Call signup API
      const response = await authAPI.signup(userData);
      
      // Extract user data from response
      const newUser = response.user || {
        id: response.id,
        username: userData.username || userData.email,
        email: userData.email,
        role: userData.role || 'user',
        name: userData.first_name && userData.last_name 
          ? `${userData.first_name} ${userData.last_name}` 
          : userData.username || userData.email,
      };

      // Store token and user data
      localStorage.setItem('token', response.access);
      localStorage.setItem('refresh_token', response.refresh);
      localStorage.setItem('user', JSON.stringify(newUser));

      // Update state
      setToken(response.access);
      setUser(newUser);

      return { success: true, user: newUser };
    } catch (error) {
      // Return error message
      const errorMessage = error.response?.data?.detail || 
                          error.response?.data?.message || 
                          error.response?.data?.email?.[0] ||
                          error.response?.data?.username?.[0] ||
                          'Signup failed. Please try again.';
      return { success: false, error: errorMessage };
    }
  };

  /**
   * Logout function
   * Clears authentication data and redirects to login
   */
  const logout = () => {
    // Clear localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');

    // Clear state
    setToken(null);
    setUser(null);
  };

  // Context value
  const value = {
    user,
    token,
    loading,
    login,
    signup,
    logout,
    isAuthenticated: !!token && !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * useAuth Hook
 * Custom hook to access authentication context
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

