const mongoose = require('mongoose');
const connectDB = require('./config/db');

// Import all models
const Patient = require('./models/Patient');
const MedicalHistory = require('./models/MedicalHistory');
const Allergy = require('./models/Allergy');
const Prescription = require('./models/Prescription');
const Vital = require('./models/vitals');

// Connect to DB
connectDB();

const seedData = async () => {
  try {
    console.log("🔥 Flushing old data...");
    await Patient.deleteMany({});
    await MedicalHistory.deleteMany({});
    await Allergy.deleteMany({});
    await Prescription.deleteMany({});
    await Vital.deleteMany({});

    console.log("🌱 Seeding High-Quality Test Data...");

    // ---------------------------------------------------------
    // 1. Create The "Star" Patient (Complex Case) + 2 Standard Cases
    // ---------------------------------------------------------
    const patients = await Patient.create([
      {
        firstName: "Vikram",
        lastName: "Das",
        dateOfBirth: new Date("1978-04-12"), // 46 years old
        gender: "Male",
        contactNumber: "9876500001",
        bloodGroup: "B+",
        address: "Flat 402, Green Valley Apts, Bangalore",
        lastVisit: new Date()
      },
      {
        firstName: "Anjali",
        lastName: "Mehta",
        dateOfBirth: new Date("1995-11-23"),
        gender: "Female",
        contactNumber: "9876500002",
        bloodGroup: "O+",
        address: "15, MG Road, Mumbai",
        lastVisit: new Date()
      }
    ]);

    const [vikram, anjali] = patients;

    // ==============================================================================
    // PATIENT 1: VIKRAM DAS (The "Best Input" for AI Testing)
    // Scenario: Metabolic Syndrome (BP + Diabetes) + Recent Accident + Drug Allergy
    // ==============================================================================

    console.log(`Creating deep history for ${vikram.firstName}...`);

    // --- A. Medical History (5 Records: Chronic & Acute) ---
    await MedicalHistory.create([
      {
        patientId: vikram._id,
        conditionName: "Essential Hypertension",
        type: "Chronic",
        diagnosisDate: new Date("2019-06-15"),
        description: "Diagnosed during routine checkup. Hereditary factors present.",
        prescribedMedications: [{ drugName: "Telmisartan 40mg", dosage: "40mg", duration: "Ongoing" }]
      },
      {
        patientId: vikram._id,
        conditionName: "Type 2 Diabetes Mellitus",
        type: "Chronic",
        diagnosisDate: new Date("2021-03-10"),
        description: "High HbA1c (7.8%). Advised lifestyle changes.",
        prescribedMedications: [{ drugName: "Metformin 500mg", dosage: "500mg", duration: "Ongoing" }]
      },
      {
        patientId: vikram._id,
        conditionName: "Acute Gastritis",
        type: "Acute",
        diagnosisDate: new Date("2022-11-05"),
        description: "Severe stomach pain after consuming spicy food.",
        prescribedMedications: [{ drugName: "Pantoprazole 40mg", dosage: "40mg", duration: "5 Days" }]
      },
      {
        patientId: vikram._id,
        conditionName: "Hairline Fracture (Right Tibia)",
        type: "Surgery",
        diagnosisDate: new Date("2023-08-20"),
        description: "Minor bike slip. Cast applied for 4 weeks.",
        prescribedMedications: [{ drugName: "Calcium + Vit D3", dosage: "500mg", duration: "30 Days" }]
      },
      {
        patientId: vikram._id,
        conditionName: "Seasonal Viral Fever",
        type: "Acute",
        diagnosisDate: new Date("2024-01-10"),
        description: "High fever with chills and body ache.",
        prescribedMedications: [{ drugName: "Dolo 650mg", dosage: "650mg", duration: "3 Days" }]
      }
    ]);

    await Allergy.create([
      {
        patientId: vikram._id,
        allergen: "Penicillin",
        severity: "Severe",
        reaction: "Anaphylactic Shock",
        detectedDate: new Date("2010-02-14")
      },
      {
        patientId: vikram._id,
        allergen: "Shellfish",
        severity: "Moderate",
        reaction: "Hives and Itching",
        detectedDate: new Date("2018-05-20")
      }
    ]);

   
    await Prescription.create({
      patientId: vikram._id,
      doctorId: "Dr. A. Verma",
      visitDate: new Date("2021-03-10"),
      vitals: { weight: "82 kg", bloodPressure: "145/90", temperature: "98.6 F", spo2: "98%" },
      chiefComplaints: ["Excessive thirst", "Frequent urination", "Fatigue"],
      diagnosis: "New Onset Type 2 Diabetes",
      clinicalNotes: "Patient presents with classic symptoms of hyperglycemia. Random blood sugar 240 mg/dL.",
      medications: [
        { name: "Metformin", dosage: "500mg", frequency: "1-0-1", duration: "30 Days", instruction: "After Food" }
      ],
      advice: "Strict diabetic diet. Avoid sugar and processed carbs. Walk 30 mins daily."
    });

   
    await Prescription.create({
      patientId: vikram._id,
      doctorId: "Dr. S. Kavin",
      visitDate: new Date("2022-11-05"),
      vitals: { weight: "80 kg", bloodPressure: "130/85", temperature: "99 F", spo2: "99%" },
      chiefComplaints: ["Burning sensation in stomach", "Nausea"],
      diagnosis: "Acute Gastritis",
      clinicalNotes: "Epigastric tenderness present. Bowel sounds normal.",
      medications: [
        { name: "Pantoprazole", dosage: "40mg", frequency: "1-0-0", duration: "5 Days", instruction: "Before Breakfast" },
        { name: "Sucralfate Syrup", dosage: "10ml", frequency: "1-1-1", duration: "5 Days", instruction: "Before Food" }
      ],
      advice: "Avoid spicy and oily foods. Eat small, frequent meals."
    });

  
    await Prescription.create({
      patientId: vikram._id,
      doctorId: "Dr. R. Bones",
      visitDate: new Date("2023-08-20"),
      vitals: { weight: "79 kg", bloodPressure: "135/85", temperature: "98.6 F", spo2: "99%" },
      chiefComplaints: ["Severe leg pain", "Swelling", "Inability to walk"],
      diagnosis: "Right Tibia Hairline Fracture",
      clinicalNotes: "X-ray confirms non-displaced fracture. Cast applied.",
      medications: [
        { name: "Zerodol-P", dosage: "Tablet", frequency: "1-0-1", duration: "5 Days", instruction: "After Food" },
        { name: "Shelcal-500", dosage: "500mg", frequency: "0-1-0", duration: "30 Days", instruction: "After Food" }
      ],
      advice: "Complete bed rest for 1 week. Keep leg elevated."
    });

   
    await Prescription.create({
      patientId: vikram._id,
      doctorId: "Dr. A. Verma",
      visitDate: new Date("2023-10-15"),
      vitals: { weight: "81 kg", bloodPressure: "128/82", temperature: "98.4 F", spo2: "99%" },
      chiefComplaints: ["Routine Checkup"],
      diagnosis: "Hypertension (Managed)",
      clinicalNotes: "BP is under control. Medication adherence is good.",
      medications: [
        { name: "Telmisartan", dosage: "40mg", frequency: "1-0-0", duration: "60 Days", instruction: "Morning" }
      ],
      advice: "Continue current medication. Yearly lipid profile recommended."
    });

    
    await Prescription.create({
      patientId: vikram._id,
      doctorId: "Dr. S. Kavin",
      visitDate: new Date("2024-01-10"),
      vitals: { weight: "80 kg", bloodPressure: "130/80", temperature: "102 F", spo2: "97%" },
      chiefComplaints: ["High Fever", "Shivering", "Headache"],
      diagnosis: "Viral Pyrexia",
      clinicalNotes: "Chest clear. Throat slightly congested. No signs of dengue.",
      medications: [
        { name: "Dolo 650", dosage: "650mg", frequency: "1-1-1", duration: "3 Days", instruction: "After Food" },
        { name: "Cetzine", dosage: "10mg", frequency: "0-0-1", duration: "3 Days", instruction: "At Night" }
      ],
      advice: "Hydration is key. Drink 3L water. Isolate if symptoms persist."
    });

    
    await Vital.create([
      { patientId: vikram._id, recordedDate: new Date("2023-01-15"), bpSystolic: 150, bpDiastolic: 95, heartRate: 80, weight: 83, spO2: 98, notes: "BP High" },
      { patientId: vikram._id, recordedDate: new Date("2023-04-20"), bpSystolic: 140, bpDiastolic: 90, heartRate: 78, weight: 82, spO2: 98, notes: "BP improving" },
      { patientId: vikram._id, recordedDate: new Date("2023-08-20"), bpSystolic: 135, bpDiastolic: 85, heartRate: 85, weight: 80, spO2: 99, notes: "Post-accident stress" },
      { patientId: vikram._id, recordedDate: new Date("2023-11-10"), bpSystolic: 130, bpDiastolic: 82, heartRate: 72, weight: 81, spO2: 98, notes: "Stable" },
      { patientId: vikram._id, recordedDate: new Date("2024-01-10"), bpSystolic: 128, bpDiastolic: 80, heartRate: 90, weight: 80, spO2: 97, notes: "Fever detected" }
    ]);

    
    await Prescription.create({
      patientId: anjali._id,
      doctorId: "Dr. S. Kavin",
      visitDate: new Date(),
      vitals: { weight: "60 kg", bloodPressure: "110/70", temperature: "98.6 F", spo2: "99%" },
      chiefComplaints: ["Migraine"],
      diagnosis: "Migraine Headache",
      medications: [{ name: "Naproxen", dosage: "500mg", frequency: "SOS", duration: "5 Days", instruction: "After Food" }]
    });

    console.log(" Database Seeded with 'Best Input' Data!");
    console.log(" Check Patient: Vikram Das for full history.");
    process.exit();
    
  } catch (err) {
    console.error(" Seeding Error:", err);
    process.exit(1);
  }
};

seedData();