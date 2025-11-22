/**
 * Socket.IO Service
 * Centralized Socket.IO connection management
 */
import { io } from '../../node_modules/socket.io-client/dist/socket.io.esm.min.js';

// Use environment variable for production, fallback to current origin for local dev
const SOCKET_URL = import.meta.env.VITE_API_URL || window.location.origin;

/**
 * Create a Socket.IO connection
 * @returns {Socket} Socket.IO client instance
 */
export function createSocket() {
  return io(SOCKET_URL, {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5
  });
}

export default createSocket;
