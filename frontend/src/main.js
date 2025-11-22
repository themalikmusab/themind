import './style.css';
import { AuthService } from './services/auth.js';
import { LoginPage } from './pages/Login.js';
import { TeacherDashboard } from './pages/TeacherDashboard.js';
import { StudentDashboard } from './pages/StudentDashboard.js';

class App {
  constructor() {
    this.authService = new AuthService();
    this.currentPage = null;
    this.init();
  }

  async init() {
    // Check if user is logged in
    const user = await this.authService.getCurrentUser();

    if (user) {
      this.showDashboard(user);
    } else {
      this.showLogin();
    }
  }

  showLogin() {
    const loginPage = new LoginPage(async (user) => {
      this.showDashboard(user);
    });

    document.getElementById('app').innerHTML = '';
    document.getElementById('app').appendChild(loginPage.render());
  }

  showDashboard(user) {
    let dashboard;

    if (user.role === 'teacher') {
      dashboard = new TeacherDashboard(user, () => this.logout());
    } else {
      dashboard = new StudentDashboard(user, () => this.logout());
    }

    document.getElementById('app').innerHTML = '';
    document.getElementById('app').appendChild(dashboard.render());
  }

  logout() {
    this.authService.logout();
    this.showLogin();
  }
}

// Start the app
new App();
