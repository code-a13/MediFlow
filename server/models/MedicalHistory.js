const mongoose = require('mongoose');

const MedicalHistorySchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  conditionName: {
    type: String,
    required: true,
    default: 'General Consultation'
  },
  type: {
    type: String,
    enum: ['Chronic', 'Acute', 'Prescription', 'Lab Report', 'Surgery'],
    default: 'Prescription'
  },
  diagnosisDate: {
    type: Date,
    default: Date.now
  },
  description: {
    type: String
  },
  // The crucial part that was likely causing the crash:
  prescribedMedications: [{
    drugName: { type: String, required: true }, // Standardized key
    dosage: { type: String, default: 'N/A' },
    frequency: { type: String, default: '1-0-1' },
    duration: { type: String, default: '5 Days' }
  }]
});

module.exports = mongoose.model('MedicalHistory', MedicalHistorySchema);