@echo off
echo ========================================
echo   Blockchain Certificate System
echo   Holesky Testnet Setup
echo ========================================
echo.

echo This script will help you configure your system for Holesky testnet.
echo.

echo Step 1: Get your MetaMask wallet address
echo ----------------------------------------
echo 1. Open MetaMask browser extension
echo 2. Click on your account name at the top
echo 3. Copy your wallet address (starts with 0x...)
echo.

set /p WALLET_ADDRESS="Enter your MetaMask wallet address: "

if "%WALLET_ADDRESS%"=="" (
    echo ❌ Wallet address is required!
    pause
    exit /b 1
)

echo.
echo Step 2: Get your private key
echo ----------------------------
echo 1. In MetaMask, click on the three dots next to your account
echo 2. Select "Account details"
echo 3. Click "Export private key"
echo 4. Enter your MetaMask password
echo 5. Copy the private key (without 0x prefix)
echo.

set /p PRIVATE_KEY="Enter your private key (without 0x): "

if "%PRIVATE_KEY%"=="" (
    echo ❌ Private key is required!
    pause
    exit /b 1
)

echo.
echo Step 3: Update configuration...
echo --------------------------------

REM Update config.env file
powershell -Command "(Get-Content config.env) -replace 'PRIVATE_KEY=.*', 'PRIVATE_KEY=%PRIVATE_KEY%' | Set-Content config.env"

echo ✅ Configuration updated successfully!
echo.

echo Step 4: Get Holesky testnet ETH
echo -------------------------------
echo Your wallet address: %WALLET_ADDRESS%
echo.
echo 🆓 Get free ETH from Holesky Faucet:
echo - https://holesky-faucet.pk910.de/
echo.
echo Steps:
echo 1. Visit the faucet URL above
echo 2. Paste your wallet address: %WALLET_ADDRESS%
echo 3. Complete the captcha
echo 4. Click "Request ETH"
echo 5. Wait 1-2 minutes for ETH to arrive
echo.

echo Step 5: Deploy smart contract
echo -----------------------------
echo After getting test ETH, run: node setup-testnet.js
echo.

echo 🎉 Holesky setup complete!
echo.
echo Next steps:
echo 1. Get test ETH from Holesky faucet
echo 2. Run: node setup-testnet.js
echo 3. Start server: node server.js
echo 4. Open: http://localhost:3000
echo 5. Connect MetaMask to Holesky testnet
echo.

echo 📋 Holesky Testnet Details:
echo - Chain ID: 17000 (0x4268)
echo - RPC URL: https://ethereum-holesky.publicnode.com
echo - Explorer: https://holesky.etherscan.io
echo - Faucet: https://holesky-faucet.pk910.de/
echo.

pause
