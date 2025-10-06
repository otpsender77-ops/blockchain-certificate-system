const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const path = require('path');
require('dotenv').config({ path: './config.env' });

// Import models and routes
const User = require('./models/User');
const Certificate = require('./models/Certificate');
const { authenticateToken } = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy for Vercel deployment
app.set('trust proxy', 1);

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? [
    'https://block-certi-sigma.vercel.app',
    'https://*.vercel.app'
  ] : ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true
}));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Simple login endpoint
app.post('/api/auth/login', async (req, res) => {
  try {
    console.log('Login attempt:', { username: req.body.username, hasPassword: !!req.body.password });
    console.log('Database connection state:', mongoose.connection.readyState);
    console.log('JWT_SECRET exists:', !!process.env.JWT_SECRET);
    console.log('MONGODB_URI exists:', !!process.env.MONGODB_URI);
    
    const { username, password, metaMaskAddress } = req.body;

    if (!username || !password) {
      console.log('Missing credentials:', { username: !!username, password: !!password });
      return res.status(400).json({ error: 'Username and password are required' });
    }

    console.log('Attempting to authenticate user:', username);
    const user = await User.authenticate(username, password);
    console.log('User authenticated successfully:', user.username);
    
    const token = jwt.sign(
      { 
        userId: user._id, 
        username: user.username, 
        role: user.role,
        metaMaskAddress: metaMaskAddress || null
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        permissions: user.permissions,
        metaMaskAddress: metaMaskAddress || null
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(401).json({ error: error.message });
  }
});

// Certificate generation endpoint
app.post('/api/certificates', authenticateToken, async (req, res) => {
  try {
    console.log('Certificate generation request:', req.body);
    
    const { studentName, parentName, district, state, courseName, studentEmail } = req.body;

    if (!studentName || !courseName || !studentEmail) {
      return res.status(400).json({ error: 'Student name, course name, and email are required' });
    }

    // Generate certificate ID
    const certificateId = `DEIT${Date.now()}`;
    
    // Create certificate record with required blockchain fields (using defaults for simplified server)
    const certificate = new Certificate({
      certificateId,
      studentName,
      parentName: parentName || '',
      district: district || '',
      state: state || '',
      courseName,
      studentEmail,
      generatedBy: req.user.username,
      issuedBy: req.user.userId,
      issuedAt: new Date(),
      status: 'issued',
      // Required blockchain fields (using defaults for simplified server)
      blockchainHash: `simplified_${certificateId}_${Date.now()}`,
      transactionHash: `simplified_tx_${certificateId}_${Date.now()}`,
      blockNumber: 0,
      gasUsed: '0'
    });

    await certificate.save();
    console.log('Certificate created:', certificateId);

    res.json({
      success: true,
      certificate: {
        id: certificate._id,
        certificateId,
        studentName,
        courseName,
        studentEmail,
        issuedAt: certificate.issuedAt
      },
      // Include blockchain data for frontend compatibility
      blockchain: {
        transactionHash: certificate.transactionHash,
        blockNumber: certificate.blockNumber,
        gasUsed: certificate.gasUsed,
        blockchainHash: certificate.blockchainHash
      }
    });

  } catch (error) {
    console.error('Certificate generation error:', error);
    res.status(500).json({ error: 'Failed to generate certificate' });
  }
});

// Get certificates endpoint
app.get('/api/certificates', authenticateToken, async (req, res) => {
  try {
    console.log('Fetching certificates...');
    const certificates = await Certificate.find({})
      .sort({ issuedAt: -1 });

    console.log(`Found ${certificates.length} certificates`);

    res.json({
      success: true,
      certificates: certificates.map(cert => ({
        id: cert._id,
        certificateId: cert.certificateId,
        studentName: cert.studentName,
        courseName: cert.courseName,
        studentEmail: cert.studentEmail,
        issuedAt: cert.issuedAt,
        status: cert.status,
        issuedBy: cert.generatedBy || 'Unknown',
        transactionHash: cert.transactionHash,
        blockNumber: cert.blockNumber
      }))
    });

  } catch (error) {
    console.error('Get certificates error:', error);
    res.status(500).json({ error: 'Failed to fetch certificates' });
  }
});

// Certificate statistics endpoint
app.get('/api/certificates/stats/overview', authenticateToken, async (req, res) => {
  try {
    const totalCertificates = await Certificate.countDocuments({});
    
    // Get today's certificates
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const todayCertificates = await Certificate.countDocuments({
      issuedAt: {
        $gte: today,
        $lt: tomorrow
      }
    });

    // Get total verifications (placeholder - you can implement this later)
    const totalVerifications = 0;

    res.json({
      success: true,
      stats: {
        totalCertificates,
        todayCertificates,
        totalVerifications
      }
    });

  } catch (error) {
    console.error('Get certificate stats error:', error);
    res.status(500).json({ error: 'Failed to fetch certificate statistics' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Simple test endpoint
app.get('/api/test', (req, res) => {
  res.json({
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// Serve the main application
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// MongoDB connection (non-blocking)
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('✅ Connected to MongoDB');
})
.catch((error) => {
  console.error('❌ MongoDB connection error:', error);
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

module.exports = app;
