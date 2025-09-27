@echo off
echo ========================================
echo   Blockchain Certificate System
echo   Service Status Check
echo ========================================
echo.

REM Check MongoDB
echo 🔍 Checking MongoDB...
mongosh --eval "db.runCommand('ping')" >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ MongoDB: Running
) else (
    echo ❌ MongoDB: Not running
)

REM Check Ganache CLI
echo 🔍 Checking Ganache CLI...
curl -s -X POST -H "Content-Type: application/json" --data "{\"jsonrpc\":\"2.0\",\"method\":\"eth_blockNumber\",\"params\":[],\"id\":1}" http://127.0.0.1:8545 >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Ganache CLI: Running (http://127.0.0.1:8545)
) else (
    echo ❌ Ganache CLI: Not running
)

REM Check Node.js Server
echo 🔍 Checking Node.js Server...
curl -s http://localhost:3000/api/health >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Node.js Server: Running (http://localhost:3000)
    
    REM Get detailed health info
    echo.
    echo 📊 Detailed Health Information:
    curl -s http://localhost:3000/api/health 2>nul | findstr /C:"status" /C:"blockchain" /C:"database"
) else (
    echo ❌ Node.js Server: Not running
)

REM Check for running processes
echo.
echo 🔍 Running Processes:
tasklist /FI "IMAGENAME eq node.exe" 2>nul | findstr node.exe >nul
if %errorlevel% equ 0 (
    echo ✅ Node.js processes found
    tasklist /FI "IMAGENAME eq node.exe" /FO TABLE
) else (
    echo ❌ No Node.js processes running
)

tasklist /FI "IMAGENAME eq ganache-cli.exe" 2>nul | findstr ganache-cli.exe >nul
if %errorlevel% equ 0 (
    echo ✅ Ganache CLI processes found
    tasklist /FI "IMAGENAME eq ganache-cli.exe" /FO TABLE
) else (
    echo ❌ No Ganache CLI processes running
)

REM Check port usage
echo.
echo 🔍 Port Usage:
netstat -an | findstr :3000 >nul
if %errorlevel% equ 0 (
    echo ✅ Port 3000: In use (Node.js Server)
) else (
    echo ❌ Port 3000: Available
)

netstat -an | findstr :8545 >nul
if %errorlevel% equ 0 (
    echo ✅ Port 8545: In use (Ganache CLI)
) else (
    echo ❌ Port 8545: Available
)

netstat -an | findstr :27017 >nul
if %errorlevel% equ 0 (
    echo ✅ Port 27017: In use (MongoDB)
) else (
    echo ❌ Port 27017: Available
)

REM Check log files
echo.
echo 📁 Log Files:
if exist "logs\server.log" (
    echo ✅ Server log: logs\server.log
    for %%A in (logs\server.log) do echo    Size: %%~zA bytes
) else (
    echo ❌ Server log: Not found
)

if exist "logs\ganache.log" (
    echo ✅ Ganache log: logs\ganache.log
    for %%A in (logs\ganache.log) do echo    Size: %%~zA bytes
) else (
    echo ❌ Ganache log: Not found
)

echo.
echo ========================================
echo   Status Check Complete
echo ========================================
echo.
echo 💡 Tips:
echo   - Use start.bat to start all services
echo   - Use start-dev.bat for development mode
echo   - Use stop.bat to stop all services
echo   - Check logs directory for detailed logs
echo.
pause
