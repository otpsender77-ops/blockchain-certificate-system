@echo off
echo 🚀 QUICK DEPLOYMENT GUIDE
echo ========================
echo.
echo Your code is ready and pushed to GitHub!
echo Repository: https://github.com/otpsender77-ops/blockchain-certificate-system.git
echo.
echo 📋 NEXT STEPS:
echo.
echo 1. 🌐 DEPLOY FRONTEND TO VERCEL:
echo    - Go to: https://vercel.com/dashboard
echo    - Click "New Project"
echo    - Import: otpsender77-ops/blockchain-certificate-system
echo    - Framework: Other
echo    - Build Command: npm run vercel-build
echo    - Output Directory: public
echo    - Add Environment Variable: NODE_ENV=production
echo    - Click "Deploy"
echo.
echo 2. 🔧 DEPLOY BACKEND TO RENDER:
echo    - Go to: https://dashboard.render.com
echo    - Click "New +" → "Web Service"
echo    - Connect: otpsender77-ops/blockchain-certificate-system
echo    - Name: blockchain-certificate-backend
echo    - Environment: Node
echo    - Build Command: npm install
echo    - Start Command: npm start
echo    - Add ALL environment variables from render.yaml
echo    - Click "Create Web Service"
echo.
echo 3. 🔗 CONNECT FRONTEND TO BACKEND:
echo    - Get your Render backend URL
echo    - Update public/app.js with the backend URL
echo    - Commit and push changes
echo    - Vercel will auto-redeploy
echo.
echo 📖 For detailed steps, see: DEPLOYMENT_STEPS.md
echo.
echo ✅ You're ready to deploy! Follow the steps above.
echo.
pause
