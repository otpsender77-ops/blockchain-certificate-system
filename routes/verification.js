const express = require('express');
const Certificate = require('../models/Certificate');
const VerificationLog = require('../models/VerificationLog');
const blockchainService = require('../services/blockchainService');
const emailService = require('../services/emailService');
const router = express.Router();

// Verify certificate by ID
router.post('/certificate-id', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { certificateId } = req.body;

    if (!certificateId) {
      // Log failed verification
      await VerificationLog.logVerification({
        certificateId: certificateId || 'unknown',
        verificationMethod: 'certificateId',
        identifier: certificateId || 'empty',
        success: false,
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent'),
        errorMessage: 'Certificate ID is required',
        responseTime: Date.now() - startTime
      });
      
      return res.status(400).json({ error: 'Certificate ID is required' });
    }

    const certificate = await Certificate.findOne({ certificateId });
    
    if (!certificate) {
      // Log failed verification
      await VerificationLog.logVerification({
        certificateId,
        verificationMethod: 'certificateId',
        identifier: certificateId,
        success: false,
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent'),
        errorMessage: 'Certificate not found',
        responseTime: Date.now() - startTime
      });
      
      return res.json({
        success: false,
        valid: false,
        message: 'Certificate not found',
        method: 'Certificate ID',
        identifier: certificateId
      });
    }

    // Check if certificate is revoked
    if (certificate.status === 'revoked') {
      return res.json({
        success: false,
        valid: false,
        message: 'Certificate has been revoked',
        method: 'Certificate ID',
        identifier: certificateId,
        certificate: {
          certificateId: certificate.certificateId,
          studentName: certificate.studentName,
          courseName: certificate.courseName,
          issueDate: certificate.issueDate,
          status: certificate.status,
          revocationReason: certificate.revocationReason,
          revokedDate: certificate.revokedDate,
          revokedBy: certificate.revokedBy
        }
      });
    }

    // Verify on blockchain
    const blockchainVerification = await blockchainService.verifyCertificate(certificate.certificateId);

    // Increment verification count
    await certificate.incrementVerification();

    // Log successful verification
    await VerificationLog.logVerification({
      certificateId,
      verificationMethod: 'certificateId',
      identifier: certificateId,
      success: true,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      verificationData: {
        studentName: certificate.studentName,
        courseName: certificate.courseName,
        issueDate: certificate.issueDate
      },
      responseTime: Date.now() - startTime
    });

    // Send verification notification email
    try {
      await emailService.sendVerificationNotification(certificate, {
        method: 'Certificate ID',
        identifier: certificateId,
        timestamp: new Date(),
        ip: req.ip || req.connection.remoteAddress
      });
    } catch (emailError) {
      console.error('Failed to send verification notification:', emailError);
    }

    res.json({
      success: true,
      valid: true,
      certificate: {
        certificateId: certificate.certificateId,
        studentName: certificate.studentName,
        parentName: certificate.parentName,
        district: certificate.district,
        state: certificate.state,
        courseName: certificate.courseName,
        issueDate: certificate.issueDate,
        generatedDate: certificate.generatedDate,
        blockchainHash: certificate.blockchainHash,
        transactionHash: certificate.transactionHash,
        blockNumber: certificate.blockNumber,
        gasUsed: certificate.gasUsed,
        verificationCount: certificate.verificationCount + 1,
        status: certificate.status
      },
      blockchain: blockchainVerification,
      method: 'Certificate ID',
      identifier: certificateId,
      verifiedAt: new Date()
    });

  } catch (error) {
    console.error('Certificate ID verification error:', error);
    
    // Log error
    await VerificationLog.logVerification({
      certificateId: req.body.certificateId || 'unknown',
      verificationMethod: 'certificateId',
      identifier: req.body.certificateId || 'unknown',
      success: false,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      errorMessage: error.message,
      responseTime: Date.now() - startTime
    });
    
    res.status(500).json({ error: 'Verification failed' });
  }
});

