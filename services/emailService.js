const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs').promises;
const EmailLog = require('../models/EmailLog');

class EmailService {
  constructor() {
    this.transporter = null;
    this.isInitialized = false;
  }

  async initialize() {
    try {
      // Create transporter for Brevo SMTP
      this.transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: parseInt(process.env.EMAIL_PORT),
        secure: process.env.EMAIL_SECURE === 'true',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        },
        tls: {
          rejectUnauthorized: false
        }
      });

      // Verify connection
      await this.transporter.verify();
      this.isInitialized = true;
      console.log('✅ Email service initialized successfully');
      
    } catch (error) {
      console.error('❌ Email service initialization failed:', error);
      throw error;
    }
  }

  async sendCertificateEmail(certificate, attachments = []) {
    let emailLog = null;
    
    try {
      if (!this.isInitialized) {
        throw new Error('Email service not initialized');
      }

      emailLog = new EmailLog({
        certificateId: certificate.certificateId,
        studentEmail: certificate.studentEmail,
        studentName: certificate.studentName,
        emailType: 'certificate_issued',
        subject: `Your Certificate from ${process.env.INSTITUTE_NAME}`,
        sentBy: certificate.generatedBy,
        attachments: attachments.map(att => ({
          filename: att.filename,
          contentType: att.contentType,
          size: att.size,
          path: att.path
        }))
      });

      await emailLog.save();

      const emailContent = this.generateCertificateEmailHTML(certificate);
      
      const mailOptions = {
        from: process.env.SMTP_FROM,
        to: certificate.studentEmail,
        subject: `Your Certificate from ${process.env.INSTITUTE_NAME}`,
        html: emailContent,
        attachments: attachments.map(att => ({
          filename: att.filename,
          path: att.path,
          contentType: att.contentType
        }))
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      await emailLog.markAsSent(result.messageId);
      
      // Update certificate email status
      await certificate.markEmailSent();
      
      console.log(`✅ Certificate email sent to ${certificate.studentEmail}`);
      return {
        success: true,
        messageId: result.messageId,
        emailLogId: emailLog._id
      };

    } catch (error) {
      console.error('❌ Failed to send certificate email:', error);
      
      // Log the error
      if (emailLog) {
        await emailLog.markAsFailed(error.message);
      }
      
      return {
        success: false,
        error: error.message
      };
    }
  }

  generateCertificateEmailHTML(certificate) {
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify/${certificate.certificateId}`;
    
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Your Certificate from ${process.env.INSTITUTE_NAME}</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
          }
          .email-container {
            background: white;
            border-radius: 10px;
            padding: 30px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .header {
            text-align: center;
            border-bottom: 3px solid #1e40af;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .institute-name {
            color: #1e40af;
            font-size: 24px;
            font-weight: bold;
            margin: 0;
          }
          .institute-subtitle {
            color: #f59e0b;
            font-style: italic;
            margin: 5px 0 0 0;
          }
          .greeting {
            font-size: 18px;
            margin-bottom: 20px;
          }
          .certificate-details {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            border-left: 4px solid #1e40af;
          }
          .detail-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            padding: 5px 0;
          }
          .detail-label {
            font-weight: bold;
            color: #1e40af;
          }
          .detail-value {
            color: #333;
          }
          .blockchain-info {
            background: #e0f2fe;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
            border: 1px solid #0288d1;
          }
          .blockchain-title {
            color: #0288d1;
            font-weight: bold;
            margin-bottom: 10px;
          }
          .blockchain-hash {
            font-family: monospace;
            font-size: 12px;
            word-break: break-all;
            background: white;
            padding: 8px;
            border-radius: 4px;
            border: 1px solid #ddd;
          }
          .verification-section {
            text-align: center;
            margin: 30px 0;
            padding: 20px;
            background: #f0f9ff;
            border-radius: 8px;
            border: 2px solid #0ea5e9;
          }
          .verify-button {
            display: inline-block;
            background: #1e40af;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: bold;
            margin: 10px 0;
          }
          .verify-button:hover {
            background: #1e3a8a;
          }
          .attachments {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
          }
          .attachment-item {
            display: flex;
            align-items: center;
            margin: 8px 0;
          }
          .attachment-icon {
            margin-right: 10px;
            font-size: 18px;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            color: #666;
            font-size: 14px;
          }
          .social-links {
            margin: 15px 0;
          }
          .social-links a {
            color: #1e40af;
            text-decoration: none;
            margin: 0 10px;
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="header">
            <h1 class="institute-name">${process.env.INSTITUTE_NAME}</h1>
            <p class="institute-subtitle">${process.env.INSTITUTE_SUBTITLE}</p>
          </div>
          
          <div class="greeting">
            Dear <strong>${certificate.studentName}</strong>,
          </div>
          
          <p>Congratulations! We are pleased to inform you that your certificate has been successfully generated and stored on the blockchain. Your achievement is now permanently recorded and verifiable.</p>
          
          <div class="certificate-details">
            <h3 style="color: #1e40af; margin-top: 0;">Certificate Details</h3>
            <div class="detail-row">
              <span class="detail-label">Certificate ID:</span>
              <span class="detail-value">${certificate.certificateId}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Course:</span>
              <span class="detail-value">${certificate.courseName}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Issue Date:</span>
              <span class="detail-value">${new Date(certificate.issueDate).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Location:</span>
              <span class="detail-value">${certificate.district}, ${certificate.state}</span>
            </div>
          </div>
          
          <div class="blockchain-info">
            <div class="blockchain-title">🔗 Blockchain Information</div>
            <p><strong>Transaction Hash:</strong></p>
            <div class="blockchain-hash">${certificate.transactionHash}</div>
            <p><strong>Block Number:</strong> ${certificate.blockNumber.toLocaleString()}</p>
            <p><strong>Gas Used:</strong> ${certificate.gasUsed}</p>
          </div>
          
          <div class="verification-section">
            <h3 style="color: #0ea5e9; margin-top: 0;">Verify Your Certificate</h3>
            <p>Your certificate is now permanently stored on the blockchain, ensuring its authenticity and preventing tampering. You can verify it anytime using the link below:</p>
            <a href="${verificationUrl}" class="verify-button">Verify Certificate Online</a>
            <p style="font-size: 14px; color: #666; margin-top: 15px;">
              Or visit: <a href="${verificationUrl}" style="color: #0ea5e9;">${verificationUrl}</a>
            </p>
          </div>
          
          <div class="attachments">
            <h4 style="color: #1e40af; margin-top: 0;">📎 Attachments</h4>
            <div class="attachment-item">
              <span class="attachment-icon">📄</span>
              <span>Certificate.pdf - Your official certificate document</span>
            </div>
            <div class="attachment-item">
              <span class="attachment-icon">🔍</span>
              <span>QR_Code.png - Quick verification code</span>
            </div>
            <div class="attachment-item">
              <span class="attachment-icon">📋</span>
              <span>Verification_Instructions.pdf - How to verify your certificate</span>
            </div>
          </div>
          
          <p>Your certificate represents your successful completion of the course and demonstrates your commitment to learning and professional development.</p>
          
          <p>If you have any questions or need assistance, please don't hesitate to contact us.</p>
          
          <div class="footer">
            <p><strong>Best regards,</strong><br>
            ${process.env.DIRECTOR_NAME}<br>
            ${process.env.DIRECTOR_TITLE}<br>
            ${process.env.INSTITUTE_NAME}</p>
            
            <div class="social-links">
              <a href="#">Website</a> |
              <a href="#">LinkedIn</a> |
              <a href="#">Twitter</a>
            </div>
            
            <p style="font-size: 12px; color: #999;">
              This is an automated message. Please do not reply to this email.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  async sendVerificationNotification(certificate, verificationData) {
    try {
      const emailLog = new EmailLog({
        certificateId: certificate.certificateId,
        studentEmail: certificate.studentEmail,
        studentName: certificate.studentName,
        emailType: 'verification_notification',
        subject: `Certificate Verification Alert - ${certificate.certificateId}`,
        sentBy: 'system',
        metadata: verificationData
      });

      await emailLog.save();

      const emailContent = this.generateVerificationNotificationHTML(certificate, verificationData);
      
      const mailOptions = {
        from: process.env.SMTP_FROM,
        to: certificate.studentEmail,
        subject: `Certificate Verification Alert - ${certificate.certificateId}`,
        html: emailContent
      };

      const result = await this.transporter.sendMail(mailOptions);
      await emailLog.markAsSent(result.messageId);
      
      return {
        success: true,
        messageId: result.messageId
      };

    } catch (error) {
      console.error('❌ Failed to send verification notification:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  generateVerificationNotificationHTML(certificate, verificationData) {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Certificate Verification Alert</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
          }
          .email-container {
            background: white;
            border-radius: 10px;
            padding: 30px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .alert-header {
            background: #fef3c7;
            border: 1px solid #f59e0b;
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 20px;
            text-align: center;
          }
          .alert-icon {
            font-size: 24px;
            margin-bottom: 10px;
          }
          .verification-details {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="alert-header">
            <div class="alert-icon">🔍</div>
            <h2 style="color: #f59e0b; margin: 0;">Certificate Verification Alert</h2>
          </div>
          
          <p>Dear <strong>${certificate.studentName}</strong>,</p>
          
          <p>This is to inform you that your certificate has been verified on our system.</p>
          
          <div class="verification-details">
            <h3>Verification Details:</h3>
            <p><strong>Certificate ID:</strong> ${certificate.certificateId}</p>
            <p><strong>Verified On:</strong> ${new Date(verificationData.timestamp).toLocaleString()}</p>
            <p><strong>Verification Method:</strong> ${verificationData.method}</p>
            <p><strong>IP Address:</strong> ${verificationData.ip || 'Not available'}</p>
          </div>
          
          <p>If you did not request this verification, please contact us immediately.</p>
          
          <p>Best regards,<br>
          ${process.env.INSTITUTE_NAME}</p>
        </div>
      </body>
      </html>
    `;
  }

  async retryFailedEmails() {
    try {
      const failedEmails = await EmailLog.getFailedEmails(5);
      
      for (const emailLog of failedEmails) {
        // Implementation for retrying failed emails
        console.log(`Retrying email for certificate: ${emailLog.certificateId}`);
      }
      
    } catch (error) {
      console.error('❌ Failed to retry emails:', error);
    }
  }

  async sendRevocationNotification(certificate, reason, revokedBy) {
    try {
      const emailLog = new EmailLog({
        certificateId: certificate.certificateId,
        studentEmail: certificate.studentEmail,
        studentName: certificate.studentName,
        emailType: 'revocation_notification',
        status: 'pending',
        sentBy: revokedBy || 'System',
        subject: `Certificate Revocation Notice - ${certificate.certificateId}`
      });
      await emailLog.save();

      const mailOptions = {
        from: process.env.SMTP_FROM,
        to: certificate.studentEmail,
        subject: `Certificate Revocation Notice - ${certificate.certificateId}`,
        html: this.generateRevocationEmailHTML(certificate, reason, revokedBy)
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      await emailLog.markAsSent(result.messageId);
      
      console.log(`✅ Revocation notification sent to ${certificate.studentEmail}`);
      return {
        success: true,
        messageId: result.messageId,
        emailLogId: emailLog._id
      };

    } catch (error) {
      console.error('❌ Failed to send revocation notification:', error);
      throw error;
    }
  }

  generateRevocationEmailHTML(certificate, reason, revokedBy) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Certificate Revocation Notice</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background-color: #f4f4f4; }
          .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
          .header { text-align: center; border-bottom: 3px solid #dc3545; padding-bottom: 20px; margin-bottom: 30px; }
          .header h1 { color: #dc3545; margin: 0; font-size: 24px; }
          .content { margin-bottom: 30px; }
          .certificate-details { background: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0; }
          .certificate-details h3 { margin-top: 0; color: #495057; }
          .certificate-details p { margin: 5px 0; }
          .revocation-info { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; color: #6c757d; font-size: 14px; border-top: 1px solid #dee2e6; padding-top: 20px; }
          .warning { color: #dc3545; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🚫 Certificate Revocation Notice</h1>
            <p>Digital Excellence Institute of Technology</p>
          </div>
          
          <div class="content">
            <p>Dear <strong>${certificate.studentName}</strong>,</p>
            
            <p>We are writing to inform you that your certificate has been revoked due to the following reason:</p>
            
            <div class="revocation-info">
              <h3>Revocation Details:</h3>
              <p><strong>Reason:</strong> ${reason}</p>
              <p><strong>Revoked By:</strong> ${revokedBy}</p>
              <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
            </div>
            
            <div class="certificate-details">
              <h3>Certificate Information:</h3>
              <p><strong>Certificate ID:</strong> ${certificate.certificateId}</p>
              <p><strong>Student Name:</strong> ${certificate.studentName}</p>
              <p><strong>Course:</strong> ${certificate.courseName}</p>
              <p><strong>Issue Date:</strong> ${new Date(certificate.generatedDate).toLocaleDateString()}</p>
            </div>
            
            <p class="warning">⚠️ This certificate is no longer valid and should not be used for any official purposes.</p>
            
            <p>If you have any questions or concerns about this revocation, please contact our administration office.</p>
            
            <p>Best regards,<br>
            ${process.env.INSTITUTE_NAME}</p>
          </div>
          
          <div class="footer">
            <p>This is an automated notification. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  isInitialized() {
    return this.isInitialized;
  }
}

module.exports = new EmailService();
