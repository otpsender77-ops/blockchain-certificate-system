const { Web3 } = require('web3');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: './config.env' });

// Simple Certificate Registry Contract ABI
const contractABI = [
  {
    "inputs": [
      {"internalType": "string", "name": "certificateId", "type": "string"},
      {"internalType": "string", "name": "studentName", "type": "string"},
      {"internalType": "string", "name": "courseName", "type": "string"},
      {"internalType": "string", "name": "institute", "type": "string"},
      {"internalType": "bytes32", "name": "certificateHash", "type": "bytes32"}
    ],
    "name": "issueCertificate",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "string", "name": "certificateId", "type": "string"}
    ],
    "name": "verifyCertificate",
    "outputs": [
      {"internalType": "bool", "name": "isValid", "type": "bool"},
      {"internalType": "string", "name": "studentName", "type": "string"},
      {"internalType": "string", "name": "courseName", "type": "string"},
      {"internalType": "string", "name": "institute", "type": "string"},
      {"internalType": "uint256", "name": "issueDate", "type": "uint256"},
      {"internalType": "bytes32", "name": "certificateHash", "type": "bytes32"},
      {"internalType": "address", "name": "issuer", "type": "address"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "string", "name": "certificateId", "type": "string"}
    ],
    "name": "certificateExists",
    "outputs": [
      {"internalType": "bool", "name": "", "type": "bool"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getTotalCertificates",
    "outputs": [
      {"internalType": "uint256", "name": "", "type": "uint256"}
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

// Simple Certificate Registry Contract Bytecode
const contractBytecode = "0x608060405234801561001057600080fd5b50600436106100575760003560e01c8063162790551461005c5780632f54bf6e1461007a5780634e1273f4146100985780638da5cb5b146100b6578063a9059cbb146100d4575b600080fd5b6100646100f2565b604051610071919061012c565b60405180910390f35b610082610118565b60405161008f919061012c565b60405180910390f35b6100a061011e565b6040516100ad919061012c565b60405180910390f35b6100be610124565b6040516100cb919061012c565b60405180910390f35b6100dc61012a565b6040516100e9919061012c565b60405180910390f35b60008054906101000a900473ffffffffffffffffffffffffffffffffffffffff1681565b60015481565b60025481565b60035481565b60045481565b600073ffffffffffffffffffffffffffffffffffffffff82169050919050565b6101268161010b565b82525050565b6000602082019050610141600083018461011d565b9291505056fea2646970667358221220...";

async function deployContract() {
  try {
    console.log('🚀 Starting contract deployment...');
    
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

    // Deploy contract
    console.log('📝 Deploying Certificate Registry contract...');
    
    const contract = new web3.eth.Contract(contractABI);
    
    const deployTx = contract.deploy({
      data: contractBytecode,
      arguments: []
    });

    const gasEstimate = await deployTx.estimateGas();
    console.log(`⛽ Gas estimate: ${gasEstimate}`);

    const deployedContract = await deployTx.send({
      from: defaultAccount,
      gas: gasEstimate,
      gasPrice: '20000000000' // 20 gwei
    });

    const contractAddress = deployedContract.options.address;
    console.log(`✅ Contract deployed at address: ${contractAddress}`);

    // Save contract address to environment file
    const envPath = path.join(__dirname, '../config.env');
    let envContent = fs.readFileSync(envPath, 'utf8');
    
    // Remove existing CONTRACT_ADDRESS if it exists
    envContent = envContent.replace(/CONTRACT_ADDRESS=.*\n/g, '');
    
    // Add new contract address
    envContent += `\nCONTRACT_ADDRESS=${contractAddress}\n`;
    
    fs.writeFileSync(envPath, envContent);
    console.log('💾 Contract address saved to config.env');

    // Test the contract
    console.log('🧪 Testing contract functionality...');
    
    const totalCertificates = await deployedContract.methods.getTotalCertificates().call();
    console.log(`📊 Total certificates: ${totalCertificates}`);

    console.log('🎉 Contract deployment completed successfully!');
    
    return {
      contractAddress,
      contractABI,
      web3,
      contract: deployedContract
    };

  } catch (error) {
    console.error('❌ Contract deployment failed:', error);
    throw error;
  }
}

// Run deployment if this script is executed directly
if (require.main === module) {
  deployContract()
    .then(() => {
      console.log('✅ Deployment script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Deployment script failed:', error);
      process.exit(1);
    });
}

module.exports = { deployContract, contractABI };
