@echo off
echo ========================================
echo   Blockchain Certificate System
echo   Testnet Setup (Sepolia/Holesky)
echo ========================================
echo.

echo Checking Node.js installation...
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo ✅ Node.js is installed
echo.

echo Checking dependencies...
if not exist "node_modules" (
    echo 📦 Installing dependencies...
    npm install
    if errorlevel 1 (
        echo ❌ Failed to install dependencies
        pause
        exit /b 1
    )
)

echo ✅ Dependencies are ready
echo.

echo 🔧 Starting testnet setup...
echo.
echo This will:
echo - Check your configuration
echo - Deploy smart contract to testnet
echo - Update config.env with contract address
echo.

pause

node setup-testnet.js

if errorlevel 1 (
    echo.
    echo ❌ Setup failed. Please check the error messages above.
    echo.
    echo Common issues:
    echo - Missing or invalid private key in config.env
    echo - Invalid RPC URL
    echo - Insufficient testnet ETH
    echo.
    pause
    exit /b 1
)

echo.
echo 🎉 Testnet setup completed successfully!
echo.
echo Next steps:
echo 1. Start the server: node server.js
echo 2. Open http://localhost:3000
echo 3. Connect MetaMask to Sepolia testnet
echo 4. Login with admin credentials
echo.
pause
