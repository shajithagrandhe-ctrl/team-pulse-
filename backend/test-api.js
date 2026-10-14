// Test API connection
const API_BASE_URL = 'http://localhost:3002/api';

async function testAPIConnection() {
  try {
    console.log('Testing API connection...');
    
    // Test login endpoint
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@estatehub.com',
        password: 'Admin123'
      })
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ API Login successful!');
      console.log('Response:', JSON.stringify(data, null, 2));
    } else {
      const error = await response.text();
      console.log('❌ API Login failed:', error);
    }
  } catch (error) {
    console.error('❌ API Connection error:', error.message);
  }
}

testAPIConnection();
