// Test API from frontend perspective
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
        email: 'customer1@estatehub.com',
        password: 'Cust123'
      })
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Frontend API Login successful!');
      console.log('Customer Data:');
      console.log('Email:', data.data.user.email);
      console.log('DisplayName:', data.data.user.displayName);
      console.log('FullName:', data.data.user.fullName);
      console.log('PhoneNumber:', data.data.user.phoneNumber);
      console.log('Address:', data.data.user.address);
      console.log('Budget:', data.data.user.budget);
      console.log('UserType:', data.data.user.userType);
      console.log('Interested:', data.data.user.interested);
      console.log('Record Owner:', data.data.user.recordOwner);
      
      // Check if all required fields are present
      const requiredFields = ['email', 'displayName', 'fullName', 'phoneNumber', 'address'];
      const missingFields = requiredFields.filter(field => !data.data.user[field]);
      
      if (missingFields.length === 0) {
        console.log('✅ All required fields are present!');
      } else {
        console.log('❌ Missing fields:', missingFields);
      }
      
    } else {
      const error = await response.text();
      console.log('❌ Frontend API Login failed:', error);
    }
  } catch (error) {
    console.error('❌ Frontend API Connection error:', error.message);
  }
}

testFromFrontend();
