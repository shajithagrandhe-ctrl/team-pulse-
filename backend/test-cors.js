// Test CORS and API from frontend perspective
const API_BASE_URL = 'http://localhost:3002/api';

async function testFromFrontend() {
  try {
    console.log('Testing API from frontend perspective...');
    
    // Test with CORS headers
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Origin': 'http://localhost:8081'
      },
      body: JSON.stringify({
        email: 'admin@estatehub.com',
        password: 'Admin123'
      })
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Frontend API Login successful!');
      console.log('User data:', {
        email: data.data.user.email,
        fullName: data.data.user.fullName,
        adminCode: data.data.user.adminCode,
        userType: data.data.user.userType
      });
    } else {
      const error = await response.text();
      console.log('❌ Frontend API Login failed:', error);
    }
  } catch (error) {
    console.error('❌ Frontend API Connection error:', error.message);
  }
}

testFromFrontend();
