@echo off
echo ========================================
echo   Blockchain Certificate System
echo   Starting All Services...
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
    echo Please start MongoDB service first
    echo You can start it with: net start MongoDB
    pause
    exit /b 1
)
echo ✅ MongoDB is running

REM Check if Ganache CLI is installed
ganache-cli --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Ganache CLI is not installed
    echo Installing Ganache CLI globally...
    npm install -g ganache-cli
    if %errorlevel% neq 0 (
        echo ❌ Failed to install Ganache CLI
        pause
        exit /b 1
    )
)
echo ✅ Ganache CLI is available

REM Install dependencies if node_modules doesn't exist
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

REM Start Ganache CLI in background
echo 🚀 Starting Ganache CLI...
start "Ganache CLI" /min cmd /c "ganache-cli --mnemonic \"margin upper arrow nuclear cradle engage monster design autumn clap egg warrior\" --host 127.0.0.1 --port 8545 --networkId 1337 --accounts 10 --defaultBalanceEther 100 > logs/ganache.log 2>&1"

REM Wait for Ganache to start
echo ⏳ Waiting for Ganache to initialize...
timeout /t 5 /nobreak >nul

REM Check if Ganache is running
echo 🔍 Verifying Ganache connection...
curl -s -X POST -H "Content-Type: application/json" --data "{\"jsonrpc\":\"2.0\",\"method\":\"eth_blockNumber\",\"params\":[],\"id\":1}" http://127.0.0.1:8545 >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Ganache failed to start properly
    echo Check logs/ganache.log for details
    pause
    exit /b 1
)
echo ✅ Ganache is running

REM Initialize admin user if needed
echo 👤 Checking admin user...
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

REM Start the Node.js server
echo 🚀 Starting Node.js server...
start "Blockchain Certificate System" cmd /c "node server.js > logs/server.log 2>&1"

REM Wait for server to start
echo ⏳ Waiting for server to initialize...
timeout /t 3 /nobreak >nul

REM Check if server is running
echo 🔍 Verifying server connection...
curl -s http://localhost:3000/api/health >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Server failed to start properly
    echo Check logs/server.log for details
    pause
    exit /b 1
)
echo ✅ Server is running

echo.
echo ========================================
echo   🎉 System Started Successfully!
echo ========================================
echo.
echo 📊 Services Status:
echo   ✅ MongoDB: Running
echo   ✅ Ganache CLI: Running (http://127.0.0.1:8545)
echo   ✅ Node.js Server: Running (http://localhost:3000)
echo.
echo 🌐 Access the system:
echo   Frontend: http://localhost:3000
echo   API Health: http://localhost:3000/api/health
echo.
echo 👤 Default Login:
echo   Username: admin
echo   Password: admin123
echo.
echo 📁 Logs are available in the 'logs' directory
echo.
echo Press any key to open the system in your browser...
pause >nul

REM Open browser
start http://localhost:3000

echo.
echo ✅ System is ready! Use stop.bat to stop all services.
echo.
