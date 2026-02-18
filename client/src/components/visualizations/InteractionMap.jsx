import React, { useState } from 'react';
import axios from 'axios';
import { PlusCircle, AlertCircle, Loader2 } from 'lucide-react';

const PrescriptionForm = ({ patientId, onRefresh }) => {
  // --- Logic State (Unchanged) ---
  const [formData, setFormData] = useState({
    drugName: '',
    dosage: '',
    frequency: 'Once Daily',
    category: 'Prescription'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // 1. Add to Medications
      await axios.post(`http://localhost:5000/api/patients/${patientId}/medications`, {
        drugName: formData.drugName,
        dosage: formData.dosage,
        frequency: formData.frequency,
        startDate: new Date()
      });

      // 2. Add to Timeline
      await axios.post(`http://localhost:5000/api/patients/${patientId}/timeline`, {
        title: `Prescribed ${formData.drugName}`,
        date: new Date(),
        description: `Dosage: ${formData.dosage}, Freq: ${formData.frequency}`,
        category: 'Prescription'
      });

      // Reset & Refresh
      setFormData({ drugName: '', dosage: '', frequency: 'Once Daily', category: 'Prescription' });
      if (onRefresh) onRefresh();

    } catch (err) {
      setError('Failed to save prescription. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // --- Styles ---
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";
  const inputClass = "w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all";

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
      
      {/* Header */}
      <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
        <PlusCircle size={20} className="text-blue-600" />
        New Prescription
      </h3>
      
      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4 text-sm flex items-center gap-2">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        
        {/* Drug Name */}
        <div>
          <label className={labelClass}>Drug Name</label>
          <input
            name="drugName"
            type="text"
            required
            placeholder="e.g. Amoxicillin"
            className={inputClass}
            value={formData.drugName}
            onChange={handleChange}
          />
        </div>

        {/* Grid for Dosage & Frequency */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Dosage</label>
            <input
              name="dosage"
              type="text"
              required
              placeholder="e.g. 500mg"
              className={inputClass}
              value={formData.dosage}
              onChange={handleChange}
            />
          </div>
          <div>
            <label className={labelClass}>Frequency</label>
            <select
              name="frequency"
              className={inputClass}
              value={formData.frequency}
              onChange={handleChange}
            >
              <option>Once Daily</option>
              <option>Twice Daily</option>
              <option>Every 8 Hours</option>
              <option>As Needed</option>
            </select>
          </div>
        </div>

        {/* Action Button */}
        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors flex items-center justify-center gap-2 mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" /> Processing...
            </>
          ) : (
            'Add Prescription'
          )}
        </button>
      </form>
    </div>
  );
};

export default PrescriptionForm;