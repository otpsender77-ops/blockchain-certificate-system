@echo off
echo ========================================
echo   Blockchain Certificate System
echo   Wallet Setup for Testnet
echo ========================================
echo.

echo This script will help you configure your wallet for testnet usage.
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
echo Step 3: Choose RPC URL
echo ----------------------
echo 1. Free Public RPC (recommended for testing)
echo 2. Infura RPC (requires free account)
echo 3. Alchemy RPC (requires free account)
echo.

set /p RPC_CHOICE="Choose RPC option (1-3): "

if "%RPC_CHOICE%"=="1" (
    set RPC_URL=https://rpc.sepolia.org
    echo ✅ Using free public RPC
) else if "%RPC_CHOICE%"=="2" (
    set /p INFURA_ID="Enter your Infura Project ID: "
    if "%INFURA_ID%"=="" (
        echo ❌ Infura Project ID is required!
        pause
        exit /b 1
    )
    set RPC_URL=https://sepolia.infura.io/v3/%INFURA_ID%
    echo ✅ Using Infura RPC
) else if "%RPC_CHOICE%"=="3" (
    set /p ALCHEMY_KEY="Enter your Alchemy API Key: "
    if "%ALCHEMY_KEY%"=="" (
        echo ❌ Alchemy API Key is required!
        pause
        exit /b 1
    )
    set RPC_URL=https://eth-sepolia.g.alchemy.com/v2/%ALCHEMY_KEY%
    echo ✅ Using Alchemy RPC
) else (
    echo ❌ Invalid choice!
    pause
    exit /b 1
)

echo.
echo Step 4: Updating configuration...
echo --------------------------------

REM Update config.env file
powershell -Command "(Get-Content config.env) -replace 'BLOCKCHAIN_RPC_URL=.*', 'BLOCKCHAIN_RPC_URL=%RPC_URL%' | Set-Content config.env"
powershell -Command "(Get-Content config.env) -replace 'PRIVATE_KEY=.*', 'PRIVATE_KEY=%PRIVATE_KEY%' | Set-Content config.env"

echo ✅ Configuration updated successfully!
echo.

echo Step 5: Get testnet ETH
echo -----------------------
echo Your wallet address: %WALLET_ADDRESS%
echo.
echo Visit these faucets to get free test ETH:
echo.
echo 🆓 Sepolia Faucets:
echo - https://sepoliafaucet.com/
echo - https://www.infura.io/faucet/sepolia
echo - https://sepolia-faucet.pk910.de/
echo.
echo 🆓 Holesky Faucets:
echo - https://holesky-faucet.pk910.de/
echo.

echo Step 6: Deploy smart contract
echo -----------------------------
echo After getting test ETH, run: node setup-testnet.js
echo.

echo 🎉 Wallet setup complete!
echo.
echo Next steps:
echo 1. Get test ETH from faucets above
echo 2. Run: node setup-testnet.js
echo 3. Start server: node server.js
echo 4. Open: http://localhost:3000
echo.

pause
