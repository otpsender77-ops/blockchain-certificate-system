@echo off
echo 🚀 QUICK DEPLOYMENT TO RAILWAY (Faster than Render!)
echo ===================================================
echo.
echo Your frontend is already working on Vercel!
echo Now let's get the backend deployed quickly on Railway.
echo.
echo 📋 STEPS:
echo.
echo 1. 🌐 Go to Railway: https://railway.app
echo 2. 🔑 Sign up with GitHub
echo 3. ➕ Click "New Project"
echo 4. 📁 Select "Deploy from GitHub repo"
echo 5. 🎯 Choose: otpsender77-ops/blockchain-certificate-system
echo 6. ⚙️ Railway will auto-detect Node.js
echo 7. 🔧 Add environment variables (see below)
echo 8. 🚀 Deploy (takes 2-3 minutes!)
echo.
echo 🔧 ENVIRONMENT VARIABLES TO ADD:
echo ================================
echo NODE_ENV=production
echo PORT=10000
echo MONGODB_URI=mongodb+srv://blockchain-admin:k4J3OB0E8O4pdDVH@blockchain-certificates.vz6h2fr.mongodb.net/?retryWrites=true&w=majority&appName=blockchain-certificates
echo BLOCKCHAIN_NETWORK=holesky
echo BLOCKCHAIN_RPC_URL=https://rpc.ankr.com/eth_holesky
echo BLOCKCHAIN_NETWORK_ID=17000
echo BLOCKCHAIN_CHAIN_ID=0x4268
echo CONTRACT_ADDRESS=0x2dcd685bA9fd46B85849Fac86b908491BC9e0783
echo GAS_LIMIT=3000000
echo GAS_PRICE=20000000000
echo PRIVATE_KEY=8e4d8d9b1437534cd90f705f8e6f253d40a3df3f30f3489aa5ec761da10e23bd
echo EMAIL_HOST=smtp-relay.brevo.com
echo EMAIL_PORT=587
echo EMAIL_SECURE=false
echo EMAIL_USER=9715b5001@smtp-brevo.com
echo EMAIL_PASS=bQ7JmB4xE2kUTFqV
echo SMTP_FROM=Digital Excellence Institute ^<otpsender77@gmail.com^>
echo JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
echo USE_BLOCKCHAIN_FALLBACK=false
echo PINATA_API_KEY=4d4c23ad6fc7594b49da
echo PINATA_SECRET_KEY=ae6734648d4343fd699db2f3941c45e3e285f0a8c108013d9b8f83b9f54323f4
echo INSTITUTE_NAME=Digital Excellence Institute of Technology
echo INSTITUTE_SUBTITLE=Advancing Digital Skills ^& Innovation
echo DIRECTOR_NAME=Dr. Rajesh Kumar
echo DIRECTOR_TITLE=Director ^& CEO
echo.
echo 🎯 After Railway deployment:
echo 1. Get your Railway URL (e.g., https://your-app.railway.app)
echo 2. Update public/app.js with the Railway URL
echo 3. Commit and push changes
echo 4. Vercel will auto-redeploy
echo.
echo ✅ This should take only 2-3 minutes instead of 40+!
echo.
pause
