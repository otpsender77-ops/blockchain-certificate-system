const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    minlength: 3,
    maxlength: 30
  },
  
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  
  password: {
    type: String,
    required: true,
    minlength: 12,
    validate: {
      validator: function(password) {
        // Strong password validation: at least 12 chars, uppercase, lowercase, number, special char
        const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_+\-=\[\]{};':"\\|,.<>\/~`])[A-Za-z\d@$!%*?&#^()_+\-=\[\]{};':"\\|,.<>\/~`]{12,}$/;
        return strongPasswordRegex.test(password);
      },
      message: 'Password must be at least 12 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    }
  },
  
  role: {
    type: String,
    enum: ['admin', 'issuer', 'viewer'],
    default: 'issuer'
  },
  
  isActive: {
    type: Boolean,
    default: true
  },
  
  lastLogin: {
    type: Date
  },
  
  loginAttempts: {
    type: Number,
    default: 0
  },
  
  lockUntil: {
    type: Date
  },
  
  profile: {
    firstName: String,
    lastName: String,
    department: String,
    phone: String
  },
  
  permissions: {
    canIssue: {
      type: Boolean,
      default: true
    },
    canVerify: {
      type: Boolean,
      default: true
    },
    canManage: {
      type: Boolean,
      default: false
    },
    canExport: {
      type: Boolean,
      default: true
    }
  }
}, {
  timestamps: true,
  toJSON: { 
    virtuals: true,
    transform: function(doc, ret) {
      delete ret.password;
      delete ret.loginAttempts;
      delete ret.lockUntil;
      return ret;
    }
  },
  toObject: { virtuals: true }
});

// Indexes
userSchema.index({ username: 1 });
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  if (this.profile.firstName && this.profile.lastName) {
    return `${this.profile.firstName} ${this.profile.lastName}`;
  }
  return this.username;
});

// Virtual for account lock status
userSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Method to increment login attempts
userSchema.methods.incLoginAttempts = function() {
  // If we have a previous lock that has expired, restart at 1
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { loginAttempts: 1 }
    });
  }
  
  const updates = { $inc: { loginAttempts: 1 } };
  
  // Lock account after 5 failed attempts for 2 hours
  if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 }; // 2 hours
  }
  
  return this.updateOne(updates);
};

// Method to reset login attempts
userSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $unset: { loginAttempts: 1, lockUntil: 1 },
    $set: { lastLogin: new Date() }
  });
};

// Method to check if user has permission
userSchema.methods.hasPermission = function(permission) {
  if (this.role === 'admin') return true;
  return this.permissions[permission] === true;
};

// Static method to create admin user
userSchema.statics.createAdmin = async function(securePassword = null) {
  const adminExists = await this.findOne({ role: 'admin' });
  
  if (!adminExists) {
    // Use provided password or generate a secure one
    const password = securePassword || 'AdminSecure2024!@#';
    
    const admin = new this({
      username: 'admin',
      email: 'admin@digitalexcellence.edu',
      password: password,
      role: 'admin',
      profile: {
        firstName: 'System',
        lastName: 'Administrator',
        department: 'IT'
      },
      permissions: {
        canIssue: true,
        canVerify: true,
        canManage: true,
        canExport: true
      }
    });
    
    await admin.save();
    console.log('✅ Admin user created with secure password');
    console.log('⚠️  IMPORTANT: Change the default password immediately!');
    return admin;
  }
  
  return adminExists;
};

// Static method to authenticate user
userSchema.statics.authenticate = async function(username, password) {
  const user = await this.findOne({ 
    $or: [
      { username: username.toLowerCase() },
      { email: username.toLowerCase() }
    ],
    isActive: true
  });
  
  if (!user) {
    throw new Error('User not found');
  }
  
  if (user.isLocked) {
    throw new Error('Account is temporarily locked due to too many failed login attempts');
  }
  
  const isMatch = await user.comparePassword(password);
  
  if (!isMatch) {
    await user.incLoginAttempts();
    throw new Error('Invalid password');
  }
  
  // Reset login attempts on successful login
  if (user.loginAttempts > 0) {
    await user.resetLoginAttempts();
  }
  
  return user;
};

module.exports = mongoose.model('User', userSchema);
