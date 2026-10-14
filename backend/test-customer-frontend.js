// Test customer login with frontend
console.log('🔍 Testing Customer Login with Frontend Integration...');

// Test the exact credentials that should work
const customerTest = {
  email: 'customer1@estatehub.com',
  password: 'Cust123',
  userType: 'customer'
};

fetch('http://localhost:3002/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(customerTest)
})
.then(response => {
  console.log('✅ Backend Response Status:', response.status);
  if (response.ok) {
    return response.json();
  } else {
    throw new Error(`HTTP error! Status: ${response.status}`);
  }
})
.then(data => {
  console.log('✅ Customer Login Successful!');
  console.log('Customer Details:');
  console.log('Email:', data.data.user.email);
  console.log('Display Name:', data.data.user.displayName);
  console.log('Full Name:', data.data.user.fullName);
  console.log('Phone Number:', data.data.user.phoneNumber);
  console.log('Address:', data.data.user.address);
  console.log('Budget:', data.data.user.budget);
  console.log('User Type:', data.data.user.userType);
  console.log('Department:', data.data.user.department);
  console.log('Position:', data.data.user.position);
  console.log('✅ Frontend should now be able to login with these credentials!');
})
.catch(error => {
  console.error('❌ Login Error:', error.message);
  console.log('❌ This indicates a backend issue!');
});
