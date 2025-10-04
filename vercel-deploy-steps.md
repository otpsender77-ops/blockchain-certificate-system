# 🚀 Deploy Backend to Vercel - Step by Step

## **Step 1: Go to Vercel Dashboard**
1. Open your browser
2. Go to: https://vercel.com/dashboard
3. Sign in with your GitHub account

## **Step 2: Create New Project**
1. Click **"New Project"** button
2. You'll see your GitHub repositories
3. Find and select: `otpsender77-ops/blockchain-certificate-system`
4. Click **"Import"**

## **Step 3: Configure Project Settings**
1. **Project Name**: `blockchain-certificate-backend`
2. **Framework Preset**: Select **"Other"** or **"Node.js"**
3. **Root Directory**: Leave as `/` (root)
4. **Build Command**: Leave empty
5. **Output Directory**: Leave empty

## **Step 4: Add Environment Variables**
Click **"Environment Variables"** and add these one by one:

```
NODE_ENV = production
MONGODB_URI = mongodb+srv://blockchain-admin:k4J3OB0E8O4pdDVH@blockchain-certificates.vz6h2fr.mongodb.net/?retryWrites=true&w=majority&appName=blockchain-certificates
BLOCKCHAIN_NETWORK = holesky
BLOCKCHAIN_RPC_URL = https://rpc.ankr.com/eth_holesky
BLOCKCHAIN_NETWORK_ID = 17000
BLOCKCHAIN_CHAIN_ID = 0x4268
CONTRACT_ADDRESS = 0x2dcd685bA9fd46B85849Fac86b908491BC9e0783
GAS_LIMIT = 3000000
GAS_PRICE = 20000000000
PRIVATE_KEY = 8e4d8d9b1437534cd90f705f8e6f253d40a3df3f30f3489aa5ec761da10e23bd
EMAIL_HOST = smtp-relay.brevo.com
EMAIL_PORT = 587
EMAIL_SECURE = false
EMAIL_USER = 9715b5001@smtp-brevo.com
EMAIL_PASS = bQ7JmB4xE2kUTFqV
SMTP_FROM = Digital Excellence Institute <otpsender77@gmail.com>
JWT_SECRET = your-super-secret-jwt-key-change-this-in-production
USE_BLOCKCHAIN_FALLBACK = false
PINATA_API_KEY = 4d4c23ad6fc7594b49da
PINATA_SECRET_KEY = ae6734648d4343fd699db2f3941c45e3e285f0a8c108013d9b8f83b9f54323f4
INSTITUTE_NAME = Digital Excellence Institute of Technology
INSTITUTE_SUBTITLE = Advancing Digital Skills & Innovation
DIRECTOR_NAME = Dr. Rajesh Kumar
DIRECTOR_TITLE = Director & CEO
```

## **Step 5: Deploy**
1. Click **"Deploy"** button
2. Wait 2-3 minutes for deployment
3. You'll get a URL like: `https://blockchain-certificate-backend.vercel.app`

## **Step 6: Test Your Backend**
1. Visit: `https://your-backend-url.vercel.app/api/health`
2. You should see: `{"status":"OK","timestamp":"...","environment":"production"}`

## **Step 7: Update Frontend (if needed)**
If your backend URL is different from `blockchain-certificate-backend.vercel.app`, run:
```bash
.\update-backend-url.bat
```

## **🎯 What to Expect:**
- ✅ Deployment takes 2-3 minutes
- ✅ You'll get a live backend URL
- ✅ All your API endpoints will work
- ✅ Frontend will connect automatically

## **❓ Need Help?**
If you encounter any errors during deployment, let me know and I'll help you fix them!

**Ready to start? Go to: https://vercel.com/dashboard**
