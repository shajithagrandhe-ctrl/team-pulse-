const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Admin Schema
const adminSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  displayName: { type: String, required: true },
  userType: { type: String, required: true, enum: ['admin', 'employee', 'customer'] },
  department: { type: String, required: true },
  position: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const Admin = mongoose.model('Admin', adminSchema);

// Admin data
const admins = [
  {
    id: "admin001",
    email: "admin@estatehub.com",
    password: "Admin123",
    displayName: "System Administrator",
    userType: "admin",
    department: "Administration",
    position: "System Admin",
    createdAt: new Date('2024-02-27T00:00:00.000Z')
  },
  {
    id: "admin002", 
    email: "manager@estatehub.com",
    password: "Mgr123",
    displayName: "Operations Manager",
    userType: "admin",
    department: "Operations",
    position: "Operations Manager",
    createdAt: new Date('2024-02-27T00:00:00.000Z')
  },
  {
    id: "admin003",
    email: "hr@estatehub.com",
    password: "HR123",
    displayName: "HR Manager",
    userType: "admin",
    department: "Human Resources",
    position: "HR Manager",
    createdAt: new Date('2024-02-27T00:00:00.000Z')
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
      console.log(`Created admin: ${admin.displayName} (${admin.id})`);
    }

    console.log(`Successfully seeded ${admins.length} admins`);
    
    // Display admin summary
    const departments = {
      'Administration': admins.filter(a => a.department === 'Administration').length,
      'Operations': admins.filter(a => a.department === 'Operations').length,
      'Human Resources': admins.filter(a => a.department === 'Human Resources').length
    };

    console.log('\nAdmin Department Summary:');
    Object.entries(departments).forEach(([dept, count]) => {
      console.log(`${dept}: ${count} admins`);
    });

    console.log('\nLogin Credentials:');
    admins.forEach(admin => {
      console.log(`${admin.displayName} - ${admin.email} | Password: ${admin.password} | ID: ${admin.id}`);
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
