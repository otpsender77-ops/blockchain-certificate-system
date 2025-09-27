# 🔐 Login Guide - Blockchain Certificate System

## ✅ **NEW: Simplified Login Process**

The MetaMask connection section is now **always visible** for easy access!

## 📋 **Step-by-Step Login Process:**

### **Step 1: Open the Application**
- Go to: http://localhost:3000
- You'll see the login form with **MetaMask connection section visible**

### **Step 2: Connect MetaMask to Holesky**
1. **Open MetaMask Extension** in your browser
2. **Switch to Holesky Testnet**:
   - Click the network dropdown (top of MetaMask)
   - Select "Holesky Test Network" (Chain ID: 17000)
   - If not present, add it manually:
     - **Network Name**: Holesky Test Network
     - **RPC URL**: https://rpc.ankr.com/eth_holesky
     - **Chain ID**: 17000
     - **Currency Symbol**: ETH
     - **Block Explorer**: https://holesky.etherscan.io

### **Step 3: Connect MetaMask in the App**
1. **Click "Connect MetaMask Wallet"** button in the app
2. **Approve the connection** in MetaMask popup
3. **Verify the connection** - you should see your wallet address displayed

### **Step 4: Login Button Becomes Active**
- Once MetaMask is connected, the login button will change to **"Login to System"**
- The button will become **clickable** (no longer grayed out)

### **Step 5: Complete Login**
1. **Enter credentials**:
   - Username: `admin`
   - Password: `admin123`
2. **Click "Login to System"** button
3. **You'll be redirected** to the admin dashboard

## 🔧 **Troubleshooting:**

### **If Login Button Still Disabled:**
- ✅ Check MetaMask is connected to Holesky testnet
- ✅ Check MetaMask is unlocked
- ✅ Refresh the page and try again
- ✅ Check browser console for errors (F12)

### **If MetaMask Connection Fails:**
- ✅ Make sure MetaMask extension is installed
- ✅ Make sure you're on Holesky testnet
- ✅ Try refreshing the page
- ✅ Check if MetaMask is unlocked

### **If You Don't Have Holesky Testnet:**
1. Open MetaMask
2. Click "Add Network" or "Custom RPC"
3. Enter these details:
   - **Network Name**: Holesky Test Network
   - **RPC URL**: https://rpc.ankr.com/eth_holesky
   - **Chain ID**: 17000
   - **Currency Symbol**: ETH
   - **Block Explorer**: https://holesky.etherscan.io

## 💰 **Need Test ETH?**
- **Holesky Faucet**: https://holesky-faucet.pk910.de/
- **Your Wallet**: 0x8235E56bEaa053378AA993908c95A43A49722244
- **Current Balance**: ~2.55 ETH (should be enough)

## 🎯 **Expected Behavior:**
1. **Initial State**: Login button disabled, shows "Connect MetaMask to Continue"
2. **After MetaMask Connection**: Login button enabled, shows "Login to System"
3. **After Login**: Redirected to admin dashboard

---

**The system is now running on Holesky testnet with MetaMask integration! 🚀**
