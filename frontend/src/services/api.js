/**
 * API Service Helper
 * Centralized API calls with error handling
 */

// Use environment variable in production, fallback to /api for local dev
const BASE_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api';

class APIService {
  getToken() {
    return localStorage.getItem('token');
  }

  async request(endpoint, options = {}) {
    const token = this.getToken();
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers
    };

    try {
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        ...options,
        headers
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Request failed');
      }

      return data;
    } catch (error) {
      console.error('API Request failed:', error);
      throw error;
    }
  }

  // Auth endpoints
  async login(email, password) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
  }

  async register(email, password, name, role) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name, role })
    });
  }

  async getCurrentUser() {
    return this.request('/auth/me');
  }

  // Class endpoints
  async getMyClasses() {
    return this.request('/classes/my-classes');
  }

  async createClass(name) {
    return this.request('/classes/create', {
      method: 'POST',
      body: JSON.stringify({ name })
    });
  }

  async joinClass(joinCode) {
    return this.request('/classes/join', {
      method: 'POST',
      body: JSON.stringify({ joinCode })
    });
  }

  async getClassDetails(classId) {
    return this.request(`/classes/${classId}`);
  }

  // Attendance endpoints
  async getClassAttendance(classId) {
    return this.request(`/attendance/class/${classId}`);
  }

  async getSessionDetails(sessionId) {
    return this.request(`/attendance/session/${sessionId}`);
  }

  async getAttendanceReport(classId) {
    return this.request(`/attendance/report/${classId}`);
  }

  async getMyAttendance(classId) {
    return this.request(`/attendance/my-attendance/${classId}`);
  }

  // Session endpoints
  async getActiveSession(classId) {
    return this.request(`/sessions/active/${classId}`);
  }

  // Health check
  async healthCheck() {
    return this.request('/health');
  }
}

export const apiService = new APIService();
