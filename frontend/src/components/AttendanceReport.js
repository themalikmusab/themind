export class AttendanceReport {
  constructor(classData) {
    this.classData = classData;
    this.reportData = null;
  }

  render() {
    const container = document.createElement('div');
    container.className = 'card';

    const header = document.createElement('div');
    header.className = 'card-header';

    const title = document.createElement('h2');
    title.textContent = `📊 Attendance Report: ${this.classData.name}`;

    const exportBtn = document.createElement('button');
    exportBtn.className = 'btn btn-success';
    exportBtn.textContent = '📥 Export CSV';
    exportBtn.onclick = () => this.exportToCSV();

    header.appendChild(title);
    header.appendChild(exportBtn);

    const content = document.createElement('div');
    content.id = 'report-content';
    content.innerHTML = '<div class="spinner"></div>';

    container.appendChild(header);
    container.appendChild(content);

    // Load report data
    this.loadReport();

    return container;
  }

  async loadReport() {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/attendance/report/${this.classData.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();
      this.reportData = data;

      this.renderReport();
    } catch (error) {
      console.error('Error loading report:', error);
      const content = document.getElementById('report-content');
      content.innerHTML = '<div class="alert alert-error">Failed to load report</div>';
    }
  }

  renderReport() {
    const content = document.getElementById('report-content');
    if (!content) return;

    content.innerHTML = '';

    if (!this.reportData || this.reportData.students.length === 0) {
      content.innerHTML = `
        <div class="text-center mt-4" style="opacity: 0.7;">
          <p style="font-size: 48px; margin-bottom: 16px;">📊</p>
          <p>No attendance data yet</p>
        </div>
      `;
      return;
    }

    // Summary stats
    const summary = document.createElement('div');
    summary.className = 'grid grid-3 mb-4';

    const totalStudents = document.createElement('div');
    totalStudents.className = 'card';
    totalStudents.innerHTML = `
      <div style="font-size: 32px; font-weight: bold;">${this.reportData.students.length}</div>
      <div style="opacity: 0.8;">Total Students</div>
    `;

    const totalSessions = document.createElement('div');
    totalSessions.className = 'card';
    totalSessions.innerHTML = `
      <div style="font-size: 32px; font-weight: bold;">${this.reportData.sessions.length}</div>
      <div style="opacity: 0.8;">Total Sessions</div>
    `;

    const avgAttendance = this.calculateAverageAttendance();
    const avgCard = document.createElement('div');
    avgCard.className = 'card';
    avgCard.innerHTML = `
      <div style="font-size: 32px; font-weight: bold;">${avgAttendance}%</div>
      <div style="opacity: 0.8;">Average Attendance</div>
    `;

    summary.appendChild(totalStudents);
    summary.appendChild(totalSessions);
    summary.appendChild(avgCard);

    // Table
    const tableWrapper = document.createElement('div');
    tableWrapper.style.overflowX = 'auto';

    const table = document.createElement('table');
    table.className = 'table';

    // Header
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');

    const nameHeader = document.createElement('th');
    nameHeader.textContent = 'Student';

    const emailHeader = document.createElement('th');
    emailHeader.textContent = 'Email';

    const presentHeader = document.createElement('th');
    presentHeader.textContent = 'Present';

    const totalHeader = document.createElement('th');
    totalHeader.textContent = 'Total';

    const percentHeader = document.createElement('th');
    percentHeader.textContent = 'Percentage';

    headerRow.appendChild(nameHeader);
    headerRow.appendChild(emailHeader);
    headerRow.appendChild(presentHeader);
    headerRow.appendChild(totalHeader);
    headerRow.appendChild(percentHeader);

    thead.appendChild(headerRow);

    // Body
    const tbody = document.createElement('tbody');

    this.reportData.students.forEach(student => {
      const row = document.createElement('tr');

      const nameCell = document.createElement('td');
      nameCell.textContent = student.name;

      const emailCell = document.createElement('td');
      emailCell.textContent = student.email;
      emailCell.style.opacity = '0.7';

      const presentCell = document.createElement('td');
      presentCell.textContent = student.presentCount;
      presentCell.style.color = '#00FF00';
      presentCell.style.fontWeight = 'bold';

      const totalCell = document.createElement('td');
      totalCell.textContent = student.totalSessions;

      const percentCell = document.createElement('td');
      const percentage = parseFloat(student.percentage);
      percentCell.textContent = `${student.percentage}%`;
      percentCell.style.fontWeight = 'bold';

      // Color code percentage
      if (percentage >= 75) {
        percentCell.style.color = '#00FF00'; // Green
      } else if (percentage >= 50) {
        percentCell.style.color = '#FFFF00'; // Yellow
      } else {
        percentCell.style.color = '#FF0000'; // Red
      }

      row.appendChild(nameCell);
      row.appendChild(emailCell);
      row.appendChild(presentCell);
      row.appendChild(totalCell);
      row.appendChild(percentCell);

      tbody.appendChild(row);
    });

    table.appendChild(thead);
    table.appendChild(tbody);
    tableWrapper.appendChild(table);

    content.appendChild(summary);
    content.appendChild(tableWrapper);
  }

  calculateAverageAttendance() {
    if (!this.reportData || this.reportData.students.length === 0) {
      return 0;
    }

    const total = this.reportData.students.reduce((sum, student) => {
      return sum + parseFloat(student.percentage);
    }, 0);

    return (total / this.reportData.students.length).toFixed(1);
  }

  exportToCSV() {
    if (!this.reportData) return;

    let csv = 'Name,Email,Present,Total Sessions,Percentage\n';

    this.reportData.students.forEach(student => {
      csv += `"${student.name}","${student.email}",${student.presentCount},${student.totalSessions},${student.percentage}%\n`;
    });

    // Create download link
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${this.classData.name.replace(/\s+/g, '_')}_attendance_report.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }
}
