import { io } from 'socket.io-client';
import { ScanGridScanner } from '../components/ScanGridScanner.js';
import { StudentClassList } from '../components/StudentClassList.js';

export class StudentDashboard {
  constructor(user, onLogout) {
    this.user = user;
    this.onLogout = onLogout;
    this.currentView = 'classes'; // classes, scanner
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
    title.textContent = `🎓 Welcome, ${this.user.name}`;

    const subtitle = document.createElement('p');
    subtitle.style.opacity = '0.8';
    subtitle.textContent = 'Student Dashboard';

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
      const classList = new StudentClassList(
        this.user,
        (cls) => this.switchView('scanner', cls)
      );
      content.appendChild(classList.render());
    } else if (view === 'scanner') {
      this.renderScannerView(content);
    }
  }

  renderScannerView(container) {
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

    header.appendChild(backBtn);
    header.appendChild(title);

    const scanner = new ScanGridScanner(
      this.user,
      this.selectedClass,
      (result) => this.handleScanResult(result)
    );

    card.appendChild(header);
    card.appendChild(scanner.render());

    container.appendChild(card);
  }

  handleScanResult(result) {
    if (result.success) {
      // Show success notification with streak
      const notification = document.createElement('div');
      notification.className = 'modal-overlay';
      notification.style.backdropFilter = 'blur(20px)';

      const content = document.createElement('div');
      content.className = 'modal-content text-center';
      content.style.maxWidth = '400px';

      const icon = document.createElement('div');
      icon.style.fontSize = '80px';
      icon.textContent = '✅';

      const message = document.createElement('h2');
      message.style.marginTop = '20px';
      message.textContent = 'Attendance Marked!';

      const streak = document.createElement('div');
      streak.className = 'streak-badge mt-3';
      streak.style.fontSize = '24px';
      streak.style.justifyContent = 'center';
      streak.innerHTML = `<span class="streak-fire">🔥</span> ${result.streak}-day streak!`;

      if (result.maxStreak > result.streak) {
        const maxStreak = document.createElement('p');
        maxStreak.className = 'mt-2';
        maxStreak.style.opacity = '0.7';
        maxStreak.textContent = `Best: ${result.maxStreak} days`;
        content.appendChild(maxStreak);
      }

      const closeBtn = document.createElement('button');
      closeBtn.className = 'btn btn-primary mt-4';
      closeBtn.style.width = '100%';
      closeBtn.textContent = 'Awesome!';
      closeBtn.onclick = () => {
        notification.remove();
        this.switchView('classes');
      };

      content.appendChild(icon);
      content.appendChild(message);
      content.appendChild(streak);
      content.appendChild(closeBtn);

      notification.appendChild(content);
      document.body.appendChild(notification);

      // Auto-close after 5 seconds
      setTimeout(() => {
        if (notification.parentNode) {
          notification.remove();
          this.switchView('classes');
        }
      }, 5000);
    } else {
      // Show error
      alert(result.message || 'Failed to mark attendance');
    }
  }
}
