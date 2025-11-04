const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const connectDB = require('./config/database');

// Import routes
const userRoutes = require('./routes/users');
const tweetRoutes = require('./routes/tweets');
const notificationRoutes = require('./routes/notifications');
const authRoutes = require('./routes/auth');
const verifyRoutes = require('./routes/verify.route');
const uploadRoutes = require('./routes/upload');
const imageRoutes = require('./routes/images');
const chatbotRoutes = require('./routes/chatbot');

const app = express();
const PORT = process.env.PORT || 3001;

// Connect to MongoDB
connectDB();

// Rate limiting - More lenient for development
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs (increased for development)
  message: 'Too many requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware
app.use(limiter);
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'http://[::1]:5173',
      "https://google-gen-ai-exchange-demo-app.vercel.app/",
      "https://google-gen-ai-exchange-demo-app.vercel.app",
    ];
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes (must come before static file serving for proper routing)
app.use('/api/users', userRoutes);
app.use('/api/tweets', tweetRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/verify', verifyRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/image', imageRoutes); // Image serving route
app.use('/api/chatbot', chatbotRoutes);

// Serve static files from uploads directory (for backward compatibility)
const path = require('path');
app.use('/api/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check endpoint
app.get('/api/health', (req, res) => {
  const mongoose = require('mongoose');
  const dbStatus = mongoose.connection.readyState;
  const dbStates = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };
  
  res.json({ 
    status: dbStatus === 1 ? 'OK' : 'WARNING',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: {
      status: dbStates[dbStatus] || 'unknown',
      readyState: dbStatus
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
});

module.exports = app;
