# 🆓 How to Get Free Testnet ETH

This guide will help you get free testnet ETH for your blockchain certificate system.

## 🦊 **Step 1: Install MetaMask**

1. Go to [metamask.io](https://metamask.io/)
2. Click "Download" and install the browser extension
3. Create a new wallet or import existing
4. **⚠️ IMPORTANT: Save your seed phrase securely!**

## 📍 **Step 2: Get Your Wallet Address**

1. Open MetaMask extension
2. Click on your account name at the top
3. Copy your wallet address (starts with `0x...`)
4. This is what you'll use to receive test ETH

## 💰 **Step 3: Get Free Test ETH**

### **Sepolia Testnet (Recommended)**

#### **Option 1: Sepolia Faucet (Easiest)**
- **URL**: https://sepoliafaucet.com/
- **Amount**: 0.1-0.5 ETH per request
- **Steps**:
  1. Paste your wallet address
  2. Complete captcha
  3. Click "Send me ETH"
  4. Wait 1-2 minutes

#### **Option 2: Infura Faucet**
- **URL**: https://www.infura.io/faucet/sepolia
- **Amount**: 0.1 ETH per request
- **Steps**:
  1. Create free Infura account
  2. Paste your wallet address
  3. Complete verification
  4. Get ETH instantly

#### **Option 3: Alchemy Faucet**
- **URL**: https://sepoliafaucet.com/
- **Amount**: 0.1 ETH per request
- **Steps**:
  1. Create free Alchemy account
  2. Paste your wallet address
  3. Complete verification
  4. Get ETH instantly

### **Holesky Testnet (Alternative)**

#### **Holesky Faucet**
- **URL**: https://holesky-faucet.pk910.de/
- **Amount**: 0.1 ETH per request
- **Steps**:
  1. Paste your wallet address
  2. Complete captcha
  3. Get ETH instantly

## 🔧 **Step 4: Configure Your System**

### **Quick Setup (Windows)**
```bash
# Run the automated setup script
setup-wallet.bat
```

### **Manual Setup**
1. **Get your private key from MetaMask**:
   - Click three dots next to your account
   - Select "Account details"
   - Click "Export private key"
   - Enter your password
   - Copy the private key (without 0x)

2. **Update config.env**:
   ```env
   BLOCKCHAIN_RPC_URL=https://rpc.sepolia.org
   PRIVATE_KEY=your_private_key_here
   ```

3. **Deploy smart contract**:
   ```bash
   node setup-testnet.js
   ```

## 🚀 **Step 5: Start Your System**

```bash
# Start the server
node server.js

# Open in browser
# http://localhost:3000
```

## 💡 **Tips for Getting ETH**

### **If Faucets Are Slow**
- Try different faucets
- Wait a few minutes between requests
- Use different browsers/incognito mode
- Check faucet status on their websites

### **If You Need More ETH**
- Most faucets allow multiple requests
- Wait 24 hours between requests on same faucet
- Use different faucets for more ETH
- Join Discord/Telegram groups for additional faucets

### **Cost Estimation**
- **Contract deployment**: ~0.01-0.02 ETH
- **Certificate issuance**: ~0.001-0.005 ETH each
- **100 certificates**: ~0.1-0.5 ETH total

## 🔍 **Verify Your ETH**

1. **Check MetaMask**: Your balance should show test ETH
2. **Check on Explorer**: 
   - Sepolia: https://sepolia.etherscan.io/address/YOUR_ADDRESS
   - Holesky: https://holesky.etherscan.io/address/YOUR_ADDRESS

## 🆘 **Troubleshooting**

### **"Insufficient funds" Error**
- Get more test ETH from faucets
- Check your balance in MetaMask
- Ensure you're on the correct network

### **"Network not found" Error**
- Switch MetaMask to Sepolia testnet
- Add network manually if needed
- Check RPC URL in config.env

### **"Private key invalid" Error**
- Ensure private key is correct (no 0x prefix)
- Check for extra spaces or characters
- Export private key again from MetaMask

## 📞 **Need Help?**

If you're still having issues:
1. Check the console logs for detailed errors
2. Verify your testnet ETH balance
3. Ensure MetaMask is on the correct network
4. Try different RPC URLs

## 🎯 **Next Steps**

After getting test ETH:
1. Run `setup-wallet.bat` to configure your system
2. Deploy smart contract with `node setup-testnet.js`
3. Start your server with `node server.js`
4. Open http://localhost:3000 and test the system

---

**🎉 You're all set!** Your blockchain certificate system will now use permanent testnet storage instead of local Ganache.
