const fs = require('fs').promises;
const path = require('path');
const https = require('https');
const http = require('http');
const axios = require('axios');

class IPFSService {
  constructor() {
    this.gatewayUrl = 'https://ipfs.io/ipfs/';
    this.pinataApiKey = process.env.PINATA_API_KEY || null;
    this.pinataSecretKey = process.env.PINATA_SECRET_KEY || null;
    this.ipfsNode = null;
    this.isInitialized = false;
  }

  async initialize() {
    try {
      // Check if Pinata credentials are available
      if (this.pinataApiKey && this.pinataSecretKey) {
        // Test Pinata connection
        try {
          const response = await axios.get('https://api.pinata.cloud/data/testAuthentication', {
            headers: {
              'pinata_api_key': this.pinataApiKey,
              'pinata_secret_api_key': this.pinataSecretKey
            }
          });
          
          if (response.status === 200) {
            console.log('✅ IPFS service initialized (Pinata)');
            console.log(`   Pinata API Key: ${this.pinataApiKey.substring(0, 8)}...`);
            this.pinataEnabled = true;
          } else {
            throw new Error('Pinata authentication failed');
          }
        } catch (pinataError) {
          console.log('⚠️ Pinata authentication failed, using mock mode');
          this.pinataEnabled = false;
        }
      } else {
        console.log('⚠️ Pinata credentials not provided, using mock mode');
        this.pinataEnabled = false;
      }
      
      this.isInitialized = true;
      console.log('✅ IPFS service initialized');
    } catch (error) {
      console.error('❌ IPFS service initialization failed:', error);
      // Don't throw error, just use mock mode
      this.isInitialized = true;
      this.pinataEnabled = false;
      console.log('✅ IPFS service initialized (mock mode)');
    }
  }

  async checkLocalIPFSNode() {
    return new Promise((resolve, reject) => {
      const req = http.get('http://localhost:5001/api/v0/id', (res) => {
        if (res.statusCode === 200) {
          this.ipfsNode = { url: 'http://localhost:5001' };
          resolve();
        } else {
          reject(new Error('Local IPFS node not responding'));
        }
      });
      
      req.on('error', (err) => {
        reject(err);
      });
      
      req.setTimeout(3000, () => {
        req.destroy();
        reject(new Error('Local IPFS node timeout'));
      });
    });
  }

  async uploadToIPFS(filePath, fileName) {
    try {
      if (!this.isInitialized) {
        throw new Error('IPFS service not initialized');
      }

      // Read the file
      const fileBuffer = await fs.readFile(filePath);
      
      if (this.pinataEnabled) {
        // Use Pinata for real IPFS upload
        return await this.uploadToPinata(filePath, fileName);
      } else {
        // Generate mock hash for testing
        const mockHash = this.generateMockHash(fileName);
        console.log(`📁 File uploaded to IPFS (mock): ${fileName} -> ${mockHash}`);
        
        return {
          hash: mockHash,
          url: `${this.gatewayUrl}${mockHash}`,
          size: fileBuffer.length
        };
      }
    } catch (error) {
      console.error('❌ Failed to upload to IPFS:', error);
      throw error;
    }
  }

