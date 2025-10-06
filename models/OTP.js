const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  otp: {
    type: String,
    required: true,
    length: 6
  },
  purpose: {
    type: String,
    enum: ['password_reset', 'email_verification'],
    default: 'password_reset'
  },
  expiresAt: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
  },
  isUsed: {
    type: Boolean,
    default: false
  },
  attempts: {
    type: Number,
    default: 0,
    max: 3
  }
}, {
  timestamps: true
});

// Index for automatic cleanup of expired OTPs
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Static method to generate OTP
otpSchema.statics.generateOTP = function() {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Static method to create OTP
otpSchema.statics.createOTP = async function(email, purpose = 'password_reset') {
  // Delete any existing OTPs for this email
  await this.deleteMany({ email, purpose });
  
  const otp = this.generateOTP();
  const otpRecord = new this({
    email,
    otp,
    purpose
  });
  
  await otpRecord.save();
  return otp;
};

// Method to verify OTP
otpSchema.methods.verifyOTP = async function(inputOTP) {
  if (this.isUsed) {
    throw new Error('OTP has already been used');
  }
  
  if (this.attempts >= 3) {
    throw new Error('Too many failed attempts. Please request a new OTP.');
  }
  
  if (this.expiresAt < new Date()) {
    throw new Error('OTP has expired');
  }
  
  if (this.otp !== inputOTP) {
    this.attempts += 1;
    await this.save();
    throw new Error('Invalid OTP');
  }
  
  this.isUsed = true;
  await this.save();
  return true;
};

module.exports = mongoose.model('OTP', otpSchema);
