const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config({ path: './config.env' });

async function initSecureAdmin() {
  try {
    console.log('🔐 Initializing secure admin user...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Check if admin already exists
    const existingAdmin = await User.findOne({ role: 'admin' });
    
    if (existingAdmin) {
      console.log('⚠️  Admin user already exists');
      console.log('📧 Email:', existingAdmin.email);
      console.log('👤 Username:', existingAdmin.username);
      console.log('🔒 To reset password, delete the admin user first');
      return;
    }
    
    // Create secure admin user
    const securePassword = 'AdminSecure2024!@#';
    const admin = await User.createAdmin(securePassword);
    
    console.log('✅ Secure admin user created successfully!');
    console.log('================================');
    console.log('🔑 LOGIN CREDENTIALS:');
    console.log('Username: admin');
    console.log('Password: AdminSecure2024!@#');
    console.log('Email: admin@digitalexcellence.edu');
    console.log('================================');
    console.log('⚠️  IMPORTANT SECURITY NOTES:');
    console.log('1. Change the password immediately after first login');
    console.log('2. Enable 2FA if available');
    console.log('3. Use a strong, unique password');
    console.log('4. Never share these credentials');
    console.log('================================');
    
  } catch (error) {
    console.error('❌ Error initializing admin:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the initialization
initSecureAdmin();
