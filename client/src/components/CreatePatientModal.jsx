import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Loader2 } from 'lucide-react';

const CreatePatientModal = ({ isOpen, onClose, onSuccess, initialPhone }) => {
  const initialFormState = {
    firstName: '', lastName: '', dateOfBirth: '', gender: 'Male', bloodGroup: 'Unknown',
    contactNumber: '', email: '',
    street: '', city: '', state: '', zipCode: '',
    allergies: '', chronicConditions: ''
  };

  const [formData, setFormData] = useState(initialFormState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && initialPhone) {
      setFormData(prev => ({ ...prev, contactNumber: initialPhone }));
    }
  }, [isOpen, initialPhone]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
        bloodGroup: formData.bloodGroup,
        contactNumber: formData.contactNumber,
        email: formData.email,
        address: {
          street: formData.street,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode
        },
        allergies: formData.allergies ? formData.allergies.split(',').map(s => s.trim()) : [],
        chronicConditions: formData.chronicConditions ? formData.chronicConditions.split(',').map(s => s.trim()) : []
      };

      await axios.post('http://localhost:5000/api/patients', payload);
      
      onSuccess();
      onClose();
      setFormData(initialFormState);

    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create patient.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh]">

        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-800">New Patient</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-md border border-red-100">
              {error}
            </div>
          )}

          <form id="create-patient-form" onSubmit={handleSubmit} className="space-y-6">

            <div>
              <h3 className="font-bold text-gray-900 mb-3 border-b border-gray-100 pb-1">Personal Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>First Name *</label>
                  <input name="firstName" required className={inputClass} onChange={handleChange} value={formData.firstName} />
                </div>
                <div>
                  <label className={labelClass}>Last Name *</label>
                  <input name="lastName" required className={inputClass} onChange={handleChange} value={formData.lastName} />
                </div>
                <div>
                  <label className={labelClass}>Date of Birth *</label>
                  <input type="date" name="dateOfBirth" required className={inputClass} onChange={handleChange} value={formData.dateOfBirth} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div>
                      <label className={labelClass}>Gender *</label>
                      <select name="gender" className={inputClass} onChange={handleChange} value={formData.gender}>
                        <option>Male</option><option>Female</option><option>Other</option>
                      </select>
                   </div>
                   <div>
                      <label className={labelClass}>Blood Group</label>
                      <select name="bloodGroup" className={inputClass} onChange={handleChange} value={formData.bloodGroup}>
                        <option>Unknown</option>
                        <option>A+</option><option>A-</option><option>B+</option><option>B-</option>
                        <option>AB+</option><option>AB-</option><option>O+</option><option>O-</option>
                      </select>
                   </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-bold text-gray-900 mb-3 border-b border-gray-100 pb-1">Contact Info</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Phone Number *</label>
                  <input name="contactNumber" required placeholder="+91..." className={inputClass} onChange={handleChange} value={formData.contactNumber} />
                </div>
                <div>
                  <label className={labelClass}>Email</label>
                  <input type="email" name="email" className={inputClass} onChange={handleChange} value={formData.email} />
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-bold text-gray-900 mb-3 border-b border-gray-100 pb-1">Address</h3>
              <div className="space-y-4">
                <div>
                  <label className={labelClass}>Street Address</label>
                  <input name="street" className={inputClass} onChange={handleChange} value={formData.street} />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className={labelClass}>City</label>
                    <input name="city" className={inputClass} onChange={handleChange} value={formData.city} />
                  </div>
                  <div>
                    <label className={labelClass}>State</label>
                    <input name="state" className={inputClass} onChange={handleChange} value={formData.state} />
                  </div>
                  <div>
                    <label className={labelClass}>Zip Code</label>
                    <input name="zipCode" className={inputClass} onChange={handleChange} value={formData.zipCode} />
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-bold text-gray-900 mb-3 border-b border-gray-100 pb-1">Medical History</h3>
              <div className="space-y-4">
                <div>
                  <label className={labelClass}>Allergies (Comma separated)</label>
                  <input name="allergies" placeholder="e.g. Peanuts, Dust" className={inputClass} onChange={handleChange} value={formData.allergies} />
                </div>
                <div>
                  <label className={labelClass}>Chronic Conditions (Comma separated)</label>
                  <input name="chronicConditions" placeholder="e.g. Diabetes" className={inputClass} onChange={handleChange} value={formData.chronicConditions} />
                </div>
              </div>
            </div>

          </form>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 rounded-b-lg">
          <button 
            onClick={onClose}
            type="button" 
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-md transition-colors"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            form="create-patient-form"
            disabled={loading}
            className="px-6 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            {loading ? 'Saving...' : 'Save Patient'}
          </button>
        </div>

      </div>
    </div>
  );
};

export default CreatePatientModal;