const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { authenticateToken } = require('./auth');
const Certificate = require('../models/Certificate');
const EmailLog = require('../models/EmailLog');
const blockchainService = require('../services/blockchainService');
const emailService = require('../services/emailService');
const pdfService = require('../services/pdfService');
const ipfsService = require('../services/ipfsService');
const router = express.Router();

// Cleanup utility function
async function cleanupTempFiles() {
  try {
    const tempDir = path.join(__dirname, '..', 'temp');
    const files = await fs.readdir(tempDir);
    const pdfFiles = files.filter(file => file.endsWith('.pdf'));
    
    if (pdfFiles.length > 0) {
      console.log(`🧹 Found ${pdfFiles.length} orphaned PDF files in temp directory`);
      
      for (const file of pdfFiles) {
        try {
          const filePath = path.join(tempDir, file);
          const stats = await fs.stat(filePath);
          const ageInHours = (Date.now() - stats.mtime.getTime()) / (1000 * 60 * 60);
          
          // Delete files older than 1 hour
          if (ageInHours > 1) {
            await fs.unlink(filePath);
            console.log(`🗑️ Cleaned up orphaned file: ${file} (age: ${ageInHours.toFixed(1)}h)`);
          }
        } catch (fileError) {
          console.warn(`⚠️ Failed to clean up ${file}:`, fileError.message);
        }
      }
    }
  } catch (error) {
    console.warn('⚠️ Temp cleanup failed:', error.message);
  }
}

// Schedule cleanup every 30 minutes
setInterval(cleanupTempFiles, 30 * 60 * 1000);

// Run initial cleanup
cleanupTempFiles();

// Manual cleanup endpoint for admin
router.post('/cleanup-temp', authenticateToken, async (req, res) => {
  try {
    await cleanupTempFiles();
    res.json({ success: true, message: 'Temp cleanup completed' });
  } catch (error) {
    res.status(500).json({ error: 'Cleanup failed', message: error.message });
  }
});

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

