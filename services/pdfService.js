let puppeteer;
try {
  puppeteer = require('puppeteer');
} catch (error) {
  console.warn('⚠️ Puppeteer not available - PDF generation will be disabled');
  puppeteer = null;
}
const QRCode = require('qrcode');
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');
const ipfsService = require('./ipfsService');

class PDFService {
  constructor() {
    this.outputDir = path.join(__dirname, '../public/certificates');
    this.initialized = false;
    this.browser = null;
  }

  async initialize() {
    try {
      // Create output directories
      await fs.mkdir(this.outputDir, { recursive: true });
      
      // Initialize IPFS service
      await ipfsService.initialize();
      
      this.initialized = true;
      console.log('✅ PDF service initialized successfully');
      
    } catch (error) {
      console.error('❌ PDF service initialization failed:', error);
      throw error;
    }
  }

  async generateCertificatePDF(certificate) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      // Generate PDF with embedded QR code
      const pdfPath = await this.generatePDF(certificate);
      
      // Upload to IPFS
      const ipfsResult = await ipfsService.uploadCertificateToIPFS(pdfPath);
      
      return {
        pdfPath,
        ipfsHash: ipfsResult.hash,
        ipfsUrl: ipfsResult.url,
        ipfsSize: ipfsResult.size,
        success: true
      };

    } catch (error) {
      console.error('❌ PDF generation failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }


  async generatePDF(certificate) {
    let page = null;
    
    try {
      // Check if puppeteer is available
      if (!puppeteer) {
        throw new Error('PDF generation is not available - puppeteer not installed');
      }

      // Reuse browser instance if available, otherwise create new one
      if (!this.browser) {
        this.browser = await puppeteer.launch({
          headless: 'new',
          args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
        });
      }

      page = await this.browser.newPage();
      
      // Set page size to A4
      await page.setViewport({ width: 794, height: 1123 }); // A4 size in pixels at 96 DPI
      
      // Generate QR code data URL
      const qrDataUrl = await this.generateQRCodeDataURL(certificate);
      
      // Generate HTML content with embedded QR code
      const htmlContent = this.generateCertificateHTML(certificate, qrDataUrl);
      
      await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
      
      const fileName = `certificate_${certificate.certificateId}.pdf`;
      const tempDir = path.join(__dirname, '..', 'temp');
      const filePath = path.join(tempDir, fileName);
      
      // Ensure temp directory exists
      await fs.mkdir(tempDir, { recursive: true });
      
      // Generate PDF with high quality
      await page.pdf({
        path: filePath,
        format: 'A4',
        printBackground: true,
        margin: {
          top: '0.5in',
          right: '0.5in',
          bottom: '0.5in',
          left: '0.5in'
        },
        preferCSSPageSize: true,
        displayHeaderFooter: false
      });

      console.log(`✅ PDF generated: ${fileName}`);
      // Return full path for IPFS upload (temporary file)
      return filePath;

    } catch (error) {
      console.error('❌ PDF generation failed:', error);
      throw error;
    } finally {
      if (page) {
        await page.close();
      }
      // Don't close browser - keep it for reuse
    }
  }

  async generateQRCodeDataURL(certificate) {
    try {
      const qrData = {
        certificateId: certificate.certificateId,
        studentName: certificate.studentName,
        blockchainHash: certificate.blockchainHash,
        issueDate: certificate.issueDate,
        verificationUrl: `${process.env.BASE_URL || 'http://localhost:3000'}/verify/${certificate.certificateId}`
      };

      const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(qrData), {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      return qrCodeDataURL;
    } catch (error) {
      console.error('❌ QR code data URL generation failed:', error);
      throw error;
    }
  }

  generateCertificateHTML(certificate, qrDataUrl) {
    const issueDate = new Date(certificate.issueDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Certificate - ${certificate.certificateId}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Crimson+Text:ital,wght@0,400;0,600;1,400&display=swap');
          
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Crimson Text', serif;
            background: white;
            color: #1e3a8a;
            line-height: 1.6;
          }
          
          .certificate {
            width: 100%;
            height: 100vh;
            background: white;
            position: relative;
            padding: 20px;
            overflow: hidden;
          }
          
          .certificate-border {
            border: 6px solid #1e40af;
            border-radius: 15px;
            padding: 30px;
            position: relative;
            background: linear-gradient(45deg, transparent 49%, #dbeafe 50%, transparent 51%),
                        linear-gradient(-45deg, transparent 49%, #dbeafe 50%, transparent 51%);
            background-size: 20px 20px;
            background-position: 0 0, 10px 10px;
            height: calc(100vh - 40px);
            display: flex;
            flex-direction: column;
            justify-content: space-between;
          }
          
          .certificate-border::before {
            content: '';
            position: absolute;
            top: 20px;
            left: 20px;
            right: 20px;
            bottom: 20px;
            border: 3px solid #d4af37;
            border-radius: 15px;
            pointer-events: none;
          }
          
          .certificate-header {
            text-align: center;
            margin-bottom: 40px;
            position: relative;
          }
          
          .institute-name {
            font-family: 'Playfair Display', serif;
            font-size: 28px;
            font-weight: 700;
            color: #1e40af;
            margin: 0 0 12px 0;
            text-shadow: 1px 1px 2px rgba(0,0,0,0.1);
            line-height: 1.2;
            word-wrap: break-word;
            white-space: normal;
          }
          
          .institute-subtitle {
            font-family: 'Crimson Text', serif;
            font-size: 16px;
            font-style: italic;
            color: #f59e0b;
            margin: 0 0 20px 0;
            line-height: 1.4;
            word-wrap: break-word;
            white-space: normal;
          }
          
          .decorative-line {
            width: 200px;
            height: 4px;
            background: linear-gradient(to right, #1e40af, #d4af37, #1e40af);
            margin: 0 auto;
            border-radius: 2px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          
          .certificate-body {
            text-align: center;
            flex: 1;
            display: flex;
            flex-direction: column;
            justify-content: center;
            margin: 20px 0;
          }
          
          .certificate-title {
            font-family: 'Playfair Display', serif;
            font-size: 36px;
            font-weight: 600;
            color: #1e40af;
            margin: 0 0 20px 0;
            text-decoration: underline;
            text-decoration-color: #d4af37;
            text-underline-offset: 8px;
            text-decoration-thickness: 2px;
          }
          
          .certificate-text {
            font-size: 18px;
            color: #1e3a8a;
            margin: 10px 0;
            line-height: 1.6;
          }
          
          .student-name {
            font-family: 'Playfair Display', serif;
            font-size: 28px;
            font-weight: 700;
            color: #1e40af;
            margin: 15px 0;
            text-transform: uppercase;
            letter-spacing: 1px;
            border-bottom: 2px solid #d4af37;
            padding-bottom: 8px;
            display: inline-block;
            text-shadow: 1px 1px 2px rgba(0,0,0,0.1);
          }
          
          .course-name {
            font-family: 'Playfair Display', serif;
            font-size: 22px;
            font-weight: 600;
            color: #1e40af;
            margin: 15px 0;
            font-style: italic;
            text-shadow: 1px 1px 2px rgba(0,0,0,0.1);
          }
          
          .certificate-footer {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            margin-top: 20px;
          }
          
          .qr-section {
            text-align: center;
            flex: 0 0 150px;
          }
          
          .qr-code {
            border: 2px solid #1e40af;
            border-radius: 8px;
            padding: 8px;
            background: white;
            margin-bottom: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            width: 120px;
            height: 120px;
          }
          
          .certificate-id {
            font-size: 12px;
            color: #1e3a8a;
            font-weight: bold;
            background: #f8f9fa;
            padding: 4px 8px;
            border-radius: 4px;
            border: 1px solid #dee2e6;
          }
          
          .signature-section {
            text-align: center;
            flex: 0 0 150px;
          }
          
          .signature-line {
            width: 180px;
            height: 3px;
            background: #1e40af;
            margin: 0 auto 10px auto;
            border-radius: 2px;
          }
          
          .director-name {
            font-size: 20px;
            font-weight: bold;
            color: #1e40af;
            margin: 0 0 5px 0;
          }
          
          .director-title {
            font-size: 16px;
            color: #1e3a8a;
            margin: 0;
          }
          
          .blockchain-info {
            text-align: center;
            margin: 20px 0;
            background: rgba(30, 64, 175, 0.05);
            padding: 15px;
            border-radius: 10px;
            border: 1px solid rgba(30, 64, 175, 0.2);
            font-size: 12px;
            color: #1e3a8a;
          }
          
          .blockchain-hash {
            font-family: monospace;
            word-break: break-all;
            background: white;
            padding: 5px;
            border-radius: 3px;
            border: 1px solid #ddd;
            margin: 5px 0;
          }
          
          .verification-url {
            color: #1e40af;
            text-decoration: none;
            font-weight: bold;
          }
          
          @media print {
            .certificate {
              margin: 0;
              padding: 20px;
            }
            
            .certificate-border {
              min-height: calc(100vh - 40px);
            }
          }
        </style>
      </head>
      <body>
        <div class="certificate">
          <div class="certificate-border">
            <div class="certificate-header">
              <h1 class="institute-name">${process.env.INSTITUTE_NAME}</h1>
              <p class="institute-subtitle">${process.env.INSTITUTE_SUBTITLE}</p>
              <div class="decorative-line"></div>
            </div>

            <div class="certificate-body">
              <h2 class="certificate-title">Certificate of Completion</h2>
              
              <p class="certificate-text">This is to certify that</p>
              <div class="student-name">${certificate.studentName.toUpperCase()}</div>
              
              <p class="certificate-text">
                Son/Daughter of ${certificate.parentName}
              </p>
              
              <p class="certificate-text">
                District ${certificate.district}, State ${certificate.state}
              </p>
              
              <p class="certificate-text">has successfully completed</p>
              
              <div class="course-name">${certificate.courseName}</div>
              
              <p class="certificate-text">
                Date: ${issueDate}
              </p>
            </div>

            <div class="certificate-footer">
              <div class="qr-section">
                <img src="${qrDataUrl}" alt="QR Code" class="qr-code" width="150" height="150">
                <div class="certificate-id">ID: ${certificate.certificateId}</div>
              </div>
              
              <div class="signature-section">
                <div class="signature-line"></div>
                <p class="director-name">${process.env.DIRECTOR_NAME}</p>
                <p class="director-title">${process.env.DIRECTOR_TITLE}</p>
              </div>
            </div>
            
            <div class="blockchain-info">
              This certificate has been securely stored on the blockchain and can be verified online at:<br>
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify/${certificate.certificateId}" class="verification-url">${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify/${certificate.certificateId}</a>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  getBase64FromPath(filePath) {
    try {
      const fs = require('fs');
      const path = require('path');
      
      // Handle both absolute and relative paths
      let fullPath;
      if (filePath.startsWith('qr-codes/')) {
        // Relative path - convert to absolute
        fullPath = path.join(__dirname, '../public', filePath);
      } else {
        // Absolute path - use as is
        fullPath = filePath;
      }
      
      const imageBuffer = fs.readFileSync(fullPath);
      return imageBuffer.toString('base64');
    } catch (error) {
      console.error('❌ Failed to read QR code file:', error);
      return '';
    }
  }

  async generateVerificationInstructionsPDF() {
    let browser = null;
    
    try {
      // Check if puppeteer is available
      if (!puppeteer) {
        throw new Error('PDF generation is not available - puppeteer not installed');
      }

      browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });

      const page = await browser.newPage();
      await page.setViewport({ width: 794, height: 1123 });
      
      const htmlContent = this.generateVerificationInstructionsHTML();
      await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
      
      const fileName = 'verification_instructions.pdf';
      const filePath = path.join(this.outputDir, fileName);
      
      await page.pdf({
        path: filePath,
        format: 'A4',
        printBackground: true,
        margin: {
          top: '0.5in',
          right: '0.5in',
          bottom: '0.5in',
          left: '0.5in'
        }
      });

      console.log(`✅ Verification instructions PDF generated: ${fileName}`);
      return filePath;

    } catch (error) {
      console.error('❌ Verification instructions PDF generation failed:', error);
      throw error;
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  generateVerificationInstructionsHTML() {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Certificate Verification Instructions</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            text-align: center;
            border-bottom: 3px solid #1e40af;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .institute-name {
            color: #1e40af;
            font-size: 28px;
            font-weight: bold;
            margin: 0;
          }
          .section {
            margin: 30px 0;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 8px;
            border-left: 4px solid #1e40af;
          }
          .section h3 {
            color: #1e40af;
            margin-top: 0;
          }
          .step {
            margin: 15px 0;
            padding: 10px;
            background: white;
            border-radius: 5px;
            border: 1px solid #dee2e6;
          }
          .step-number {
            background: #1e40af;
            color: white;
            width: 25px;
            height: 25px;
            border-radius: 50%;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            margin-right: 10px;
          }
          .qr-example {
            text-align: center;
            margin: 20px 0;
            padding: 20px;
            background: white;
            border: 2px dashed #1e40af;
            border-radius: 8px;
          }
          .contact-info {
            background: #e3f2fd;
            padding: 20px;
            border-radius: 8px;
            margin-top: 30px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 class="institute-name">${process.env.INSTITUTE_NAME}</h1>
          <p>Certificate Verification Instructions</p>
        </div>
        
        <div class="section">
          <h3>🔍 How to Verify Your Certificate</h3>
          <p>Your certificate is stored on the blockchain, making it tamper-proof and easily verifiable. Follow these simple steps to verify your certificate:</p>
        </div>
        
        <div class="section">
          <h3>Method 1: Using Certificate ID</h3>
          <div class="step">
            <span class="step-number">1</span>
            Visit our verification portal: <strong>${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify</strong>
          </div>
          <div class="step">
            <span class="step-number">2</span>
            Enter your Certificate ID (e.g., DEIT2024001)
          </div>
          <div class="step">
            <span class="step-number">3</span>
            Click "Verify Certificate" to see your certificate details
          </div>
        </div>
        
        <div class="section">
          <h3>Method 2: Using QR Code</h3>
          <div class="step">
            <span class="step-number">1</span>
            Scan the QR code on your certificate with any QR code scanner
          </div>
          <div class="step">
            <span class="step-number">2</span>
            The QR code contains all your certificate information
          </div>
          <div class="step">
            <span class="step-number">3</span>
            Follow the verification link provided in the QR code data
          </div>
          
          <div class="qr-example">
            <p><strong>QR Code Example:</strong></p>
            <p>📱 Scan this code with your phone's camera or any QR scanner app</p>
          </div>
        </div>
        
        <div class="section">
          <h3>Method 3: Using Blockchain Hash</h3>
          <div class="step">
            <span class="step-number">1</span>
            Copy the transaction hash from your certificate
          </div>
          <div class="step">
            <span class="step-number">2</span>
            Paste it into the blockchain hash verification field
          </div>
          <div class="step">
            <span class="step-number">3</span>
            Click "Verify Transaction" to confirm authenticity
          </div>
        </div>
        
        <div class="section">
          <h3>✅ What You'll See When Verified</h3>
          <ul>
            <li>Your full name and course details</li>
            <li>Issue date and certificate ID</li>
            <li>Blockchain transaction information</li>
            <li>Verification timestamp</li>
            <li>Institute authenticity confirmation</li>
          </ul>
        </div>
        
        <div class="section">
          <h3>🔒 Security Features</h3>
          <ul>
            <li><strong>Blockchain Storage:</strong> Your certificate is permanently stored on the blockchain</li>
            <li><strong>Tamper-Proof:</strong> Any modification would be immediately detectable</li>
            <li><strong>Unique Hash:</strong> Each certificate has a unique cryptographic hash</li>
            <li><strong>QR Code:</strong> Quick verification with embedded certificate data</li>
          </ul>
        </div>
        
        <div class="contact-info">
          <h3>📞 Need Help?</h3>
          <p>If you have any questions or need assistance with certificate verification, please contact us:</p>
          <ul>
            <li><strong>Email:</strong> certificates@digitalexcellence.edu</li>
            <li><strong>Phone:</strong> +1 (555) 123-4567</li>
            <li><strong>Website:</strong> ${process.env.FRONTEND_URL || 'http://localhost:3000'}</li>
          </ul>
        </div>
        
        <div style="text-align: center; margin-top: 40px; color: #666; font-size: 14px;">
          <p>© ${new Date().getFullYear()} ${process.env.INSTITUTE_NAME}. All rights reserved.</p>
        </div>
      </body>
      </html>
    `;
  }

  async cleanupOldFiles(daysOld = 30) {
    try {
      const files = await fs.readdir(this.outputDir);
      const qrFiles = await fs.readdir(this.qrOutputDir);
      
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);
      
      let deletedCount = 0;
      
      for (const file of files) {
        const filePath = path.join(this.outputDir, file);
        const stats = await fs.stat(filePath);
        
        if (stats.mtime < cutoffDate) {
          await fs.unlink(filePath);
          deletedCount++;
        }
      }
      
      for (const file of qrFiles) {
        const filePath = path.join(this.qrOutputDir, file);
        const stats = await fs.stat(filePath);
        
        if (stats.mtime < cutoffDate) {
          await fs.unlink(filePath);
          deletedCount++;
        }
      }
      
      console.log(`✅ Cleaned up ${deletedCount} old files`);
      
    } catch (error) {
      console.error('❌ File cleanup failed:', error);
    }
  }

  async closeBrowser() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      console.log('✅ Browser closed');
    }
  }
}

module.exports = new PDFService();
