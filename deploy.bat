@echo off
echo 🚀 Starting deployment process...

REM Check if git is initialized
if not exist ".git" (
    echo ❌ Git not initialized. Please run 'git init' first.
    pause
    exit /b 1
)

REM Check if there are uncommitted changes
git status --porcelain > temp_status.txt
if not %errorlevel%==0 (
    echo ❌ Git status check failed
    del temp_status.txt
    pause
    exit /b 1
)

for /f %%i in (temp_status.txt) do (
    echo ⚠️  You have uncommitted changes. Please commit them first.
    echo Run: git add . ^&^& git commit -m "Prepare for deployment"
    del temp_status.txt
    pause
    exit /b 1
)
del temp_status.txt

echo ✅ Git status clean

REM Create .gitignore if it doesn't exist
if not exist ".gitignore" (
    echo 📝 Creating .gitignore...
    (
        echo node_modules/
        echo .env
        echo .env.local
        echo .env.production
        echo temp/
        echo *.log
        echo .DS_Store
        echo Thumbs.db
    ) > .gitignore
)

echo 📦 Preparing for deployment...

REM Check if all required files exist
if not exist "package.json" (
    echo ❌ Required file missing: package.json
    pause
    exit /b 1
)
if not exist "server.production.js" (
    echo ❌ Required file missing: server.production.js
    pause
    exit /b 1
)
if not exist "vercel.json" (
    echo ❌ Required file missing: vercel.json
    pause
    exit /b 1
)
if not exist "render.yaml" (
    echo ❌ Required file missing: render.yaml
    pause
    exit /b 1
)

echo ✅ All required files present

echo.
echo 🎯 Next steps:
echo 1. Push to GitHub: git push origin main
echo 2. Deploy frontend to Vercel:
echo    - Go to https://vercel.com/dashboard
echo    - Import your repository
echo    - Configure as static site with public/ as root
echo 3. Deploy backend to Render:
echo    - Go to https://dashboard.render.com
echo    - Create new Web Service
echo    - Connect your repository
echo    - Use render.yaml configuration
echo.
echo 📖 See DEPLOYMENT.md for detailed instructions
echo.
echo ✅ Deployment preparation complete!
pause
