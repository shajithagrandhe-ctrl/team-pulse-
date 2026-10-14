// Frontend Connection Test
console.log('🔍 Testing Frontend Connection to Backend...');
console.log('Backend URL:', 'http://localhost:3002');
console.log('Frontend URL:', 'http://localhost:8081');

// Test connection to backend
fetch('http://localhost:3002/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  body: JSON.stringify({
    email: 'customer1@estatehub.com',
    password: 'Cust123'
  })
})
.then(response => {
  console.log('✅ Frontend Connection Status:', response.status);
  if (response.ok) {
    return response.json();
  } else {
    throw new Error(`HTTP error! Status: ${response.status}`);
  }
})
.then(data => {
  console.log('✅ Login Response Received:');
  console.log('Customer Name:', data.data.user.displayName);
  console.log('Full Name:', data.data.user.fullName);
  console.log('Phone Number:', data.data.user.phoneNumber);
  console.log('Address:', data.data.user.address);
  console.log('Budget:', data.data.user.budget);
  console.log('User Type:', data.data.user.userType);
  console.log('✅ Customer login working from frontend!');
})
.catch(error => {
  console.error('❌ Frontend Connection Error:', error.message);
  console.log('❌ This indicates a frontend issue!');
  console.log('Possible causes:');
  console.log('- CORS issue');
  console.log('- Network connectivity');
  console.log('- Frontend configuration');
});
