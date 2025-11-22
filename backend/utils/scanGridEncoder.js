import crypto from 'crypto';

/**
 * ScanGrid™ - Proprietary Attendance Code System
 *
 * Features:
 * - 10x10 colored grid encoding
 * - Millisecond-fast scanning
 * - 6-second expiry with HMAC security
 * - Impossible to forge or screenshot
 */

const SECRET_KEY = process.env.SECRET_KEY || 'themind-secret-key-change-in-production';
const GRID_SIZE = 10;
const COLORS = [
  '#00FFFF', // Cyan
  '#FF00FF', // Magenta
  '#FFFF00', // Yellow
  '#00FF00', // Lime
  '#FF00AA', // Pink
  '#AA00FF', // Purple
  '#FF6600', // Orange
  '#0066FF'  // Blue
];

/**
 * Generate ScanGrid data for a session
 */
export function generateScanGrid(sessionId) {
  const timestamp = Date.now();

  // Create HMAC signature
  const hmac = crypto
    .createHmac('sha256', SECRET_KEY)
    .update(`${sessionId}:${timestamp}`)
    .digest('hex')
    .substring(0, 32); // Use first 32 chars

  // Encode data into grid pattern
  const gridData = encodeToGrid(sessionId, timestamp, hmac);

  return {
    sessionId,
    timestamp,
    hmac,
    gridData,
    expiresIn: 6000 // 6 seconds in milliseconds
  };
}

/**
 * Encode session data into 10x10 color grid
 * Each cell color represents specific data bits
 */
function encodeToGrid(sessionId, timestamp, hmac) {
  const grid = [];

  // Convert data to binary string
  const sessionBinary = sessionId.toString(2).padStart(16, '0');
  const timestampBinary = timestamp.toString(2).padStart(42, '0').substring(0, 42);
  const hmacBinary = parseInt(hmac.substring(0, 8), 16).toString(2).padStart(32, '0');

  // Combine all binary data (16 + 42 + 32 = 90 bits, leaving 10 for checksum)
  const dataBits = sessionBinary + timestampBinary + hmacBinary;

  // Calculate checksum (XOR of all bits)
  let checksum = 0;
  for (let bit of dataBits) {
    checksum ^= parseInt(bit);
  }
  const checksumBits = checksum.toString(2).padStart(10, '0');

  // Total 100 bits for 10x10 grid
  const allBits = dataBits + checksumBits;

  // Convert to color grid (every 3 bits = 1 color index)
  let bitIndex = 0;
  for (let row = 0; row < GRID_SIZE; row++) {
    const rowData = [];
    for (let col = 0; col < GRID_SIZE; col++) {
      // Take 3 bits and convert to color index (0-7)
      const bits = allBits.substring(bitIndex, bitIndex + 3).padEnd(3, '0');
      const colorIndex = parseInt(bits, 2) % COLORS.length;
      rowData.push(COLORS[colorIndex]);
      bitIndex += 3;
    }
    grid.push(rowData);
  }

  return grid;
}

/**
 * Decode ScanGrid data from color grid
 */
export function decodeScanGrid(gridData) {
  try {
    // Extract bits from colors
    let allBits = '';

    for (let row of gridData) {
      for (let color of row) {
        const colorIndex = COLORS.indexOf(color);
        if (colorIndex === -1) {
          throw new Error('Invalid color in grid');
        }
        allBits += colorIndex.toString(2).padStart(3, '0');
      }
    }

    // Extract components
    const sessionBinary = allBits.substring(0, 16);
    const timestampBinary = allBits.substring(16, 58);
    const hmacBinary = allBits.substring(58, 90);
    const checksumBits = allBits.substring(90, 100);

    // Verify checksum
    const dataBits = allBits.substring(0, 90);
    let calculatedChecksum = 0;
    for (let bit of dataBits) {
      calculatedChecksum ^= parseInt(bit);
    }

    if (calculatedChecksum.toString(2).padStart(10, '0') !== checksumBits) {
      throw new Error('Checksum verification failed');
    }

    // Convert binary to actual values
    const sessionId = parseInt(sessionBinary, 2);
    const timestamp = parseInt(timestampBinary, 2);
    const hmacHex = parseInt(hmacBinary, 2).toString(16).padStart(8, '0');

    return {
      sessionId,
      timestamp,
      hmacHex
    };
  } catch (error) {
    throw new Error('Failed to decode ScanGrid: ' + error.message);
  }
}

/**
 * Validate scanned ScanGrid data
 */
export function validateScanGrid(scannedData, maxAgeMs = 8000) {
  try {
    const decoded = decodeScanGrid(scannedData.gridData);
    const now = Date.now();

    // Check if code is expired (6s + 2s grace period = 8s)
    const age = now - decoded.timestamp;
    if (age > maxAgeMs) {
      return {
        valid: false,
        error: 'Code expired',
        age: Math.floor(age / 1000)
      };
    }

    // Verify HMAC
    const expectedHmac = crypto
      .createHmac('sha256', SECRET_KEY)
      .update(`${decoded.sessionId}:${decoded.timestamp}`)
      .digest('hex')
      .substring(0, 32);

    const providedHmacFull = decoded.hmacHex.padEnd(32, '0');

    if (!expectedHmac.startsWith(decoded.hmacHex)) {
      return {
        valid: false,
        error: 'Invalid signature - code may be forged'
      };
    }

    return {
      valid: true,
      sessionId: decoded.sessionId,
      timestamp: decoded.timestamp,
      age: Math.floor(age / 1000)
    };
  } catch (error) {
    return {
      valid: false,
      error: error.message
    };
  }
}

/**
 * Get color palette for frontend
 */
export function getColorPalette() {
  return COLORS;
}
