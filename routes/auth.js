const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();

// Middleware to verify JWT token
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Fetch full user object from database to get permissions
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(403).json({ error: 'User not found' });
    }
    
    if (!user.isActive) {
      return res.status(403).json({ error: 'User account is deactivated' });
    }
    
    req.user = {
      userId: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      permissions: user.permissions,
      profile: user.profile
    };
    
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

// Login endpoint - Two-step authentication
router.post('/login', async (req, res) => {
  try {
    console.log('Login attempt:', { username: req.body.username, hasPassword: !!req.body.password, hasMetaMask: !!req.body.metaMaskAddress });
    
    const { username, password, metaMaskAddress } = req.body;

    if (!username || !password) {
      console.log('Missing credentials:', { username: !!username, password: !!password });
      return res.status(400).json({ error: 'Username and password are required' });
    }

    console.log('Attempting to authenticate user:', username);
    const user = await User.authenticate(username, password);
    console.log('User authenticated successfully:', user.username);
    
    // Step 1: If no MetaMask address provided, just verify credentials
    if (!metaMaskAddress) {
      console.log('Step 1: Username/password verified, MetaMask required for admin');
      
      // For admin users, require MetaMask for step 2
      if (user.role === 'admin') {
        return res.json({
          success: true,
          step: 1,
          message: 'Username/password verified. MetaMask connection required for admin access.',
          requiresMetaMask: true,
          user: {
            id: user._id,
            username: user.username,
            email: user.email,
            role: user.role
          }
        });
      } else {
        // Non-admin users can login without MetaMask
        const token = jwt.sign(
          { 
            userId: user._id, 
            username: user.username, 
            role: user.role,
            metaMaskAddress: null
          },
          process.env.JWT_SECRET,
          { expiresIn: '24h' }
        );

        return res.json({
          success: true,
          step: 2,
          token,
          user: {
            id: user._id,
            username: user.username,
            email: user.email,
            role: user.role,
            permissions: user.permissions,
            metaMaskAddress: null
          }
        });
      }
    }
    
    // Step 2: MetaMask address provided - complete authentication
    if (user.role === 'admin') {
      if (!metaMaskAddress) {
        return res.status(400).json({ error: 'MetaMask connection required for admin access' });
      }
      
      console.log(`Step 2: Admin ${username} completing login with MetaMask: ${metaMaskAddress}`);
    }
    
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
      step: 2,
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

// Register endpoint (admin only)
router.post('/register', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { username, email, password, role, profile } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required' });
    }

    const user = new User({
      username,
      email,
      password,
      role: role || 'issuer',
      profile: profile || {}
    });

    await user.save();

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Username or email already exists' });
    }
    
    res.status(400).json({ error: error.message });
  }
});

// Get current user info
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        permissions: user.permissions,
        profile: user.profile,
        lastLogin: user.lastLogin
      }
    });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Logout endpoint (client-side token removal)
router.post('/logout', (req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
});

// Verify token endpoint
router.get('/verify', authenticateToken, (req, res) => {
  res.json({ 
    success: true, 
    valid: true,
    user: req.user 
  });
});

module.exports = { router, authenticateToken };
