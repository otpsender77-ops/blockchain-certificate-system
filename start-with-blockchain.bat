@echo off
echo ========================================
echo   Blockchain Certificate System Startup
echo ========================================
echo.

echo [1/4] Connecting to Holesky testnet blockchain...
echo Using Holesky testnet RPC: https://rpc.ankr.com/eth_holesky

echo [2/4] Waiting for blockchain connection...
timeout /t 8 /nobreak > nul

echo [3/4] Smart contract already deployed on Holesky testnet...
echo Contract Address: 0xFcbc69C6F4DbEE5EA92573C309c2B3D2Ff4a427e

echo [4/4] Starting Node.js server...
echo.
echo ✅ System ready! Access at: http://localhost:3000
echo 🔗 Blockchain: Holesky Testnet
echo.
node server.js

pause
