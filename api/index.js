const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');
const { connectDB } = require('../config/database');

const app = express();

// Trust proxy for Vercel
app.set('trust proxy', 1);

// Initialize database connection
connectDB().catch(console.error);

// Database connection middleware
const ensureDBConnection = (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ 
      error: 'Database connection not ready',
      status: mongoose.connection.readyState 
    });
  }
  next();
};

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdn.jsdelivr.net"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdn.jsdelivr.net", "https://unpkg.com", "https://cdnjs.cloudflare.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "https://fonts.googleapis.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "ws://127.0.0.1:8545"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'self'", "https://gateway.pinata.cloud", "https://ipfs.io", "https://*.ipfs.dweb.link"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'self'"],
      upgradeInsecureRequests: []
    }
  },
  crossOriginOpenerPolicy: { policy: "same-origin" },
  crossOriginResourcePolicy: { policy: "same-origin" }
}));

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? [
    'https://block-certi-g2n9rhiro-shahid-sheikhs-projects.vercel.app',
    'https://block-certi-steel.vercel.app',
    'https://block-certi-shahid-sheikhs-projects.vercel.app'
  ] : ['http://localhost:3000'],
  credentials: true
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
    message: 'Blockchain Certificate System API is running'
  });
});

// Simple test endpoint
app.get('/api/test', (req, res) => {
  res.json({
    message: 'API is working',
    timestamp: new Date().toISOString()
  });
});

// Try to import and use routes with error handling
try {
  const authModule = require('../routes/auth');
  const authRoutes = authModule.router || authModule;
  app.use('/api/auth', ensureDBConnection, authRoutes);
  console.log('✅ Auth routes loaded');
} catch (error) {
  console.error('❌ Failed to load auth routes:', error.message);
  app.use('/api/auth', (req, res) => {
    res.status(500).json({ error: 'Auth service temporarily unavailable' });
  });
}

try {
  const certificateRoutes = require('../routes/certificates');
  app.use('/api/certificates', ensureDBConnection, certificateRoutes);
  console.log('✅ Certificate routes loaded');
} catch (error) {
  console.error('❌ Failed to load certificate routes:', error.message);
  app.use('/api/certificates', (req, res) => {
    res.status(500).json({ error: 'Certificate service temporarily unavailable' });
  });
}

try {
  const verificationRoutes = require('../routes/verification');
  app.use('/api/verification', ensureDBConnection, verificationRoutes);
  console.log('✅ Verification routes loaded');
} catch (error) {
  console.error('❌ Failed to load verification routes:', error.message);
  app.use('/api/verification', (req, res) => {
    res.status(500).json({ error: 'Verification service temporarily unavailable' });
  });
}

try {
  const emailRoutes = require('../routes/email');
  app.use('/api/email', ensureDBConnection, emailRoutes);
  console.log('✅ Email routes loaded');
} catch (error) {
  console.error('❌ Failed to load email routes:', error.message);
  app.use('/api/email', (req, res) => {
    res.status(500).json({ error: 'Email service temporarily unavailable' });
  });
}

module.exports = app;
