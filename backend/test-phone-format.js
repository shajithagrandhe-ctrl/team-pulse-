// Test phone number format in login response
const API_BASE_URL = 'http://localhost:3002/api';

async function testPhoneNumberFormat() {
  try {
    console.log('Testing phone number format in login response...');
    
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
      console.log('Phone Number:', data.data.user.phoneNumber);
      console.log('Phone Field:', data.data.user.phone);
      
      // Check format
      const requiredFormat = /^\+91 \d{10}$/;
      const isValid = requiredFormat.test(data.data.user.phoneNumber);
      
      console.log('Format Validation:', isValid ? '✅ CORRECT' : '❌ INCORRECT');
      
      if (isValid) {
        console.log('✅ Phone number is in correct format: +91 9876543210');
      } else {
        console.log('❌ Phone number format is incorrect');
      }
      
    } else {
      const error = await response.text();
      console.log('❌ Login failed:', error);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testPhoneNumberFormat();
