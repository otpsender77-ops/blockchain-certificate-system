@echo off
echo 🚀 VERCEL BACKEND DEPLOYMENT GUIDE
echo ===================================
echo.
echo ✅ Your frontend is already working on Vercel!
echo Now let's deploy the backend to Vercel too (FREE!)
echo.
echo 📋 STEPS TO DEPLOY BACKEND:
echo.
echo 1. 🌐 Go to Vercel Dashboard:
echo    https://vercel.com/dashboard
echo.
echo 2. ➕ Click "New Project"
echo.
echo 3. 📁 Import GitHub Repository:
echo    otpsender77-ops/blockchain-certificate-system
echo.
echo 4. ⚙️ Configure Project:
echo    - Project Name: blockchain-certificate-backend
echo    - Framework: Other/Node.js
echo    - Root Directory: / (root)
echo    - Build Command: (leave empty)
echo    - Output Directory: (leave empty)
echo.
echo 5. 🔧 Add Environment Variables:
echo    (Copy from the list below)
echo.
echo 6. 🚀 Click "Deploy"
echo.
echo 7. ⏱️ Wait 2-3 minutes for deployment
echo.
echo 8. 📋 Copy your backend URL (e.g., https://blockchain-certificate-backend.vercel.app)
echo.
echo 9. 🔄 Update frontend with new backend URL:
echo    Run: .\update-backend-url.bat
echo.
echo 🔧 ENVIRONMENT VARIABLES TO ADD:
echo ================================
echo NODE_ENV=production
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
echo 🎯 BENEFITS:
echo - ✅ FREE (no cost)
echo - ✅ Fast deployment (2-3 minutes)
echo - ✅ Reliable (same platform as frontend)
echo - ✅ Easy to manage
echo - ✅ Auto-deploy on git push
echo.
echo 📊 AFTER DEPLOYMENT:
echo Frontend: https://blockchain-certificate-system.vercel.app
echo Backend: https://your-backend-name.vercel.app
echo.
echo 🚀 Ready to deploy? Go to: https://vercel.com/dashboard
echo.
pause
