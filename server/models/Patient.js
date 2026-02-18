const mongoose = require('mongoose');

const PatientSchema = new mongoose.Schema({
  // Identity
  firstName: { type: String, required: true, index: true },
  lastName: { type: String, required: true },
  dateOfBirth: { type: Date, required: true }, // Age is calculated from this
  gender: { type: String, enum: ['Male', 'Female', 'Other'], required: true },
  
  // Contact & Bio
  contactNumber: { type: String, required: true, unique: true },
  bloodGroup: { type: String, enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'], default: 'Unknown' },
  address: { type: String },
  
  // Metadata
  createdAt: { type: Date, default: Date.now },
  lastVisit: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Patient', PatientSchema);