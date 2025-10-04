@echo off
echo 🔍 Checking Deployment Status...
echo.

echo 🌐 Frontend (Vercel):
echo https://blockchain-certificate-system.vercel.app
echo.

echo 🖥️ Backend (Render):
echo https://blockchain-certificate-backend.onrender.com
echo.

echo 📊 Testing connections...
node monitor-deployment.js

echo.
echo 💡 If backend shows errors, wait 2-3 minutes and run again
echo 📖 For troubleshooting, see: render-debug.md
echo.
pause
