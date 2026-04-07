require('dotenv').config();
const http         = require('http');
const express      = require('express');
const cors         = require('cors');
const helmet       = require('helmet');
const morgan       = require('morgan');
const cookieParser = require('cookie-parser');
const { Server }   = require('socket.io');

const connectDB             = require('./config/db');
const authRoutes            = require('./routes/authRoutes');
const serviceRequestRoutes  = require('./routes/serviceRequestRoutes');
const userRoutes            = require('./routes/userRoutes');
const publicRoutes          = require('./routes/publicRoutes');
const setupSocket           = require('./socket/socketHandler');

// ─── Connect to MongoDB ────────────────────────────────────────────────────────
connectDB();

const app    = express();
const server = http.createServer(app);

// ─── Socket.io ────────────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin:      process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true,
    methods:     ['GET', 'POST'],
  },
});
app.set('io', io);   // make accessible in controllers via req.app.get('io')
setupSocket(io);

// ─── Security middleware ───────────────────────────────────────────────────────
app.use(helmet());

app.use(cors({
  origin:         process.env.CLIENT_URL || 'http://localhost:3000',
  credentials:    true,
  methods:        ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ─── General middleware ────────────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth',     authRoutes);
app.use('/api/requests', serviceRequestRoutes);
app.use('/api/users',    userRoutes);
app.use('/api/public',   publicRoutes);

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'PropMaintain API is running',
    env:     process.env.NODE_ENV,
    time:    new Date().toISOString(),
  });
});

// ─── 404 handler ──────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found.`,
  });
});

// ─── Global error handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.stack);
  res.status(err.statusCode || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'development'
      ? err.message
      : 'Internal Server Error',
  });
});

// ─── Start server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
  console.log(`🔌 Socket.io ready`);
});

module.exports = app;
