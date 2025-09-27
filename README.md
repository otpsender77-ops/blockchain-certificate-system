# Blockchain Certificate System

A comprehensive blockchain-based certificate management system with Holesky testnet integration, MongoDB database, and Brevo email service.

## Features

- **Blockchain Integration**: Real blockchain transactions using Holesky testnet
- **Certificate Generation**: Create professional certificates with QR codes
- **PDF Generation**: High-quality A4 PDF certificates with embedded QR codes
- **Email Service**: Automated email delivery via Brevo SMTP
- **MongoDB Database**: Persistent storage for certificates and user data
- **Verification System**: Multiple verification methods (ID, Hash, QR Code)
- **Admin Dashboard**: Complete management interface
- **Export Functionality**: CSV export of certificate data

## Prerequisites

Before running the application, ensure you have the following installed:

1. **Node.js** (v16 or higher)
2. **MongoDB** (running on localhost:27017)
3. **Ganache CLI** (for blockchain functionality)

## Installation

1. **Clone or download the project files**

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start Ganache CLI:**
   ```bash
   ganache-cli --mnemonic "margin upper arrow nuclear cradle engage monster design autumn clap egg warrior" --host 127.0.0.1 --port 8545 --networkId 1337 --accounts 10 --defaultBalanceEther 100
   ```

4. **Start MongoDB:**
   - Make sure MongoDB is running on `mongodb://localhost:27017`
   - The database `bcs` will be created automatically

5. **Configure environment variables:**
   - Copy `config.env` and update the values if needed
   - The default configuration should work for local development

## Configuration

### Environment Variables (config.env)

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/bcs

# Blockchain Configuration (Ganache)
GANACHE_HOST=127.0.0.1
GANACHE_PORT=8545
GANACHE_NETWORK_ID=1337
GANACHE_MNEMONIC=margin upper arrow nuclear cradle engage monster design autumn clap egg warrior

# Email Configuration (Brevo)
EMAIL_HOST=smtp-relay.brevo.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=9715b5001@smtp-brevo.com
EMAIL_PASS=bQ7JmB4xE2kUTFqV
SMTP_FROM=Digital Excellence Institute <otpsender77@gmail.com>

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Certificate Configuration
INSTITUTE_NAME=Digital Excellence Institute of Technology
INSTITUTE_SUBTITLE=Advancing Digital Skills & Innovation
DIRECTOR_NAME=Dr. Rajesh Kumar
DIRECTOR_TITLE=Director & CEO
```

## Running the Application

1. **Start the server:**
   ```bash
   npm start
   ```
   
   Or for development with auto-restart:
   ```bash
   npm run dev
   ```

2. **Access the application:**
   - Open your browser and go to `http://localhost:3000`
   - Default admin credentials: `admin` / `admin123`

## Usage

### Admin Login
- Username: `admin`
- Password: `admin123`

### Certificate Generation
1. Login to the admin panel
2. Navigate to "Generate Certificate"
3. Fill in the student details
4. Click "Generate Certificate"
5. The system will:
   - Create a blockchain transaction
   - Generate a PDF certificate
   - Create a QR code
   - Send an email to the student

### Certificate Verification
1. Go to the "Verify Certificate" section
2. Use any of the three verification methods:
   - **Certificate ID**: Enter the certificate ID (e.g., DEIT2024001)
   - **Blockchain Hash**: Enter the transaction hash
   - **QR Code**: Scan or paste QR code data

### Certificate Management
1. Navigate to "Manage Certificates"
2. View all generated certificates
3. Search and filter certificates
4. Download PDFs or resend emails
5. Export data to CSV

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user info
- `POST /api/auth/logout` - Logout

### Certificates
- `GET /api/certificates` - Get all certificates (with pagination)
- `POST /api/certificates` - Generate new certificate
- `GET /api/certificates/:id` - Get certificate by ID
- `POST /api/certificates/:id/resend-email` - Resend email
- `GET /api/certificates/export/csv` - Export certificates to CSV
- `GET /api/certificates/:id/download/pdf` - Download certificate PDF

