const mongoose = require('mongoose');
const axios = require('axios'); // Required for RAG Bridge
const Patient = require('../models/Patient');
const MedicalHistory = require('../models/MedicalHistory');
const Allergy = require('../models/Allergy');
const Prescription = require('../models/Prescription'); 
const { generatePrescriptionPDF } = require('../utils/pdfGenerator');

// Define Python AI Service URL
const PYTHON_API = 'http://localhost:8000'; 

// ==========================================
// 1. GET ALL PATIENTS (Dashboard List)
// ==========================================
exports.getAllPatients = async (req, res) => {
  try {
    const patients = await Patient.find()
      .sort({ lastVisit: -1 })
      .limit(20)
      .lean(); 
    res.json(patients);
  } catch (err) {
    console.error("Error fetching patients:", err);
    res.status(500).json({ error: "Failed to fetch patients list" });
  }
};

// ==========================================
// 2. SEARCH PATIENTS (Smart Search)
// ==========================================
exports.searchPatients = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query || query.length < 2) return res.json([]);

    const searchRegex = new RegExp(query, 'i'); 

    const patients = await Patient.find({
      $or: [
        { contactNumber: searchRegex },
        { firstName: searchRegex },
        { lastName: searchRegex }
      ]
    })
    .select('firstName lastName contactNumber dateOfBirth gender')
    .limit(10)
    .lean();

    res.json(patients);
  } catch (err) {
    console.error("Search Error:", err);
    res.status(500).json({ error: "Search failed" });
  }
};

// ==========================================
// 3. GET SINGLE PATIENT PROFILE
// ==========================================
exports.getPatient = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid Patient ID format" });
    }

    // Parallel Fetch (Performance Optimized)
    const [patient, medicalHistory, allergies] = await Promise.all([
      Patient.findById(id).lean(),
      MedicalHistory.find({ patientId: id }).sort({ diagnosisDate: -1 }).lean(),
      Allergy.find({ patientId: id }).lean()
    ]);

    if (!patient) return res.status(404).json({ error: 'Patient not found' });

    const completeProfile = {
      ...patient,
      medicalHistory: medicalHistory || [],
      allergies: allergies || []
    };

    res.json(completeProfile);

  } catch (err) {
    console.error("Get Profile Error:", err);
    res.status(500).json({ error: err.message });
  }
};

// ==========================================
// 4. CREATE NEW PATIENT (Transaction Removed)
// ==========================================
exports.createPatient = async (req, res) => {
  try {
    const { allergies, chronicConditions, ...patientData } = req.body;

    // 1. Create Patient
    const newPatient = await Patient.create(patientData);

    // 2. Add Allergies
    if (allergies && allergies.length > 0) {
      const allergyDocs = allergies.map(a => ({
        patientId: newPatient._id,
        allergen: a,
        severity: 'Moderate',
        reaction: 'Unknown'
      }));
      await Allergy.insertMany(allergyDocs);
    }

    // 3. Add History
    if (chronicConditions && chronicConditions.length > 0) {
      const historyDocs = chronicConditions.map(c => ({
        patientId: newPatient._id,
        conditionName: c,
        type: 'Chronic',
        status: 'Active',
        diagnosisDate: new Date()
      }));
      await MedicalHistory.insertMany(historyDocs);
    }

    res.status(201).json(newPatient);

  } catch (err) {
    console.error("Create Patient Error:", err);
    res.status(500).json({ error: err.message });
  }
};

