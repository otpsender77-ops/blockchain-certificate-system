const axios = require('axios');

async function monitorDeployment() {
  console.log('🔍 Monitoring Deployment Status...\n');
  
  const backendUrl = 'https://blockchain-certificate-system.onrender.com';
  const frontendUrl = 'https://blockchain-certificate-system.vercel.app';
  
  // Test backend health
  console.log('1. 🖥️  Testing Backend...');
  try {
    const healthResponse = await axios.get(`${backendUrl}/api/health`, { timeout: 10000 });
    console.log('✅ Backend Status:', healthResponse.data);
    console.log('✅ Backend URL:', backendUrl);
  } catch (error) {
    if (error.code === 'ECONNREFUSED' || error.response?.status === 503) {
      console.log('⏳ Backend is still starting up...');
      console.log('   This is normal - Render takes 2-3 minutes to deploy');
    } else {
      console.log('❌ Backend Error:', error.message);
    }
  }
  
  // Test frontend
  console.log('\n2. 🌐 Testing Frontend...');
  try {
    const frontendResponse = await axios.get(frontendUrl, { timeout: 10000 });
    console.log('✅ Frontend Status:', frontendResponse.status === 200 ? 'Online' : 'Error');
    console.log('✅ Frontend URL:', frontendUrl);
  } catch (error) {
    console.log('❌ Frontend Error:', error.message);
  }
  
  // Test verification endpoint
  console.log('\n3. 🔍 Testing Verification...');
  try {
    const verifyResponse = await axios.post(`${backendUrl}/api/verification/certificate-id`, {
      certificateId: 'DEIT20250034'
    }, { timeout: 10000 });
    console.log('✅ Verification Status:', verifyResponse.data.success ? 'Working' : 'Error');
  } catch (error) {
    if (error.code === 'ECONNREFUSED' || error.response?.status === 503) {
      console.log('⏳ Backend still starting - verification will work once backend is ready');
    } else {
      console.log('❌ Verification Error:', error.message);
    }
  }
  
  console.log('\n📊 Deployment Summary:');
  console.log('Frontend: https://blockchain-certificate-system.vercel.app');
  console.log('Backend: https://blockchain-certificate-backend.onrender.com');
  console.log('\n💡 If backend shows errors, wait 2-3 minutes and run this script again');
}

// Run monitoring
monitorDeployment().catch(console.error);
