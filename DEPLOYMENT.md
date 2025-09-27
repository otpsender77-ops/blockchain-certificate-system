# 🚀 Deployment Guide

## GitHub & Vercel Deployment

This guide will help you deploy your Blockchain Certificate System to GitHub and Vercel.

## 📋 Prerequisites

1. **GitHub Account** - [Sign up here](https://github.com)
2. **Vercel Account** - [Sign up here](https://vercel.com)
3. **MongoDB Atlas** - [Sign up here](https://www.mongodb.com/atlas) (for production database)
4. **Brevo Account** - [Sign up here](https://www.brevo.com) (for email service)

## 🔧 Step 1: Prepare Your Project

### 1.1 Initialize Git Repository
```bash
git init
git add .
git commit -m "Initial commit: Blockchain Certificate System"
```

### 1.2 Create GitHub Repository
1. Go to [GitHub](https://github.com) and create a new repository
2. Name it: `blockchain-certificate-system`
3. Make it **Public** (required for free Vercel deployment)
4. Don't initialize with README (we already have files)

### 1.3 Push to GitHub
```bash
git remote add origin https://github.com/YOUR_USERNAME/blockchain-certificate-system.git
git branch -M main
git push -u origin main
```

## 🌐 Step 2: Deploy to Vercel

### 2.1 Connect to Vercel
1. Go to [Vercel](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository
4. Vercel will auto-detect it's a Node.js project

### 2.2 Configure Environment Variables
In Vercel dashboard, go to **Settings > Environment Variables** and add:

#### Database Configuration
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/bcs?retryWrites=true&w=majority
```

#### Email Configuration (Brevo)
```
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USER=your-brevo-email@example.com
SMTP_PASS=your-brevo-smtp-key
SMTP_FROM=your-brevo-email@example.com
EMAIL_FROM=your-brevo-email@example.com
```

#### Institute Information
```
INSTITUTE_NAME=Your Institute Name
INSTITUTE_ADDRESS=Your Institute Address
INSTITUTE_LOGO_URL=https://your-domain.com/logo.png
```

#### Frontend URL
```
FRONTEND_URL=https://your-app.vercel.app
```

#### Blockchain Configuration (Holesky Testnet)
```
BLOCKCHAIN_NETWORK=holesky
BLOCKCHAIN_RPC_URL=https://rpc.ankr.com/eth_holesky
BLOCKCHAIN_NETWORK_ID=17000
BLOCKCHAIN_CHAIN_ID=0x4268
CONTRACT_ADDRESS=0xFcbc69C6F4DbEE5EA92573C309c2B3D2Ff4a427e
PRIVATE_KEY=your-private-key-here
```

#### Security
```
JWT_SECRET=your-super-secret-jwt-key-here
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-secure-admin-password
```

#### Performance
```
USE_BLOCKCHAIN_FALLBACK=false
NODE_ENV=production
```

### 2.3 Deploy
1. Click "Deploy" in Vercel
2. Wait for deployment to complete
3. Your app will be available at: `https://your-app.vercel.app`

## 🗄️ Step 3: Setup Production Database

### 3.1 MongoDB Atlas Setup
1. Create a new cluster in MongoDB Atlas
2. Create a database user
3. Whitelist Vercel's IP addresses (or use 0.0.0.0/0 for all)
4. Get your connection string
5. Add it to Vercel environment variables

### 3.2 Database Connection String Format
```
mongodb+srv://username:password@cluster.mongodb.net/bcs?retryWrites=true&w=majority
```

## 📧 Step 4: Setup Email Service

### 4.1 Brevo SMTP Setup
1. Create a Brevo account
2. Go to SMTP & API settings
3. Generate an SMTP key
4. Add credentials to Vercel environment variables

## 🔗 Step 5: Blockchain Configuration

### 5.1 Holesky Testnet Setup
1. Get test ETH from [Holesky Faucet](https://faucet.holesky.ethpandaops.io/)
2. Deploy your smart contract to Holesky
3. Update contract address in environment variables

### 5.2 Smart Contract Deployment
```bash
# Deploy to Holesky testnet
truffle migrate --network holesky
```

## 🔒 Step 6: Security Configuration

### 6.1 Environment Variables Security
- Never commit `.env` files to Git
- Use strong, unique passwords
- Rotate JWT secrets regularly
- Use environment-specific configurations

### 6.2 CORS Configuration
The app is configured to work with Vercel domains automatically.

## 🚀 Step 7: Post-Deployment

### 7.1 Test Your Deployment
1. Visit your Vercel URL
2. Test certificate generation
3. Test email sending
4. Test blockchain verification
5. Test MetaMask integration

### 7.2 Monitor Performance
- Check Vercel analytics
- Monitor MongoDB Atlas metrics
- Check email delivery rates
- Monitor blockchain transaction success

## 🔧 Troubleshooting

### Common Issues

#### 1. Build Failures
- Check Node.js version compatibility
- Verify all dependencies are in package.json
- Check for missing environment variables

#### 2. Database Connection Issues
- Verify MongoDB Atlas connection string
- Check IP whitelist settings
- Ensure database user has proper permissions

#### 3. Email Sending Issues
- Verify Brevo SMTP credentials
- Check email quotas and limits
- Test with different email providers

#### 4. Blockchain Issues
- Verify Holesky testnet connection
- Check contract address and ABI
- Ensure sufficient test ETH balance

## 📊 Monitoring & Maintenance

### Regular Tasks
1. **Monitor Vercel usage** - Check function execution limits
2. **Database maintenance** - Monitor MongoDB Atlas usage
3. **Email monitoring** - Check Brevo delivery rates
4. **Blockchain monitoring** - Monitor transaction success rates
5. **Security updates** - Keep dependencies updated

### Performance Optimization
1. **Enable caching** - Use Vercel's edge caching
2. **Optimize images** - Compress and optimize assets
3. **Database indexing** - Add indexes for better performance
4. **CDN usage** - Leverage Vercel's global CDN

## 🆘 Support

If you encounter issues:
1. Check Vercel deployment logs
2. Review MongoDB Atlas logs
3. Check Brevo email logs
4. Verify blockchain transaction status
5. Contact support for your respective services

## 🎉 Success!

Once deployed, your Blockchain Certificate System will be:
- ✅ Globally accessible via Vercel
- ✅ Scalable and reliable
- ✅ Secure with proper environment variables
- ✅ Integrated with production services
- ✅ Ready for real-world usage

**Your app URL:** `https://your-app.vercel.app`
