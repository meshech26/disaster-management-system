let ioInstance = null;

const setupSocket = (io) => {
  ioInstance = io;

  io.on('connection', (socket) => {
    console.log(`[Socket.IO] Client connected: ${socket.id}`);

    // Join role-specific channels (e.g. responders, admins)
    socket.on('join_role_room', ({ role, userId }) => {
      if (role === 'responder' || role === 'admin') {
        socket.join(`role_${role}s`);
        console.log(`[Socket.IO] User ${userId} joined room role_${role}s`);
      }
      if (userId) {
        socket.join(`user_${userId}`);
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
