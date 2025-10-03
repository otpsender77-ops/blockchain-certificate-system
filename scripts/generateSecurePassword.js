const crypto = require('crypto');

// Generate a secure random password
function generateSecurePassword(length = 16) {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    
    // Ensure at least one character from each required type
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*';
    
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += symbols[Math.floor(Math.random() * symbols.length)];
    
    // Fill the rest with random characters
    for (let i = 4; i < length; i++) {
        password += charset[Math.floor(Math.random() * charset.length)];
    }
    
    // Shuffle the password
    return password.split('').sort(() => Math.random() - 0.5).join('');
}

// Generate JWT secret
function generateJWTSecret() {
    return crypto.randomBytes(64).toString('hex');
}

// Generate private key
function generatePrivateKey() {
    return crypto.randomBytes(32).toString('hex');
}

console.log('🔐 SECURE CREDENTIALS GENERATED:');
console.log('================================');
console.log(`Admin Password: ${generateSecurePassword(16)}`);
console.log(`JWT Secret: ${generateJWTSecret()}`);
console.log(`Private Key: ${generatePrivateKey()}`);
console.log('================================');
console.log('⚠️  IMPORTANT: Store these securely and update your environment variables!');
