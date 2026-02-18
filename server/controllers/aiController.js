const axios = require('axios');
const Patient = require('../models/Patient');
const MedicalHistory = require('../models/MedicalHistory'); // Import needed for manual fetch
const Allergy = require('../models/Allergy');             // Import needed for manual fetch
const Prescription = require('../models/Prescription');
// Python AI Service URL
const PYTHON_API = 'http://localhost:8000';

// ==========================================
// 1. BRIDGE FOR TIMELINE (Pure Python Proxy)
// ==========================================
exports.createTimeline = async (req, res) => {
  try {
    const { historyText } = req.body;
    // Just forwards text to Python, no DB needed here
    const response = await axios.post(`${PYTHON_API}/api/timeline`, { historyText });
    res.json(response.data); 
  } catch (error) {
    console.error("Timeline Error:", error.message);
    res.status(500).json({ timeline: [], error: "AI Service Offline" });
  }
};

// ==========================================
// 2. SAFETY CHECK (Fixed Populate Crash)
// ==========================================
exports.checkSafety = async (req, res) => {
  try {
    const { patientId, medications } = req.body;

    // 🛑 FIX: Don't use .populate(). Fetch manually in parallel.
    const [patient, history, allergies] = await Promise.all([
      Patient.findById(patientId).lean(),
      MedicalHistory.find({ patientId }).lean(),
      Allergy.find({ patientId }).lean()
    ]);

    if (!patient) return res.status(404).json({ error: "Patient not found" });

    // Combine data for Python
    const patientProfile = {
      ...patient,
      medicalHistory: history || [],
      allergies: allergies || []
    };

    const response = await axios.post(`${PYTHON_API}/api/safety-check`, {
      patient_profile: patientProfile,
      new_meds: medications
    });
    
    res.json(response.data);

  } catch (error) {
    console.error("Safety Check Error:", error.message);
    // Fail safe: Allow user to proceed if AI is down
    res.json({ safe: true, warnings: ["AI Check Failed - Proceed manually"] });
  }
};

// ==========================================
// 3. PATIENT SUMMARY (Fixed Populate Crash)
// ==========================================
exports.generatePatientSummary = async (req, res) => {
  try {
    const { patientId } = req.body;
    
    // 🛑 FIX: Manual Parallel Fetch
    const [patient, history, allergies] = await Promise.all([
      Patient.findById(patientId).lean(),
      MedicalHistory.find({ patientId }).sort({ diagnosisDate: -1 }).limit(10).lean(),
      Allergy.find({ patientId }).lean()
    ]);
      
    if (!patient) return res.status(404).json({ error: "Patient not found" });

    // Combine data for Python
    const patientProfile = {
      ...patient,
      medicalHistory: history || [],
      allergies: allergies || []
    };

    const response = await axios.post(`${PYTHON_API}/api/summary`, {
      patient_profile: patientProfile
    });

    res.json(response.data);

  } catch (error) {
    console.error("Summary Error:", error.message);
    // Fallback JSON so UI doesn't break
    res.json({ 
      summary: "Could not generate summary at this time.", 
      risk_factors: [], 
      suggested_actions: [] 
    });
  }
};

// ==========================================
// 4. RAG PRESCRIPTION (Python Bridge)
// ==========================================
exports.getSmartPrescription = async (req, res) => {
  try {
    const { description } = req.body;
    
    // Call Python RAG Endpoint
    const response = await axios.post(`${PYTHON_API}/api/rag/suggest-rx`, { 
      description: description 
    });

    res.json(response.data); // Returns { suggestions: [...] }
  } catch (error) {
    console.error("RAG Error:", error.message);
    // Fallback to empty if AI fails
    res.json({ suggestions: [] });
  }
};

// ==========================================
// 5. TRAIN AI (Python Bridge)
// ==========================================
exports.trainAI = async (req, res) => {
    try {
        const { text } = req.body;
        const response = await axios.post(`${PYTHON_API}/api/rag/ingest`, { text });
        res.json(response.data);
    } catch (error) {
        console.error("Training Error:", error.message);
        res.status(500).json({ error: "Training Failed" });
    }
};

// ==========================================
// 6. GET CLINIC OVERVIEW (Stats + AI Trends)
// ==========================================
exports.getClinicOverview = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. Parallel DB Queries (Fast)
    const [totalPatients, todayPatients, recentRx] = await Promise.all([
      Patient.countDocuments(),
      Patient.countDocuments({ lastVisit: { $gte: today } }),
      Prescription.find().sort({ visitDate: -1 }).limit(10).select('diagnosis')
    ]);

    // 2. Prepare Data for AI
    const diagnoses = recentRx.map(r => r.diagnosis).filter(d => d);

    // 3. Ask AI for Insights
    let aiInsight = { trend: "Analyzing...", alert: "Gathering data..." };
    try {
      if (diagnoses.length > 0) {
        const aiRes = await axios.post(`${PYTHON_API}/api/analyze-trends`, { 
          recent_diagnoses: diagnoses 
        });
        aiInsight = aiRes.data;
      }
    } catch (e) {
      console.warn("AI Trend Analysis Failed");
    }

    // 4. Send Packet
    res.json({
      stats: {
        total_patients: totalPatients,
        today_visits: todayPatients,
        total_prescriptions: await Prescription.countDocuments()
      },
      ai_insight: aiInsight
    });

  } catch (err) {
    console.error("Overview Error:", err);
    res.status(500).json({ error: "Failed to load overview" });
  }
};