const express = require('express');
const router = express.Router();

// 👇 UPDATE THIS LINE: Add 'getSmartPrescription' and 'trainAI' to the list
const { 
  createTimeline, 
  checkSafety,
  generatePatientSummary,
  getSmartPrescription, // <--- Added this
  trainAI,
  getClinicOverview         // <--- Added this (if you added the training route too)
} = require('../controllers/aiController');

// Debug check to stop crash if names don't match
if (!createTimeline || !checkSafety || !generatePatientSummary) {
    console.error("❌ ERROR: Functions not found in aiController. Fix your exports!");
}

// --- ROUTES ---
router.post('/timeline', createTimeline);
router.post('/safety-check', checkSafety);
router.post('/summary', generatePatientSummary); 
router.post('/suggest-rx', getSmartPrescription); // <--- Now this will work
router.post('/train', trainAI);                   // <--- And this
router.get('/overview', getClinicOverview);
module.exports = router;