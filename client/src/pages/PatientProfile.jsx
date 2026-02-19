import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, User, Phone, AlertCircle, Check, Brain } from 'lucide-react';
import PatientTimeline from '../components/visualizations/PatientTimeline'; 
import PrescriptionWriter from '../components/Prescription/PrescriptionWriter';

const PatientProfile = () => {
  const { id } = useParams();
  const [patient, setPatient] = useState(null);
  const [activeTab, setActiveTab] = useState('prescribe');
  const [loading, setLoading] = useState(true);
  const [aiReport, setAiReport] = useState(null);
  const [isSaving, setIsSaving] = useState(false);


  useEffect(() => {
    const loadData = async () => {
      try {
        const pRes = await axios.get(`http://localhost:5000/api/patients/${id}`);
        setPatient(pRes.data);

        axios.post('http://localhost:5000/api/ai/summary', { patientId: id })
             .then(res => setAiReport(res.data))
             .catch(err => console.log("AI not available"));
             
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id]);

  const handlePrescriptionSave = async (rxData) => {
    setIsSaving(true);
    try {
      try {
          const safetyRes = await axios.post('http://localhost:5000/api/ai/safety-check', {
            patientId: id, 
            medications: rxData.medications
          });
          
          if (safetyRes.data && !safetyRes.data.safe) {
             const proceed = window.confirm(`Safety Warning: Potential interaction detected.\n\nPrescribe anyway?`);
             if (!proceed) { setIsSaving(false); return; }
          }
      } catch (e) { console.warn("Safety check skipped"); }

      const res = await axios.post(`http://localhost:5000/api/patients/${id}/prescription`, {
        patientId: id,
        ...rxData
      });

      if (res.data.pdfBase64) {
        const bytes = Uint8Array.from(atob(res.data.pdfBase64), c => c.charCodeAt(0));
        const url = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }));
        window.open(url, '_blank');
      }

      alert("Prescription saved successfully!");
      

      const pRes = await axios.get(`http://localhost:5000/api/patients/${id}`);
      setPatient(pRes.data);

    } catch (err) {
      alert("Error saving prescription.");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-gray-500">Loading patient record...</div>;
  if (!patient) return <div className="p-8">Patient not found.</div>;

  return (
    <div className="max-w-5xl mx-auto p-6 font-sans text-gray-800">
      
      <Link to="/patients" className="inline-flex items-center text-sm text-gray-500 hover:text-blue-600 mb-6">
        <ArrowLeft size={16} className="mr-1" /> Back to Registry
      </Link>

      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm mb-6">
        <div className="flex justify-between items-start">
          <div className="flex gap-4">
           
            <div className="w-16 h-16 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-2xl font-bold">
              {patient.firstName?.[0]}{patient.lastName?.[0]}
            </div>
            
            <div>
              <h1 className="text-2xl font-bold">{patient.firstName} {patient.lastName}</h1>
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mt-1">
                <span>{new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear()} Years Old</span>
                <span>{patient.gender}</span>
                <span className="flex items-center gap-1"><Phone size={14}/> {patient.contactNumber}</span>
              </div>
            </div>
          </div>

          <div>
            {patient.allergies?.length > 0 ? (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-50 text-red-700 rounded-full text-xs font-bold border border-red-100">
                <AlertCircle size={12} /> {patient.allergies.map(a => a.allergen).join(', ')}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-bold border border-green-100">
                <Check size={12} /> No Allergies
              </span>
            )}
          </div>
        </div>

        {aiReport && (
          <div className="mt-6 p-4 bg-blue-50 text-blue-900 rounded-md text-sm border border-blue-100 flex gap-3">
             <Brain size={20} className="shrink-0 mt-0.5" />
             <div>
               <strong className="block mb-1">AI Clinical Summary</strong>
               <p className="opacity-90 leading-relaxed">{aiReport.summary}</p>
             </div>
          </div>
        )}
      </div>

      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-6">
          <button
            onClick={() => setActiveTab('prescribe')}
            className={`pb-3 text-sm font-medium transition-colors ${
              activeTab === 'prescribe' 
                ? 'border-b-2 border-blue-600 text-blue-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Write Prescription
          </button>
          <button
            onClick={() => setActiveTab('timeline')}
            className={`pb-3 text-sm font-medium transition-colors ${
              activeTab === 'timeline' 
                ? 'border-b-2 border-blue-600 text-blue-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Medical History
          </button>
        </nav>
      </div>

      <div className="bg-white min-h-[400px]">
        {activeTab === 'prescribe' ? (
          <PrescriptionWriter 
            onSave={handlePrescriptionSave} 
            isSaving={isSaving} 
          />
        ) : (
          <div className="py-4">
             <h3 className="text-lg font-bold mb-4">Past Visits</h3>
             <PatientTimeline history={patient.medicalHistory} />
          </div>
        )}
      </div>

    </div>
  );
};

export default PatientProfile;