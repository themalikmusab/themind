export class ScanGridDisplay {
  constructor(session, onStop) {
    this.session = session;
    this.onStop = onStop;
    this.timeLeft = 6;
    this.timerInterval = null;
  }

  render() {
    const container = document.createElement('div');
    container.className = 'scangrid-container';
    container.id = 'scangrid-display';

    const title = document.createElement('h2');
    title.textContent = '📱 Students: Scan This Code';
    title.className = 'text-center mb-3';

    const subtitle = document.createElement('p');
    subtitle.textContent = 'Code refreshes every 6 seconds';
    subtitle.className = 'text-center';
    subtitle.style.opacity = '0.7';

    // ScanGrid display
    const displayBox = document.createElement('div');
    displayBox.className = 'scangrid-display glow pulse';

    const grid = document.createElement('div');
    grid.className = 'scangrid-grid';
    grid.id = 'scangrid-grid';

    // Render grid cells
    if (this.session.scanGrid && this.session.scanGrid.gridData) {
      this.session.scanGrid.gridData.forEach(row => {
        row.forEach(color => {
          const cell = document.createElement('div');
          cell.className = 'scangrid-cell';
          cell.style.backgroundColor = color;
          grid.appendChild(cell);
        });
      });
    }

    displayBox.appendChild(grid);

    // Timer
    const timer = document.createElement('div');
    timer.className = 'scangrid-timer pulse';
    timer.id = 'scangrid-timer';
    timer.textContent = '6';

    // Session info
    const info = document.createElement('div');
    info.className = 'mt-4';
    info.style.opacity = '0.8';

    const sessionId = document.createElement('p');
    sessionId.textContent = `Session ID: ${this.session.id}`;
    sessionId.style.fontFamily = 'monospace';

    const instruction = document.createElement('p');
    instruction.textContent = 'Keep this window open while students scan';
    instruction.className = 'mt-2';

    info.appendChild(sessionId);
    info.appendChild(instruction);

    // Stop button
    const stopBtn = document.createElement('button');
    stopBtn.className = 'btn btn-danger mt-4';
    stopBtn.style.width = '100%';
    stopBtn.textContent = '⏹ Stop Attendance';
    stopBtn.onclick = () => {
      if (confirm('Are you sure you want to stop attendance?')) {
        this.cleanup();
        this.onStop();
      }
    };

    container.appendChild(title);
    container.appendChild(subtitle);
    container.appendChild(displayBox);
    container.appendChild(timer);
    container.appendChild(info);
    container.appendChild(stopBtn);

    // Start countdown timer
    setTimeout(() => this.startTimer(), 0);

    return container;
  }

  startTimer() {
    this.timeLeft = 6;

    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }

    this.timerInterval = setInterval(() => {
      this.timeLeft--;

      const timerElement = document.getElementById('scangrid-timer');
      if (timerElement) {
        timerElement.textContent = this.timeLeft;

        // Change color as time runs out
        if (this.timeLeft <= 2) {
          timerElement.style.color = '#FF00AA'; // Pink warning
        } else {
          timerElement.style.color = '#00FFFF'; // Cyan
        }
      }

      if (this.timeLeft <= 0) {
        this.timeLeft = 6;
      }
    }, 1000);
  }

  cleanup() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }
}
