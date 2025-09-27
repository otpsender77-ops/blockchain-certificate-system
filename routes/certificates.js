const express = require('express');
const multer = require('multer');
const path = require('path');
const { authenticateToken } = require('./auth');
const Certificate = require('../models/Certificate');
const EmailLog = require('../models/EmailLog');
const blockchainService = require('../services/blockchainService');
const emailService = require('../services/emailService');
const pdfService = require('../services/pdfService');
const router = express.Router();

// Helper function to resolve PDF/QR paths
function resolveFilePath(filePath) {
  if (!filePath) return null;
  if (filePath.startsWith('certificates/') || filePath.startsWith('qr-codes/')) {
    // Relative path - convert to absolute
    return path.join(__dirname, '../public', filePath);
  } else {
    // Absolute path - use as is
    return filePath;
  }
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage });

// Get all certificates with pagination and search
router.get('/', authenticateToken, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      sortBy = 'generatedDate',
      sortOrder = 'desc'
    } = req.query;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sortBy,
      sortOrder
    };

    const certificates = await Certificate.searchCertificates(search, options);
    const total = await Certificate.countDocuments(
      search ? {
        $or: [
          { certificateId: { $regex: search, $options: 'i' } },
          { studentName: { $regex: search, $options: 'i' } },
          { courseName: { $regex: search, $options: 'i' } },
          { studentEmail: { $regex: search, $options: 'i' } }
        ]
      } : {}
    );

    res.json({
      success: true,
      certificates,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get certificates error:', error);
    res.status(500).json({ error: 'Failed to fetch certificates' });
  }
});

// Get email history
router.get('/email-history', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 50, status, emailType } = req.query;
    const skip = (page - 1) * limit;
    
    // Build filter
    const filter = {};
    if (status) filter.status = status;
    if (emailType) filter.emailType = emailType;
    
    // Get email logs with pagination
    const emailLogs = await EmailLog.find(filter)
      .sort({ sentDate: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('certificateId', 'certificateId studentName courseName')
      .exec();
    
    // Get total count
    const total = await EmailLog.countDocuments(filter);
    
    // Get email statistics
    const stats = await EmailLog.getEmailStatistics();
    
    res.json({
      success: true,
      emailHistory: emailLogs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      },
      stats
    });

  } catch (error) {
    console.error('Get email history error:', error);
    res.status(500).json({ error: 'Failed to fetch email history' });
  }
});

// Get certificate by ID
router.get('/:id', async (req, res) => {
  try {
    const certificate = await Certificate.findOne({ certificateId: req.params.id });
    
    if (!certificate) {
      return res.status(404).json({ error: 'Certificate not found' });
    }

    res.json({
      success: true,
      certificate
    });

  } catch (error) {
    console.error('Get certificate error:', error);
    res.status(500).json({ error: 'Failed to fetch certificate' });
  }
});

// Generate new certificate
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      studentName,
      parentName,
      district,
      state,
      courseName,
      studentEmail
    } = req.body;

    // Validate required fields
    if (!studentName || !parentName || !district || !state || !courseName || !studentEmail) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Check if user has permission to issue certificates
    if (!req.user.permissions?.canIssue) {
      return res.status(403).json({ error: 'Permission denied: Cannot issue certificates' });
    }

    // Create certificate data
    const certificateData = {
      studentName,
      parentName,
      district,
      state,
      courseName,
      studentEmail,
      generatedBy: req.user.username,
      issueDate: new Date()
    };

    // Generate certificate ID
    const tempCert = new Certificate(certificateData);
    const certificateId = await tempCert.generateCertificateId();
    certificateData.certificateId = certificateId;

    // Generate blockchain hash
    const blockchainHash = blockchainService.generateCertificateHash(certificateData);

    // Issue certificate on blockchain
    const blockchainResult = await blockchainService.issueCertificate({
      certificateId,
      studentName,
      courseName,
      instituteName: process.env.INSTITUTE_NAME,
      issueDate: certificateData.issueDate,
      certificateHash: blockchainHash
    });

    // Create certificate record
    const certificate = new Certificate({
      ...certificateData,
      blockchainHash,
      transactionHash: blockchainResult.transactionHash,
      blockNumber: blockchainResult.blockNumber,
      gasUsed: blockchainResult.gasUsed
    });

    await certificate.save();

    // Generate PDF and QR code
    const pdfResult = await pdfService.generateCertificatePDF(certificate);
    
    if (pdfResult.success) {
      certificate.pdfPath = pdfResult.pdfPath;
      certificate.qrCodePath = pdfResult.qrCodePath;
      await certificate.save();
    }

    // Prepare email attachments
    const attachments = [];
    if (pdfResult.success) {
      const pdfFullPath = resolveFilePath(pdfResult.pdfPath);
      const qrFullPath = resolveFilePath(pdfResult.qrCodePath);
      
      attachments.push({
        filename: `Certificate_${certificateId}.pdf`,
        path: pdfFullPath,
        contentType: 'application/pdf',
        size: require('fs').statSync(pdfFullPath).size
      });
      
      attachments.push({
        filename: `QR_Code_${certificateId}.png`,
        path: qrFullPath,
        contentType: 'image/png',
        size: require('fs').statSync(qrFullPath).size
      });
    }

    // Send email to student
    const emailResult = await emailService.sendCertificateEmail(certificate, attachments);

    res.status(201).json({
      success: true,
      certificate,
      blockchain: blockchainResult,
      pdf: pdfResult,
      email: emailResult,
      message: 'Certificate generated successfully'
    });

  } catch (error) {
    console.error('Generate certificate error:', error);
    res.status(500).json({ error: 'Failed to generate certificate' });
  }
});

