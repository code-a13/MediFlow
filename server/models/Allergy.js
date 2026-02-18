// server/models/Allergy.js
const mongoose = require('mongoose');

const AllergySchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  
  // NOTE: Schema expects "allergen" (NOT "name" or "allergy")
  allergen: { type: String, required: true }, 
  
  // NOTE: Schema expects "severity"
  severity: { type: String, enum: ['Mild', 'Moderate', 'Severe', 'Life-Threatening'], required: true },
  
  reaction: String, 
  detectedDate: { type: Date, default: Date.now }
});

module.exports = mongoose.models.Allergy || mongoose.model('Allergy', AllergySchema);