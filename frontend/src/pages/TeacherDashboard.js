import { io } from '../../../node_modules/socket.io-client/dist/socket.io.esm.min.js';
import { ScanGridDisplay } from '../components/ScanGridDisplay.js';
import { ClassManager } from '../components/ClassManager.js';
import { AttendanceReport } from '../components/AttendanceReport.js';

export class TeacherDashboard {
  constructor(user, onLogout) {
    this.user = user;
    this.onLogout = onLogout;
    this.socket = null;
    this.activeSession = null;
    this.currentView = 'classes'; // classes, session, report
    this.selectedClass = null;
  }

  render() {
    const container = document.createElement('div');
    container.className = 'container';

    // Header
    const header = document.createElement('div');
    header.className = 'dashboard-header';

    const headerContent = document.createElement('div');
    headerContent.className = 'flex justify-between items-center';

    const titleDiv = document.createElement('div');
    const title = document.createElement('h1');
    title.className = 'dashboard-title';
    title.textContent = `👨‍🏫 Welcome, ${this.user.name}`;

    const subtitle = document.createElement('p');
    subtitle.style.opacity = '0.8';
    subtitle.textContent = 'Teacher Dashboard';

    titleDiv.appendChild(title);
    titleDiv.appendChild(subtitle);

    const logoutBtn = document.createElement('button');
    logoutBtn.className = 'btn btn-secondary';
    logoutBtn.textContent = '🚪 Logout';
    logoutBtn.onclick = () => this.onLogout();

    headerContent.appendChild(titleDiv);
    headerContent.appendChild(logoutBtn);
    header.appendChild(headerContent);

    // Navigation
    const nav = document.createElement('div');
    nav.className = 'card';
    nav.style.padding = '12px';

    const navButtons = document.createElement('div');
    navButtons.className = 'flex gap-2';
    navButtons.id = 'nav-buttons';

    const classesBtn = document.createElement('button');
    classesBtn.className = 'btn btn-primary';
    classesBtn.textContent = '📚 My Classes';
    classesBtn.onclick = () => this.switchView('classes');

    navButtons.appendChild(classesBtn);
    nav.appendChild(navButtons);

    // Content area
    const content = document.createElement('div');
    content.id = 'dashboard-content';

    container.appendChild(header);
    container.appendChild(nav);
    container.appendChild(content);

    // Load initial view
    setTimeout(() => this.switchView('classes'), 0);

    return container;
  }

  switchView(view, classData = null) {
    this.currentView = view;
    this.selectedClass = classData;

    const content = document.getElementById('dashboard-content');
    content.innerHTML = '';

    if (view === 'classes') {
      const classManager = new ClassManager(
        this.user,
        (cls) => this.switchView('session', cls)
      );
      content.appendChild(classManager.render());
    } else if (view === 'session') {
      this.renderSessionView(content);
    } else if (view === 'report') {
      const report = new AttendanceReport(this.selectedClass);
      content.appendChild(report.render());
    }
  }

  renderSessionView(container) {
    const card = document.createElement('div');
    card.className = 'card';

    const header = document.createElement('div');
    header.className = 'card-header';

    const backBtn = document.createElement('button');
    backBtn.className = 'btn btn-secondary';
    backBtn.textContent = '← Back';
    backBtn.onclick = () => this.switchView('classes');

    const title = document.createElement('h2');
    title.textContent = this.selectedClass.name;

    const viewReportBtn = document.createElement('button');
    viewReportBtn.className = 'btn btn-secondary';
    viewReportBtn.textContent = '📊 View Report';
    viewReportBtn.onclick = () => this.switchView('report', this.selectedClass);

    header.appendChild(backBtn);
    header.appendChild(title);
    header.appendChild(viewReportBtn);

    const content = document.createElement('div');
    content.id = 'session-content';

    if (!this.activeSession) {
      const startBtn = document.createElement('button');
      startBtn.className = 'btn btn-success btn-large';
      startBtn.style.width = '100%';
      startBtn.style.padding = '20px';
      startBtn.style.fontSize = '20px';
      startBtn.textContent = '🚀 Start Attendance Session';
      startBtn.onclick = () => this.startSession();

      content.appendChild(startBtn);
    } else {
      const scanGridDisplay = new ScanGridDisplay(this.activeSession, () => this.stopSession());
      content.appendChild(scanGridDisplay.render());
    }

    card.appendChild(header);
    card.appendChild(content);
    container.appendChild(card);
  }

  async startSession() {
    try {
      // Connect to socket (use environment variable for production)
      const socketUrl = import.meta.env.VITE_API_URL || window.location.origin;
      this.socket = io(socketUrl);

      this.socket.on('connect', () => {
        console.log('Connected to server');

        // Start session
        this.socket.emit('start-session', {
          classId: this.selectedClass.id,
          teacherId: this.user.id
        });
      });

      this.socket.on('session-started', (session) => {
        console.log('Session started:', session);
        this.activeSession = session;
        this.switchView('session', this.selectedClass);

        // Listen for ScanGrid updates
        this.socket.on('scangrid-update', (newScanGrid) => {
          console.log('ScanGrid updated');
          const display = document.getElementById('scangrid-display');
          if (display) {
            this.updateScanGrid(newScanGrid);
          }
        });
      });

      this.socket.on('error', (error) => {
        alert('Error: ' + error.message);
      });

    } catch (error) {
      console.error('Error starting session:', error);
      alert('Failed to start session');
    }
  }

  updateScanGrid(scanGrid) {
    const display = document.getElementById('scangrid-display');
    if (!display) return;

    const scanGridDisplay = new ScanGridDisplay(
      { ...this.activeSession, scanGrid },
      () => this.stopSession()
    );

    display.replaceWith(scanGridDisplay.render());
  }

  async stopSession() {
    if (!this.socket || !this.activeSession) return;

    this.socket.emit('stop-session', {
      sessionId: this.activeSession.id
    });

    this.socket.disconnect();
    this.socket = null;
    this.activeSession = null;

    this.switchView('session', this.selectedClass);
  }
}
