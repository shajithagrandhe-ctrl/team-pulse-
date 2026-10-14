const mongoose = require('mongoose');
require('dotenv').config();

// Customer Schema
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

// Check phone number formats
async function checkPhoneNumbers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/venture_plus')
    console.log('Connected to MongoDB');

    // Get all customers
    const allCustomers = await Customer.find({});
    console.log('📋 Checking Phone Number Formats:');
    console.log('Required Format: +91 9876543210');
    console.log('Total customers:', allCustomers.length);
    
    allCustomers.forEach(customer => {
      console.log(`\n${customer.displayName}:`);
      console.log(`  Current Phone: ${customer.phoneNumber}`);
      
      // Check if phone number matches required format
      const requiredFormat = /^\+91 \d{10}$/;
      const isValid = requiredFormat.test(customer.phoneNumber);
      
      if (isValid) {
        console.log(`  ✅ Format: CORRECT`);
      } else {
        console.log(`  ❌ Format: INCORRECT - Should be +91 followed by 10 digits`);
        console.log(`  📝 Suggested: +91 ${customer.phoneNumber.replace(/\D/g, '').slice(-10).padStart(3, '+91')}`);
      }
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

checkPhoneNumbers();
