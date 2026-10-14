const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Employee Schema
const employeeSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  displayName: { type: String, required: true },
  userType: { type: String, required: true, enum: ['admin', 'employee', 'customer'] },
  department: { type: String, required: true },
  position: { type: String, required: true },
  employeeId: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now }
});

const Employee = mongoose.model('Employee', employeeSchema);

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

// Customer Schema
const customerSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  displayName: { type: String, required: true },
  userType: { type: String, required: true, enum: ['admin', 'employee', 'customer'] },
  department: { type: String, required: true },
  position: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  lastLogin: { type: Date, default: Date.now },
  phone: { type: String },
  address: { type: String },
  budget: { type: String },
  interested: { type: Boolean, default: false },
  recordOwner: { type: String },
  notes: { type: String }
});

const Customer = mongoose.model('Customer', customerSchema);

// Employee data based on your frontend pages
const employees = [
  { 
    id: "emp001", 
    email: "john.employee@estatehub.com", 
    password: "Emp123", 
    displayName: "John Employee", 
    userType: "employee", 
    department: "Sales", 
    position: "Sales Executive", 
    employeeId: "EMP001"
  },
  { 
    id: "emp002", 
    email: "jane.employee@estatehub.com", 
    password: "Emp456", 
    displayName: "Jane Employee", 
    userType: "employee", 
    department: "Marketing", 
    position: "Marketing Executive", 
    employeeId: "EMP002"
  },
  { 
    id: "emp003", 
    email: "sarah.jones@estatehub.com", 
    password: "Emp789", 
    displayName: "Sarah Jones", 
    userType: "employee", 
    department: "Operations", 
    position: "Operations Manager", 
    employeeId: "EMP003"
  },
  { 
    id: "emp004", 
    email: "michael.brown@estatehub.com", 
    password: "Emp456", 
    displayName: "Michael Brown", 
    userType: "employee", 
    department: "Sales", 
    position: "Sales Manager", 
    employeeId: "EMP004"
  },
  { 
    id: "emp005", 
    email: "lisa.anderson@estatehub.com", 
    password: "Emp123", 
    displayName: "Lisa Anderson", 
    userType: "employee", 
    department: "HR", 
    position: "HR Manager", 
    employeeId: "EMP005"
  },
  { 
    id: "emp006", 
    email: "robert.smith@estatehub.com", 
    password: "Emp789", 
    displayName: "Robert Smith", 
    userType: "employee", 
    department: "IT", 
    position: "IT Manager", 
    employeeId: "EMP006"
  }
];

// Admin data based on your frontend admin page
const admins = [
  {
    id: "admin001",
    email: "admin@estatehub.com",
    password: "Admin123",
    displayName: "Super Admin",
    userType: "admin",
    department: "Administration",
    position: "Super Administrator"
  },
  {
    id: "admin002",
    email: "manager@estatehub.com",
    password: "Mgr123",
    displayName: "Operations Manager",
    userType: "admin",
    department: "Operations",
    position: "Operations Manager"
  },
  {
    id: "admin003",
    email: "hr@estatehub.com",
    password: "HR123",
    displayName: "HR Manager",
    userType: "admin",
    department: "Human Resources",
    position: "HR Manager"
  }
];

// Customer data based on your frontend customer page
const customers = [
  {
    id: "cust001",
    email: "customer1@estatehub.com",
    password: "Cust123",
    displayName: "Rajesh Kumar",
    userType: "customer",
    department: "Sales",
    position: "Customer",
    phone: "+91 9876543210",
    address: "123 Main Street, Bhogapuram, Visakhapatnam",
    budget: "₹15,00,000",
    interested: true,
    recordOwner: "John Employee",
    notes: "Interested in 200 sq yards plot"
  },
  {
    id: "cust002",
    email: "customer2@estatehub.com",
    password: "Cust456",
    displayName: "Sunita Devi",
    userType: "customer",
    department: "Sales",
    position: "Customer",
    phone: "+91 9876543211",
    address: "456 Park Road, Gajuwaka, Visakhapatnam",
    budget: "₹20,00,000",
    interested: false,
    recordOwner: "Jane Employee",
    notes: "Not interested at this time"
  },
  {
    id: "cust003",
    email: "customer3@estatehub.com",
    password: "Cust789",
    displayName: "Mohan Rao",
    userType: "customer",
    department: "Sales",
    position: "Customer",
    phone: "+91 9876543212",
    address: "789 Temple Street, Aganampudi, Visakhapatnam",
    budget: "₹12,00,000",
    interested: true,
    recordOwner: "Sarah Jones",
    notes: "Very interested in the property"
  },
  {
    id: "cust004",
    email: "customer4@estatehub.com",
    password: "Cust012",
    displayName: "Priya Sharma",
    userType: "customer",
    department: "Sales",
    position: "Customer",
    phone: "+91 9876543213",
    address: "321 Beach Road, Visakhapatnam",
    budget: "₹18,00,000",
    interested: true,
    recordOwner: "Michael Brown",
    notes: "Looking for 3BHK apartment"
  },
  {
    id: "cust005",
    email: "customer5@estatehub.com",
    password: "Cust345",
    displayName: "Venkat Rao",
    userType: "customer",
    department: "Sales",
    position: "Customer",
    phone: "+91 9876543214",
    address: "654 Hill Station Road, Visakhapatnam",
    budget: "₹25,00,000",
    interested: false,
    recordOwner: "Lisa Anderson",
    notes: "Still considering options"
  }
];

// Function to seed all data
async function seedAllData() {
  console.log('🌱️ Starting data seeding...');
  
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/venture_plus')
    console.log('Connected to MongoDB');

    // Clear existing data
    await Employee.deleteMany({});
    await Admin.deleteMany({});
    await Customer.deleteMany({});
    console.log('Cleared existing data');

    // Hash passwords and create employees
    for (const employee of employees) {
      const hashedPassword = await bcrypt.hash(employee.password, 10);
      
      const newEmployee = new Employee({
        ...employee,
        password: hashedPassword,
        createdAt: new Date()
      });

      await newEmployee.save();
      console.log(`Created employee: ${employee.displayName} (${employee.employeeId})`);
    }

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

    // Hash passwords and create customers
    for (const customer of customers) {
      const hashedPassword = await bcrypt.hash(customer.password, 10);
      
      const newCustomer = new Customer({
        ...customer,
        password: hashedPassword,
        createdAt: new Date(),
        lastLogin: new Date()
      });

      await newCustomer.save();
      console.log(`Created customer: ${customer.displayName} (${customer.id})`);
    }

    console.log(`✅ Successfully seeded: ${employees.length} employees, ${admins.length} admins, ${customers.length} customers`);
    
    console.log('\n📋 Login Credentials Summary:');
    console.log('\n🏢 ADMIN CREDENTIALS:');
    admins.forEach(admin => {
      console.log(`${admin.displayName} - ${admin.email} | Password: ${admin.password}`);
    });
    
    console.log('\n👥 EMPLOYEE CREDENTIALS:');
    employees.forEach(employee => {
      console.log(`${employee.displayName} - ${employee.email} | Password: ${employee.password} | ID: ${employee.employeeId}`);
    });
    
    console.log('\n🏠 CUSTOMER CREDENTIALS:');
    customers.forEach(customer => {
      console.log(`${customer.displayName} - ${customer.email} | Password: ${customer.password} | Budget: ${customer.budget}`);
    });
    
  } catch (error) {
    console.error('Error seeding data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the seeding function
seedAllData();
