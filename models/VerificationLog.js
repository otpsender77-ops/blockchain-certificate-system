const mongoose = require('mongoose');

const verificationLogSchema = new mongoose.Schema({
  // Verification Details
  certificateId: {
    type: String,
    required: true,
    ref: 'Certificate'
  },
  
  verificationMethod: {
    type: String,
    enum: ['certificateId', 'blockchainHash', 'qrCode', 'transactionHash'],
    required: true
  },
  
  identifier: {
    type: String,
    required: true
  },
  
  // Verification Result
  success: {
    type: Boolean,
    required: true
  },
  
  // User Information
  verifiedBy: {
    type: String,
    default: 'anonymous'
  },
  
  // Network Information
  ipAddress: {
    type: String,
    default: '127.0.0.1'
  },
  
  userAgent: {
    type: String
  },
  
  // Location Information (if available)
  country: {
    type: String
  },
  
  city: {
    type: String
  },
  
  // Verification Details
  verificationData: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  
  // Error Information (if verification failed)
  errorMessage: {
    type: String
  },
  
  // Response Time
  responseTime: {
    type: Number, // in milliseconds
    default: 0
  },
  
  // Additional Metadata
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
verificationLogSchema.index({ certificateId: 1 });
verificationLogSchema.index({ verificationMethod: 1 });
verificationLogSchema.index({ success: 1 });
verificationLogSchema.index({ createdAt: -1 });
verificationLogSchema.index({ ipAddress: 1 });

// Compound indexes
verificationLogSchema.index({ certificateId: 1, verificationMethod: 1 });
verificationLogSchema.index({ success: 1, createdAt: -1 });

// Virtual for verification age
verificationLogSchema.virtual('ageInMinutes').get(function() {
  const now = new Date();
  const diffTime = Math.abs(now - this.createdAt);
  return Math.ceil(diffTime / (1000 * 60));
});

// Virtual for formatted timestamp
verificationLogSchema.virtual('formattedDate').get(function() {
  return this.createdAt.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
});

// Static method to get verification statistics
verificationLogSchema.statics.getVerificationStats = async function() {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const thisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  
  const stats = await this.aggregate([
    {
      $group: {
        _id: null,
        totalVerifications: { $sum: 1 },
        successfulVerifications: {
          $sum: {
            $cond: ['$success', 1, 0]
          }
        },
        failedVerifications: {
          $sum: {
            $cond: ['$success', 0, 1]
          }
        },
        todayVerifications: {
          $sum: {
            $cond: [{ $gte: ['$createdAt', today] }, 1, 0]
          }
        },
        thisWeekVerifications: {
          $sum: {
            $cond: [{ $gte: ['$createdAt', thisWeek] }, 1, 0]
          }
        },
        thisMonthVerifications: {
          $sum: {
            $cond: [{ $gte: ['$createdAt', thisMonth] }, 1, 0]
          }
        },
        averageResponseTime: {
          $avg: '$responseTime'
        }
      }
    }
  ]);
  
  // Get method breakdown
  const methodStats = await this.aggregate([
    {
      $group: {
        _id: '$verificationMethod',
        count: { $sum: 1 },
        successCount: {
          $sum: {
            $cond: ['$success', 1, 0]
          }
        }
      }
    },
    {
      $project: {
        method: '$_id',
        count: 1,
        successCount: 1,
        successRate: {
          $multiply: [
            { $divide: ['$successCount', '$count'] },
            100
          ]
        }
      }
    }
  ]);
  
  // Get recent verifications
  const recentVerifications = await this.find({})
    .sort({ createdAt: -1 })
    .limit(10)
    .select('certificateId verificationMethod success createdAt ipAddress')
    .lean();
  
  return {
    overview: stats[0] || {
      totalVerifications: 0,
      successfulVerifications: 0,
      failedVerifications: 0,
      todayVerifications: 0,
      thisWeekVerifications: 0,
      thisMonthVerifications: 0,
      averageResponseTime: 0
    },
    methodBreakdown: methodStats,
    recentVerifications
  };
};

// Static method to get verification history for a certificate
verificationLogSchema.statics.getCertificateVerificationHistory = function(certificateId, limit = 50) {
  return this.find({ certificateId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .select('verificationMethod success createdAt ipAddress userAgent errorMessage responseTime')
    .exec();
};

// Static method to get verification trends
verificationLogSchema.statics.getVerificationTrends = async function(days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  const trends = await this.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' }
        },
        totalVerifications: { $sum: 1 },
        successfulVerifications: {
          $sum: {
            $cond: ['$success', 1, 0]
          }
        },
        averageResponseTime: { $avg: '$responseTime' }
      }
    },
    {
      $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
    }
  ]);
  
  return trends;
};

// Method to log a verification attempt
verificationLogSchema.statics.logVerification = async function(data) {
  const {
    certificateId,
    verificationMethod,
    identifier,
    success,
    verifiedBy = 'anonymous',
    ipAddress = '127.0.0.1',
    userAgent,
    verificationData = {},
    errorMessage,
    responseTime = 0,
    metadata = {}
  } = data;
  
  const log = new this({
    certificateId,
    verificationMethod,
    identifier,
    success,
    verifiedBy,
    ipAddress,
    userAgent,
    verificationData,
    errorMessage,
    responseTime,
    metadata
  });
  
  return await log.save();
};

module.exports = mongoose.model('VerificationLog', verificationLogSchema);
