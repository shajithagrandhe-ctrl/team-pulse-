const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

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

// Employee data from your credentials
const employees = [
  // Sales Department
  {
    id: "emp001",
    email: "john.employee@estatehub.com",
    password: "Emp123",
    displayName: "John Employee",
    userType: "employee",
    department: "Sales Department",
    position: "Executive",
    employeeId: "EMP001"
  },
  {
    id: "emp003",
    email: "robert.smith@estatehub.com",
    password: "Rob789",
    displayName: "Robert Smith",
    userType: "employee",
    department: "Sales Department",
    position: "Senior Executive",
    employeeId: "EMP003"
  },
  {
    id: "emp005",
    email: "michael.brown@estatehub.com",
    password: "Mic456",
    displayName: "Michael Brown",
    userType: "employee",
    department: "Sales Department",
    position: "Executive",
    employeeId: "EMP005"
  },
  {
    id: "emp008",
    email: "lisa.anderson@estatehub.com",
    password: "Lis456",
    displayName: "Lisa Anderson",
    userType: "employee",
    department: "Sales Department",
    position: "Team Lead",
    employeeId: "EMP008"
  },
  {
    id: "emp011",
    email: "christopher.lee@estatehub.com",
    password: "Chr456",
    displayName: "Christopher Lee",
    userType: "employee",
    department: "Sales Department",
    position: "Senior Executive",
    employeeId: "EMP011"
  },
  {
    id: "emp014",
    email: "susan.clark@estatehub.com",
    password: "Sus456",
    displayName: "Susan Clark",
    userType: "employee",
    department: "Sales Department",
    position: "Executive",
    employeeId: "EMP014"
  },
  {
    id: "emp017",
    email: "thomas.hall@estatehub.com",
    password: "Tho456",
    displayName: "Thomas Hall",
    userType: "employee",
    department: "Sales Department",
    position: "Manager",
    employeeId: "EMP017"
  },
  {
    id: "emp020",
    email: "lisa.king@estatehub.com",
    password: "Lis456",
    displayName: "Lisa King",
    userType: "employee",
    department: "Sales Department",
    position: "Director",
    employeeId: "EMP020"
  },

  // Marketing Department
  {
    id: "emp002",
    email: "jane.employee@estatehub.com",
    password: "Emp456",
    displayName: "Jane Employee",
    userType: "employee",
    department: "Marketing Department",
    position: "Manager",
    employeeId: "EMP002"
  },
  {
    id: "emp006",
    email: "emily.davis@estatehub.com",
    password: "Emi789",
    displayName: "Emily Davis",
    userType: "employee",
    department: "Marketing Department",
    position: "Executive",
    employeeId: "EMP006"
  },
  {
    id: "emp009",
    email: "james.taylor@estatehub.com",
    password: "Jam789",
    displayName: "James Taylor",
    userType: "employee",
    department: "Marketing Department",
    position: "Manager",
    employeeId: "EMP009"
  },
  {
    id: "emp012",
    email: "nancy.white@estatehub.com",
    password: "Nan789",
    displayName: "Nancy White",
    userType: "employee",
    department: "Marketing Department",
    position: "Team Lead",
    employeeId: "EMP012"
  },
  {
    id: "emp015",
    email: "robert.lewis@estatehub.com",
    password: "Rob789",
    displayName: "Robert Lewis",
    userType: "employee",
    department: "Marketing Department",
    position: "Senior Manager",
    employeeId: "EMP015"
  },
  {
    id: "emp018",
    email: "jennifer.allen@estatehub.com",
    password: "Jen789",
    displayName: "Jennifer Allen",
    userType: "employee",
    department: "Marketing Department",
    position: "Executive",
    employeeId: "EMP018"
  },

  // Operations Department
  {
    id: "emp004",
    email: "sarah.jones@estatehub.com",
    password: "Sar123",
    displayName: "Sarah Jones",
    userType: "employee",
    department: "Operations Department",
    position: "Manager",
    employeeId: "EMP004"
  },
  {
    id: "emp007",
    email: "david.wilson@estatehub.com",
    password: "Dav123",
    displayName: "David Wilson",
    userType: "employee",
    department: "Operations Department",
    position: "Senior Manager",
    employeeId: "EMP007"
  },
  {
    id: "emp010",
    email: "patricia.martin@estatehub.com",
    password: "Pat123",
    displayName: "Patricia Martin",
    userType: "employee",
    department: "Operations Department",
    position: "Team Lead",
    employeeId: "EMP010"
  },
  {
    id: "emp013",
    email: "daniel.harris@estatehub.com",
    password: "Dan123",
    displayName: "Daniel Harris",
    userType: "employee",
    department: "Operations Department",
    position: "Manager",
    employeeId: "EMP013"
  },
  {
    id: "emp016",
    email: "karen.walker@estatehub.com",
    password: "Kar123",
    displayName: "Karen Walker",
    userType: "employee",
    department: "Operations Department",
    position: "Team Lead",
    employeeId: "EMP016"
  },
  {
    id: "emp019",
    email: "william.young@estatehub.com",
    password: "Wil123",
    displayName: "William Young",
    userType: "employee",
    department: "Operations Department",
    position: "Senior Executive",
    employeeId: "EMP019"
  }
];

// Function to seed employees
async function seedEmployees() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/venture_plus');
    console.log('Connected to MongoDB');

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
    
    // Display department summary
    const departments = {
      'Sales Department': employees.filter(e => e.department === 'Sales Department').length,
      'Marketing Department': employees.filter(e => e.department === 'Marketing Department').length,
      'Operations Department': employees.filter(e => e.department === 'Operations Department').length
    };

    console.log('\nDepartment Summary:');
    Object.entries(departments).forEach(([dept, count]) => {
      console.log(`${dept}: ${count} employees`);
    });

    console.log('\nLogin Credentials:');
    employees.forEach(emp => {
      console.log(`${emp.displayName} - ${emp.email} | Password: ${emp.password} | ID: ${emp.employeeId}`);
    });

  } catch (error) {
    console.error('Error seeding employees:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the seeding function
seedEmployees();
