const axios = require('axios');

async function testVercelBackend() {
  console.log('🧪 Testing Vercel Backend Deployment...\n');
  
  // You'll need to replace this with your actual Vercel backend URL
  const backendUrl = 'https://blockchain-certificate-backend.vercel.app';
  
  console.log(`🔗 Testing: ${backendUrl}\n`);
  
  // Test 1: Health Check
  console.log('1. 🏥 Health Check...');
  try {
    const healthResponse = await axios.get(`${backendUrl}/api/health`, { timeout: 10000 });
    console.log('✅ Health Check:', healthResponse.data);
  } catch (error) {
    console.log('❌ Health Check Failed:', error.message);
    return;
  }
  
  // Test 2: Certificate Verification
  console.log('\n2. 🔍 Certificate Verification...');
  try {
    const verifyResponse = await axios.post(`${backendUrl}/api/verification/certificate-id`, {
      certificateId: 'DEIT20250034'
    }, { timeout: 10000 });
    console.log('✅ Verification:', verifyResponse.data.success ? 'Working' : 'Error');
  } catch (error) {
    console.log('❌ Verification Failed:', error.message);
  }
  
  // Test 3: Frontend Connection
  console.log('\n3. 🌐 Frontend Connection Test...');
  try {
    const frontendResponse = await axios.get('https://blockchain-certificate-system.vercel.app', { timeout: 10000 });
    console.log('✅ Frontend Status:', frontendResponse.status === 200 ? 'Online' : 'Error');
  } catch (error) {
    console.log('❌ Frontend Connection Failed:', error.message);
  }
  
  console.log('\n🎉 Backend Deployment Test Complete!');
  console.log(`📊 Backend URL: ${backendUrl}`);
  console.log('📊 Frontend URL: https://blockchain-certificate-system.vercel.app');
  
  console.log('\n💡 If all tests pass, your system is fully deployed and working!');
}

// Run the test
testVercelBackend().catch(console.error);