  async uploadToLocalIPFS(fileBuffer, fileName) {
    return new Promise((resolve, reject) => {
      const FormData = require('form-data');
      const form = new FormData();
      form.append('file', fileBuffer, { filename: fileName });

      const options = {
        hostname: 'localhost',
        port: 5001,
        path: '/api/v0/add',
        method: 'POST',
        headers: form.getHeaders()
      };

      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          try {
            const result = JSON.parse(data);
            const hash = result.Hash;
            console.log(`📁 File uploaded to IPFS: ${fileName} -> ${hash}`);
            
            resolve({
              hash: hash,
              url: `${this.gatewayUrl}${hash}`,
              size: fileBuffer.length
            });
          } catch (parseError) {
            reject(new Error('Failed to parse IPFS response'));
          }
        });
      });

      req.on('error', (err) => {
        reject(err);
      });

      form.pipe(req);
    });
  }

  async uploadCertificateToIPFS(certificatePath) {
    try {
      const fileName = path.basename(certificatePath);
      const result = await this.uploadToIPFS(certificatePath, fileName);
      
      console.log(`📄 Certificate uploaded to IPFS: ${result.url}`);
      return result;
    } catch (error) {
      console.error('❌ Failed to upload certificate to IPFS:', error);
      throw error;
    }
  }

  async retrieveFromIPFS(hash) {
    try {
      if (!this.isInitialized) {
        throw new Error('IPFS service not initialized');
      }

      // Try multiple IPFS gateways for better reliability
      const gateways = this.pinataEnabled 
        ? [
            `https://ipfs.io/ipfs/${hash}`,
            `https://gateway.pinata.cloud/ipfs/${hash}`,
            `https://dweb.link/ipfs/${hash}`,
            `https://${hash}.ipfs.dweb.link`
          ]
        : [`${this.gatewayUrl}${hash}`];
      
      console.log(`📥 Retrieving from IPFS: ${gateways[0]}`);
      
      // Try each gateway until one works
      for (const url of gateways) {
        try {
          console.log(`🔄 Trying gateway: ${url}`);
          const response = await axios.get(url, {
            responseType: 'arraybuffer',
            timeout: 15000,
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
          });
          
          const fileBuffer = Buffer.from(response.data);
          
          // Check if we got actual PDF data (not a challenge page)
          if (fileBuffer.length > 1000 && fileBuffer.toString('utf8', 0, 4) === '%PDF') {
            console.log(`✅ Successfully retrieved from: ${url}`);
            return {
              url: url,
              hash: hash,
              data: fileBuffer,
              size: fileBuffer.length
            };
          } else {
            console.warn(`⚠️ Gateway returned non-PDF data: ${url}`);
          }
        } catch (fetchError) {
          console.warn(`⚠️ Gateway failed: ${url} - ${fetchError.message}`);
          continue;
        }
      }
      
      // If all gateways failed, return the first URL
      console.warn('⚠️ All gateways failed, returning URL only');
      return {
        url: gateways[0],
        hash: hash
      };
    } catch (error) {
      console.error('❌ Failed to retrieve from IPFS:', error);
      throw error;
    }
  }

  generateMockHash(fileName) {
    // Generate a mock IPFS hash for testing
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    return `Qm${random}${timestamp.toString(36)}${fileName.replace(/[^a-zA-Z0-9]/g, '')}`;
  }

  // Method to upload using Pinata (if configured)
  async uploadToPinata(filePath, fileName) {
    if (!this.pinataApiKey || !this.pinataSecretKey) {
      throw new Error('Pinata API keys not configured');
    }

    try {
      const FormData = require('form-data');
      const form = new FormData();
      
      const fileBuffer = await fs.readFile(filePath);
      form.append('file', fileBuffer, {
        filename: fileName,
        contentType: 'application/pdf'
      });
      
      form.append('pinataMetadata', JSON.stringify({
        name: fileName,
        keyvalues: {
          type: 'certificate',
          timestamp: new Date().toISOString()
        }
      }));

      const response = await axios.post('https://api.pinata.cloud/pinning/pinFileToIPFS', form, {
        headers: {
          'pinata_api_key': this.pinataApiKey,
          'pinata_secret_api_key': this.pinataSecretKey,
          ...form.getHeaders()
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      });

      if (response.status === 200) {
        const { IpfsHash, PinSize } = response.data;
        const gatewayUrl = `https://gateway.pinata.cloud/ipfs/${IpfsHash}`;
        
        console.log(`📁 File uploaded to Pinata: ${fileName} -> ${IpfsHash}`);
        console.log(`   Pinata Gateway: ${gatewayUrl}`);
        console.log(`   Size: ${PinSize} bytes`);
        
        return {
          hash: IpfsHash,
          url: gatewayUrl,
          size: PinSize
        };
      } else {
        throw new Error(`Pinata upload failed with status: ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Pinata upload failed:', error);
      throw error;
    }
  }

  isConnected() {
    return this.isInitialized;
  }
}

module.exports = new IPFSService();
