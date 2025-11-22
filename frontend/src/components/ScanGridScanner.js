import { io } from 'socket.io-client';

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
    status.innerHTML = '<div class="spinner"></div><p class="mt-2">Starting camera...</p>';

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

    // Start scanner
    setTimeout(() => this.startScanning(), 100);

    return container;
  }

  async startScanning() {
    try {
      // Request camera access
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' } // Use back camera on mobile
      });

      this.videoElement.srcObject = stream;

      // Wait for video to be ready
      this.videoElement.onloadedmetadata = () => {
        const status = document.getElementById('scanner-status');
        status.innerHTML = '<p style="color: #00FF00; font-weight: bold;">🟢 Scanning... Point at code</p>';

        const controls = document.getElementById('scanner-controls');
        controls.style.display = 'flex';

        this.isScanning = true;
        this.startScanLoop();
      };

      // Connect to socket for real-time scanning
      this.socket = io();

    } catch (error) {
      console.error('Camera access error:', error);
      const status = document.getElementById('scanner-status');
      status.innerHTML = '<p style="color: #FF0000;">❌ Camera access denied. Please allow camera access.</p>';
    }
  }

  startScanLoop() {
    // Scan every 100ms for millisecond-fast detection
    this.scanInterval = setInterval(() => {
      if (!this.isScanning) return;

      this.detectScanGrid();
    }, 100); // 10 times per second = ~100ms response time
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
    const gridSize = Math.min(canvas.width, canvas.height) * 0.6; // 60% of frame

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

    // Extract 10x10 grid
    for (let row = 0; row < 10; row++) {
      const rowData = [];

      for (let col = 0; col < 10; col++) {
        const x = startX + col * cellSize + cellSize / 2;
        const y = startY + row * cellSize + cellSize / 2;

        // Get pixel color
        const imageData = ctx.getImageData(x, y, 1, 1);
        const pixel = imageData.data;

        // Convert to hex
        const hex = '#' +
          ('0' + pixel[0].toString(16)).slice(-2).toUpperCase() +
          ('0' + pixel[1].toString(16)).slice(-2).toUpperCase() +
          ('0' + pixel[2].toString(16)).slice(-2).toUpperCase();

        // Find closest matching color
        const closestColor = this.findClosestColor(hex, colors);
        rowData.push(closestColor);

        // Check if color is valid
        if (colors.includes(closestColor)) {
          validColorCount++;
        }
      }

      grid.push(rowData);
    }

    // Only return grid if we detected enough valid colors (at least 80%)
    if (validColorCount >= 80) {
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
      const distance = Math.sqrt(
        Math.pow(rgb.r - paletteRgb.r, 2) +
        Math.pow(rgb.g - paletteRgb.g, 2) +
        Math.pow(rgb.b - paletteRgb.b, 2)
      );

      if (distance < minDistance) {
        minDistance = distance;
        closestColor = color;
      }
    });

    // Only return if distance is reasonable (not too far from any palette color)
    return minDistance < 100 ? closestColor : palette[0];
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
    status.innerHTML = '<div class="spinner"></div><p class="mt-2">⚡ Processing...</p>';

    // Send to server via socket
    this.socket.emit('scan-code', {
      sessionId: this.getActiveSessionId(),
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
        if (this.videoElement.srcObject) {
          this.isScanning = true;
          status.innerHTML = '<p style="color: #00FF00; font-weight: bold;">🟢 Scanning... Point at code</p>';
        }
      }, 2000);
    });
  }

  getActiveSessionId() {
    // In a real implementation, we'd query the server for active sessions
    // For now, we'll use a placeholder that the server will handle
    return 0; // Server will find the active session for this class
  }

  stopScanning() {
    this.isScanning = false;

    if (this.scanInterval) {
      clearInterval(this.scanInterval);
      this.scanInterval = null;
    }

    if (this.videoElement && this.videoElement.srcObject) {
      this.videoElement.srcObject.getTracks().forEach(track => track.stop());
    }

    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}
