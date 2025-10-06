require('dotenv').config({ path: './config.env' });
const mongoose = require('mongoose');
const User = require('../models/User');

async function resetAdminPassword() {
    console.log('🔐 Resetting admin password and email...');
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('✅ Connected to MongoDB');

        // Find existing admin user
        const adminUser = await User.findOne({ role: 'admin' });

        if (adminUser) {
            console.log('👤 Found existing admin user');
            console.log('📧 Current email:', adminUser.email);
            console.log('👤 Username:', adminUser.username);
            
            // Update email and password
            const newPassword = 'kYK7s8q#TvJkNc@E';
            adminUser.email = 'otpsender77@gmail.com';
            adminUser.password = newPassword; // This will be hashed automatically
            
            await adminUser.save();
            console.log('✅ Admin user updated successfully');
            console.log('📧 New email: otpsender77@gmail.com');
            console.log('🔑 New password: kYK7s8q#TvJkNc@E');
        } else {
            console.log('❌ No admin user found');
        }
    } catch (error) {
        console.error('❌ Error resetting admin password:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
    }
}

resetAdminPassword();
