const { Web3 } = require('web3');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: './config.env' });

async function deployMinimalContract() {
  try {
    console.log('🚀 Starting minimal contract deployment...');
    
    // Connect to Ganache
    const ganacheUrl = `http://${process.env.GANACHE_HOST}:${process.env.GANACHE_PORT}`;
    const web3 = new Web3(ganacheUrl);
    
    // Verify connection
    try {
      await web3.eth.getBlockNumber();
      console.log('✅ Connected to Ganache blockchain');
    } catch (error) {
      throw new Error('Cannot connect to Ganache blockchain');
    }

    // Get accounts
    const accounts = await web3.eth.getAccounts();
    console.log(`📋 Found ${accounts.length} accounts in Ganache`);
    
    if (accounts.length === 0) {
      throw new Error('No accounts found in Ganache');
    }

    // Set default account
    const defaultAccount = accounts[0];
    web3.eth.defaultAccount = defaultAccount;
    console.log(`🔑 Using account: ${defaultAccount}`);

    // Deploy a minimal contract using a very simple approach
    console.log('📝 Deploying minimal contract...');
    
    // Use a minimal contract bytecode that just returns 0
    // This is a very simple contract that just has a constructor and returns 0
    const minimalContractBytecode = '0x608060405234801561001057600080fd5b50600436106100365760003560e01c80630d4d15131461003b5780632f54bf6e14610059575b600080fd5b610043610075565b604051610050919061009c565b60405180910390f35b61006161007b565b60405161006e919061009c565b60405180910390f35b60005481565b60008054905090565b6000819050919050565b61009681610083565b82525050565b60006020820190506100b1600083018461008d565b9291505056fea26469706673582212207d...';

    // Deploy using raw transaction with minimal gas
    const deployTx = {
      from: defaultAccount,
      data: minimalContractBytecode,
      gas: 50000,
      gasPrice: '20000000000'
    };

    console.log(`⛽ Using minimal gas limit: ${deployTx.gas}`);

    // Send deployment transaction
    const receipt = await web3.eth.sendTransaction(deployTx);
    const contractAddress = receipt.contractAddress;
    
    console.log(`✅ Minimal contract deployed at address: ${contractAddress}`);

    // Save contract address to environment file
    const envPath = path.join(__dirname, '../config.env');
    let envContent = fs.readFileSync(envPath, 'utf8');
    
    // Remove existing CONTRACT_ADDRESS if it exists
    envContent = envContent.replace(/CONTRACT_ADDRESS=.*\n/g, '');
    
    // Add new contract address
    envContent = envContent.replace(
      /# Smart Contract Configuration\nCONTRACT_ADDRESS=/,
      `# Smart Contract Configuration\nCONTRACT_ADDRESS=${contractAddress}`
    );
    
    fs.writeFileSync(envPath, envContent);
    console.log('💾 Minimal contract address saved to config.env');

    console.log('🎉 Minimal contract deployment completed successfully!');
    
    return {
      contractAddress,
      web3
    };

  } catch (error) {
    console.error('❌ Minimal contract deployment failed:', error);
    throw error;
  }
}

// Run deployment if this script is executed directly
if (require.main === module) {
  deployMinimalContract()
    .then(() => {
      console.log('✅ Minimal deployment script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Minimal deployment script failed:', error);
      process.exit(1);
    });
}

module.exports = { deployMinimalContract };