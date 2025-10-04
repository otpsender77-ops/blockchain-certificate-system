const axios = require('axios');

async function testDeployment() {
  console.log('🧪 Testing Deployment...\n');
  
  // Test backend health
  try {
    console.log('1. Testing Backend Health...');
    const healthResponse = await axios.get('https://blockchain-certificate-backend.onrender.com/api/health');
    console.log('✅ Backend Health:', healthResponse.data);
  } catch (error) {
    console.log('❌ Backend Health Failed:', error.message);
  }
  
  // Test verification endpoint
  try {
    console.log('\n2. Testing Verification Endpoint...');
    const verifyResponse = await axios.post('https://blockchain-certificate-backend.onrender.com/api/verification/certificate-id', {
      certificateId: 'DEIT20250034'
    });
    console.log('✅ Verification Test:', verifyResponse.data);
  } catch (error) {
    console.log('❌ Verification Test Failed:', error.message);
  }
  
  // Test frontend accessibility
  try {
    console.log('\n3. Testing Frontend...');
    const frontendResponse = await axios.get('https://blockchain-certificate-system.vercel.app');
    console.log('✅ Frontend Accessible:', frontendResponse.status === 200 ? 'Yes' : 'No');
  } catch (error) {
    console.log('❌ Frontend Test Failed:', error.message);
  }
  
  console.log('\n🎉 Deployment test completed!');
}

// Run test
testDeployment().catch(console.error);
