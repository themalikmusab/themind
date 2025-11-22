export class AuthService {
  constructor() {
    this.baseURL = '/api';
    this.token = localStorage.getItem('token');
  }

  async register(email, password, name, role) {
    const response = await fetch(`${this.baseURL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name, role })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Registration failed');
    }

    this.token = data.token;
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));

    return data.user;
  }

  async login(email, password) {
    const response = await fetch(`${this.baseURL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Login failed');
    }

    this.token = data.token;
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));

    return data.user;
  }

  async getCurrentUser() {
    if (!this.token) {
      return null;
    }

    try {
      const response = await fetch(`${this.baseURL}/auth/me`, {
        headers: { 'Authorization': `Bearer ${this.token}` }
      });

      if (!response.ok) {
        this.logout();
        return null;
      }

      const data = await response.json();
      localStorage.setItem('user', JSON.stringify(data.user));
      return data.user;
    } catch (error) {
      this.logout();
      return null;
    }
  }

  logout() {
    this.token = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  getToken() {
    return this.token;
  }

  isAuthenticated() {
    return !!this.token;
  }
}
