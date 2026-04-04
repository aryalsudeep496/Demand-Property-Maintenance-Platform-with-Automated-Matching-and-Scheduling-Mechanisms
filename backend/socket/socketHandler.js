const jwt = require('jsonwebtoken');

module.exports = (io) => {
  // ── Auth middleware: verify JWT before allowing connection ──────────────────
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Unauthorized: no token'));
    try {
      const decoded    = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId    = decoded.id;
      socket.userRole  = decoded.role;
      next();
    } catch {
      next(new Error('Unauthorized: invalid token'));
    }
  });

  io.on('connection', (socket) => {
    // Every user joins their personal room for targeted notifications
    socket.join(`user:${socket.userId}`);
    console.log(`🔌 [Socket] ${socket.userRole} connected  user:${socket.userId}`);

    // ── Chat rooms ──────────────────────────────────────────────────────────
    socket.on('join_request', (requestId) => {
      socket.join(`request:${requestId}`);
      console.log(`💬 [Socket] user:${socket.userId} joined request:${requestId}`);
    });

    socket.on('leave_request', (requestId) => {
      socket.leave(`request:${requestId}`);
    });

    socket.on('disconnect', () => {
      console.log(`🔌 [Socket] disconnected  user:${socket.userId}`);
    });
  });
};
