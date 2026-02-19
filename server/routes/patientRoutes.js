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
  getAllPrescriptions 
} = require('../controllers/patientController');

// --- ROUTES ---


router.get('/search', searchPatients);
router.get('/prescriptions/all', getAllPrescriptions);


router.get('/', getAllPatients);
router.post('/', createPatient);


router.get('/:id', getPatient);


router.post('/:id/prescription', addPrescription);
router.post('/:id/safety-check', checkSafety);
router.get('/prescription/:id/download', getPrescriptionPDF);
module.exports = router;