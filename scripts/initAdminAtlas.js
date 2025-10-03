const mongoose = require('mongoose');
const User = require('../models/User');

async function initializeAdminAtlas() {
  try {
    // Use the production MongoDB Atlas URI
    const mongoUri = 'mongodb+srv://blockchain-admin:k4J3OB0E8O4pdDVH@blockchain-certificates.vz6h2fr.mongodb.net/bcs?retryWrites=true&w=majority&appName=blockchain-certificates';
    
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to MongoDB Atlas');
    
    // Check if admin user exists
    const existingAdmin = await User.findOne({ username: 'admin' });
    if (existingAdmin) {
      console.log('✅ Admin user already exists in Atlas');
      console.log('📋 Admin credentials:');
      console.log('   Username: admin');
      console.log('   Password: admin123');
      console.log('   Email:', existingAdmin.email);
      console.log('   Role:', existingAdmin.role);
    } else {
      // Create admin user
      const adminUser = await User.createAdmin();
      console.log('✅ Admin user created successfully in Atlas');
      console.log('📋 Admin credentials:');
      console.log('   Username: admin');
      console.log('   Password: admin123');
      console.log('   Email: admin@digitalexcellence.edu');
      console.log('   Role: admin');
    }
    
    // List all users
    const users = await User.find({});
    console.log('\n📋 All users in Atlas database:');
    users.forEach(user => {
      console.log(`   - ${user.username} (${user.role}) - ${user.email}`);
    });
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Failed to initialize admin user in Atlas:', error);
    process.exit(1);
  }
}

initializeAdminAtlas();
