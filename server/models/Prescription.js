const mongoose = require('mongoose');

const PrescriptionSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
  doctorId: { type: String, default: "Dr. S. Kavin" }, // Hardcoded for now
  visitDate: { type: Date, default: Date.now },

  // 1. Vitals & Stats (Crucial for Pediatrics/Cardiac)
  vitals: {
    weight: { type: String, default: "--" }, // e.g., "72 kg"
    height: { type: String, default: "--" }, // e.g., "175 cm"
    bloodPressure: { type: String, default: "--" }, // e.g., "120/80"
    temperature: { type: String, default: "--" }, // e.g., "98.6 F"
    pulse: { type: String, default: "--" }, // e.g., "72 bpm"
    spo2: { type: String, default: "--" } // e.g., "98%"
  },

  // 2. Clinical Findings
  chiefComplaints: [String], // e.g., ["Fever for 3 days", "Dry Cough"]
  diagnosis: { type: String, required: true }, // e.g., "Acute Bronchitis"
  clinicalNotes: { type: String }, // e.g., "Chest clear, throat inflamed"

  // 3. The Meds
  medications: [{
    name: { type: String, required: true },
    dosage: { type: String, required: true }, // "500mg"
    frequency: { type: String, required: true }, // "1-0-1"
    duration: { type: String, required: true }, // "5 Days"
    instruction: { type: String } // "After Food"
  }],

  // 4. Follow Up
  nextVisit: { type: Date },
  advice: { type: String } // "Drink warm water, rest"
});

module.exports = mongoose.model('Prescription', PrescriptionSchema);