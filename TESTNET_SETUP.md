# 🚀 Blockchain Certificate System - Testnet Setup

This guide will help you configure the system to use Ethereum testnets (Sepolia or Holesky) instead of local Ganache for permanent, reliable blockchain storage.

## 🌟 Benefits of Using Testnets

- **Permanent Storage**: Data is stored on the global testnet, never lost
- **Real Blockchain**: Even if your laptop restarts, contracts & transactions remain forever
- **Free Test ETH**: Available via faucets for testing
- **Production-like**: Best for demos and testing with real blockchain behavior

## 📋 Prerequisites

1. **MetaMask Extension**: Install from [metamask.io](https://metamask.io/)
2. **Node.js**: Version 16+ installed
3. **Testnet ETH**: Get free test ETH from faucets

## 🔧 Setup Instructions

### Step 1: Get Testnet ETH

#### For Sepolia Testnet:
1. Visit [Sepolia Faucet](https://sepoliafaucet.com/)
2. Enter your MetaMask wallet address
3. Request test ETH (usually 0.1-0.5 ETH)

#### For Holesky Testnet:
1. Visit [Holesky Faucet](https://holesky-faucet.pk910.de/)
2. Enter your MetaMask wallet address
3. Request test ETH

### Step 2: Configure Environment

1. **Open `config.env`** and update the following:

```env
# Blockchain Configuration (Sepolia Testnet)
BLOCKCHAIN_NETWORK=sepolia
BLOCKCHAIN_RPC_URL=https://rpc.sepolia.org
BLOCKCHAIN_NETWORK_ID=11155111
BLOCKCHAIN_CHAIN_ID=0xaa36a7

# Smart Contract Configuration (will be deployed)
CONTRACT_ADDRESS=
GAS_LIMIT=3000000
GAS_PRICE=20000000000

# Your testnet wallet private key (keep secure!)
PRIVATE_KEY=YOUR_ACTUAL_PRIVATE_KEY_HERE
```

2. **Get your private key from MetaMask**:
   - Open MetaMask
   - Click on account details
   - Export private key
   - Copy the private key (without 0x prefix)

3. **Choose your RPC URL** (pick one):
   - **Free Public RPC**: `https://rpc.sepolia.org`
   - **Infura**: `https://sepolia.infura.io/v3/YOUR_PROJECT_ID`
   - **Alchemy**: `https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY`

### Step 3: Deploy Smart Contract

Run the automated setup script:

```bash
node setup-testnet.js
```

This will:
- ✅ Check your configuration
- ✅ Deploy the smart contract to testnet
- ✅ Update config.env with contract address
- ✅ Provide verification links

### Step 4: Start the System

```bash
node server.js
```

## 🔗 Network Configuration

### Sepolia Testnet
- **Chain ID**: 11155111 (0xaa36a7)
- **RPC URL**: https://rpc.sepolia.org
- **Explorer**: https://sepolia.etherscan.io
- **Faucet**: https://sepoliafaucet.com/

### Holesky Testnet
- **Chain ID**: 17000 (0x4268)
- **RPC URL**: https://ethereum-holesky.publicnode.com
- **Explorer**: https://holesky.etherscan.io
- **Faucet**: https://holesky-faucet.pk910.de/

## 🦊 MetaMask Configuration

The system will automatically prompt you to:
1. **Switch to Sepolia testnet** when connecting
2. **Add the network** if not already configured
3. **Verify connection** before allowing admin access

## 🚀 Usage

1. **Start the system**: `node server.js`
2. **Open browser**: http://localhost:3000
3. **Connect MetaMask**: Switch to Sepolia testnet
4. **Login**: Use admin credentials (admin/admin123)
5. **Generate certificates**: All transactions will be on testnet

## 🔍 Verification

After deployment, you can:
- **View contract**: Check on Etherscan
- **Verify transactions**: All certificate issuances are public
- **Check balances**: Monitor your testnet ETH usage

## 🛠️ Troubleshooting

### Common Issues:

1. **"Insufficient funds"**
   - Get more test ETH from faucet
   - Check gas price settings

2. **"Network not found"**
   - Ensure MetaMask is connected to Sepolia
   - Check RPC URL in config.env

3. **"Contract deployment failed"**
   - Verify private key is correct
   - Check RPC URL is accessible
   - Ensure sufficient test ETH

### Manual Deployment:

If the setup script fails, deploy manually:

```bash
# Deploy to Sepolia
npx truffle migrate --network sepolia --reset

# Deploy to Holesky
npx truffle migrate --network holesky --reset
```

## 🔒 Security Notes

- **Never use mainnet private keys** in testnet configuration
- **Keep testnet private keys secure** (they still have value)
- **Use separate wallets** for testing and production
- **Regularly rotate testnet keys** for security

## 📊 Cost Estimation

- **Contract deployment**: ~0.01-0.02 ETH
- **Certificate issuance**: ~0.001-0.005 ETH each
- **Total for 100 certificates**: ~0.1-0.5 ETH

## 🎯 Production Migration

When ready for mainnet:
1. Update RPC URL to mainnet
2. Update chain ID to 1 (Ethereum mainnet)
3. Use real ETH for gas fees
4. Deploy contract to mainnet
5. Update MetaMask to mainnet

## 📞 Support

If you encounter issues:
1. Check the console logs for detailed error messages
2. Verify your testnet ETH balance
3. Ensure MetaMask is on the correct network
4. Check RPC URL accessibility

---

**🎉 Congratulations!** Your blockchain certificate system is now running on a permanent testnet with real blockchain security and immutability!
