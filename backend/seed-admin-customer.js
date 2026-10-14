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

// Employee data (from previous seed)
const employees = [
  // Sales Department
  { id: "emp001", email: "john.employee@estatehub.com", password: "Emp123", displayName: "John Employee", userType: "employee", department: "Sales Department", position: "Executive", employeeId: "EMP001" },
  { id: "emp003", email: "robert.smith@estatehub.com", password: "Rob789", displayName: "Robert Smith", userType: "employee", department: "Sales Department", position: "Senior Executive", employeeId: "EMP003" },
  { id: "emp005", email: "michael.brown@estatehub.com", password: "Mic456", displayName: "Michael Brown", userType: "employee", department: "Sales Department", position: "Executive", employeeId: "EMP005" },
  { id: "emp008", email: "lisa.anderson@estatehub.com", password: "Lis456", displayName: "Lisa Anderson", userType: "employee", department: "Sales Department", position: "Team Lead", employeeId: "EMP008" },
  { id: "emp011", email: "christopher.lee@estatehub.com", password: "Chr456", displayName: "Christopher Lee", userType: "employee", department: "Sales Department", position: "Senior Executive", employeeId: "EMP011" },
  { id: "emp014", email: "susan.clark@estatehub.com", password: "Sus456", displayName: "Susan Clark", userType: "employee", department: "Sales Department", position: "Executive", employeeId: "EMP014" },
  { id: "emp017", email: "thomas.hall@estatehub.com", password: "Tho456", displayName: "Thomas Hall", userType: "employee", department: "Sales Department", position: "Manager", employeeId: "EMP017" },
  { id: "emp020", email: "lisa.king@estatehub.com", password: "Lis456", displayName: "Lisa King", userType: "employee", department: "Sales Department", position: "Director", employeeId: "EMP020" },

  // Marketing Department
  { id: "emp002", email: "jane.employee@estatehub.com", password: "Emp456", displayName: "Jane Employee", userType: "employee", department: "Marketing Department", position: "Manager", employeeId: "EMP002" },
  { id: "emp006", email: "emily.davis@estatehub.com", password: "Emi789", displayName: "Emily Davis", userType: "employee", department: "Marketing Department", position: "Executive", employeeId: "EMP006" },
  { id: "emp009", email: "james.taylor@estatehub.com", password: "Jam789", displayName: "James Taylor", userType: "employee", department: "Marketing Department", position: "Manager", employeeId: "EMP009" },
  { id: "emp012", email: "nancy.white@estatehub.com", password: "Nan789", displayName: "Nancy White", userType: "employee", department: "Marketing Department", position: "Team Lead", employeeId: "EMP012" },
  { id: "emp015", email: "robert.lewis@estatehub.com", password: "Rob789", displayName: "Robert Lewis", userType: "employee", department: "Marketing Department", position: "Senior Manager", employeeId: "EMP015" },
  { id: "emp018", email: "jennifer.allen@estatehub.com", password: "Jen789", displayName: "Jennifer Allen", userType: "employee", department: "Marketing Department", position: "Executive", employeeId: "EMP018" },

  // Operations Department
  { id: "emp004", email: "sarah.jones@estatehub.com", password: "Sar123", displayName: "Sarah Jones", userType: "employee", department: "Operations Department", position: "Manager", employeeId: "EMP004" },
  { id: "emp007", email: "david.wilson@estatehub.com", password: "Dav123", displayName: "David Wilson", userType: "employee", department: "Operations Department", position: "Senior Manager", employeeId: "EMP007" },
  { id: "emp010", email: "patricia.martin@estatehub.com", password: "Pat123", displayName: "Patricia Martin", userType: "employee", department: "Operations Department", position: "Team Lead", employeeId: "EMP010" },
  { id: "emp013", email: "daniel.harris@estatehub.com", password: "Dan123", displayName: "Daniel Harris", userType: "employee", department: "Operations Department", position: "Manager", employeeId: "EMP013" },
  { id: "emp016", email: "karen.walker@estatehub.com", password: "Kar123", displayName: "Karen Walker", userType: "employee", department: "Operations Department", position: "Team Lead", employeeId: "EMP016" },
  { id: "emp019", email: "william.young@estatehub.com", password: "Wil123", displayName: "William Young", userType: "employee", department: "Operations Department", position: "Senior Executive", employeeId: "EMP019" }
];

// Function to seed employees
async function seedEmployees() {
  try {
    // Clear existing employees
    await Employee.deleteMany({});
    console.log('Cleared existing employees');

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

    console.log(`Successfully seeded ${employees.length} employees`);
  } catch (error) {
    console.error('Error seeding employees:', error);
  }
}

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

// Customer data
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
    createdAt: new Date('2024-02-27T00:00:00.000Z'),
    lastLogin: new Date('2024-02-27T00:00:00.000Z'),
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
    createdAt: new Date('2024-02-27T00:00:00.000Z'),
    lastLogin: new Date('2024-02-27T00:00:00.000Z'),
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
    recordOwner: "Priya Sharma",
    createdAt: new Date('2024-02-27T00:00:00.000Z'),
    lastLogin: new Date('2024-02-27T00:00:00.000Z'),
    notes: "Very interested in the property"
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

// Function to seed customers
async function seedCustomers() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/venture_plus')
    console.log('Connected to MongoDB');

    // Clear existing customers
    await Customer.deleteMany({});
    console.log('Cleared existing customers');

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

    console.log(`Successfully seeded ${customers.length} customers`);
    
    // Display customer summary
    const departments = {
      'Sales': customers.filter(c => c.department === 'Sales').length,
      'Marketing': customers.filter(c => c.department === 'Marketing').length,
      'Operations': customers.filter(c => c.department === 'Operations').length
    };

    console.log('\nCustomer Department Summary:');
    Object.entries(departments).forEach(([dept, count]) => {
      console.log(`${dept}: ${count} customers`);
    });

    console.log('\nLogin Credentials:');
    customers.forEach(customer => {
      console.log(`${customer.displayName} - ${customer.email} | Password: ${customer.password} | ID: ${customer.id}`);
    });

  } catch (error) {
    console.error('Error seeding customers:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Function to seed all data
async function seedAllData() {
  console.log('🌱️ Starting data seeding...');
  
  try {
    await seedEmployees();
    await seedCustomers();
    console.log('✅ All data seeded successfully!');
  } catch (error) {
    console.error('Error seeding data:', error);
  }
}

// Run the seeding function
seedAllData();
