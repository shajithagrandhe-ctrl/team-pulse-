const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
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

// Customer data with updated fields
const customers = [
  {
    id: "cust001",
    email: "customer1@estatehub.com",
    password: "Cust123",
    displayName: "Rajesh Kumar",
    fullName: "Rajesh Kumar Reddy",
    phoneNumber: "+91 9876543210",
    address: "123 Main Street, Bhogapuram, Visakhapatnam, Andhra Pradesh 530001",
    userType: "customer",
    department: "Sales",
    position: "Customer",
    phone: "+91 9876543210",
    budget: "₹15,00,000",
    interested: true,
    recordOwner: "John Employee",
    notes: "Interested in 200 sq yards plot, looking for 3BHK villa",
    createdAt: new Date('2024-02-27T00:00:00.000Z'),
    lastLogin: new Date('2024-02-27T00:00:00.000Z')
  },
  {
    id: "cust002",
    email: "customer2@estatehub.com",
    password: "Cust456",
    displayName: "Sunita Devi",
    fullName: "Sunita Devi Sharma",
    phoneNumber: "+91 9876543211",
    address: "456 Park Road, Gajuwaka, Visakhapatnam, Andhra Pradesh 530016",
    userType: "customer",
    department: "Sales",
    position: "Customer",
    phone: "+91 9876543211",
    budget: "₹20,00,000",
    interested: false,
    recordOwner: "Jane Employee",
    notes: "Not interested at this time, considering other options",
    createdAt: new Date('2024-02-27T00:00:00.000Z'),
    lastLogin: new Date('2024-02-27T00:00:00.000Z')
  },
  {
    id: "cust003",
    email: "customer3@estatehub.com",
    password: "Cust789",
    displayName: "Mohan Rao",
    fullName: "Mohan Rao Naidu",
    phoneNumber: "+91 9876543212",
    address: "789 Temple Street, Aganampudi, Visakhapatnam, Andhra Pradesh 530018",
    userType: "customer",
    department: "Sales",
    position: "Customer",
    phone: "+91 9876543212",
    budget: "₹12,00,000",
    interested: true,
    recordOwner: "Sarah Jones",
    notes: "Very interested in the property, ready to make payment",
    createdAt: new Date('2024-02-27T00:00:00.000Z'),
    lastLogin: new Date('2024-02-27T00:00:00.000Z')
  },
  {
    id: "cust004",
    email: "customer4@estatehub.com",
    password: "Cust012",
    displayName: "Priya Sharma",
    fullName: "Priya Sharma Reddy",
    phoneNumber: "+91 9876543213",
    address: "321 Beach Road, Visakhapatnam, Andhra Pradesh 530017",
    userType: "customer",
    department: "Sales",
    position: "Customer",
    phone: "+91 9876543213",
    budget: "₹18,00,000",
    interested: true,
    recordOwner: "Michael Brown",
    notes: "Looking for 3BHK apartment near beach, budget flexible",
    createdAt: new Date('2024-02-27T00:00:00.000Z'),
    lastLogin: new Date('2024-02-27T00:00:00.000Z')
  },
  {
    id: "cust005",
    email: "customer5@estatehub.com",
    password: "Cust345",
    displayName: "Venkat Rao",
    fullName: "Venkat Rao Murthy",
    phoneNumber: "+91 9876543214",
    address: "654 Hill Station Road, Visakhapatnam, Andhra Pradesh 530019",
    userType: "customer",
    department: "Sales",
    position: "Customer",
    phone: "+91 9876543214",
    budget: "₹25,00,000",
    interested: false,
    recordOwner: "Lisa Anderson",
    notes: "Still considering options, will decide after site visit",
    createdAt: new Date('2024-02-27T00:00:00.000Z'),
    lastLogin: new Date('2024-02-27T00:00:00.000Z')
  },
  {
    id: "cust006",
    email: "customer6@estatehub.com",
    password: "Cust678",
    displayName: "Anjali Gupta",
    fullName: "Anjali Gupta Sharma",
    phoneNumber: "+91 9876543215",
    address: "987 City Center, Visakhapatnam, Andhra Pradesh 530020",
    userType: "customer",
    department: "Sales",
    position: "Customer",
    phone: "+91 9876543215",
    budget: "₹22,00,000",
    interested: true,
    recordOwner: "Robert Smith",
    notes: "Interested in commercial property for business",
    createdAt: new Date('2024-02-27T00:00:00.000Z'),
    lastLogin: new Date('2024-02-27T00:00:00.000Z')
  },
  {
    id: "cust007",
    email: "customer7@estatehub.com",
    password: "Cust901",
    displayName: "David Wilson",
    fullName: "David Wilson Thomas",
    phoneNumber: "+91 9876543216",
    address: "456 Residential Area, Bhogapuram, Visakhapatnam, Andhra Pradesh 530021",
    userType: "customer",
    department: "Sales",
    position: "Customer",
    phone: "+91 9876543216",
    budget: "₹16,00,000",
    interested: true,
    recordOwner: "Christopher Lee",
    notes: "Looking for 2BHK flat for family",
    createdAt: new Date('2024-02-27T00:00:00.000Z'),
    lastLogin: new Date('2024-02-27T00:00:00.000Z')
  }
];

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
      console.log(`Created customer: ${customer.displayName} (${customer.email})`);
    }

    console.log(`Successfully seeded ${customers.length} customers`);
    
    console.log('\n📋 Customer Login Credentials:');
    customers.forEach(customer => {
      console.log(`${customer.displayName} - ${customer.email} | Password: ${customer.password} | Phone: ${customer.phoneNumber}`);
    });
    
    console.log('\n📊 Customer Details:');
    customers.forEach(customer => {
      console.log(`\n${customer.fullName}:`);
      console.log(`  Email: ${customer.email}`);
      console.log(`  Password: ${customer.password}`);
      console.log(`  Phone: ${customer.phoneNumber}`);
      console.log(`  Address: ${customer.address}`);
      console.log(`  Budget: ${customer.budget}`);
      console.log(`  Interested: ${customer.interested ? 'Yes' : 'No'}`);
      console.log(`  Record Owner: ${customer.recordOwner}`);
    });

  } catch (error) {
    console.error('Error seeding customers:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the seeding function
seedCustomers();