// Resend email for certificate
router.post('/:id/resend-email', authenticateToken, async (req, res) => {
  try {
    const certificate = await Certificate.findOne({ certificateId: req.params.id });
    
    if (!certificate) {
      return res.status(404).json({ error: 'Certificate not found' });
    }

    // Prepare attachments
    const attachments = [];
    if (certificate.pdfPath) {
      const pdfFullPath = resolveFilePath(certificate.pdfPath);
      if (pdfFullPath) {
        attachments.push({
          filename: `Certificate_${certificate.certificateId}.pdf`,
          path: pdfFullPath,
          contentType: 'application/pdf'
        });
      }
    }
    
    if (certificate.qrCodePath) {
      const qrFullPath = resolveFilePath(certificate.qrCodePath);
      if (qrFullPath) {
        attachments.push({
          filename: `QR_Code_${certificate.certificateId}.png`,
          path: qrFullPath,
          contentType: 'image/png'
        });
      }
    }

    // Send email
    const emailResult = await emailService.sendCertificateEmail(certificate, attachments);

    res.json({
      success: true,
      email: emailResult,
      message: 'Email sent successfully'
    });

  } catch (error) {
    console.error('Resend email error:', error);
    res.status(500).json({ error: 'Failed to resend email' });
  }
});

// Get certificate statistics
router.get('/stats/overview', authenticateToken, async (req, res) => {
  try {
    const stats = await Certificate.getStatistics();
    
    res.json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// Export certificates to CSV
router.get('/export/csv', authenticateToken, async (req, res) => {
  try {
    if (!req.user.permissions?.canExport) {
      return res.status(403).json({ error: 'Permission denied: Cannot export data' });
    }

    const certificates = await Certificate.find({}).sort({ generatedDate: -1 });
    
    // Generate CSV content
    const headers = [
      'Certificate ID',
      'Student Name',
      'Parent Name',
      'District',
      'State',
      'Course Name',
      'Student Email',
      'Generated Date',
      'Blockchain Hash',
      'Transaction Hash',
      'Block Number',
      'Email Sent',
      'Verification Count'
    ];

    const rows = certificates.map(cert => [
      cert.certificateId,
      cert.studentName,
      cert.parentName,
      cert.district,
      cert.state,
      cert.courseName,
      cert.studentEmail,
      new Date(cert.generatedDate).toLocaleDateString(),
      cert.blockchainHash,
      cert.transactionHash,
      cert.blockNumber,
      cert.emailSent ? 'Yes' : 'No',
      cert.verificationCount || 0
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="certificates_${new Date().toISOString().split('T')[0]}.csv"`);
    res.send(csvContent);

  } catch (error) {
    console.error('Export CSV error:', error);
    res.status(500).json({ error: 'Failed to export certificates' });
  }
});

// Download certificate PDF
router.get('/:id/download/pdf', async (req, res) => {
  try {
    const certificate = await Certificate.findOne({ certificateId: req.params.id });
    
    if (!certificate) {
      return res.status(404).json({ error: 'Certificate not found' });
    }

    if (!certificate.pdfPath) {
      return res.status(404).json({ error: 'PDF not available for this certificate' });
    }

    const fs = require('fs');
    const path = require('path');
    
    const fullPath = resolveFilePath(certificate.pdfPath);
    
    if (!fullPath || !fs.existsSync(fullPath)) {
      return res.status(404).json({ error: 'PDF file not found' });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Certificate_${certificate.certificateId}.pdf"`);
    
    const fileStream = fs.createReadStream(fullPath);
    fileStream.pipe(res);

  } catch (error) {
    console.error('Download PDF error:', error);
    res.status(500).json({ error: 'Failed to download PDF' });
  }
});

// Download QR code
router.get('/:id/download/qr', async (req, res) => {
  try {
    const certificate = await Certificate.findOne({ certificateId: req.params.id });
    
    if (!certificate) {
      return res.status(404).json({ error: 'Certificate not found' });
    }

    if (!certificate.qrCodePath) {
      return res.status(404).json({ error: 'QR code not available for this certificate' });
    }

    const fs = require('fs');
    
    if (!fs.existsSync(certificate.qrCodePath)) {
      return res.status(404).json({ error: 'QR code file not found' });
    }

    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', `attachment; filename="QR_Code_${certificate.certificateId}.png"`);
    
    const fileStream = fs.createReadStream(certificate.qrCodePath);
    fileStream.pipe(res);

  } catch (error) {
    console.error('Download QR error:', error);
    res.status(500).json({ error: 'Failed to download QR code' });
  }
});

// Update certificate (admin only)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const certificate = await Certificate.findOne({ certificateId: req.params.id });
    
    if (!certificate) {
      return res.status(404).json({ error: 'Certificate not found' });
    }

    const allowedUpdates = ['status', 'metadata'];
    const updates = {};
    
    for (const field of allowedUpdates) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    Object.assign(certificate, updates);
    await certificate.save();

    res.json({
      success: true,
      certificate,
      message: 'Certificate updated successfully'
    });

  } catch (error) {
    console.error('Update certificate error:', error);
    res.status(500).json({ error: 'Failed to update certificate' });
  }
});

// Get email history for specific certificate
router.get('/:id/email-history', authenticateToken, async (req, res) => {
  try {
    const emailLogs = await EmailLog.find({ certificateId: req.params.id })
      .sort({ sentDate: -1 })
      .exec();
    
    res.json({
      success: true,
      emailHistory: emailLogs
    });

  } catch (error) {
    console.error('Get certificate email history error:', error);
    res.status(500).json({ error: 'Failed to fetch certificate email history' });
  }
});

// Batch certificate generation
router.post('/batch', authenticateToken, async (req, res) => {
  try {
    const { students, generatedBy } = req.body;

    if (!students || !Array.isArray(students) || students.length === 0) {
      return res.status(400).json({ error: 'Students array is required' });
    }

    if (students.length > 50) {
      return res.status(400).json({ error: 'Maximum 50 students allowed per batch' });
    }

    if (!generatedBy) {
      return res.status(400).json({ error: 'GeneratedBy field is required' });
    }

    const results = {
      successful: [],
      failed: [],
      total: students.length
    };

    // Process students in parallel batches (max 5 at a time to avoid overwhelming the system)
    const batchSize = 5;
    const batches = [];
    
    for (let i = 0; i < students.length; i += batchSize) {
      batches.push(students.slice(i, i + batchSize));
    }

    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];
      
      // Process batch in parallel
      const batchPromises = batch.map(async (student, studentIndex) => {
        const globalIndex = batchIndex * batchSize + studentIndex;
        
        try {
        // Validate student data
        const requiredFields = ['studentName', 'parentName', 'district', 'state', 'courseName', 'studentEmail'];
        const missingFields = requiredFields.filter(field => !student[field] || !student[field].trim());
        
        if (missingFields.length > 0) {
          throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
        }

        // Generate certificate ID
        const certificateId = await generateCertificateId();
        
        // Generate blockchain hash
        const blockchainHash = generateBlockchainHash();
        
        // Store on blockchain
        const blockchainResult = await blockchainService.issueCertificate({
          certificateId,
          studentName: student.studentName,
          courseName: student.courseName,
          instituteName: process.env.INSTITUTE_NAME || 'Digital Excellence Institute of Technology',
          issueDate: Math.floor(Date.now() / 1000),
          certificateHash: blockchainHash
        });

        // Create certificate document
        const certificateData = {
          certificateId,
          studentName: student.studentName,
          parentName: student.parentName,
          studentEmail: student.studentEmail,
          district: student.district,
          state: student.state,
          courseName: student.courseName,
          blockchainHash,
          transactionHash: blockchainResult.transactionHash,
          blockNumber: blockchainResult.blockNumber,
          gasUsed: blockchainResult.gasUsed,
          generatedBy,
          status: 'issued'
        };

        const certificate = new Certificate(certificateData);
        await certificate.save();

        // Generate PDF and QR code
        const pdfResult = await pdfService.generateCertificatePDF(certificate);

        // Update certificate with file paths
        certificate.pdfPath = pdfResult.pdfPath;
        certificate.qrCodePath = pdfResult.qrCodePath;
        await certificate.save();

        // Send email with attachments
        try {
          const attachments = [
            {
              filename: `Certificate_${certificateId}.pdf`,
              path: resolveFilePath(certificate.pdfPath),
              contentType: 'application/pdf'
            },
            {
              filename: `QR_Code_${certificateId}.png`,
              path: resolveFilePath(certificate.qrCodePath),
              contentType: 'image/png'
            }
          ];
          
          await emailService.sendCertificateEmail(certificate, attachments);
          await certificate.markEmailSent();
        } catch (emailError) {
          console.error(`Email failed for ${certificateId}:`, emailError);
        }

          return {
            success: true,
            index: globalIndex + 1,
            certificateId,
            studentName: student.studentName,
            studentEmail: student.studentEmail
          };

        } catch (error) {
          console.error(`Error processing student ${globalIndex + 1}:`, error);
          return {
            success: false,
            index: globalIndex + 1,
            studentName: student.studentName || 'Unknown',
            studentEmail: student.studentEmail || 'Unknown',
            error: error.message
          };
        }
      });

      // Wait for batch to complete
      const batchResults = await Promise.all(batchPromises);
      
      // Add results to main results
      batchResults.forEach(result => {
        if (result.success) {
          results.successful.push(result);
        } else {
          results.failed.push(result);
        }
      });
    }

    res.json({
      success: true,
      message: `Batch processing completed. ${results.successful.length} successful, ${results.failed.length} failed.`,
      results
    });

  } catch (error) {
    console.error('Batch certificate generation error:', error);
    res.status(500).json({ error: 'Failed to process batch certificates' });
  }
});

