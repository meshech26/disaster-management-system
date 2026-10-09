import { io } from 'socket.io-client';
import { SOCKET_URL } from '../config/env';

class SocketService {
  constructor() {
    this.socket = null;
  }

  connect() {
    if (this.socket && this.socket.connected) {
      return this.socket;
    }

    this.socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000
    });

    this.socket.on('connect', () => {
      console.log('[SocketClient] Connected:', this.socket?.id);
    });

    this.socket.on('connect_error', (error) => {
      console.warn('[SocketClient] Connection error:', error.message);
    });

    return this.socket;
  }

  getSocket() {
    if (!this.socket) {
      return this.connect();
    }
    return this.socket;
  }

  joinRole(role, userId) {
    if (this.socket) {
      this.socket.emit('join_role_room', { role, userId });
    }
  }

  joinSosRoom(sosId) {
    if (this.socket) {
      this.socket.emit('join_sos_room', { sosId });
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export const socketService = new SocketService();
