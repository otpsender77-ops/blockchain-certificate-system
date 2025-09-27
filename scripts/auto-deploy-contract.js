const { Web3 } = require('web3');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: './config.env' });

async function autoDeployContract() {
  try {
    console.log('🚀 Auto-deploying contract to current Ganache instance...');
    
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

    // Load the compiled contract
    const contractPath = path.join(__dirname, '../build/contracts/WorkingCertificateRegistry.json');
    const contractData = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
    
    const contractABI = contractData.abi;
    const contractBytecode = contractData.bytecode;

    // Deploy contract
    console.log('📝 Deploying contract...');
    
    const contract = new web3.eth.Contract(contractABI);
    
    const deployTx = contract.deploy({
      data: contractBytecode,
      arguments: []
    });

    const gasLimit = 1000000;
    console.log(`⛽ Using gas limit: ${gasLimit}`);

    const deployedContract = await deployTx.send({
      from: defaultAccount,
      gas: gasLimit,
      gasPrice: '20000000000'
    });

    const contractAddress = deployedContract.options.address;
    console.log(`✅ Contract deployed at address: ${contractAddress}`);

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
    console.log('💾 Contract address saved to config.env');

    // Test the contract
    console.log('🧪 Testing contract functionality...');
    
    try {
      const totalCertificates = await deployedContract.methods.getTotalCertificates().call();
      console.log(`📊 Total certificates: ${totalCertificates}`);
      console.log('✅ Contract is working!');
    } catch (error) {
      console.log('⚠️  Contract test failed, but deployment succeeded');
      console.log('Error:', error.message);
    }

    console.log('🎉 Auto-deployment completed successfully!');
    
    return {
      contractAddress,
      contractABI,
      web3,
      contract: deployedContract
    };

  } catch (error) {
    console.error('❌ Auto-deployment failed:', error);
    throw error;
  }
}

// Run deployment if this script is executed directly
if (require.main === module) {
  autoDeployContract()
    .then(() => {
      console.log('✅ Auto-deployment script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Auto-deployment script failed:', error);
      process.exit(1);
    });
}

module.exports = { autoDeployContract };
