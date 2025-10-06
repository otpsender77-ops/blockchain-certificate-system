const mongoose = require('mongoose');

const emailLogSchema = new mongoose.Schema({
  certificateId: {
    type: String,
    required: true,
    ref: 'Certificate'
  },
  
  studentEmail: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  
  studentName: {
    type: String,
    required: true,
    trim: true
  },
  
  emailType: {
    type: String,
    enum: ['certificate_issued', 'certificate_reminder', 'verification_notification', 'revocation_notification'],
    default: 'certificate_issued'
  },
  
  status: {
    type: String,
    enum: ['pending', 'sent', 'delivered', 'failed', 'bounced'],
    default: 'pending'
  },
  
  subject: {
    type: String,
    required: true
  },
  
  messageId: {
    type: String
  },
  
  errorMessage: {
    type: String
  },
  
  attachments: [{
    filename: String,
    contentType: String,
    size: Number,
    path: String
  }],
  
  sentBy: {
    type: String,
    required: true
  },
  
  sentDate: {
    type: Date,
    default: Date.now
  },
  
  deliveryDate: {
    type: Date
  },
  
  retryCount: {
    type: Number,
    default: 0
  },
  
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
emailLogSchema.index({ certificateId: 1 });
emailLogSchema.index({ studentEmail: 1 });
emailLogSchema.index({ status: 1 });
emailLogSchema.index({ sentDate: -1 });
emailLogSchema.index({ emailType: 1 });

// Virtual for email age
emailLogSchema.virtual('ageInHours').get(function() {
  const now = new Date();
  const diffTime = Math.abs(now - this.sentDate);
  return Math.ceil(diffTime / (1000 * 60 * 60));
});

// Static method to get email statistics
emailLogSchema.statics.getEmailStatistics = async function() {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  
  const stats = await this.aggregate([
    {
      $group: {
        _id: null,
        totalEmails: { $sum: 1 },
        sentEmails: {
          $sum: {
            $cond: [{ $eq: ['$status', 'sent'] }, 1, 0]
          }
        },
        deliveredEmails: {
          $sum: {
            $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0]
          }
        },
        failedEmails: {
          $sum: {
            $cond: [{ $eq: ['$status', 'failed'] }, 1, 0]
          }
        },
        todayEmails: {
          $sum: {
            $cond: [{ $gte: ['$sentDate', today] }, 1, 0]
          }
        },
        thisMonthEmails: {
          $sum: {
            $cond: [{ $gte: ['$sentDate', thisMonth] }, 1, 0]
          }
        }
      }
    }
  ]);
  
  return stats[0] || {
    totalEmails: 0,
    sentEmails: 0,
    deliveredEmails: 0,
    failedEmails: 0,
    todayEmails: 0,
    thisMonthEmails: 0
  };
};

// Static method to get failed emails for retry
emailLogSchema.statics.getFailedEmails = function(limit = 10) {
  return this.find({
    status: 'failed',
    retryCount: { $lt: 3 }
  })
  .sort({ sentDate: 1 })
  .limit(limit)
  .exec();
};

// Method to mark as sent
emailLogSchema.methods.markAsSent = function(messageId) {
  this.status = 'sent';
  this.messageId = messageId;
  this.deliveryDate = new Date();
  return this.save();
};

// Method to mark as failed
emailLogSchema.methods.markAsFailed = function(errorMessage) {
  this.status = 'failed';
  this.errorMessage = errorMessage;
  this.retryCount += 1;
  return this.save();
};

// Method to mark as delivered
emailLogSchema.methods.markAsDelivered = function() {
  this.status = 'delivered';
  this.deliveryDate = new Date();
  return this.save();
};

module.exports = mongoose.model('EmailLog', emailLogSchema);
