const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config({ path: './config.env' });

// Import routes
const certificateRoutes = require('./routes/certificates');
const { router: authRoutes } = require('./routes/auth');
const verificationRoutes = require('./routes/verification');
const forgotPasswordRoutes = require('./routes/forgotPassword');
const settingsRoutes = require('./routes/settings');

// Import services
const blockchainService = require('./services/blockchainService');
const emailService = require('./services/emailService');
const ipfsService = require('./services/ipfsService');

const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy for Vercel deployment
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdn.jsdelivr.net"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdn.jsdelivr.net", "https://unpkg.com", "https://cdnjs.cloudflare.com"],
      scriptSrcAttr: ["'unsafe-inline'"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "https://fonts.googleapis.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "ws://127.0.0.1:8545"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'self'", "https://gateway.pinata.cloud", "https://ipfs.io", "https://*.ipfs.dweb.link"]
    }
  },
  noSniff: true,
  xssFilter: true
}));

// General rate limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});

// Strict rate limiting for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // limit each IP to 50 login attempts per windowMs (increased for development)
  message: 'Too many login attempts from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', generalLimiter);
app.use('/api/auth/login', authLimiter);

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? [
    'https://block-certi-28k6fqhx6-otpsender77-3024s-projects.vercel.app',
    'https://block-certi-sigma.vercel.app',
    'https://*.vercel.app'
  ] : ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true
}));

// Cache control headers for better performance
app.use((req, res, next) => {
  // Cache static assets for 1 hour
  if (req.url.match(/\.(css|js|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/)) {
    res.setHeader('Cache-Control', 'public, max-age=3600');
  }
  // Cache API responses for 5 minutes
  else if (req.url.startsWith('/api/')) {
    res.setHeader('Cache-Control', 'public, max-age=300');
  }
  // No cache for HTML files
  else {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  }
  next();
});

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Initialize services asynchronously (Vercel-friendly)
async function initializeServices() {
  try {
    // MongoDB connection (serverless-optimized)
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // 5 second timeout
      connectTimeoutMS: 10000, // 10 second timeout
      maxPoolSize: 1, // Maintain up to 1 socket connection for serverless
      minPoolSize: 0, // Close connections when not in use
      maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
    });
    console.log('✅ Connected to MongoDB');
    
    // Initialize email service (non-blocking)
    try {
      await emailService.initialize();
      console.log('✅ Email service initialized successfully');
    } catch (error) {
      console.warn('⚠️ Email service initialization failed, continuing without email:', error.message);
    }
    
    // Initialize IPFS service (non-blocking)
    try {
      await ipfsService.initialize();
      console.log('✅ IPFS service initialized successfully');
    } catch (error) {
      console.warn('⚠️ IPFS service initialization failed, continuing without IPFS:', error.message);
    }
    
    // Initialize blockchain connection (completely non-blocking for Vercel)
    setTimeout(() => {
      blockchainService.initialize().then(() => {
        console.log('✅ Blockchain service initialized successfully');
      }).catch((error) => {
        console.warn('⚠️ Blockchain initialization failed, continuing without blockchain:', error.message);
      });
    }, 2000); // Delay blockchain initialization by 2 seconds
    
  } catch (error) {
    console.error('❌ Service initialization error:', error.message);
    // Don't exit process in Vercel, just log the error
  }
}

// Start service initialization in background (non-blocking)
initializeServices();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/verification', verificationRoutes);
app.use('/api/forgot-password', forgotPasswordRoutes);
app.use('/api/settings', settingsRoutes);

// Vercel Speed Insights endpoint
app.post('/api/vercel-insights', (req, res) => {
  // Handle Vercel Speed Insights data
  console.log('📊 Speed Insights data received:', req.body);
  res.status(200).json({ success: true });
});

// Health check endpoint (Vercel-friendly)
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    blockchain: blockchainService.isConnected ? blockchainService.isConnected() : 'Initializing',
    uptime: process.uptime()
  });
});

// Simple test endpoint
app.get('/api/test', (req, res) => {
  res.json({
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    vercel: process.env.VERCEL === '1' ? 'Yes' : 'No'
  });
});

// Quick status endpoint (no dependencies)
app.get('/api/status', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    vercel: process.env.VERCEL === '1' ? 'Yes' : 'No',
    uptime: process.uptime()
  });
});

// Development endpoint to clear rate limits (only in development)
if (process.env.NODE_ENV === 'development') {
  app.post('/api/dev/clear-rate-limits', (req, res) => {
    // Clear rate limit stores
    generalLimiter.resetKey(req.ip);
    authLimiter.resetKey(req.ip);
    res.json({ message: 'Rate limits cleared for this IP', ip: req.ip });
  });
}

// Serve the main application
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await mongoose.connection.close();
  console.log('✅ MongoDB connection closed');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await mongoose.connection.close();
  console.log('✅ MongoDB connection closed');
  process.exit(0);
});

// Only start server if not in Vercel environment
if (process.env.NODE_ENV !== 'production' || process.env.VERCEL !== '1') {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV}`);
    console.log(`🔗 Blockchain: http://${process.env.GANACHE_HOST}:${process.env.GANACHE_PORT}`);
    console.log(`🗄️  Database: ${process.env.MONGODB_URI}`);
  });
}

// Export for Vercel
module.exports = app;
