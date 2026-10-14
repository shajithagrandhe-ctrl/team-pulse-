// Simple API test
const API_BASE_URL = 'http://localhost:3002/api';

async function testAPI() {
  try {
    console.log('Testing API...');
    
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'customer1@estatehub.com',
        password: 'Cust123'
      })
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ API Response:', JSON.stringify(data, null, 2));
    } else {
      console.log('❌ API Error:', response.status, response.statusText);
    }
  } catch (error) {
    console.error('❌ Connection Error:', error.message);
  }
}

testAPI();
