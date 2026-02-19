const mongoose = require('mongoose');

const PrescriptionSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
  doctorId: { type: String, default: "Dr. S. Kavin" },
  visitDate: { type: Date, default: Date.now },

  // 1. Vitals & Stats 
  vitals: {
    weight: { type: String, default: "--" }, 
    height: { type: String, default: "--" }, 
    bloodPressure: { type: String, default: "--" }, 
    temperature: { type: String, default: "--" }, 
    pulse: { type: String, default: "--" }, 
    spo2: { type: String, default: "--" } 
  },

  // 2. Clinical Findings
  chiefComplaints: [String], 
  diagnosis: { type: String, required: true }, 
  clinicalNotes: { type: String }, 

  // 3. The Meds
  medications: [{
    name: { type: String, required: true },
    dosage: { type: String, required: true }, 
    frequency: { type: String, required: true }, // "1-0-1"
    duration: { type: String, required: true }, 
    instruction: { type: String } 
  }],

  // 4. Follow Up
  nextVisit: { type: Date },
  advice: { type: String } 
});

module.exports = mongoose.model('Prescription', PrescriptionSchema);