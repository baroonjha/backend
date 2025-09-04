// server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB Connected Successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Student Schema
const studentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  address: {
    type: String,
    required: true,
    trim: true
  },
  city: {
    type: String,
    required: true,
    trim: true
  },
  state: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    validate: {
      validator: function(v) {
        return /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(v);
      },
      message: 'Please enter a valid email address'
    }
  },
  phone: {
    type: String,
    required: true,
    trim: true
  }
}, {
  timestamps: true
});

const Student = mongoose.model('Student', studentSchema);

// Routes

// GET /api/students - Get all students
app.get('/api/students', async (req, res) => {
  try {
    const students = await Student.find().sort({ createdAt: -1 });
    res.json(students);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching students', error: error.message });
  }
});

// GET /api/students/:id - Get a specific student
app.get('/api/students/:id', async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    res.json(student);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching student', error: error.message });
  }
});

// POST /api/students - Create a new student
app.post('/api/students', async (req, res) => {
  try {
    const { name, address, city, state, email, phone } = req.body;

    // Validate required fields
    if (!name || !address || !city || !state || !email || !phone) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Check if email already exists
    const existingStudent = await Student.findOne({ email });
    if (existingStudent) {
      return res.status(400).json({ message: 'Student with this email already exists' });
    }

    const student = new Student({
      name,
      address,
      city,
      state,
      email,
      phone
    });

    const savedStudent = await student.save();
    res.status(201).json(savedStudent);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Student with this email already exists' });
    }
    res.status(400).json({ message: 'Error creating student', error: error.message });
  }
});

// PUT /api/students/:id - Update a student
app.put('/api/students/:id', async (req, res) => {
  try {
    const { name, address, city, state, email, phone } = req.body;

    // Validate required fields
    if (!name || !address || !city || !state || !email || !phone) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Check if email already exists for a different student
    const existingStudent = await Student.findOne({ 
      email, 
      _id: { $ne: req.params.id } 
    });
    if (existingStudent) {
      return res.status(400).json({ message: 'Student with this email already exists' });
    }

    const student = await Student.findByIdAndUpdate(
      req.params.id,
      {
        name,
        address,
        city,
        state,
        email,
        phone
      },
      { new: true, runValidators: true }
    );

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    res.json(student);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Student with this email already exists' });
    }
    res.status(400).json({ message: 'Error updating student', error: error.message });
  }
});

// DELETE /api/students/:id - Delete a student
app.delete('/api/students/:id', async (req, res) => {
  try {
    const student = await Student.findByIdAndDelete(req.params.id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    res.json({ message: 'Student deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting student', error: error.message });
  }
});

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ message: 'Server is running successfully' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// 404 handler
// app.use('*', (req, res) => {
//   res.status(404).json({ message: 'Route not found' });
// });

// Start server
const PORT = process.env.PORT || 5000;

// Connect to database and start server
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/api/health`);
  });
});