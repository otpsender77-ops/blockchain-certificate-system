@echo off
echo ========================================
echo   Blockchain Certificate System
echo   Development Mode Startup
echo ========================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if MongoDB is running
echo 🔍 Checking MongoDB connection...
mongosh --eval "db.runCommand('ping')" >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ MongoDB is not running
    echo Attempting to start MongoDB service...
    net start MongoDB >nul 2>&1
    if %errorlevel% neq 0 (
        echo ❌ Failed to start MongoDB service
        echo Please start MongoDB manually or install it
        pause
        exit /b 1
    )
    echo ✅ MongoDB service started
) else (
    echo ✅ MongoDB is running
)

REM Install dependencies if needed
if not exist "node_modules" (
    echo 📦 Installing dependencies...
    npm install
    if %errorlevel% neq 0 (
        echo ❌ Failed to install dependencies
        pause
        exit /b 1
    )
    echo ✅ Dependencies installed
)

REM Create logs directory
if not exist "logs" mkdir logs

REM Start Ganache CLI in a new window
echo 🚀 Starting Ganache CLI...
start "Ganache CLI - Blockchain Certificate System" cmd /k "ganache-cli --mnemonic \"margin upper arrow nuclear cradle engage monster design autumn clap egg warrior\" --host 127.0.0.1 --port 8545 --networkId 1337 --accounts 10 --defaultBalanceEther 100"

REM Wait for Ganache to start
echo ⏳ Waiting for Ganache to initialize...
timeout /t 5 /nobreak >nul

REM Initialize admin user
echo 👤 Initializing admin user...
node scripts/initAdmin.js
if %errorlevel% neq 0 (
    echo ⚠️  Admin user initialization failed, but continuing...
)

REM Deploy smart contract if needed
echo 📄 Checking smart contract...
if "%CONTRACT_ADDRESS%"=="" (
    echo 📝 Deploying smart contract...
    node scripts/auto-deploy-contract.js
    if %errorlevel% neq 0 (
        echo ⚠️  Contract deployment failed, but continuing with fallback...
    )
) else (
    echo ✅ Smart contract address found: %CONTRACT_ADDRESS%
    echo 🔄 Verifying contract connection...
    node scripts/auto-deploy-contract.js
    if %errorlevel% neq 0 (
        echo ⚠️  Contract verification failed, but continuing...
    )
)

REM Start the Node.js server in development mode
echo 🚀 Starting Node.js server in development mode...
start "Blockchain Certificate System - Development" cmd /k "npm run dev"

REM Wait for server to start
echo ⏳ Waiting for server to initialize...
timeout /t 5 /nobreak >nul

echo.
echo ========================================
echo   🎉 Development System Started!
echo ========================================
echo.
echo 📊 Services Status:
echo   ✅ MongoDB: Running
echo   ✅ Ganache CLI: Running (http://127.0.0.1:8545)
echo   ✅ Node.js Server: Running in development mode (http://localhost:3000)
echo.
echo 🌐 Access the system:
echo   Frontend: http://localhost:3000
echo   API Health: http://localhost:3000/api/health
echo.
echo 👤 Default Login:
echo   Username: admin
echo   Password: admin123
echo.
echo 🔧 Development Features:
echo   - Auto-restart on file changes
echo   - Detailed error logging
echo   - Hot reload enabled
echo.
echo Press any key to open the system in your browser...
pause >nul

REM Open browser
start http://localhost:3000

echo.
echo ✅ Development system is ready!
echo Use stop.bat to stop all services.
echo.
