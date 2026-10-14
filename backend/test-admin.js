const mongoose = require('mongoose');
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

// Test function to check admin data
async function testAdminData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/venture_plus')
    console.log('Connected to MongoDB');

    // List all admins
    const allAdmins = await Admin.find({});
    console.log('✅ All Admins in Database:');
    console.log('Total admins:', allAdmins.length);
    
    allAdmins.forEach(admin => {
      console.log(`\n${admin.displayName}:`);
      console.log(`  Email: ${admin.email}`);
      console.log(`  Password: ${admin.password.replace(/./g, '*')}`);
      console.log(`  Full Name: ${admin.fullName}`);
      console.log(`  Admin Code: ${admin.adminCode}`);
      console.log(`  Department: ${admin.department}`);
      console.log(`  Position: ${admin.position}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

testAdminData();