// ==========================================
// 5. ADD PRESCRIPTION (FIXED & MAPPED)
// ==========================================
exports.addPrescription = async (req, res) => {
  try {
    // 1. Robust ID Extraction
    const patientId = req.params.id || req.body.patientId;
    if (!patientId) throw new Error("Patient ID is missing");

    // 2. Extract Data
    const { 
      medications, 
      diagnosis, 
      vitals,       
      symptoms      
    } = req.body;

    console.log("📝 Received Rx Data:", { diagnosis, meds: medications?.length });

    // 🛑 FIX 1: Map Frontend Keys (short) to Backend Schema (long)
    // Frontend sends: { name, dosage, freq, dur }
    // Schema expects: { name, dosage, frequency, duration }
    const formattedMeds = (medications || []).map(m => ({
      name: m.name,
      dosage: m.dosage,
      frequency: m.freq || m.frequency || "1-0-1", // Fallback if missing
      duration: m.dur || m.duration || "5 Days",   // Fallback if missing
      instruction: m.instruction || ""
    }));

    // 🛑 FIX 2: Ensure Diagnosis is never null
    const finalDiagnosis = diagnosis || "General Consultation";

    // 3. Fetch Patient
    const patient = await Patient.findById(patientId);
    if (!patient) throw new Error("Patient not found");

    // 4. Create Prescription Record
    const [newPrescription] = await Prescription.create([{
      patientId,
      diagnosis: finalDiagnosis, // ✅ Using fixed diagnosis
      medications: formattedMeds, // ✅ Using fixed meds
      vitals: vitals || {}, 
      chiefComplaints: symptoms || [],
      doctorName: "Dr. S. Kavin",
      visitDate: new Date()
    }]);

    console.log("✅ Prescription Saved:", newPrescription._id);

    // 5. Generate PDF (Safe Mode)
    let pdfBuffer = null;
    try {
        pdfBuffer = await generatePrescriptionPDF(patient, newPrescription);
    } catch (pdfErr) {
        console.warn("⚠️ PDF Generation Warning:", pdfErr.message);
    }

    // 6. Update Medical History (Using the same formatted data)
    await MedicalHistory.create([{
      patientId,
      conditionName: finalDiagnosis, 
      type: 'Prescription',
      diagnosisDate: new Date(),
      description: `OPD Visit. Prescribed: ${formattedMeds.length} meds.`,
      prescribedMedications: formattedMeds.map(m => ({
          drugName: m.name,
          dosage: m.dosage,
          frequency: m.frequency, 
          duration: m.duration   
      }))
    }]);

    // 7. Update Patient Last Visit
    patient.lastVisit = new Date();
    await patient.save();

    // 8. Trigger AI Memory (Fire & Forget)
    const ragTask = async () => {
      try {
        const medsText = formattedMeds.map(m => `${m.name} ${m.dosage}`).join(', ');
        const vitalsText = `BP:${vitals?.bloodPressure || 'N/A'}, Wt:${vitals?.weight || 'N/A'}`;
        
        const memoryText = `
          CLINICAL RECORD [${new Date().toLocaleDateString()}]:
          Patient ${patient.firstName} ${patient.lastName} presented with ${symptoms?.join(', ') || 'general complaints'}.
          Vitals: ${vitalsText}.
          Diagnosis: ${finalDiagnosis}.
          Prescribed: ${medsText}.
        `.trim();

        await axios.post(`${PYTHON_API}/api/rag/ingest`, { text: memoryText });
      } catch (e) {
        console.warn("AI Ingestion failed:", e.message);
      }
    };
    ragTask();

    // 9. Return Response
    res.json({ 
        success: true, 
        message: "Prescription Saved Successfully",
        pdfBase64: pdfBuffer ? pdfBuffer.toString('base64') : null 
    });

  } catch (err) {
    console.error("❌ Save Prescription Error:", err);
    // Return detailed error to frontend for easier debugging
    res.status(500).json({ error: err.message, details: err.errors });
  }
};

// ==========================================
// 6. GET GLOBAL PRESCRIPTION HISTORY
// ==========================================
exports.getAllPrescriptions = async (req, res) => {
  try {
    const prescriptions = await Prescription.find()
      .populate('patientId', 'firstName lastName gender dateOfBirth contactNumber') // Join Patient Data
      .sort({ visitDate: -1 }) // Newest first
      .lean();
      
    res.json(prescriptions);
  } catch (err) {
    console.error("Fetch History Error:", err);
    res.status(500).json({ error: "Failed to fetch prescriptions" });
  }
};

// ==========================================
// 7. RE-PRINT PRESCRIPTION (PDF)
// ==========================================
exports.getPrescriptionPDF = async (req, res) => {
  try {
    const { id } = req.params; // Prescription ID

    // 1. Find Prescription + Patient
    const prescription = await Prescription.findById(id).populate('patientId');
    
    if (!prescription || !prescription.patientId) {
        return res.status(404).json({ error: "Prescription record not found" });
    }

    // 2. Generate PDF on the fly
    const pdfBuffer = await generatePrescriptionPDF(prescription.patientId, prescription);

    // 3. Stream back as file
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=Rx_${prescription.patientId.firstName}_${Date.now()}.pdf`,
      'Content-Length': pdfBuffer.length
    });
    
    res.send(pdfBuffer);

  } catch (err) {
    console.error("Reprint Error:", err);
    res.status(500).json({ error: "Could not generate PDF" });
  }
};