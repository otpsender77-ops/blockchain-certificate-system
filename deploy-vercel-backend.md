# 🚀 Deploy Backend to Vercel (FREE!)

## **Steps to Deploy Backend to Vercel:**

### **1. Create New Vercel Project for Backend**
1. Go to: https://vercel.com/dashboard
2. Click **"New Project"**
3. Import your GitHub repository: `otpsender77-ops/blockchain-certificate-system`
4. **Important**: This will be a separate project from your frontend

### **2. Configure the Backend Project**
1. **Project Name**: `blockchain-certificate-backend`
2. **Framework Preset**: Select **"Other"** or **"Node.js"**
3. **Root Directory**: Leave as `/` (root)
4. **Build Command**: Leave empty (Vercel will auto-detect)
5. **Output Directory**: Leave empty

### **3. Add Environment Variables**
In the Vercel dashboard, go to **Settings** → **Environment Variables** and add:

```
NODE_ENV=production
MONGODB_URI=mongodb+srv://blockchain-admin:k4J3OB0E8O4pdDVH@blockchain-certificates.vz6h2fr.mongodb.net/?retryWrites=true&w=majority&appName=blockchain-certificates
BLOCKCHAIN_NETWORK=holesky
BLOCKCHAIN_RPC_URL=https://rpc.ankr.com/eth_holesky
BLOCKCHAIN_NETWORK_ID=17000
BLOCKCHAIN_CHAIN_ID=0x4268
CONTRACT_ADDRESS=0x2dcd685bA9fd46B85849Fac86b908491BC9e0783
GAS_LIMIT=3000000
GAS_PRICE=20000000000
PRIVATE_KEY=8e4d8d9b1437534cd90f705f8e6f253d40a3df3f30f3489aa5ec761da10e23bd
EMAIL_HOST=smtp-relay.brevo.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=9715b5001@smtp-brevo.com
EMAIL_PASS=bQ7JmB4xE2kUTFqV
SMTP_FROM=Digital Excellence Institute <otpsender77@gmail.com>
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
USE_BLOCKCHAIN_FALLBACK=false
PINATA_API_KEY=4d4c23ad6fc7594b49da
PINATA_SECRET_KEY=ae6734648d4343fd699db2f3941c45e3e285f0a8c108013d9b8f83b9f54323f4
INSTITUTE_NAME=Digital Excellence Institute of Technology
INSTITUTE_SUBTITLE=Advancing Digital Skills & Innovation
DIRECTOR_NAME=Dr. Rajesh Kumar
DIRECTOR_TITLE=Director & CEO
```

### **4. Deploy**
1. Click **"Deploy"**
2. Wait 2-3 minutes for deployment
3. Get your backend URL (e.g., `https://blockchain-certificate-backend.vercel.app`)

### **5. Update Frontend to Use New Backend**
1. Get your new backend URL from Vercel
2. Run: `.\update-backend-url.bat`
3. Enter your Vercel backend URL
4. Commit and push changes

## **🎯 Benefits of Vercel Backend:**
- ✅ **FREE** (no cost)
- ✅ **Fast** deployment (2-3 minutes)
- ✅ **Reliable** (same platform as frontend)
- ✅ **Easy** to manage
- ✅ **Auto-deploy** on git push

## **📊 After Deployment:**
- **Frontend**: https://blockchain-certificate-system.vercel.app
- **Backend**: https://your-backend-name.vercel.app
- **Both on Vercel**: Easy to manage!

## **🔄 Quick Update Script:**
After getting your backend URL, run:
```bash
.\update-backend-url.bat
```

**This is the fastest and most reliable way to get your backend deployed!** 🚀
