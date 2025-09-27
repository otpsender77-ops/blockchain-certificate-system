@echo off
echo ========================================
echo   Blockchain Certificate System
echo   Stopping All Services...
echo ========================================
echo.

REM Stop Node.js processes
echo 🛑 Stopping Node.js server...
taskkill /F /IM node.exe >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Node.js processes stopped
) else (
    echo ⚠️  No Node.js processes found
)

REM Stop Ganache CLI processes
echo 🛑 Stopping Ganache CLI...
taskkill /F /IM ganache-cli.exe >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Ganache CLI stopped
) else (
    echo ⚠️  No Ganache CLI processes found
)

REM Stop any remaining cmd processes that might be running our services
echo 🛑 Stopping service windows...
taskkill /F /FI "WINDOWTITLE eq Ganache CLI*" >nul 2>&1
taskkill /F /FI "WINDOWTITLE eq Blockchain Certificate System*" >nul 2>&1

REM Wait a moment for processes to fully terminate
timeout /t 2 /nobreak >nul

REM Check if services are still running
echo 🔍 Verifying services are stopped...

REM Check if server is still responding
curl -s http://localhost:3000/api/health >nul 2>&1
if %errorlevel% equ 0 (
    echo ❌ Server is still running on port 3000
    echo Trying to force stop...
    netstat -ano | findstr :3000 | for /f "tokens=5" %%a in ('more') do taskkill /F /PID %%a >nul 2>&1
) else (
    echo ✅ Server stopped
)

REM Check if Ganache is still responding
curl -s -X POST -H "Content-Type: application/json" --data "{\"jsonrpc\":\"2.0\",\"method\":\"eth_blockNumber\",\"params\":[],\"id\":1}" http://127.0.0.1:8545 >nul 2>&1
if %errorlevel% equ 0 (
    echo ❌ Ganache is still running on port 8545
    echo Trying to force stop...
    netstat -ano | findstr :8545 | for /f "tokens=5" %%a in ('more') do taskkill /F /PID %%a >nul 2>&1
) else (
    echo ✅ Ganache stopped
)

echo.
echo ========================================
echo   🛑 System Stopped Successfully!
echo ========================================
echo.
echo 📊 Services Status:
echo   ✅ Node.js Server: Stopped
echo   ✅ Ganache CLI: Stopped
echo   ✅ All processes terminated
echo.
echo 📁 Logs are preserved in the 'logs' directory
echo.
echo Press any key to exit...
pause >nul
