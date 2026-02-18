import React from 'react';
import { Calendar, FileText, Pill } from 'lucide-react';

const PatientTimeline = ({ history = [] }) => {
  
  // 1. Empty State
  if (!history || history.length === 0) {
    return (
      <div className="p-8 text-center border-2 border-dashed border-gray-100 rounded-lg bg-gray-50">
        <p className="text-gray-400 text-sm">No medical history recorded.</p>
      </div>
    );
  }

  // 2. Render Simple Timeline
  return (
    <div className="relative border-l-2 border-gray-200 ml-3 space-y-8 my-4">
      {history.map((item, index) => {
        const dateStr = new Date(item.diagnosisDate || item.createdAt).toLocaleDateString();
        
        return (
          <div key={index} className="relative ml-6">
            
            {/* Dot on the Line */}
            <div className="absolute -left-[31px] top-1 h-4 w-4 rounded-full border-2 border-white bg-blue-500 ring-4 ring-gray-50"></div>

            {/* Date Header */}
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold text-gray-500 flex items-center gap-1">
                <Calendar size={12} /> {dateStr}
              </span>
            </div>

            {/* Content Card */}
            <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
              
              <div className="flex justify-between items-start mb-2">
                <h4 className="text-sm font-bold text-gray-900">
                  {item.conditionName || "Visit"}
                </h4>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                  {item.type || "General"}
                </span>
              </div>

              {/* Description */}
              {item.description && (
                <p className="text-sm text-gray-600 mb-3 leading-relaxed">
                  {item.description}
                </p>
              )}

              {/* Medications Section */}
              {item.prescribedMedications && item.prescribedMedications.length > 0 && (
                <div className="bg-blue-50 rounded px-3 py-2 mt-2">
                  <div className="flex items-center gap-1 text-xs font-bold text-blue-700 mb-1">
                    <Pill size={12} /> Prescribed Meds
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {item.prescribedMedications.map((med, idx) => (
                      <span key={idx} className="text-xs text-blue-600 bg-white px-2 py-0.5 rounded border border-blue-100">
                        {med.drugName} <span className="opacity-70">({med.dosage})</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>
        );
      })}
    </div>
  );
};

export default PatientTimeline;