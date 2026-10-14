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

// Admin data based on your admin page image
const admins = [
  {
    id: "admin001",
    email: "admin@estatehub.com",
    password: "Admin123",
    displayName: "Super Admin",
    fullName: "Super Administrator",
    adminCode: "ADMIN2024",
    userType: "admin",
    department: "Administration",
    position: "Super Administrator"
  },
  {
    id: "admin002",
    email: "manager@estatehub.com",
    password: "Mgr123",
    displayName: "Operations Manager",
    fullName: "Operations Manager",
    adminCode: "ADMIN2025",
    userType: "admin",
    department: "Operations",
    position: "Operations Manager"
  },
  {
    id: "admin003",
    email: "hr@estatehub.com",
    password: "HR123",
    displayName: "HR Manager",
    fullName: "HR Manager",
    adminCode: "ADMIN2026",
    userType: "admin",
    department: "Human Resources",
    position: "HR Manager"
  },
  {
    id: "admin004",
    email: "finance@estatehub.com",
    password: "Fin123",
    displayName: "Finance Manager",
    fullName: "Finance Manager",
    adminCode: "ADMIN2027",
    userType: "admin",
    department: "Finance",
    position: "Finance Manager"
  },
  {
    id: "admin005",
    email: "marketing@estatehub.com",
    password: "Mkt123",
    displayName: "Marketing Manager",
    fullName: "Marketing Manager",
    adminCode: "ADMIN2028",
    userType: "admin",
    department: "Marketing",
    position: "Marketing Manager"
  },
  {
    id: "admin006",
    email: "it@estatehub.com",
    password: "IT123",
    displayName: "IT Manager",
    fullName: "IT Manager",
    adminCode: "ADMIN2029",
    userType: "admin",
    department: "IT",
    position: "IT Manager"
  }
];

// Function to seed admins
async function seedAdmins() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/venture_plus')
    console.log('Connected to MongoDB');

    // Clear existing admins
    await Admin.deleteMany({});
    console.log('Cleared existing admins');

    // Hash passwords and create admins
    for (const admin of admins) {
      const hashedPassword = await bcrypt.hash(admin.password, 10);
      
      const newAdmin = new Admin({
        ...admin,
        password: hashedPassword,
        createdAt: new Date()
      });

      await newAdmin.save();
      console.log(`Created admin: ${admin.displayName} (${admin.email})`);
    }

    console.log(`Successfully seeded ${admins.length} admins`);
    
    console.log('\n📋 Admin Login Credentials:');
    admins.forEach(admin => {
      console.log(`${admin.displayName} - ${admin.email} | Password: ${admin.password}`);
    });

  } catch (error) {
    console.error('Error seeding admins:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the seeding function
seedAdmins();