// Verify certificate by blockchain hash
router.post('/blockchain-hash', async (req, res) => {
  try {
    const { hash } = req.body;

    if (!hash) {
      return res.status(400).json({ error: 'Blockchain hash is required' });
    }

    // Try to find by blockchain hash first, then by transaction hash
    let certificate = await Certificate.findOne({ blockchainHash: hash });
    if (!certificate) {
      certificate = await Certificate.findOne({ transactionHash: hash });
    }
    
    if (!certificate) {
      return res.json({
        success: false,
        valid: false,
        message: 'Certificate not found for this transaction hash',
        method: 'Transaction Hash',
        identifier: hash
      });
    }

    // Verify on blockchain
    const blockchainVerification = await blockchainService.verifyCertificate(certificate.certificateId);
    
    if (!blockchainVerification.isValid) {
      return res.json({
        success: false,
        valid: false,
        message: 'Certificate verification failed on blockchain',
        method: 'Transaction Hash',
        identifier: hash
      });
    }

    // Increment verification count
    await certificate.incrementVerification();

    // Send verification notification email
    try {
      await emailService.sendVerificationNotification(certificate, {
        method: 'Transaction Hash',
        identifier: hash,
        timestamp: new Date(),
        ip: req.ip || req.connection.remoteAddress
      });
    } catch (emailError) {
      console.error('Failed to send verification notification:', emailError);
    }

    res.json({
      success: true,
      valid: true,
      certificate: {
        certificateId: certificate.certificateId,
        studentName: certificate.studentName,
        parentName: certificate.parentName,
        district: certificate.district,
        state: certificate.state,
        courseName: certificate.courseName,
        issueDate: certificate.issueDate,
        generatedDate: certificate.generatedDate,
        blockchainHash: certificate.blockchainHash,
        transactionHash: certificate.transactionHash,
        blockNumber: certificate.blockNumber,
        gasUsed: certificate.gasUsed,
        verificationCount: certificate.verificationCount + 1,
        status: certificate.status
      },
      blockchain: blockchainVerification,
      method: 'Blockchain Hash',
      identifier: hash,
      verifiedAt: new Date()
    });

  } catch (error) {
    console.error('Blockchain hash verification error:', error);
    res.status(500).json({ error: 'Verification failed' });
  }
});

// Verify certificate by QR code data
router.post('/qr-code', async (req, res) => {
  try {
    const { qrData } = req.body;

    if (!qrData) {
      return res.status(400).json({ error: 'QR code data is required' });
    }

    let parsedData;
    try {
      parsedData = JSON.parse(qrData);
    } catch (parseError) {
      return res.status(400).json({ error: 'Invalid QR code format' });
    }

    if (!parsedData.certificateId) {
      return res.status(400).json({ error: 'Certificate ID not found in QR code data' });
    }

    const certificate = await Certificate.findOne({ certificateId: parsedData.certificateId });
    
    if (!certificate) {
      return res.json({
        success: false,
        valid: false,
        message: 'Certificate not found',
        method: 'QR Code',
        identifier: parsedData.certificateId
      });
    }

    // Verify QR code data matches certificate
    const qrDataMatches = (
      parsedData.studentName === certificate.studentName &&
      parsedData.courseName === certificate.courseName &&
      parsedData.blockchainHash === certificate.blockchainHash
    );

    if (!qrDataMatches) {
      return res.json({
        success: false,
        valid: false,
        message: 'QR code data does not match certificate records',
        method: 'QR Code',
        identifier: parsedData.certificateId
      });
    }

    // Verify on blockchain
    const blockchainVerification = await blockchainService.verifyCertificate(certificate.certificateId);

    // Increment verification count
    await certificate.incrementVerification();

    // Send verification notification email
    try {
      await emailService.sendVerificationNotification(certificate, {
        method: 'QR Code',
        identifier: parsedData.certificateId,
        timestamp: new Date(),
        ip: req.ip || req.connection.remoteAddress
      });
    } catch (emailError) {
      console.error('Failed to send verification notification:', emailError);
    }

    res.json({
      success: true,
      valid: true,
      certificate: {
        certificateId: certificate.certificateId,
        studentName: certificate.studentName,
        parentName: certificate.parentName,
        district: certificate.district,
        state: certificate.state,
        courseName: certificate.courseName,
        issueDate: certificate.issueDate,
        generatedDate: certificate.generatedDate,
        blockchainHash: certificate.blockchainHash,
        transactionHash: certificate.transactionHash,
        blockNumber: certificate.blockNumber,
        gasUsed: certificate.gasUsed,
        verificationCount: certificate.verificationCount + 1,
        status: certificate.status
      },
      blockchain: blockchainVerification,
      qrData: parsedData,
      method: 'QR Code',
      identifier: parsedData.certificateId,
      verifiedAt: new Date()
    });

  } catch (error) {
    console.error('QR code verification error:', error);
    res.status(500).json({ error: 'Verification failed' });
  }
});

