import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: async (credentials) => {
    const username = credentials.username || credentials.email;
    
    if (!username || !credentials.password) {
      throw new Error('Username/email and password are required');
    }
    
    const loginData = {
      username: username.trim(),
      password: credentials.password,
    };
    
    const response = await api.post('/token/', loginData);
    return response.data;
  },

  signup: async (userData) => {
    const response = await api.post('/accounts/signup/', userData);
    return response.data;
  },

  refreshToken: async (refreshToken) => {
    const response = await api.post('/token/refresh/', {
      refresh: refreshToken,
    });
    return response.data;
  },
};

export const tasksAPI = {
  getTasks: async (params = {}) => {
    const response = await api.get('/tasks/', { params });
    return response.data;
  },

  getTask: async (id) => {
    const response = await api.get(`/tasks/${id}/`);
    return response.data;
  },

  createTask: async (taskData) => {
    const response = await api.post('/tasks/', taskData);
    return response.data;
  },

  updateTask: async (id, taskData) => {
    const response = await api.patch(`/tasks/${id}/`, taskData);
    return response.data;
  },

  deleteTask: async (id) => {
    const response = await api.delete(`/tasks/${id}/`);
    return response.data;
  },

  getCalendarTasks: async (startDate, endDate) => {
    const params = {};
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;
    const response = await api.get('/tasks/calendar/', { params });
    return response.data;
  },
};

export const dashboardAPI = {
  getStats: async () => {
    const response = await api.get('/dashboard/stats/');
    return response.data;
  },
};

export const teamsAPI = {
  getTeams: async () => {
    const response = await api.get('/teams/');
    return response.data;
  },

  getTeam: async (id) => {
    const response = await api.get(`/teams/${id}/`);
    return response.data;
  },

  createTeam: async (teamData) => {
    const response = await api.post('/teams/', teamData);
    return response.data;
  },

  updateTeam: async (id, teamData) => {
    const response = await api.put(`/teams/${id}/`, teamData);
    return response.data;
  },

  deleteTeam: async (id) => {
    const response = await api.delete(`/teams/${id}/`);
    return response.data;
  },
};

export const employeesAPI = {
  getEmployees: async (params = {}) => {
    const response = await api.get('/employees/', { params });
    return response.data;
  },

  getEmployee: async (id) => {
    const response = await api.get(`/employees/${id}/`);
    return response.data;
  },

  createEmployee: async (employeeData) => {
    const response = await api.post('/employees/', employeeData);
    return response.data;
  },

  updateEmployee: async (id, employeeData) => {
    const response = await api.patch(`/employees/${id}/`, employeeData);
    return response.data;
  },

  deleteEmployee: async (id) => {
    const response = await api.delete(`/employees/${id}/`);
    return response.data;
  },
};

export const attendanceAPI = {
  getAttendance: async (params = {}) => {
    const response = await api.get('/attendance/', { params });
    return response.data;
  },

  getAttendanceRecord: async (id) => {
    const response = await api.get(`/attendance/${id}/`);
    return response.data;
  },

  createAttendance: async (attendanceData) => {
    const response = await api.post('/attendance/', attendanceData);
    return response.data;
  },

  updateAttendance: async (id, attendanceData) => {
    const response = await api.patch(`/attendance/${id}/`, attendanceData);
    return response.data;
  },

  deleteAttendance: async (id) => {
    const response = await api.delete(`/attendance/${id}/`);
    return response.data;
  },
};

export const payrollAPI = {
  getPayroll: async (params = {}) => {
    const response = await api.get('/payroll/', { params });
    return response.data;
  },

  getPayrollRecord: async (id) => {
    const response = await api.get(`/payroll/${id}/`);
    return response.data;
  },

  createPayroll: async (payrollData) => {
    const response = await api.post('/payroll/', payrollData);
    return response.data;
  },

  updatePayroll: async (id, payrollData) => {
    const response = await api.patch(`/payroll/${id}/`, payrollData);
    return response.data;
  },

  deletePayroll: async (id) => {
    const response = await api.delete(`/payroll/${id}/`);
    return response.data;
  },
};

export const usersAPI = {
  getUsers: async () => {
    const response = await api.get('/accounts/users/');
    return response.data;
  },

  getUser: async (id) => {
    const response = await api.get(`/accounts/users/${id}/`);
    return response.data;
  },

  createUser: async (userData) => {
    const response = await api.post('/accounts/users/', userData);
    return response.data;
  },

  updateUser: async (id, userData) => {
    const response = await api.put(`/accounts/users/${id}/`, userData);
    return response.data;
  },

  deleteUser: async (id) => {
    const response = await api.delete(`/accounts/users/${id}/`);
    return response.data;
  },
};

export const settingsAPI = {
  getOrganizationSettings: async () => {
    const response = await api.get('/settings/organization/');
    return response.data;
  },

  updateOrganizationSettings: async (settingsData) => {
    const response = await api.put('/settings/organization/', settingsData);
    return response.data;
  },

  getSystemPreferences: async () => {
    const response = await api.get('/settings/preferences/');
    return response.data;
  },

  updateSystemPreferences: async (preferencesData) => {
    const response = await api.put('/settings/preferences/', preferencesData);
    return response.data;
  },

  resetUserPassword: async (userId, newPassword) => {
    const response = await api.post(`/settings/users/${userId}/reset-password/`, {
      new_password: newPassword,
    });
    return response.data;
  },
};

export default api;

