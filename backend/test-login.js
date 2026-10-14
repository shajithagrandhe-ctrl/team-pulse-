const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Admin Schema
const adminSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  displayName: { type: String, required: true },
  fullName: { type: String, required: true },
  adminCode: { type: String, required: true, unique: true },
  userType: { type: String, required: true, enum: ['admin', 'employee', 'customer'] },
  department: { type: String, required: true },
  position: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const Admin = mongoose.model('Admin', adminSchema);

// Test login function
async function testLogin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/venture_plus')
    console.log('Connected to MongoDB');

    // Test admin login
    const admin = await Admin.findOne({ email: 'admin@estatehub.com' });
    
    if (admin) {
      console.log('✅ Admin found, testing password...');
      
      const isPasswordValid = await bcrypt.compare('Admin123', admin.password);
      
      if (isPasswordValid) {
        console.log('✅ Password is correct!');
        console.log('Login should work with:');
        console.log('Email: admin@estatehub.com');
        console.log('Password: Admin123');
        console.log('FullName:', admin.fullName);
        console.log('AdminCode:', admin.adminCode);
      } else {
        console.log('❌ Password is incorrect!');
      }
    } else {
      console.log('❌ Admin not found');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

testLogin();
