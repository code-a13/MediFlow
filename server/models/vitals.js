const mongoose = require('mongoose');

const VitalSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
  recordedDate: { type: Date, default: Date.now },
  
  // Structured Vitals
  bpSystolic: Number,
  bpDiastolic: Number,
  heartRate: Number,
  temperature: Number,
  spO2: Number,
  weight: Number, // in Kg
  
  // Context (e.g., "Taken after running")
  notes: String

}, { timestamps: true });

// Compound index to quickly find vitals for a patient sorted by date
VitalSchema.index({ patientId: 1, recordedDate: -1 });

module.exports = mongoose.model('Vital', VitalSchema);