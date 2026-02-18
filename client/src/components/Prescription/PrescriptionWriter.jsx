import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Plus, Trash2, Save, Loader2, Sparkles, AlertCircle 
} from 'lucide-react';

// Debounce helper
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
};

const PrescriptionWriter = ({ onSave, isSaving }) => {
  // --- STATE ---
  const [vitals, setVitals] = useState({ weight: '', bp: '', temp: '', spo2: '', pulse: '' });
  const [diagnosis, setDiagnosis] = useState('');
  const [symptoms, setSymptoms] = useState('');
  
  const [meds, setMeds] = useState([]);
  const [form, setForm] = useState({ name: '', dosage: '', freq: '1-0-1', dur: '5 Days' });
  
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const debouncedSymptoms = useDebounce(symptoms, 1500);

  // --- AI TRIGGER ---
  useEffect(() => {
    if (debouncedSymptoms.length > 5) {
      fetchAiSuggestions(debouncedSymptoms);
    }
  }, [debouncedSymptoms]);

  const fetchAiSuggestions = async (text) => {
    setIsAiThinking(true);
    try {
      const res = await axios.post('http://localhost:5000/api/ai/suggest-rx', { description: text });
      if (res.data.suggestions?.length > 0) {
        setAiSuggestions(res.data.suggestions.map((s, i) => ({ ...s, id: Date.now() + i })));
      }
    } catch (err) {
      console.warn("AI Silent Fail");
    } finally {
      setIsAiThinking(false);
    }
  };

  // --- HANDLERS ---
  const addMed = (med) => {
    if (!med.name) return;
    setMeds([...meds, { ...med, id: Date.now() }]);
    if (med === form) setForm({ name: '', dosage: '', freq: '1-0-1', dur: '5 Days' });
  };

  const handleFinalSave = () => {
    const payload = {
      medications: meds,
      diagnosis: diagnosis || "General",
      symptoms: symptoms.split(',').map(s => s.trim()),
      vitals
    };
    onSave(payload);
  };

  // --- STYLES ---
  const inputClass = "w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white shadow-sm rounded-lg border border-gray-200">
      
      {/* 1. Vitals Section */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-100">
        <h3 className="text-sm font-bold text-gray-700 uppercase mb-3">Vitals</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div><label className="text-xs text-gray-500">Weight (kg)</label><input className={inputClass} value={vitals.weight} onChange={e=>setVitals({...vitals, weight: e.target.value})} /></div>
          <div><label className="text-xs text-gray-500">BP (mmHg)</label><input className={inputClass} value={vitals.bp} onChange={e=>setVitals({...vitals, bp: e.target.value})} /></div>
          <div><label className="text-xs text-gray-500">Temp (F)</label><input className={inputClass} value={vitals.temp} onChange={e=>setVitals({...vitals, temp: e.target.value})} /></div>
          <div><label className="text-xs text-gray-500">Pulse (bpm)</label><input className={inputClass} value={vitals.pulse} onChange={e=>setVitals({...vitals, pulse: e.target.value})} /></div>
          <div><label className="text-xs text-gray-500">SpO2 (%)</label><input className={inputClass} value={vitals.spo2} onChange={e=>setVitals({...vitals, spo2: e.target.value})} /></div>
        </div>
      </div>

      {/* 2. Clinical Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <label className={labelClass}>Diagnosis</label>
          <input 
            className={inputClass} 
            placeholder="e.g. Viral Fever" 
            value={diagnosis} 
            onChange={e => setDiagnosis(e.target.value)} 
          />
        </div>
        <div>
          <label className={labelClass}>
            Symptoms 
            {isAiThinking && <span className="ml-2 text-xs text-blue-500 animate-pulse">AI thinking...</span>}
          </label>
          <textarea 
            className={`${inputClass} h-24 resize-none`} 
            placeholder="Patient complaints..." 
            value={symptoms} 
            onChange={e => setSymptoms(e.target.value)} 
          />
          
          {/* AI Suggestions List */}
          {aiSuggestions.length > 0 && (
            <div className="mt-2 space-y-1">
              <p className="text-xs font-bold text-blue-600 flex items-center gap-1"><Sparkles size={10}/> AI Suggestions:</p>
              <div className="flex flex-wrap gap-2">
                {aiSuggestions.map((s, i) => (
                  <button key={i} onClick={() => addMed(s)} className="text-xs bg-blue-50 text-blue-700 border border-blue-100 px-2 py-1 rounded hover:bg-blue-100">
                    + {s.name} ({s.dosage})
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. Add Medication */}
      <div className="mb-6 border-t border-gray-100 pt-4">
        <h3 className={labelClass}>Add Medication</h3>
        <div className="flex flex-col md:flex-row gap-2">
          <input className={`${inputClass} flex-[2]`} placeholder="Drug Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
          <input className={`${inputClass} flex-1`} placeholder="Dosage (e.g. 500mg)" value={form.dosage} onChange={e => setForm({...form, dosage: e.target.value})} />
          <select className={`${inputClass} flex-1`} value={form.freq} onChange={e => setForm({...form, freq: e.target.value})}>
            <option>1-0-1</option><option>1-0-0</option><option>0-0-1</option><option>SOS</option>
          </select>
          <input className={`${inputClass} flex-1`} placeholder="Duration" value={form.dur} onChange={e => setForm({...form, dur: e.target.value})} />
          <button onClick={() => addMed(form)} className="bg-gray-800 text-white px-4 py-2 rounded hover:bg-black flex items-center justify-center">
            <Plus size={18} />
          </button>
        </div>
      </div>

      {/* 4. Medication List Table */}
      <div className="mb-6 border rounded-lg overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-500 border-b">
            <tr>
              <th className="p-3">Drug Name</th>
              <th className="p-3">Dosage</th>
              <th className="p-3">Freq</th>
              <th className="p-3">Duration</th>
              <th className="p-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {meds.length === 0 ? (
              <tr><td colSpan="5" className="p-4 text-center text-gray-400">No medications added.</td></tr>
            ) : (
              meds.map((m, i) => (
                <tr key={i}>
                  <td className="p-3 font-medium">{m.name}</td>
                  <td className="p-3">{m.dosage}</td>
                  <td className="p-3">{m.freq}</td>
                  <td className="p-3">{m.dur}</td>
                  <td className="p-3 text-right">
                    <button onClick={() => setMeds(meds.filter(x => x.id !== m.id))} className="text-red-500 hover:text-red-700">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 5. Footer Actions */}
      <div className="flex justify-end gap-4 border-t border-gray-100 pt-4">
        <div className="mr-auto flex items-center gap-2 text-xs text-amber-600 bg-amber-50 px-3 py-1 rounded border border-amber-100">
           <AlertCircle size={12} /> Auto-safety check enabled
        </div>
        <button 
          onClick={handleFinalSave}
          disabled={meds.length === 0 || isSaving}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded font-medium flex items-center gap-2 disabled:opacity-50"
        >
          {isSaving ? <Loader2 size={18} className="animate-spin"/> : <Save size={18}/>}
          Save Prescription
        </button>
      </div>

    </div>
  );
};

export default PrescriptionWriter;