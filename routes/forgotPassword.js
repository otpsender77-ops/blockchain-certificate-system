const express = require('express');
const router = express.Router();
const User = require('../models/User');
const OTP = require('../models/OTP');
const emailService = require('../services/emailService');

// Request password reset OTP
router.post('/request-reset', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Check if user exists
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Generate OTP
    const otp = await OTP.createOTP(email.toLowerCase(), 'password_reset');

    // Send OTP email
    try {
      await emailService.sendPasswordResetOTP(email, otp);
      console.log(`Password reset OTP sent to ${email}`);
    } catch (emailError) {
      console.error('Failed to send OTP email:', emailError);
      return res.status(500).json({ error: 'Failed to send OTP email' });
    }

    res.json({ 
      message: 'Password reset OTP sent to your email',
      email: email // For testing purposes
    });

  } catch (error) {
    console.error('Password reset request error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Verify OTP and reset password
router.post('/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ error: 'Email, OTP, and new password are required' });
    }

    // Find the OTP record
    const otpRecord = await OTP.findOne({ 
      email: email.toLowerCase(), 
      purpose: 'password_reset' 
    });

    if (!otpRecord) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    // Verify OTP
    try {
      await otpRecord.verifyOTP(otp);
    } catch (otpError) {
      return res.status(400).json({ error: otpError.message });
    }

    // Find user and update password
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    console.log(`Password reset successful for ${email}`);

    res.json({ message: 'Password reset successfully' });

  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Verify OTP only (for frontend validation)
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and OTP are required' });
    }

    // Find the OTP record
    const otpRecord = await OTP.findOne({ 
      email: email.toLowerCase(), 
      purpose: 'password_reset' 
    });

    if (!otpRecord) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    // Verify OTP
    try {
      await otpRecord.verifyOTP(otp);
      res.json({ message: 'OTP verified successfully' });
    } catch (otpError) {
      res.status(400).json({ error: otpError.message });
    }

  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
