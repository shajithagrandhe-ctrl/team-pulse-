const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Total Data Schema - For all customer data (interested and not interested)
const totalDataSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  contactName: { type: String, required: true },
  contactNumber: { type: String, required: true },
  location: { type: String, required: true },
  budget: { type: String, required: true },
  interested: { type: Boolean, default: false },
  recordOwner: { type: String, required: true },
  notes: { type: String },
  createdAt: { type: Date, default: Date.now },
  lastUpdated: { type: Date, default: Date.now }
});

const TotalData = mongoose.model('TotalData', totalDataSchema);

// Sample total data with both interested and not interested customers
const totalDataEntries = [
  {
    id: "td001",
    contactName: "Rajesh Kumar Reddy",
    contactNumber: "+91 9876543210",
    location: "Bhogapuram, Visakhapatnam",
    budget: "₹15,00,000",
    interested: true,
    recordOwner: "John Employee",
    notes: "Interested in 200 sq yards plot, looking for 3BHK villa"
  },
  {
    id: "td002",
    contactName: "Sunita Devi Sharma",
    contactNumber: "+91 9876543211",
    location: "Gajuwaka, Visakhapatnam",
    budget: "₹20,00,000",
    interested: false,
    recordOwner: "Jane Employee",
    notes: "Not interested at this time, considering other options"
  },
  {
    id: "td003",
    contactName: "Mohan Rao Naidu",
    contactNumber: "+91 9876543212",
    location: "Aganampudi, Visakhapatnam",
    budget: "₹12,00,000",
    interested: true,
    recordOwner: "Sarah Jones",
    notes: "Very interested in the property, ready to make payment"
  },
  {
    id: "td004",
    contactName: "Priya Sharma Reddy",
    contactNumber: "+91 9876543213",
    location: "Beach Road, Visakhapatnam",
    budget: "₹18,00,000",
    interested: true,
    recordOwner: "Michael Brown",
    notes: "Looking for 3BHK apartment near beach, budget flexible"
  },
  {
    id: "td005",
    contactName: "Venkat Rao Murthy",
    contactNumber: "+91 9876543214",
    location: "Hill Station Road, Visakhapatnam",
    budget: "₹25,00,000",
    interested: false,
    recordOwner: "Lisa Anderson",
    notes: "Still considering options, will decide after site visit"
  },
  {
    id: "td006",
    contactName: "Anjali Gupta Sharma",
    contactNumber: "+91 9876543215",
    location: "City Center, Visakhapatnam",
    budget: "₹22,00,000",
    interested: true,
    recordOwner: "Robert Smith",
    notes: "Interested in commercial property for business"
  },
  {
    id: "td007",
    contactName: "David Wilson Thomas",
    contactNumber: "+91 9876543216",
    location: "Residential Area, Bhogapuram",
    budget: "₹16,00,000",
    interested: true,
    recordOwner: "Christopher Lee",
    notes: "Looking for 2BHK flat for family"
  },
  {
    id: "td008",
    contactName: "Amit Kumar Singh",
    contactNumber: "+91 9876543217",
    location: "Madhurawada, Visakhapatnam",
    budget: "₹10,00,000",
    interested: false,
    recordOwner: "John Employee",
    notes: "Budget too low, not interested currently"
  },
  {
    id: "td009",
    contactName: "Swati Patel",
    contactNumber: "+91 9876543218",
    location: "Anandapuram, Visakhapatnam",
    budget: "₹30,00,000",
    interested: false,
    recordOwner: "Jane Employee",
    notes: "Looking for larger property, current options too small"
  },
  {
    id: "td010",
    contactName: "Ramesh Babu",
    contactNumber: "+91 9876543219",
    location: "Seethammadhara, Visakhapatnam",
    budget: "₹8,00,000",
    interested: false,
    recordOwner: "Sarah Jones",
    notes: "Budget constraints, not interested at this time"
  }
];

// Function to seed total data
async function seedTotalData() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/venture_plus')
    console.log('Connected to MongoDB');

    // Clear existing total data
    await TotalData.deleteMany({});
    console.log('Cleared existing total data');

    // Create total data entries
    for (const entry of totalDataEntries) {
      const newEntry = new TotalData({
        ...entry,
        createdAt: new Date(),
        lastUpdated: new Date()
      });

      await newEntry.save();
      console.log(`Created total data entry: ${entry.contactName} (${entry.contactNumber})`);
    }

    console.log(`Successfully seeded ${totalDataEntries.length} total data entries`);
    
    console.log('\n📋 Total Data Summary:');
    const interestedCount = totalDataEntries.filter(entry => entry.interested).length;
    const notInterestedCount = totalDataEntries.filter(entry => !entry.interested).length;
    
    console.log(`Total Entries: ${totalDataEntries.length}`);
    console.log(`Interested: ${interestedCount}`);
    console.log(`Not Interested: ${notInterestedCount}`);
    
    console.log('\n📊 Total Data Entries:');
    totalDataEntries.forEach(entry => {
      console.log(`${entry.interested ? '✅' : '❌'} ${entry.contactName} - ${entry.contactNumber} - ${entry.location} - ${entry.budget}`);
    });

  } catch (error) {
    console.error('Error seeding total data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the seeding function
seedTotalData();
