const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { validateLogin } = require('../middleware/validation');
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
router.post('/login', validateLogin, async (req, res) => {
  try {
    // Log login attempt without exposing sensitive data
    console.log('Login attempt from IP:', req.ip, 'at', new Date().toISOString());
    
    const { username, password, metaMaskAddress } = req.body;

    if (!username || !password) {
      console.log('Missing credentials from IP:', req.ip);
      return res.status(400).json({ error: 'Username and password are required' });
    }

    console.log('Authentication attempt for user:', username, 'from IP:', req.ip);
    const user = await User.authenticate(username, password);
    console.log('Authentication successful for user:', user.username, 'from IP:', req.ip);
    
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

// Change password route
router.post('/change-password', authenticateToken, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ error: 'Old password and new password are required' });
    }

    // Validate new password strength
    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_+\-=\[\]{};':"\\|,.<>\/~`])[A-Za-z\d@$!%*?&#^()_+\-=\[\]{};':"\\|,.<>\/~`]{12,}$/;
    if (!strongPasswordRegex.test(newPassword)) {
      return res.status(400).json({ 
        error: 'New password must be at least 12 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character' 
      });
    }

    // Find user
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify old password
    const isOldPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isOldPasswordValid) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const saltRounds = 12;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    user.password = hashedNewPassword;
    await user.save();

    console.log(`Password changed for user: ${user.username} from IP: ${req.ip}`);

    res.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

module.exports = { router, authenticateToken };
