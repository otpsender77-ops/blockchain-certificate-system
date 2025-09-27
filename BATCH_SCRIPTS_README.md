# Batch Scripts for Blockchain Certificate System

This directory contains Windows batch scripts to easily manage the Blockchain Certificate System services.

## 📁 Available Scripts

### 🚀 `start.bat` - Production Mode
**Purpose**: Starts all services in production mode with minimal console output.

**Features**:
- ✅ Checks all prerequisites (Node.js, MongoDB)
- ✅ Installs dependencies if needed
- ✅ Connects to Holesky testnet blockchain
- ✅ Initializes admin user
- ✅ Starts Node.js server in background
- ✅ Opens browser automatically
- ✅ Comprehensive error checking

**Usage**:
```cmd
start.bat
```

### 🔧 `start-dev.bat` - Development Mode
**Purpose**: Starts all services in development mode with visible console windows.

**Features**:
- ✅ All production features
- ✅ Holesky testnet connection visible
- ✅ Node.js server runs with auto-restart (nodemon)
- ✅ Better for debugging and development

**Usage**:
```cmd
start-dev.bat
```

### 🛑 `stop.bat` - Stop All Services
**Purpose**: Gracefully stops all running services.

**Features**:
- ✅ Stops Node.js processes
- ✅ Stops blockchain connections
- ✅ Closes service windows
- ✅ Verifies services are stopped
- ✅ Force kills if necessary

**Usage**:
```cmd
stop.bat
```

### 📊 `status.bat` - Check Service Status
**Purpose**: Shows the current status of all services.

**Features**:
- ✅ Checks MongoDB status
- ✅ Checks blockchain connection status
- ✅ Checks Node.js server status
- ✅ Shows running processes
- ✅ Shows port usage
- ✅ Shows log file information

**Usage**:
```cmd
status.bat
```

## 🎯 Quick Start Guide

### First Time Setup:
1. **Install Prerequisites**:
   - Node.js (https://nodejs.org/)
   - MongoDB (https://www.mongodb.com/try/download/community)
   - Git (optional, for cloning)

2. **Start MongoDB Service**:
   ```cmd
   net start MongoDB
   ```

3. **Run the System**:
   ```cmd
   start.bat
   ```

### Daily Usage:
- **Start**: `start.bat` or `start-dev.bat`
- **Check Status**: `status.bat`
- **Stop**: `stop.bat`

## 🔧 Service Details

### Services Started:
- **MongoDB**: Database (Port 27017)
- **Holesky Testnet**: Blockchain (RPC: https://rpc.ankr.com/eth_holesky)
- **Node.js Server**: Application (Port 3000)

### Default Login:
- **Username**: `admin`
- **Password**: `admin123`

### Access URLs:
- **Frontend**: http://localhost:3000
- **API Health**: http://localhost:3000/api/health
- **Holesky Testnet**: https://holesky.etherscan.io

## 📁 Log Files

All logs are stored in the `logs/` directory:
- `logs/server.log` - Node.js server logs
- `logs/blockchain.log` - Blockchain connection logs

## ⚠️ Troubleshooting

### Common Issues:

1. **"Node.js is not installed"**:
   - Install Node.js from https://nodejs.org/
   - Restart command prompt after installation

2. **"MongoDB is not running"**:
   - Start MongoDB service: `net start MongoDB`
   - Or install MongoDB if not installed

3. **"Blockchain connection failed"**:
   - Check internet connection
   - Verify Holesky testnet RPC is accessible

4. **"Port already in use"**:
   - Run `stop.bat` first
   - Or manually kill processes using Task Manager

5. **"Permission denied"**:
   - Run Command Prompt as Administrator
   - Or check Windows Firewall settings

### Manual Service Management:

**Start MongoDB**:
```cmd
net start MongoDB
```

**Stop MongoDB**:
```cmd
net stop MongoDB
```

**Kill all Node.js processes**:
```cmd
taskkill /F /IM node.exe
```

**Kill all blockchain processes**:
```cmd
taskkill /F /IM node.exe
```

## 🎉 Success Indicators

When everything is working correctly, you should see:
- ✅ All services show "Running" in status check
- ✅ Browser opens to http://localhost:3000
- ✅ Login works with admin/admin123
- ✅ Certificate generation works
- ✅ No error messages in console

## 📞 Support

If you encounter issues:
1. Run `status.bat` to check service status
2. Check log files in `logs/` directory
3. Ensure all prerequisites are installed
4. Try running `stop.bat` then `start.bat` again

---

**Happy Certificate Generation!** 🎓
