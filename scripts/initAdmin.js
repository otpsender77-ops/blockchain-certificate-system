const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config({ path: './config.env' });

async function initializeAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to MongoDB');
    
    // Create admin user
    const adminUser = await User.createAdmin();
    
    console.log('✅ Admin user initialized successfully');
    console.log('📋 Admin credentials:');
    console.log('   Username: admin');
    console.log('   Password: admin123');
    console.log('   Email: admin@digitalexcellence.edu');
    console.log('   Role: admin');
    
    // Create a test issuer user
    const testIssuer = new User({
      username: 'issuer',
      email: 'issuer@digitalexcellence.edu',
      password: 'issuer123',
      role: 'issuer',
      profile: {
        firstName: 'Test',
        lastName: 'Issuer',
        department: 'Academic'
      },
      permissions: {
        canIssue: true,
        canVerify: true,
        canManage: false,
        canExport: true
      }
    });
    
    await testIssuer.save();
    console.log('✅ Test issuer user created');
    console.log('📋 Issuer credentials:');
    console.log('   Username: issuer');
    console.log('   Password: issuer123');
    console.log('   Email: issuer@digitalexcellence.edu');
    console.log('   Role: issuer');
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Failed to initialize admin user:', error);
    process.exit(1);
  }
}

initializeAdmin();