### Verification
- `POST /api/verification/certificate-id` - Verify by certificate ID
- `POST /api/verification/blockchain-hash` - Verify by blockchain hash
- `POST /api/verification/qr-code` - Verify by QR code
- `GET /api/verification/stats` - Get verification statistics

## File Structure

```
blockchain-certificate-system/
├── server.js                 # Main server file
├── package.json              # Dependencies and scripts
├── config.env               # Environment configuration
├── models/                  # MongoDB models
│   ├── Certificate.js       # Certificate schema
│   ├── User.js             # User schema
│   └── EmailLog.js         # Email log schema
├── routes/                  # API routes
│   ├── auth.js             # Authentication routes
│   ├── certificates.js     # Certificate routes
│   └── verification.js     # Verification routes
├── services/               # Business logic services
│   ├── blockchainService.js # Blockchain integration
│   ├── emailService.js     # Email service
│   └── pdfService.js       # PDF generation
├── public/                 # Static files
│   ├── index.html          # Frontend application
│   ├── app.js             # Frontend JavaScript
│   ├── style.css          # Frontend styles
│   ├── certificates/      # Generated PDFs
│   ├── qr-codes/         # Generated QR codes
│   └── uploads/          # File uploads
└── README.md              # This file
```

## Blockchain Integration

The system integrates with Ganache for real blockchain transactions:

- **Smart Contract**: Automatically deployed on startup
- **Transaction Recording**: Each certificate creates a blockchain transaction
- **Hash Generation**: Unique cryptographic hashes for each certificate
- **Verification**: Blockchain-based certificate verification

## Email Service

Uses Brevo (formerly Sendinblue) for email delivery:

- **Professional Templates**: HTML email templates
- **Attachments**: PDF certificates and QR codes
- **Delivery Tracking**: Email status logging
- **Retry Mechanism**: Failed email retry system

## PDF Generation

High-quality certificate PDFs with:

- **Professional Design**: Elegant certificate layout
- **QR Code Integration**: Embedded verification QR codes
- **A4 Format**: Print-ready certificates
- **Blockchain Information**: Transaction details included

## Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt password encryption
- **Rate Limiting**: API rate limiting protection
- **Input Validation**: Comprehensive input validation
- **CORS Protection**: Cross-origin request security

## Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Ensure MongoDB is running on localhost:27017
   - Check if the `bcs` database is accessible

2. **Ganache Connection Error**
   - Verify Ganache CLI is running on port 8545
   - Check the mnemonic phrase matches the configuration

3. **Email Sending Issues**
   - Verify Brevo SMTP credentials
   - Check email configuration in config.env

4. **PDF Generation Errors**
   - Ensure Puppeteer dependencies are installed
   - Check file system permissions for public directories

### Logs

Check the console output for detailed error messages and system status.

## Development

### Adding New Features

1. **Database Models**: Add new schemas in `models/`
2. **API Routes**: Create new routes in `routes/`
3. **Services**: Add business logic in `services/`
4. **Frontend**: Update `public/app.js` for new functionality

### Testing

- Use the verification portal to test certificate verification
- Check email delivery in the admin panel
- Verify blockchain transactions in Ganache

## Production Deployment

For production deployment:

1. **Environment Variables**: Update all production values
2. **Database**: Use a production MongoDB instance
3. **Blockchain**: Connect to a production blockchain network
4. **Email**: Configure production email service
5. **Security**: Update JWT secrets and enable HTTPS
6. **Monitoring**: Add logging and monitoring services

## Support

For issues or questions:

1. Check the console logs for error messages
2. Verify all services (MongoDB, Ganache) are running
3. Ensure all environment variables are correctly set
4. Check network connectivity for external services

## License

This project is licensed under the MIT License.
