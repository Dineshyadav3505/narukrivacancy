const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api/v1/payment'; // Adjust port if needed

async function testPaymentSystem() {
  console.log('🔍 Testing Payment System...\n');

  try {
    // Test 1: Debug endpoint
    console.log('1. Testing debug endpoint...');
    const debugResponse = await axios.get(`${BASE_URL}/debug`);
    console.log('✅ Debug endpoint response:');
    console.log(JSON.stringify(debugResponse.data, null, 2));
    console.log('\n');

    // Test 2: Make a test payment
    console.log('2. Testing payment initialization...');
    const paymentData = {
      phone: '9876543210', // Test phone number
      amount: 100 // Test amount in INR
    };

    const paymentResponse = await axios.post(`${BASE_URL}/initialize-payment`, paymentData);
    console.log('✅ Payment initialization response:');
    console.log(JSON.stringify(paymentResponse.data, null, 2));

  } catch (error) {
    console.error('❌ Error occurred:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Message:', error.message);
    }
  }
}

// Run the test
testPaymentSystem(); 