const express = require('express');
const { authenticateToken } = require('./auth');
const SystemSettings = require('../models/SystemSettings');
const User = require('../models/User');
const router = express.Router();

// Get system settings
router.get('/', authenticateToken, async (req, res) => {
  try {
    const settings = await SystemSettings.getSettings();
    res.json({
      success: true,
      settings
    });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ error: 'Failed to retrieve settings' });
  }
});

// Update system settings
router.put('/', authenticateToken, async (req, res) => {
  try {
    const updates = req.body;
    const updatedBy = req.user.username || 'admin';
    
    const settings = await SystemSettings.updateSettings(updates, updatedBy);
    
    console.log(`Settings updated by ${updatedBy}:`, Object.keys(updates));
    
    res.json({
      success: true,
      message: 'Settings updated successfully',
      settings
    });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// Get admin profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const settings = await SystemSettings.getSettings();
    const user = await User.findById(req.user.userId).select('-password');
    
    res.json({
      success: true,
      profile: {
        ...settings.adminProfile,
        username: user.username,
        role: user.role,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to retrieve profile' });
  }
});

// Update admin profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { fullName, email, phone, department, profilePicture } = req.body;
    
    const updates = {
      adminProfile: {
        fullName: fullName || 'System Administrator',
        email: email || 'admin@deit.edu',
        phone: phone || '',
        department: department || 'IT Department',
        profilePicture: profilePicture || ''
      }
    };
    
    const settings = await SystemSettings.updateSettings(updates, req.user.username);
    
    console.log(`Profile updated by ${req.user.username}`);
    
    res.json({
      success: true,
      message: 'Profile updated successfully',
      profile: settings.adminProfile
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Reset settings to default
router.post('/reset', authenticateToken, async (req, res) => {
  try {
    // Delete existing settings
    await SystemSettings.deleteMany({});
    
    // Create new default settings
    const settings = new SystemSettings();
    await settings.save();
    
    console.log(`Settings reset to default by ${req.user.username}`);
    
    res.json({
      success: true,
      message: 'Settings reset to default successfully',
      settings
    });
  } catch (error) {
    console.error('Reset settings error:', error);
    res.status(500).json({ error: 'Failed to reset settings' });
  }
});

// Export settings
router.get('/export', authenticateToken, async (req, res) => {
  try {
    const settings = await SystemSettings.getSettings();
    
    res.json({
      success: true,
      settings: settings.toObject(),
      exportedAt: new Date().toISOString(),
      exportedBy: req.user.username
    });
  } catch (error) {
    console.error('Export settings error:', error);
    res.status(500).json({ error: 'Failed to export settings' });
  }
});

// Import settings
router.post('/import', authenticateToken, async (req, res) => {
  try {
    const { settings } = req.body;
    
    if (!settings) {
      return res.status(400).json({ error: 'Settings data is required' });
    }
    
    // Delete existing settings
    await SystemSettings.deleteMany({});
    
    // Create new settings from import
    const newSettings = new SystemSettings(settings);
    newSettings.updatedBy = req.user.username;
    newSettings.lastUpdated = new Date();
    await newSettings.save();
    
    console.log(`Settings imported by ${req.user.username}`);
    
    res.json({
      success: true,
      message: 'Settings imported successfully',
      settings: newSettings
    });
  } catch (error) {
    console.error('Import settings error:', error);
    res.status(500).json({ error: 'Failed to import settings' });
  }
});

module.exports = router;

