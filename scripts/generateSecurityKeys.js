const crypto = require('crypto');

// Generate secure session secret
function generateSessionSecret() {
    return crypto.randomBytes(64).toString('hex');
}

// Generate secure encryption key
function generateEncryptionKey() {
    return crypto.randomBytes(32).toString('hex');
}

// Generate all security keys
function generateAllSecurityKeys() {
    const sessionSecret = generateSessionSecret();
    const encryptionKey = generateEncryptionKey();
    
    console.log('🔐 SECURITY KEYS GENERATED:');
    console.log('================================');
    console.log(`SESSION_SECRET=${sessionSecret}`);
    console.log(`ENCRYPTION_KEY=${encryptionKey}`);
    console.log('================================');
    console.log('⚠️  IMPORTANT: Store these securely!');
    console.log('📝 Add these to your Vercel environment variables');
    console.log('🔒 Never commit these to version control');
    console.log('================================');
}

// Run the generator
generateAllSecurityKeys();
