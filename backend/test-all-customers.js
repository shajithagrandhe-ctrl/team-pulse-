// Test all customer credentials
const API_BASE_URL = 'http://localhost:3002/api';

const customerCredentials = [
  { email: 'customer1@estatehub.com', password: 'Cust123', name: 'Rajesh Kumar Reddy' },
  { email: 'customer2@estatehub.com', password: 'Cust456', name: 'Sunita Devi Sharma' },
  { email: 'customer3@estatehub.com', password: 'Cust789', name: 'Mohan Rao Naidu' },
  { email: 'customer4@estatehub.com', password: 'Cust012', name: 'Priya Sharma Reddy' },
  { email: 'customer5@estatehub.com', password: 'Cust345', name: 'Venkat Rao Murthy' },
  { email: 'customer6@estatehub.com', password: 'Cust678', name: 'Anjali Gupta Sharma' },
  { email: 'customer7@estatehub.com', password: 'Cust901', name: 'David Wilson Thomas' }
];

async function testAllCustomers() {
  console.log('🧪 Testing All Customer Credentials...\n');
  
  for (const customer of customerCredentials) {
    try {
      console.log(`Testing: ${customer.name}`);
      
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: customer.email,
          password: customer.password
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`✅ SUCCESS: ${customer.name}`);
        console.log(`   Email: ${data.data.user.email}`);
        console.log(`   Full Name: ${data.data.user.fullName}`);
        console.log(`   Phone Number: ${data.data.user.phoneNumber}`);
        console.log(`   Address: ${data.data.user.address}`);
        console.log(`   Budget: ${data.data.user.budget}`);
        console.log(`   User Type: ${data.data.user.userType}`);
      } else {
        console.log(`❌ FAILED: ${customer.name} - ${response.status}`);
      }
    } catch (error) {
      console.log(`❌ ERROR: ${customer.name} - ${error.message}`);
    }
    console.log(''); // Empty line for separation
  }
  
  console.log('✅ Customer credentials test completed!');
}

testAllCustomers();
