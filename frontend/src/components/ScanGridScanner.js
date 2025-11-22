import { io } from '../../../node_modules/socket.io-client/dist/socket.io.esm.min.js';
import { apiService } from '../services/api.js';

export class ScanGridScanner {
  constructor(user, classData, onScanComplete) {
    this.user = user;
    this.classData = classData;
    this.onScanComplete = onScanComplete;
    this.videoElement = null;
    this.canvasElement = null;
    this.isScanning = false;
    this.scanInterval = null;
    this.socket = null;
    this.activeSession = null;
  }

  render() {
    const container = document.createElement('div');
    container.className = 'mt-3';

    const title = document.createElement('h3');
    title.className = 'text-center mb-3';
    title.textContent = '📸 Scan Attendance Code';

    const instruction = document.createElement('p');
    instruction.className = 'text-center mb-3';
    instruction.style.opacity = '0.8';
    instruction.textContent = 'Point your camera at the teacher\'s ScanGrid';

    // Scanner container
    const scannerContainer = document.createElement('div');
    scannerContainer.className = 'scanner-container';

    // Video element
    this.videoElement = document.createElement('video');
    this.videoElement.className = 'scanner-video';
    this.videoElement.autoplay = true;
    this.videoElement.playsInline = true;

    // Canvas for processing (hidden)
    this.canvasElement = document.createElement('canvas');
    this.canvasElement.style.display = 'none';

    // Overlay
    const overlay = document.createElement('div');
    overlay.className = 'scanner-overlay';

    scannerContainer.appendChild(this.videoElement);
    scannerContainer.appendChild(overlay);
    scannerContainer.appendChild(this.canvasElement);

    // Status
    const status = document.createElement('div');
    status.className = 'text-center mt-3';
    status.id = 'scanner-status';
    status.innerHTML = '<div class="spinner"></div><p class="mt-2">Checking for active session...</p>';

    // Control buttons
    const controls = document.createElement('div');
    controls.className = 'flex gap-2 mt-3';
    controls.id = 'scanner-controls';
    controls.style.display = 'none';

    const stopBtn = document.createElement('button');
    stopBtn.className = 'btn btn-danger flex-1';
    stopBtn.textContent = '⏹ Stop Scanner';
    stopBtn.onclick = () => this.stopScanning();

    controls.appendChild(stopBtn);

    container.appendChild(title);
    container.appendChild(instruction);
    container.appendChild(scannerContainer);
    container.appendChild(status);
    container.appendChild(controls);

    // Check for active session then start scanner
    setTimeout(() => this.checkAndStartScanning(), 100);

    return container;
  }

  async checkAndStartScanning() {
    const status = document.getElementById('scanner-status');

    try {
      // Check if there's an active session for this class
      const response = await apiService.getActiveSession(this.classData.id);

      if (response.success && response.session) {
        this.activeSession = response.session;
        status.innerHTML = '<div class="spinner"></div><p class="mt-2">Starting camera...</p>';
        await this.startScanning();
      } else {
        status.innerHTML = `
          <div class="alert alert-info">
            <p style="font-size: 32px; margin-bottom: 8px;">⏰</p>
            <p><strong>No Active Session</strong></p>
            <p style="margin-top: 8px; opacity: 0.8;">Waiting for teacher to start attendance...</p>
          </div>
        `;

        // Connect to socket to listen for session start
        this.listenForSessionStart();
      }
    } catch (error) {
      console.error('Error checking session:', error);
      status.innerHTML = `
        <div class="alert alert-error">
          <p>❌ Error checking for active session</p>
          <p style="margin-top: 8px; opacity: 0.8;">${error.message}</p>
        </div>
      `;
    }
  }

  listenForSessionStart() {
    const socketUrl = import.meta.env.VITE_API_URL || window.location.origin;
    this.socket = io(socketUrl);

    this.socket.on('connect', () => {
      console.log('Connected to server, waiting for session...');
      this.socket.emit('join-class', {
        classId: this.classData.id
      });
    });

    this.socket.on('session-available', (data) => {
      if (data.classId === this.classData.id) {
        console.log('Session started!', data);
        this.activeSession = { id: data.sessionId, classId: data.classId };

        const status = document.getElementById('scanner-status');
        status.innerHTML = '<div class="spinner"></div><p class="mt-2">Session started! Starting camera...</p>';

        this.startScanning();
      }
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from server');
    });
  }

  async startScanning() {
    try {
      // Request camera access
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Use back camera on mobile
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      this.videoElement.srcObject = stream;

      // Wait for video to be ready
      this.videoElement.onloadedmetadata = () => {
        const status = document.getElementById('scanner-status');
        status.innerHTML = '<p style="color: #00FF00; font-weight: bold;">🟢 Scanning... Point at code</p>';

        const controls = document.getElementById('scanner-controls');
        if (controls) {
          controls.style.display = 'flex';
        }

        this.isScanning = true;
        this.startScanLoop();
      };

      // Connect to socket if not already connected
      if (!this.socket || !this.socket.connected) {
        const socketUrl = import.meta.env.VITE_API_URL || window.location.origin;
        this.socket = io(socketUrl);
        this.socket.on('connect', () => {
          console.log('Scanner connected to server');
        });
      }

    } catch (error) {
      console.error('Camera access error:', error);
      const status = document.getElementById('scanner-status');

      let errorMessage = '❌ Camera access denied. Please allow camera access.';
      if (error.name === 'NotAllowedError') {
        errorMessage = '❌ Camera permission denied. Please allow camera access in browser settings.';
      } else if (error.name === 'NotFoundError') {
        errorMessage = '❌ No camera found. Please ensure you have a camera connected.';
      } else if (error.name === 'NotReadableError') {
        errorMessage = '❌ Camera is already in use by another application.';
      }

      status.innerHTML = `<div class="alert alert-error"><p>${errorMessage}</p></div>`;
    }
  }

