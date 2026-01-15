/**
 * API Service
 * Handles all API calls to the Django backend
 * Uses Axios for HTTP requests with JWT token authentication
 */
import axios from 'axios';

// Base URL for the Django backend API
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

// Create axios instance with default configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add JWT token to all requests
api.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const token = localStorage.getItem('token');
    if (token) {
      // Add Bearer token to Authorization header
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 Unauthorized - token expired or invalid
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Authentication API endpoints
export const authAPI = {
  /**
   * Login user with email/username and password
   * Returns JWT access and refresh tokens with user data
   */
  login: async (credentials) => {
    // Support both username and email login
    const loginData = {
      username: credentials.username || credentials.email,
      password: credentials.password,
    };
    const response = await api.post('/token/', loginData);
    return response.data;
  },

  /**
   * Register a new user
   * Returns user data and JWT tokens
   */
  signup: async (userData) => {
    const response = await api.post('/accounts/signup/', userData);
    return response.data;
  },

  /**
   * Refresh JWT access token using refresh token
   */
  refreshToken: async (refreshToken) => {
    const response = await api.post('/token/refresh/', {
      refresh: refreshToken,
    });
    return response.data;
  },
};

// Tasks API endpoints
export const tasksAPI = {
  /**
   * Get all tasks with optional filters (search, status, pagination)
   */
  getTasks: async (params = {}) => {
    const response = await api.get('/tasks/', { params });
    return response.data;
  },

  /**
   * Get a single task by ID
   */
  getTask: async (id) => {
    const response = await api.get(`/tasks/${id}/`);
    return response.data;
  },

  /**
   * Create a new task
   */
  createTask: async (taskData) => {
    const response = await api.post('/tasks/', taskData);
    return response.data;
  },

  /**
   * Update an existing task
   * Uses PATCH for partial updates (better for status-only updates)
   */
  updateTask: async (id, taskData) => {
    // Use PATCH for partial updates (allows updating only specific fields)
    const response = await api.patch(`/tasks/${id}/`, taskData);
    return response.data;
  },

  /**
   * Delete a task
   */
  deleteTask: async (id) => {
    const response = await api.delete(`/tasks/${id}/`);
    return response.data;
  },

  /**
   * Get tasks for calendar view
   */
  getCalendarTasks: async (startDate, endDate) => {
    const params = {};
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;
    const response = await api.get('/tasks/calendar/', { params });
    return response.data;
  },
};

// Users API endpoints (Admin only)
export const usersAPI = {
  /**
   * Get all users (Admin only)
   */
  getUsers: async () => {
    const response = await api.get('/accounts/users/');
    return response.data;
  },

  /**
   * Get a single user by ID (Admin only)
   */
  getUser: async (id) => {
    const response = await api.get(`/accounts/users/${id}/`);
    return response.data;
  },

  /**
   * Create a new user (Admin only)
   */
  createUser: async (userData) => {
    const response = await api.post('/accounts/users/', userData);
    return response.data;
  },

  /**
   * Update an existing user (Admin only)
   */
  updateUser: async (id, userData) => {
    const response = await api.put(`/accounts/users/${id}/`, userData);
    return response.data;
  },

  /**
   * Delete a user (Admin only)
   */
  deleteUser: async (id) => {
    const response = await api.delete(`/accounts/users/${id}/`);
    return response.data;
  },
};

export default api;

