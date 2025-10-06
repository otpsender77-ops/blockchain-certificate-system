# 🚀 Vercel Deployment Guide

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **MongoDB Atlas**: Database setup
3. **Environment Variables**: All required keys

## Deployment Steps

### 1. Environment Variables Setup

Add these environment variables in your Vercel dashboard:

```bash
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority&appName=appname
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=24h
EMAIL_SERVICE=brevo
EMAIL_USER=your-email@example.com
EMAIL_PASS=your-brevo-api-key
EMAIL_FROM=your-email@example.com
PINATA_API_KEY=your-pinata-api-key
PINATA_SECRET_KEY=your-pinata-secret-key
PRIVATE_KEY=your-private-key-here
RPC_URL=https://holesky.infura.io/v3/your-project-id
CONTRACT_ADDRESS=your-contract-address
NODE_ENV=production
PORT=3000
```

### 2. Deploy via Vercel CLI

```bash
# Login to Vercel
vercel login

# Deploy the project
vercel

# For production deployment
vercel --prod
```

### 3. Deploy via Vercel Dashboard

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your Git repository
4. Configure environment variables
5. Deploy

## Project Structure for Vercel

```
block-certi/
├── api/                    # Vercel API routes
│   ├── index.js           # Main API handler
│   ├── auth.js            # Authentication routes
│   ├── certificates.js    # Certificate routes
│   ├── verification.js    # Verification routes
│   └── email.js           # Email routes
├── public/                # Static files
│   ├── index.html
│   ├── app.js
│   ├── style.css
│   └── qrcode.min.js
├── routes/                # Original route files
├── models/                # Database models
├── services/              # Business logic
├── vercel.json           # Vercel configuration
├── package.json          # Dependencies
└── .vercelignore         # Ignore file
```

## Important Notes

### ⚠️ Limitations

1. **File Uploads**: Vercel has a 4.5MB limit for serverless functions
2. **Execution Time**: 10 seconds for Hobby plan, 60 seconds for Pro
3. **Memory**: 1024MB limit
4. **Cold Starts**: First request may be slower

### 🔧 Optimizations

1. **Static Assets**: All frontend files are served as static
2. **API Routes**: Backend logic runs as serverless functions
3. **Database**: MongoDB Atlas for data persistence
4. **File Storage**: IPFS for certificate storage

### 🚨 Required Services

1. **MongoDB Atlas**: Database
2. **Pinata**: IPFS storage
3. **Brevo**: Email service
4. **Infura/Alchemy**: Blockchain RPC
5. **Holesky Testnet**: For testing

## Testing Deployment

After deployment, test these endpoints:

- `https://your-app.vercel.app/` - Main application
- `https://your-app.vercel.app/api/health` - Health check
- `https://your-app.vercel.app/api/auth/login` - Login endpoint

## Troubleshooting

### Common Issues

1. **Environment Variables**: Make sure all are set in Vercel dashboard
2. **Build Errors**: Check Vercel build logs
3. **Function Timeouts**: Optimize database queries
4. **CORS Issues**: Check CORS configuration

### Debug Commands

```bash
# Check deployment status
vercel ls

# View deployment logs
vercel logs [deployment-url]

# Check function logs
vercel logs [function-name]
```

## Production Checklist

- [ ] Environment variables configured
- [ ] MongoDB Atlas connected
- [ ] IPFS service working
- [ ] Email service configured
- [ ] Blockchain connection tested
- [ ] SSL certificate active
- [ ] Domain configured (optional)
- [ ] Performance monitoring setup

## Support

For issues with deployment:
1. Check Vercel build logs
2. Verify environment variables
3. Test API endpoints individually
4. Check service connections
