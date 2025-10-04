@echo off
echo 🔄 Backend URL Update Script
echo ============================
echo.
echo This script will help you update the backend URL in your frontend.
echo.
set /p NEW_URL="Enter your new backend URL (e.g., https://your-app.railway.app): "
echo.
echo Updating public/app.js...
echo.

powershell -Command "(Get-Content 'public/app.js') -replace 'this\.apiBaseUrl = process\.env\.NODE_ENV === ''production''\s*\? ''https://blockchain-certificate-backend\.onrender\.com/api''\s*: window\.location\.origin \+ ''/api'';', 'this.apiBaseUrl = ''%NEW_URL%/api'';' | Set-Content 'public/app.js'"

echo ✅ Backend URL updated to: %NEW_URL%/api
echo.
echo Now commit and push the changes:
echo git add .
echo git commit -m "Update backend URL to %NEW_URL%"
echo git push
echo.
echo Vercel will automatically redeploy with the new backend URL!
echo.
pause