// Revoke certificate
router.post('/:id/revoke', authenticateToken, async (req, res) => {
  try {
    const { reason, revokedBy } = req.body;

    if (!reason || !reason.trim()) {
      return res.status(400).json({ error: 'Revocation reason is required' });
    }

    if (!revokedBy || !revokedBy.trim()) {
      return res.status(400).json({ error: 'RevokedBy field is required' });
    }

    const certificate = await Certificate.findOne({ certificateId: req.params.id });
    
    if (!certificate) {
      return res.status(404).json({ error: 'Certificate not found' });
    }

    if (certificate.status === 'revoked') {
      return res.status(400).json({ error: 'Certificate is already revoked' });
    }

    // Revoke certificate
    await certificate.revokeCertificate(reason, revokedBy);

    // Send revocation notification email
    try {
      await emailService.sendRevocationNotification(certificate, reason, revokedBy);
    } catch (emailError) {
      console.error('Failed to send revocation email:', emailError);
    }

    res.json({
      success: true,
      message: 'Certificate revoked successfully',
      certificate: {
        certificateId: certificate.certificateId,
        studentName: certificate.studentName,
        status: certificate.status,
        revocationReason: certificate.revocationReason,
        revokedDate: certificate.revokedDate,
        revokedBy: certificate.revokedBy
      }
    });

  } catch (error) {
    console.error('Certificate revocation error:', error);
    res.status(500).json({ error: 'Failed to revoke certificate' });
  }
});

// Helper functions
async function generateCertificateId() {
  const prefix = 'DEIT';
  const year = new Date().getFullYear();
  
  const count = await Certificate.countDocuments({
    generatedDate: {
      $gte: new Date(year, 0, 1),
      $lt: new Date(year + 1, 0, 1)
    }
  });
  
  const sequence = String(count + 1).padStart(4, '0');
  return `${prefix}${year}${sequence}`;
}

function generateBlockchainHash() {
  const chars = '0123456789abcdef';
  let hash = '0x';
  for (let i = 0; i < 64; i++) {
    hash += chars[Math.floor(Math.random() * chars.length)];
  }
  return hash;
}

module.exports = router;
