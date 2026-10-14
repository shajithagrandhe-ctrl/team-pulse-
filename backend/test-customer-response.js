// Test customer login to see exact response
const API_BASE_URL = 'http://localhost:3002/api';

async function testCustomerLogin() {
  try {
    console.log('Testing customer login...');
    
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'customer1@estatehub.com',
        password: 'Cust123'
      })
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Customer Login Response:');
      console.log(JSON.stringify(data, null, 2));
    } else {
      const error = await response.text();
      console.log('❌ Customer Login failed:', error);
    }
  } catch (error) {
    console.error('❌ Customer Login error:', error.message);
  }
}

testCustomerLogin();
