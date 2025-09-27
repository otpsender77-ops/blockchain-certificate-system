const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema({
  // Certificate Identification
  certificateId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  // Student Information
  studentName: {
    type: String,
    required: true,
    trim: true
  },
  parentName: {
    type: String,
    required: true,
    trim: true
  },
  studentEmail: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  
  // Location Information
  district: {
    type: String,
    required: true,
    trim: true
  },
  state: {
    type: String,
    required: true,
    trim: true
  },
  
  // Course Information
  courseName: {
    type: String,
    required: true,
    trim: true
  },
  
  // Blockchain Information
  blockchainHash: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  transactionHash: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  blockNumber: {
    type: Number,
    required: true
  },
  gasUsed: {
    type: String,
    required: true
  },
  
  // Certificate Status
  status: {
    type: String,
    enum: ['issued', 'verified', 'revoked', 'active'],
    default: 'issued'
  },
  revocationReason: {
    type: String,
    trim: true
  },
  revokedDate: {
    type: Date
  },
  revokedBy: {
    type: String,
    trim: true
  },
  
  // Email Information
  emailSent: {
    type: Boolean,
    default: false
  },
  emailSentDate: {
    type: Date
  },
  emailAttempts: {
    type: Number,
    default: 0
  },
  
  // Verification Information
  verificationCount: {
    type: Number,
    default: 0
  },
  lastVerified: {
    type: Date
  },
  
  // File Information
  pdfPath: {
    type: String
  },
  qrCodePath: {
    type: String
  },
  
  // Metadata
  generatedBy: {
    type: String,
    required: true
  },
  generatedDate: {
    type: Date,
    default: Date.now
  },
  issueDate: {
    type: Date,
    default: Date.now
  },
  
  // Additional Data
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
certificateSchema.index({ studentEmail: 1 });
certificateSchema.index({ generatedDate: -1 });
certificateSchema.index({ status: 1 });
certificateSchema.index({ courseName: 1 });

// Virtual for formatted certificate ID
certificateSchema.virtual('formattedId').get(function() {
  return this.certificateId;
});

// Virtual for certificate age
certificateSchema.virtual('ageInDays').get(function() {
  const now = new Date();
  const diffTime = Math.abs(now - this.generatedDate);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Pre-save middleware to ensure unique certificate ID
certificateSchema.pre('save', async function(next) {
  if (this.isNew && !this.certificateId) {
    this.certificateId = await this.generateCertificateId();
  }
  next();
});

// Method to generate certificate ID
certificateSchema.methods.generateCertificateId = async function() {
  const prefix = 'DEIT';
  const year = new Date().getFullYear();
  
  // Get count of certificates for this year
  const count = await this.constructor.countDocuments({
    generatedDate: {
      $gte: new Date(year, 0, 1),
      $lt: new Date(year + 1, 0, 1)
    }
  });
  
  const sequence = String(count + 1).padStart(4, '0');
  return `${prefix}${year}${sequence}`;
};

// Method to increment verification count
certificateSchema.methods.incrementVerification = function() {
  this.verificationCount += 1;
  this.lastVerified = new Date();
  return this.save();
};

// Method to mark email as sent
certificateSchema.methods.markEmailSent = function() {
  this.emailSent = true;
  this.emailSentDate = new Date();
  return this.save();
};

// Method to revoke certificate
certificateSchema.methods.revokeCertificate = function(reason, revokedBy) {
  this.status = 'revoked';
  this.revocationReason = reason;
  this.revokedDate = new Date();
  this.revokedBy = revokedBy;
  return this.save();
};

// Static method to get statistics
certificateSchema.statics.getStatistics = async function() {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const thisYear = new Date(now.getFullYear(), 0, 1);
  
  const stats = await this.aggregate([
    {
      $group: {
        _id: null,
        totalCertificates: { $sum: 1 },
        totalVerifications: { $sum: '$verificationCount' },
        todayCertificates: {
          $sum: {
            $cond: [{ $gte: ['$generatedDate', today] }, 1, 0]
          }
        },
        thisMonthCertificates: {
          $sum: {
            $cond: [{ $gte: ['$generatedDate', thisMonth] }, 1, 0]
          }
        },
        thisYearCertificates: {
          $sum: {
            $cond: [{ $gte: ['$generatedDate', thisYear] }, 1, 0]
          }
        },
        emailsSent: {
          $sum: {
            $cond: ['$emailSent', 1, 0]
          }
        }
      }
    }
  ]);
  
  return stats[0] || {
    totalCertificates: 0,
    totalVerifications: 0,
    todayCertificates: 0,
    thisMonthCertificates: 0,
    thisYearCertificates: 0,
    emailsSent: 0
  };
};

// Static method to search certificates
certificateSchema.statics.searchCertificates = function(query, options = {}) {
  const {
    page = 1,
    limit = 10,
    sortBy = 'generatedDate',
    sortOrder = 'desc'
  } = options;
  
  const searchQuery = {};
  
  if (query) {
    searchQuery.$or = [
      { certificateId: { $regex: query, $options: 'i' } },
      { studentName: { $regex: query, $options: 'i' } },
      { courseName: { $regex: query, $options: 'i' } },
      { studentEmail: { $regex: query, $options: 'i' } },
      { blockchainHash: { $regex: query, $options: 'i' } },
      { transactionHash: { $regex: query, $options: 'i' } }
    ];
  }
  
  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
  
  return this.find(searchQuery)
    .sort(sort)
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .exec();
};

module.exports = mongoose.model('Certificate', certificateSchema);
