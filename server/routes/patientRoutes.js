const express = require('express');
const router = express.Router();
const { checkSafety } = require('../controllers/aiController');

const { 
  createPatient, 
  getPatient, 
  getAllPatients, 
  searchPatients,
  addPrescription,
  getPrescriptionPDF,
  getAllPrescriptions // This handles History & Meds now
} = require('../controllers/patientController');

// --- ROUTES ---

// 1. Search (Must be first to avoid conflict with :id)
router.get('/search', searchPatients);
router.get('/prescriptions/all', getAllPrescriptions);

// 2. General Operations
router.get('/', getAllPatients);
router.post('/', createPatient);

// 3. Specific Patient Operations
router.get('/:id', getPatient);

// 4. The New "Enterprise" Action (Replaces old timeline/meds routes)
router.post('/:id/prescription', addPrescription);
router.post('/:id/safety-check', checkSafety);
router.get('/prescription/:id/download', getPrescriptionPDF);
module.exports = router;