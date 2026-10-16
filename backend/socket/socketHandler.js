const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { JWT_SECRET } = require('../config/env');
const { normalizeDistrict, isPublicRecipient, districtRoom } = require('../services/emergencyAudience');
let ioInstance = null;

const setupSocket = (io) => {
  ioInstance = io;

  io.on('connection', (socket) => {
    console.log(`[Socket.IO] Client connected: ${socket.id}`);

    let identityVersion = 0;
    const leaveIdentityRooms = () => {
      identityVersion += 1;
      for (const room of socket.rooms) {
        if (room.startsWith('role_') || room.startsWith('user_') || room.startsWith('emergency_')) socket.leave(room);
      }
    };
    socket.on('leave_role_room', leaveIdentityRooms);
    socket.on('join_role_room', async ({ token } = {}) => {
      leaveIdentityRooms();
      const version = identityVersion;
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await User.findById(decoded.id).select('role district');
        if (!user || version !== identityVersion) return;
        if (['responder', 'admin'].includes(user.role)) socket.join(`role_${user.role}s`);
        socket.join(`user_${user._id}`);
        if (isPublicRecipient(user.role)) {
          socket.join('emergency_recipients');
          if (normalizeDistrict(user.district)) socket.join(districtRoom(user.district));
        }
      } catch (error) {
        // Invalid or missing sessions cannot join recipient rooms.
      }
    });

    // Join specific emergency mission room (e.g. active SOS)
    socket.on('join_sos_room', ({ sosId }) => {
      socket.join(`sos_${sosId}`);
      console.log(`[Socket.IO] Socket ${socket.id} joined sos_${sosId}`);
    });

    // Responder live location stream for active SOS missions
    socket.on('stream_responder_location', ({ sosId, responderId, coordinates, heading }) => {
      socket.to(`sos_${sosId}`).emit('responder_location_stream', {
        sosId,
        responderId,
        coordinates,
        heading,
        timestamp: new Date()
      });
    });

    // Victim live location stream during active SOS
    socket.on('stream_victim_location', ({ sosId, coordinates, batteryLevel }) => {
      socket.to(`sos_${sosId}`).emit('victim_location_stream', {
        sosId,
        coordinates,
        batteryLevel,
        timestamp: new Date()
      });
      // Also notify responder and admin channels
      io.to('role_responders').to('role_admins').emit('victim_location_updated', {
        sosId,
        coordinates
      });
    });

    // Real-time disaster broadcast from emergency coordinators
    socket.on('broadcast_emergency_warning', (data) => {
      io.emit('emergency_alert_received', data);
    });

    socket.on('disconnect', () => {
      console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
    });
  });

  return io;
};

const getIo = () => {
  if (!ioInstance) {
    throw new Error('Socket.io has not been initialized');
  }
  return ioInstance;
};

module.exports = {
  setupSocket,
  getIo
};