  startScanLoop() {
    // Scan every 200ms for optimal performance vs battery
    this.scanInterval = setInterval(() => {
      if (!this.isScanning) return;

      this.detectScanGrid();
    }, 200);
  }

  detectScanGrid() {
    if (!this.videoElement || !this.canvasElement) return;

    const video = this.videoElement;
    const canvas = this.canvasElement;
    const ctx = canvas.getContext('2d');

    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    if (canvas.width === 0 || canvas.height === 0) return;

    // Draw current video frame
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Detect ScanGrid in center of frame
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const gridSize = Math.min(canvas.width, canvas.height) * 0.5; // 50% of frame

    try {
      const gridData = this.extractGridFromFrame(ctx, centerX, centerY, gridSize);

      if (gridData) {
        this.processScanGrid(gridData);
      }
    } catch (error) {
      console.error('Grid detection error:', error);
    }
  }

  extractGridFromFrame(ctx, centerX, centerY, gridSize) {
    const cellSize = gridSize / 10;
    const startX = centerX - gridSize / 2;
    const startY = centerY - gridSize / 2;

    const grid = [];
    const colors = [
      '#00FFFF', '#FF00FF', '#FFFF00', '#00FF00',
      '#FF00AA', '#AA00FF', '#FF6600', '#0066FF'
    ];

    let validColorCount = 0;
    const confidenceThreshold = 70; // Need at least 70% valid colors

    // Extract 10x10 grid
    for (let row = 0; row < 10; row++) {
      const rowData = [];

      for (let col = 0; col < 10; col++) {
        const x = Math.floor(startX + col * cellSize + cellSize / 2);
        const y = Math.floor(startY + row * cellSize + cellSize / 2);

        // Sample multiple pixels for better accuracy
        const samples = [
          ctx.getImageData(x, y, 1, 1).data,
          ctx.getImageData(x - 2, y, 1, 1).data,
          ctx.getImageData(x + 2, y, 1, 1).data,
          ctx.getImageData(x, y - 2, 1, 1).data,
          ctx.getImageData(x, y + 2, 1, 1).data
        ];

        // Average the samples
        const avgPixel = [0, 0, 0];
        samples.forEach(sample => {
          avgPixel[0] += sample[0];
          avgPixel[1] += sample[1];
          avgPixel[2] += sample[2];
        });
        avgPixel[0] = Math.floor(avgPixel[0] / samples.length);
        avgPixel[1] = Math.floor(avgPixel[1] / samples.length);
        avgPixel[2] = Math.floor(avgPixel[2] / samples.length);

        // Convert to hex
        const hex = '#' +
          ('0' + avgPixel[0].toString(16)).slice(-2).toUpperCase() +
          ('0' + avgPixel[1].toString(16)).slice(-2).toUpperCase() +
          ('0' + avgPixel[2].toString(16)).slice(-2).toUpperCase();

        // Find closest matching color
        const closestColor = this.findClosestColor(hex, colors);
        rowData.push(closestColor);

        // Check if color is valid (distance check)
        const distance = this.colorDistance(hex, closestColor);
        if (distance < 120) { // Increased tolerance
          validColorCount++;
        }
      }

      grid.push(rowData);
    }

    // Only return grid if we detected enough valid colors
    if (validColorCount >= confidenceThreshold) {
      return grid;
    }

    return null;
  }

  findClosestColor(hex, palette) {
    const rgb = this.hexToRgb(hex);
    let minDistance = Infinity;
    let closestColor = palette[0];

    palette.forEach(color => {
      const paletteRgb = this.hexToRgb(color);
      const distance = this.colorDistance(hex, color);

      if (distance < minDistance) {
        minDistance = distance;
        closestColor = color;
      }
    });

    return closestColor;
  }

  colorDistance(hex1, hex2) {
    const rgb1 = this.hexToRgb(hex1);
    const rgb2 = this.hexToRgb(hex2);

    return Math.sqrt(
      Math.pow(rgb1.r - rgb2.r, 2) +
      Math.pow(rgb1.g - rgb2.g, 2) +
      Math.pow(rgb1.b - rgb2.b, 2)
    );
  }

  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
  }

  processScanGrid(gridData) {
    // Stop scanning temporarily to avoid duplicate scans
    this.isScanning = false;

    const status = document.getElementById('scanner-status');
    status.innerHTML = '<div class="spinner"></div><p class="mt-2">⚡ Processing code...</p>';

    // Send to server via socket
    this.socket.emit('scan-code', {
      classId: this.classData.id,
      studentId: this.user.id,
      scannedData: { gridData },
      timestamp: Date.now()
    });

    this.socket.once('scan-result', (result) => {
      this.stopScanning();
      this.onScanComplete(result);
    });

    this.socket.once('scan-error', (error) => {
      status.innerHTML = `<p style="color: #FF0000;">❌ ${error.message}</p>`;

      // Resume scanning after 2 seconds
      setTimeout(() => {
        if (this.videoElement && this.videoElement.srcObject) {
          this.isScanning = true;
          status.innerHTML = '<p style="color: #00FF00; font-weight: bold;">🟢 Scanning... Point at code</p>';
        }
      }, 2000);
    });
  }

  stopScanning() {
    this.isScanning = false;

    if (this.scanInterval) {
      clearInterval(this.scanInterval);
      this.scanInterval = null;
    }

    if (this.videoElement && this.videoElement.srcObject) {
      this.videoElement.srcObject.getTracks().forEach(track => track.stop());
      this.videoElement.srcObject = null;
    }

    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}
