// Test customer login with updated fields
const API_BASE_URL = 'http://localhost:3002/api';

async function testCustomerLogin() {
  try {
    console.log('Testing customer login with updated fields...');
    
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
      console.log('✅ Customer Login successful!');
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
    } else {
      const error = await response.text();
      console.log('❌ Customer Login failed:', error);
    }
  } catch (error) {
    console.error('❌ Customer Login error:', error.message);
  }
}

testCustomerLogin();
