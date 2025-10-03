const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config({ path: './config.env' });

async function initializeAdminProduction() {
  try {
    // Connect to MongoDB using the production URI
    const mongoUri = process.env.MONGODB_URI;
    console.log('Connecting to MongoDB:', mongoUri.replace(/\/\/.*@/, '//***:***@')); // Hide credentials in log
    
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to MongoDB');
    
    // Check if admin user exists
    const existingAdmin = await User.findOne({ username: 'admin' });
    if (existingAdmin) {
      console.log('✅ Admin user already exists');
      console.log('📋 Admin credentials:');
      console.log('   Username: admin');
      console.log('   Password: admin123');
      console.log('   Email:', existingAdmin.email);
      console.log('   Role:', existingAdmin.role);
    } else {
      // Create admin user
      const adminUser = await User.createAdmin();
      console.log('✅ Admin user created successfully');
      console.log('📋 Admin credentials:');
      console.log('   Username: admin');
      console.log('   Password: admin123');
      console.log('   Email: admin@digitalexcellence.edu');
      console.log('   Role: admin');
    }
    
    // List all users
    const users = await User.find({});
    console.log('\n📋 All users in database:');
    users.forEach(user => {
      console.log(`   - ${user.username} (${user.role}) - ${user.email}`);
    });
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Failed to initialize admin user:', error);
    process.exit(1);
  }
}

initializeAdminProduction();
