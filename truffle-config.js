const HDWalletProvider = require('@truffle/hdwallet-provider');
require('dotenv').config({ path: './config.env' });

module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",
      port: 8545,
      network_id: "1337", // Match Ganache network ID
      gas: 6721975,
      gasPrice: 20000000000,
    },
    ganache: {
      host: "127.0.0.1",
      port: 8545,
      network_id: 1337,
      gas: 6721975,
      gasPrice: 20000000000,
    },
    sepolia: {
      provider: () => new HDWalletProvider(
        process.env.PRIVATE_KEY,
        process.env.BLOCKCHAIN_RPC_URL
      ),
      network_id: 11155111,
      gas: 3000000,
      gasPrice: 20000000000,
      confirmations: 2,
      timeoutBlocks: 200,
      skipDryRun: true
    },
    holesky: {
      provider: () => new HDWalletProvider(
        process.env.PRIVATE_KEY,
        'https://ethereum-holesky.publicnode.com'
      ),
      network_id: 17000,
      gas: 3000000,
      gasPrice: 20000000000,
      confirmations: 2,
      timeoutBlocks: 200,
      skipDryRun: true
    }
  },

  // Configure your compilers
  compilers: {
    solc: {
      version: "0.8.19", // Fetch exact version from solc-bin (default: truffle's version)
      settings: {
        optimizer: {
          enabled: true,
          runs: 200
        }
      }
    }
  },

  // Truffle DB is currently disabled by default; to enable it, change enabled: false to enabled: true
  db: {
    enabled: false
  }
};
