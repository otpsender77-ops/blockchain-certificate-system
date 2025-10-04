const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

// Import routes
const certificateRoutes = require('../routes/certificates');
const { router: authRoutes } = require('../routes/auth');
const verificationRoutes = require('../routes/verification');
const forgotPasswordRoutes = require('../routes/forgotPassword');
const settingsRoutes = require('../routes/settings');

// Import services
const emailService = require('../services/emailService');
const ipfsService = require('../services/ipfsService');
const blockchainService = require('../services/blockchainService');

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: ["'self'", "https://api.pinata.cloud", "https://ipfs.io", "https://gateway.pinata.cloud"],
      frameSrc: ["'self'", "https://gateway.pinata.cloud"]
    }
  },
  crossOriginEmbedderPolicy: false
}));

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://blockchain-certificate-system.vercel.app']
    : ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime()
  });
});

// API routes
app.use('/api/certificates', certificateRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/verification', verificationRoutes);
app.use('/api/forgot-password', forgotPasswordRoutes);
app.use('/api/settings', settingsRoutes);

// Serve static files from public directory
app.use(express.static(path.join(__dirname, '../public')));

// Catch-all handler for SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' ? 'Something went wrong!' : err.message
  });
});

// Initialize services
async function initializeServices() {
  try {
    console.log('🚀 Initializing services...');
    
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/bcs';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Initialize email service
    await emailService.initialize();
    console.log('✅ Email service initialized');

    // Initialize IPFS service
    await ipfsService.initialize();
    console.log('✅ IPFS service initialized');

    // Initialize blockchain service
    await blockchainService.initialize();
    console.log('✅ Blockchain service initialized');

    console.log('🎉 All services initialized successfully!');
  } catch (error) {
    console.error('❌ Service initialization failed:', error);
    process.exit(1);
  }
}

// Initialize services
initializeServices();

module.exports = app;
