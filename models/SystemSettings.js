const mongoose = require('mongoose');

const systemSettingsSchema = new mongoose.Schema({
  // Certificate Settings
  certificateSettings: {
    instituteName: {
      type: String,
      required: true,
      default: 'Digital Excellence Institute of Technology'
    },
    instituteAddress: {
      type: String,
      required: true,
      default: '123 Education Street, Learning City, LC 12345'
    },
    instituteLogo: {
      type: String,
      default: ''
    },
    certificateTemplate: {
      type: String,
      enum: ['default', 'modern', 'classic'],
      default: 'default'
    },
    defaultCourseName: {
      type: String,
      default: 'Certificate Course in Digital Excellence'
    },
    certificateValidity: {
      type: Number,
      default: 365 // days
    }
  },

  // Email Settings
  emailSettings: {
    fromName: {
      type: String,
      required: true,
      default: 'Digital Excellence Institute of Technology'
    },
    fromEmail: {
      type: String,
      required: true,
      default: 'certificates@deit.edu'
    },
    emailTemplate: {
      type: String,
      default: 'default'
    },
    includeQRCode: {
      type: Boolean,
      default: true
    },
    includeVerificationLink: {
      type: Boolean,
      default: true
    }
  },

  // System Settings
  systemSettings: {
    maxBatchSize: {
      type: Number,
      default: 50,
      min: 1,
      max: 100
    },
    autoEmailSending: {
      type: Boolean,
      default: true
    },
    requireMetaMask: {
      type: Boolean,
      default: true
    },
    enableRevocation: {
      type: Boolean,
      default: true
    },
    enableForgotPassword: {
      type: Boolean,
      default: true
    }
  },

  // Blockchain Settings
  blockchainSettings: {
    network: {
      type: String,
      enum: ['mainnet', 'holesky', 'sepolia'],
      default: 'holesky'
    },
    gasLimit: {
      type: Number,
      default: 300000
    },
    gasPrice: {
      type: Number,
      default: 20000000000 // 20 gwei
    }
  },

  // IPFS Settings
  ipfsSettings: {
    gateway: {
      type: String,
      default: 'https://ipfs.io/ipfs/'
    },
    pinataEnabled: {
      type: Boolean,
      default: true
    },
    autoPin: {
      type: Boolean,
      default: true
    }
  },

  // Security Settings
  securitySettings: {
    sessionTimeout: {
      type: Number,
      default: 24 // hours
    },
    maxLoginAttempts: {
      type: Number,
      default: 5
    },
    lockoutDuration: {
      type: Number,
      default: 15 // minutes
    },
    requireStrongPasswords: {
      type: Boolean,
      default: true
    },
    enableTwoFactor: {
      type: Boolean,
      default: false
    }
  },

  // Admin Profile
  adminProfile: {
    fullName: {
      type: String,
      required: true,
      default: 'System Administrator'
    },
    email: {
      type: String,
      required: true,
      default: 'admin@deit.edu'
    },
    phone: {
      type: String,
      default: ''
    },
    department: {
      type: String,
      default: 'IT Department'
    },
    lastLogin: {
      type: Date,
      default: Date.now
    },
    profilePicture: {
      type: String,
      default: ''
    }
  },

  // Metadata
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  updatedBy: {
    type: String,
    default: 'system'
  }
}, {
  timestamps: true
});

// Static method to get or create settings
systemSettingsSchema.statics.getSettings = async function() {
  let settings = await this.findOne();
  if (!settings) {
    settings = new this();
    await settings.save();
  }
  return settings;
};

// Static method to update settings
systemSettingsSchema.statics.updateSettings = async function(updates, updatedBy = 'system') {
  const settings = await this.getSettings();
  
  // Deep merge the updates
  Object.keys(updates).forEach(key => {
    if (typeof updates[key] === 'object' && updates[key] !== null) {
      settings[key] = { ...settings[key], ...updates[key] };
    } else {
      settings[key] = updates[key];
    }
  });
  
  settings.lastUpdated = new Date();
  settings.updatedBy = updatedBy;
  
  await settings.save();
  return settings;
};

module.exports = mongoose.model('SystemSettings', systemSettingsSchema);

