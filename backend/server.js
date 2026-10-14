const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/venture_plus')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Employee Schema (replaces User Schema)
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
  fullName: { type: String, required: true },
  adminCode: { type: String, required: true, unique: true },
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

// Lead Schema
const leadSchema = new mongoose.Schema({
  plotId: { type: String, required: true },
  plotNumber: { type: String, required: true },
  customerName: { type: String, required: true },
  email: { type: String, required: true },
  contactNumber: { type: String, required: true },
  location: { type: String, required: true },
  uniqueId: { type: String, required: true, unique: true },
  pricePerSqYard: { type: Number, required: true },
  notes: { type: String },
  photo: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Lead = mongoose.model('Lead', leadSchema);

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';

// Routes
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Try to find user in Employee, Admin, or Customer collections
    let user = null;
    let userType = '';

    // Check Employee first
    user = await Employee.findOne({ email });
    if (user) {
      userType = 'employee';
    }

    // Check Admin if not found
    if (!user) {
      user = await Admin.findOne({ email });
      if (user) {
        userType = 'admin';
      }
    }

    // Check Customer if not found
    if (!user) {
      user = await Customer.findOne({ email });
      if (user) {
        userType = 'customer';
      }
    }

    if (!user) {
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid email or password' 
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid email or password' 
      });
    }

    // Update last login for customers
    if (userType === 'customer') {
      await Customer.findByIdAndUpdate(user._id, { lastLogin: new Date() });
    }

    const tokenPayload = {
      userId: user._id, 
      email: user.email, 
      userType: user.userType,
      department: user.department,
      position: user.position
    };

    // Add employee-specific fields
    if (userType === 'employee') {
      tokenPayload.employeeId = user.employeeId;
    }

    // Add customer-specific fields
    if (userType === 'customer') {
      tokenPayload.phone = user.phone;
      tokenPayload.address = user.address;
      tokenPayload.budget = user.budget;
      tokenPayload.interested = user.interested;
      tokenPayload.recordOwner = user.recordOwner;
    }

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '24h' });

    const responseData = {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      fullName: user.fullName,
      adminCode: user.adminCode,
      userType: user.userType,
      department: user.department,
      position: user.position,
      createdAt: user.createdAt
    };

    // Add employee-specific fields
    if (userType === 'employee') {
      responseData.employeeId = user.employeeId;
    }

    // Add customer-specific fields
    if (userType === 'customer') {
      responseData.fullName = user.fullName;
      responseData.phoneNumber = user.phoneNumber;
      responseData.address = user.address;
      responseData.phone = user.phone;
      responseData.budget = user.budget;
      responseData.interested = user.interested;
      responseData.recordOwner = user.recordOwner;
      responseData.lastLogin = user.lastLogin;
      responseData.notes = user.notes;
    }

    res.status(200).json({
      success: true,
      data: {
        user: responseData,
        token
      },
      message: 'Login successful'
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Login failed'
    });
  }
});

// Get all employees
app.get('/api/employees', async (req, res) => {
  try {
    const employees = await Employee.find().sort({ department: 1, position: 1 });
    
    res.json({
      success: true,
      data: employees,
      message: `Found ${employees.length} employees`
    });
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch employees'
    });
  }
});

// Get all admins
app.get('/api/admins', async (req, res) => {
  try {
    const admins = await Admin.find().sort({ department: 1, position: 1 });
    
    res.json({
      success: true,
      data: admins,
      message: `Found ${admins.length} admins`
    });
  } catch (error) {
    console.error('Error fetching admins:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch admins'
    });
  }
});

// Get all customers
app.get('/api/customers', async (req, res) => {
  try {
    const customers = await Customer.find().sort({ department: 1, position: 1 });
    
    res.json({
      success: true,
      data: customers,
      message: `Found ${customers.length} customers`
    });
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch customers'
    });
  }
});

// Get all total data (both interested and not interested customers)
app.get('/api/total-data', async (req, res) => {
  try {
    const totalData = await TotalData.find().sort({ interested: -1, createdAt: -1 });
    
    res.json({
      success: true,
      data: totalData,
      message: `Found ${totalData.length} total data entries`
    });
  } catch (error) {
    console.error('Error fetching total data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch total data'
    });
  }
});

// Add new total data entry
app.post('/api/total-data', async (req, res) => {
  try {
    const { contactName, contactNumber, location, budget, interested, recordOwner, notes } = req.body;
    
    // Generate unique ID
    const id = `td${Date.now()}`;
    
    const newEntry = new TotalData({
      id,
      contactName,
      contactNumber,
      location,
      budget,
      interested: interested || false,
      recordOwner,
      notes: notes || '',
      createdAt: new Date(),
      lastUpdated: new Date()
    });

    await newEntry.save();
    
    res.status(201).json({
      success: true,
      data: newEntry,
      message: 'Total data entry created successfully'
    });
  } catch (error) {
    console.error('Error creating total data entry:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create total data entry'
    });
  }
});

// Update total data entry
app.put('/api/total-data/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { contactName, contactNumber, location, budget, interested, recordOwner, notes } = req.body;
    
    const updatedEntry = await TotalData.findOneAndUpdate(
      { id },
      {
        contactName,
        contactNumber,
        location,
        budget,
        interested,
        recordOwner,
        notes,
        lastUpdated: new Date()
      },
      { new: true }
    );
    
    if (!updatedEntry) {
      return res.status(404).json({
        success: false,
        message: 'Total data entry not found'
      });
    }
    
    res.json({
      success: true,
      data: updatedEntry,
      message: 'Total data entry updated successfully'
    });
  } catch (error) {
    console.error('Error updating total data entry:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update total data entry'
    });
  }
});

// Delete total data entry
app.delete('/api/total-data/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const deletedEntry = await TotalData.findOneAndDelete({ id });
    
    if (!deletedEntry) {
      return res.status(404).json({
        success: false,
        message: 'Total data entry not found'
      });
    }
    
    res.json({
      success: true,
      data: deletedEntry,
      message: 'Total data entry deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting total data entry:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete total data entry'
    });
  }
});

// Get all leads for a specific plot
app.get('/api/plots/:plotId/leads', async (req, res) => {
  try {
    const { plotId } = req.params;
    
    // Find leads for this plot
    const leads = await Lead.find({ plotId }).sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: leads,
      message: `Found ${leads.length} leads for plot ${plotId}`
    });
  } catch (error) {
    console.error('Error fetching plot leads:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch leads'
    });
  }
});

// Create a new lead
app.post('/api/leads', async (req, res) => {
  try {
    const leadData = req.body;
    
    const newLead = new Lead({
      ...leadData,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    await newLead.save();
    
    res.status(201).json({
      success: true,
      data: newLead,
      message: 'Lead created successfully'
    });
  } catch (error) {
    console.error('Error creating lead:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create lead'
    });
  }
});

// Update an existing lead
app.put('/api/leads/:leadId', async (req, res) => {
  try {
    const { leadId } = req.params;
    const updateData = req.body;
    
    const updatedLead = await Lead.findByIdAndUpdate(
      leadId,
      { ...updateData, updatedAt: new Date() },
      { new: true }
    );
    
    if (!updatedLead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }
    
    res.json({
      success: true,
      data: updatedLead,
      message: 'Lead updated successfully'
    });
  } catch (error) {
    console.error('Error updating lead:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update lead'
    });
  }
});

// Delete a lead
app.delete('/api/leads/:leadId', async (req, res) => {
  try {
    const { leadId } = req.params;
    
    const deletedLead = await Lead.findByIdAndDelete(leadId);
    
    if (!deletedLead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Lead deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting lead:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete lead'
    });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