// Search certificate by ID or transaction hash
router.get('/search/:query', authenticateToken, async (req, res) => {
  try {
    const query = req.params.query;
    
    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const certificate = await Certificate.findOne({
      $or: [
        { certificateId: query },
        { transactionHash: query }
      ]
    });

    if (!certificate) {
      return res.status(404).json({ 
        success: false, 
        error: 'Certificate not found' 
      });
    }

    res.json({
      success: true,
      certificate
    });
  } catch (error) {
    console.error('Search certificate error:', error);
    res.status(500).json({ error: 'Failed to search certificate' });
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

    // Create certificate record first (without blockchain data)
    const certificate = new Certificate({
      ...certificateData,
      blockchainHash
    });

    await certificate.save();

    // Step 1: Generate PDF with embedded QR code
    const pdfResult = await pdfService.generateCertificatePDF(certificate);
    
    if (!pdfResult.success) {
      throw new Error('Failed to generate PDF');
    }

    // Step 2: Upload to IPFS
    const ipfsResult = await ipfsService.uploadCertificateToIPFS(pdfResult.pdfPath);
    
    // Step 3: Issue certificate on blockchain with IPFS hash
    const blockchainResult = await blockchainService.issueCertificate({
      certificateId,
      studentName,
      courseName,
      instituteName: process.env.INSTITUTE_NAME,
      issueDate: certificateData.issueDate,
      certificateHash: blockchainHash,
      ipfsHash: ipfsResult.hash
    });

    // Step 4: Update certificate with all data (no local PDF storage)
    certificate.pdfPath = null; // No local PDF storage
    certificate.ipfsHash = ipfsResult.hash;
    certificate.ipfsUrl = ipfsResult.url;
    certificate.ipfsSize = ipfsResult.size;
    certificate.transactionHash = blockchainResult.transactionHash;
    certificate.blockNumber = blockchainResult.blockNumber;
    certificate.gasUsed = blockchainResult.gasUsed;
    await certificate.save();

    // Step 5: Send email with PDF attachment (after all data is saved)
    const attachments = [];
    const pdfFullPath = pdfResult.pdfPath; // Use temp path for email
    
    attachments.push({
      filename: `Certificate_${certificateId}.pdf`,
      path: pdfFullPath,
      contentType: 'application/pdf'
    });

    // Send certificate email
    try {
      await emailService.sendCertificateEmail(
        certificate,
        attachments
      );
      console.log(`✅ Certificate email sent to ${certificate.studentEmail}`);
    } catch (emailError) {
      console.error('❌ Failed to send certificate email:', emailError);
    }

    // Step 6: Clean up temporary PDF file
    try {
      if (await fs.access(pdfFullPath).then(() => true).catch(() => false)) {
        await fs.unlink(pdfFullPath);
        console.log(`🗑️ Cleaned up temporary PDF: ${path.basename(pdfFullPath)}`);
      }
    } catch (cleanupError) {
      console.warn('⚠️ Failed to clean up temporary PDF:', cleanupError.message);
      // Schedule cleanup for later
      setTimeout(async () => {
        try {
          if (await fs.access(pdfFullPath).then(() => true).catch(() => false)) {
            await fs.unlink(pdfFullPath);
            console.log(`🗑️ Delayed cleanup successful: ${path.basename(pdfFullPath)}`);
          }
        } catch (delayedError) {
          console.error('❌ Delayed cleanup failed:', delayedError.message);
        }
      }, 5000); // Try again in 5 seconds
    }

    res.status(201).json({
      success: true,
      certificate,
      blockchain: blockchainResult,
      pdf: pdfResult,
      ipfs: ipfsResult,
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
    
    // If certificate has IPFS hash, download PDF from Pinata
    if (certificate.ipfsHash) {
      try {
        console.log(`📥 Downloading PDF from IPFS for resend: ${certificate.ipfsHash}`);
        
        // Download PDF from IPFS
        const ipfsResult = await ipfsService.retrieveFromIPFS(certificate.ipfsHash);
        
        if (ipfsResult && ipfsResult.data && ipfsResult.data.length > 0) {
          // Create temporary file for email attachment
          const tempDir = path.join(__dirname, '..', 'temp');
          await fs.mkdir(tempDir, { recursive: true });
          
          const tempPdfPath = path.join(tempDir, `resend_${certificate.certificateId}.pdf`);
          await fs.writeFile(tempPdfPath, ipfsResult.data);
          
          attachments.push({
            filename: `Certificate_${certificate.certificateId}.pdf`,
            path: tempPdfPath,
            contentType: 'application/pdf'
          });
          
          console.log(`✅ PDF downloaded from IPFS for resend: ${tempPdfPath} (${ipfsResult.data.length} bytes)`);
        } else {
          console.log('⚠️ No PDF data retrieved from IPFS:', ipfsResult ? 'data missing or empty' : 'no result');
        }
      } catch (ipfsError) {
        console.error('❌ Failed to download PDF from IPFS:', ipfsError);
        // Continue without PDF attachment
      }
    }
    
    // Fallback to local PDF if IPFS fails and local file exists
    if (attachments.length === 0 && certificate.pdfPath) {
      const pdfFullPath = resolveFilePath(certificate.pdfPath);
      if (pdfFullPath) {
        attachments.push({
          filename: `Certificate_${certificate.certificateId}.pdf`,
          path: pdfFullPath,
          contentType: 'application/pdf'
        });
        console.log(`📄 Using local PDF for resend: ${pdfFullPath}`);
      }
    }

    // Send email
    const emailResult = await emailService.sendCertificateEmail(certificate, attachments);

    // Clean up temporary PDF file if created
    if (attachments.length > 0 && attachments[0].path.includes('resend_')) {
      try {
        await fs.unlink(attachments[0].path);
        console.log(`🗑️ Cleaned up temporary resend PDF: ${path.basename(attachments[0].path)}`);
      } catch (cleanupError) {
        console.error('⚠️ Failed to clean up temporary resend PDF:', cleanupError);
      }
    }

    res.json({
      success: true,
      email: emailResult,
      message: 'Email sent successfully',
      attachmentsCount: attachments.length
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

        // Generate PDF with embedded QR code and upload to IPFS
        const pdfResult = await pdfService.generateCertificatePDF(certificate);

        // Update certificate with IPFS data
        certificate.ipfsHash = pdfResult.ipfsHash;
        certificate.ipfsUrl = pdfResult.ipfsUrl;
        certificate.ipfsSize = pdfResult.ipfsSize;
        await certificate.save();

        // Send email with PDF attachment from IPFS
        try {
          // Download PDF from IPFS for email attachment
          const ipfsResult = await ipfsService.retrieveFromIPFS(certificate.ipfsHash);
          
          const attachments = [];
          if (ipfsResult && ipfsResult.data && ipfsResult.data.length > 0) {
            // Create temporary file for email attachment
            const tempDir = path.join(__dirname, '..', 'temp');
            await fs.mkdir(tempDir, { recursive: true });
            
            const tempPdfPath = path.join(tempDir, `batch_${certificateId}.pdf`);
            await fs.writeFile(tempPdfPath, ipfsResult.data);
            
            attachments.push({
              filename: `Certificate_${certificateId}.pdf`,
              path: tempPdfPath,
              contentType: 'application/pdf'
            });
          }
          
          await emailService.sendCertificateEmail(certificate, attachments);
          await certificate.markEmailSent();
          
          // Clean up temporary PDF file
          if (attachments.length > 0) {
            try {
              await fs.unlink(attachments[0].path);
            } catch (cleanupError) {
              console.error(`Failed to clean up temporary PDF for ${certificateId}:`, cleanupError);
            }
          }
        } catch (emailError) {
          console.error(`Email failed for ${certificateId}:`, emailError);
        }

          return {
            success: true,
            index: globalIndex + 1,
            certificateId,
            studentName: student.studentName,
            studentEmail: student.studentEmail,
            ipfsHash: certificate.ipfsHash,
            ipfsUrl: certificate.ipfsUrl
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
    const { reason = 'Administrative revocation', revokedBy = 'System Administrator' } = req.body;

    const certificate = await Certificate.findOne({ certificateId: req.params.id });
    
    if (!certificate) {
      return res.status(404).json({ error: 'Certificate not found' });
    }

    if (certificate.revoked) {
      return res.status(400).json({ error: 'Certificate is already revoked' });
    }

    // Update certificate status
    certificate.revoked = true;
    certificate.revocationReason = reason;
    certificate.revokedBy = revokedBy;
    certificate.revokedDate = new Date();
    await certificate.save();

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
        revoked: certificate.revoked,
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

// Restore certificate
router.post('/:id/restore', authenticateToken, async (req, res) => {
  try {
    const certificate = await Certificate.findOne({ certificateId: req.params.id });
    
    if (!certificate) {
      return res.status(404).json({ error: 'Certificate not found' });
    }

    if (!certificate.revoked) {
      return res.status(400).json({ error: 'Certificate is not revoked' });
    }

    // Restore certificate
    certificate.revoked = false;
    certificate.revocationReason = null;
    certificate.revokedBy = null;
    certificate.revokedDate = null;
    await certificate.save();

    res.json({
      success: true,
      message: 'Certificate restored successfully',
      certificate: {
        certificateId: certificate.certificateId,
        studentName: certificate.studentName,
        revoked: certificate.revoked
      }
    });

  } catch (error) {
    console.error('Certificate restoration error:', error);
    res.status(500).json({ error: 'Failed to restore certificate' });
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

// Get certificate from IPFS
router.get('/:id/ipfs', async (req, res) => {
  try {
    const certificate = await Certificate.findOne({ certificateId: req.params.id });
    
    if (!certificate) {
      return res.status(404).json({ error: 'Certificate not found' });
    }

    if (!certificate.ipfsHash) {
      return res.status(404).json({ error: 'Certificate not available on IPFS' });
    }

    // Retrieve from IPFS
    const ipfsResult = await ipfsService.retrieveFromIPFS(certificate.ipfsHash);
    
    res.json({
      success: true,
      certificate: {
        certificateId: certificate.certificateId,
        studentName: certificate.studentName,
        courseName: certificate.courseName,
        issueDate: certificate.issueDate,
        ipfsHash: certificate.ipfsHash,
        ipfsUrl: certificate.ipfsUrl,
        ipfsSize: certificate.ipfsSize
      },
      ipfs: ipfsResult
    });

  } catch (error) {
    console.error('IPFS retrieval error:', error);
    res.status(500).json({ error: 'Failed to retrieve certificate from IPFS' });
  }
});

// Download certificate from IPFS
router.get('/:id/download', async (req, res) => {
  try {
    const certificate = await Certificate.findOne({ certificateId: req.params.id });
    
    if (!certificate) {
      return res.status(404).json({ error: 'Certificate not found' });
    }

    if (!certificate.ipfsHash) {
      return res.status(404).json({ error: 'Certificate not available on IPFS' });
    }

    // Retrieve from IPFS
    const ipfsResult = await ipfsService.retrieveFromIPFS(certificate.ipfsHash);
    
    if (ipfsResult.data) {
      // Set headers for PDF download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="certificate_${certificate.certificateId}.pdf"`);
      res.setHeader('Content-Length', ipfsResult.size);
      
      // Send the PDF data
      res.send(ipfsResult.data);
    } else {
      // Redirect to IPFS gateway
      res.redirect(ipfsResult.url);
    }

  } catch (error) {
    console.error('IPFS download error:', error);
    res.status(500).json({ error: 'Failed to download certificate from IPFS' });
  }
});

// Proxy endpoint for PDF viewing (bypasses X-Frame-Options)
router.get('/:id/proxy', async (req, res) => {
  try {
    const certificate = await Certificate.findOne({ certificateId: req.params.id });
    
    if (!certificate) {
      return res.status(404).json({ error: 'Certificate not found' });
    }

    if (!certificate.ipfsHash) {
      return res.status(404).json({ error: 'Certificate not available on IPFS' });
    }

    // Retrieve from IPFS
    const ipfsResult = await ipfsService.retrieveFromIPFS(certificate.ipfsHash);
    
    if (ipfsResult.data) {
      // Set headers for PDF viewing (not download)
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'inline; filename="certificate.pdf"');
      res.setHeader('Content-Length', ipfsResult.size);
      // Remove X-Frame-Options to allow iframe embedding
      res.removeHeader('X-Frame-Options');
      
      // Send the PDF data
      res.send(ipfsResult.data);
    } else {
      // If we can't get the data, redirect to IPFS gateway
      res.redirect(ipfsResult.url);
    }

  } catch (error) {
    console.error('IPFS proxy error:', error);
    res.status(500).json({ error: 'Failed to proxy certificate from IPFS' });
  }
});

module.exports = router;
