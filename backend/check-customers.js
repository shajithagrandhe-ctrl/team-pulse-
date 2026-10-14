const mongoose = require('mongoose');
require('dotenv').config();

// Customer Schema (matching backend)
const customerSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  displayName: { type: String, required: true },
  fullName: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  address: { type: String, required: true },
  userType: { type: String, required: true, enum: ['admin', 'employee', 'customer'] },
  department: { type: String, required: true },
  position: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  lastLogin: { type: Date, default: Date.now },
  phone: { type: String },
  budget: { type: String },
  interested: { type: Boolean, default: false },
  recordOwner: { type: String },
  notes: { type: String }
});

const Customer = mongoose.model('Customer', customerSchema);

// Test function to check current customer data
async function checkCustomerData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/venture_plus')
    console.log('Connected to MongoDB');

    // Check all customers in database
    const allCustomers = await Customer.find({});
    console.log('✅ Current Customers in Database:');
    console.log('Total customers:', allCustomers.length);
    
    allCustomers.forEach(customer => {
      console.log(`\n${customer.displayName}:`);
      console.log(`  ID: ${customer.id}`);
      console.log(`  Email: ${customer.email}`);
      console.log(`  Password: ${customer.password.replace(/./g, '*')}`);
      console.log(`  Full Name: ${customer.fullName || 'NOT SET'}`);
      console.log(`  Phone Number: ${customer.phoneNumber || 'NOT SET'}`);
      console.log(`  Address: ${customer.address || 'NOT SET'}`);
      console.log(`  Budget: ${customer.budget || 'NOT SET'}`);
      console.log(`  Interested: ${customer.interested}`);
      console.log(`  Record Owner: ${customer.recordOwner || 'NOT SET'}`);
      console.log(`  User Type: ${customer.userType}`);
      console.log(`  Department: ${customer.department}`);
      console.log(`  Position: ${customer.position}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

checkCustomerData();