// Get verification statistics
router.get('/stats', async (req, res) => {
  try {
    const verificationStats = await VerificationLog.getVerificationStats();
    
    res.json({
      success: true,
      stats: verificationStats
    });

  } catch (error) {
    console.error('Get verification stats error:', error);
    res.status(500).json({ error: 'Failed to fetch verification statistics' });
  }
});

// Get verification history for a specific certificate
router.get('/history/:certificateId', async (req, res) => {
  try {
    const { certificateId } = req.params;
    const { limit = 50 } = req.query;
    
    const history = await VerificationLog.getCertificateVerificationHistory(certificateId, parseInt(limit));
    
    res.json({
      success: true,
      certificateId,
      history
    });

  } catch (error) {
    console.error('Get verification history error:', error);
    res.status(500).json({ error: 'Failed to fetch verification history' });
  }
});

// Get verification trends
router.get('/trends', async (req, res) => {
  try {
    const { days = 30 } = req.query;
    
    const trends = await VerificationLog.getVerificationTrends(parseInt(days));
    
    res.json({
      success: true,
      trends,
      period: `${days} days`
    });

  } catch (error) {
    console.error('Get verification trends error:', error);
    res.status(500).json({ error: 'Failed to fetch verification trends' });
  }
});

// Get blockchain network info
router.get('/blockchain/info', async (req, res) => {
  try {
    const networkInfo = await blockchainService.getNetworkInfo();
    
    res.json({
      success: true,
      blockchain: {
        connected: blockchainService.isConnected(),
        networkInfo
      }
    });

  } catch (error) {
    console.error('Get blockchain info error:', error);
    res.status(500).json({ error: 'Failed to fetch blockchain information' });
  }
});

// Verify certificate by transaction hash
router.post('/transaction-hash', async (req, res) => {
  try {
    const { transactionHash } = req.body;

    if (!transactionHash) {
      return res.status(400).json({ error: 'Transaction hash is required' });
    }

    const certificate = await Certificate.findOne({ transactionHash });
    
    if (!certificate) {
      return res.json({
        success: false,
        valid: false,
        message: 'Certificate not found for this transaction hash',
        method: 'Transaction Hash',
        identifier: transactionHash
      });
    }

    // Verify on blockchain
    const blockchainVerification = await blockchainService.verifyCertificate(certificate.certificateId);

    // Increment verification count
    await certificate.incrementVerification();

    // Send verification notification email
    try {
      await emailService.sendVerificationNotification(certificate, {
        method: 'Transaction Hash',
        identifier: transactionHash,
        timestamp: new Date(),
        ip: req.ip || req.connection.remoteAddress
      });
    } catch (emailError) {
      console.error('Failed to send verification notification:', emailError);
    }

    res.json({
      success: true,
      valid: true,
      certificate: {
        certificateId: certificate.certificateId,
        studentName: certificate.studentName,
        parentName: certificate.parentName,
        district: certificate.district,
        state: certificate.state,
        courseName: certificate.courseName,
        issueDate: certificate.issueDate,
        generatedDate: certificate.generatedDate,
        blockchainHash: certificate.blockchainHash,
        transactionHash: certificate.transactionHash,
        blockNumber: certificate.blockNumber,
        gasUsed: certificate.gasUsed,
        verificationCount: certificate.verificationCount + 1,
        status: certificate.status
      },
      blockchain: blockchainVerification,
      method: 'Transaction Hash',
      identifier: transactionHash,
      verifiedAt: new Date()
    });

  } catch (error) {
    console.error('Transaction hash verification error:', error);
    res.status(500).json({ error: 'Verification failed' });
  }
});

module.exports = router;
