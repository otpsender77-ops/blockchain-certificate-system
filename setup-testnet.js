#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: './config.env' });

console.log('🚀 Blockchain Certificate System - Testnet Setup');
console.log('================================================\n');

// Check if required environment variables are set
function checkEnvironment() {
    const required = [
        'PRIVATE_KEY',
        'BLOCKCHAIN_RPC_URL'
    ];
    
    const missing = required.filter(key => {
        const value = process.env[key];
        return !value || value.includes('YOUR_') || value.includes('YOUR_INFURA_PROJECT_ID');
    });
    
    if (missing.length > 0) {
        console.log('❌ Missing or incomplete environment variables:');
        missing.forEach(key => {
            console.log(`   - ${key}`);
        });
        console.log('\n📝 Please update config.env with your testnet configuration:');
        console.log('   1. Get testnet ETH from a faucet:');
        console.log('      - Sepolia: https://sepoliafaucet.com/');
        console.log('      - Holesky: https://holesky-faucet.pk910.de/');
        console.log('   2. Set your private key in config.env');
        console.log('   3. Set your RPC URL (Infura, Alchemy, or public RPC)');
        console.log('\n🔗 Recommended RPC URLs:');
        console.log('   - https://rpc.sepolia.org (free)');
        console.log('   - https://sepolia.gateway.tenderly.co (free)');
        console.log('   - https://sepolia.infura.io/v3/YOUR_PROJECT_ID (Infura)');
        return false;
    }
    
    return true;
}

// Deploy contract to testnet
async function deployContract() {
    console.log('📦 Deploying smart contract to testnet...');
    
    try {
        const { execSync } = require('child_process');
        
        // Deploy to Holesky (or Sepolia as fallback)
        const network = process.env.BLOCKCHAIN_NETWORK === 'holesky' ? 'holesky' : 'sepolia';
        console.log(`🚀 Deploying to ${network} testnet...`);
        const output = execSync(`npx truffle migrate --network ${network} --reset`, { 
            encoding: 'utf8',
            stdio: 'pipe'
        });
        
        // Extract contract address from output
        const lines = output.split('\n');
        let contractAddress = null;
        
        for (const line of lines) {
            if (line.includes('contract address:')) {
                contractAddress = line.split('contract address:')[1].trim();
                break;
            }
        }
        
        if (contractAddress) {
            console.log(`✅ Contract deployed successfully!`);
            console.log(`📍 Contract Address: ${contractAddress}`);
            
            const explorerUrl = network === 'holesky' 
                ? `https://holesky.etherscan.io/address/${contractAddress}`
                : `https://sepolia.etherscan.io/address/${contractAddress}`;
            console.log(`🔍 View on Etherscan: ${explorerUrl}`);
            
            // Update config.env with new contract address
            updateConfigFile(contractAddress);
            
            return contractAddress;
        } else {
            throw new Error('Could not extract contract address from deployment output');
        }
        
    } catch (error) {
        console.error('❌ Contract deployment failed:', error.message);
        throw error;
    }
}

// Update config.env with contract address
function updateConfigFile(contractAddress) {
    try {
        const configPath = path.join(__dirname, 'config.env');
        let config = fs.readFileSync(configPath, 'utf8');
        
        // Update contract address
        config = config.replace(
            /CONTRACT_ADDRESS=.*/,
            `CONTRACT_ADDRESS=${contractAddress}`
        );
        
        fs.writeFileSync(configPath, config);
        console.log('✅ Updated config.env with contract address');
        
    } catch (error) {
        console.error('❌ Failed to update config.env:', error.message);
    }
}

// Main setup function
async function main() {
    try {
        // Check environment
        if (!checkEnvironment()) {
            process.exit(1);
        }
        
        console.log('✅ Environment configuration looks good!');
        console.log(`🔗 Using RPC: ${process.env.BLOCKCHAIN_RPC_URL}`);
        console.log(`💰 Account: ${process.env.PRIVATE_KEY ? '0x' + process.env.PRIVATE_KEY.slice(-8) : 'Not set'}`);
        console.log('');
        
        // Deploy contract
        const contractAddress = await deployContract();
        
        console.log('\n🎉 Testnet setup complete!');
        console.log('========================');
        console.log('✅ Smart contract deployed to Sepolia testnet');
        console.log('✅ Configuration updated');
        console.log('✅ Ready to use with MetaMask');
        console.log('\n📋 Next steps:');
        console.log('1. Start the server: node server.js');
        console.log('2. Open http://localhost:3000');
        console.log('3. Connect MetaMask to Sepolia testnet');
        console.log('4. Login with admin credentials');
        console.log('\n🔗 Useful links:');
        console.log(`- Contract: https://sepolia.etherscan.io/address/${contractAddress}`);
        console.log('- Sepolia Faucet: https://sepoliafaucet.com/');
        console.log('- MetaMask: https://metamask.io/');
        
    } catch (error) {
        console.error('\n❌ Setup failed:', error.message);
        process.exit(1);
    }
}

// Run setup
if (require.main === module) {
    main();
}

module.exports = { checkEnvironment, deployContract, updateConfigFile };
