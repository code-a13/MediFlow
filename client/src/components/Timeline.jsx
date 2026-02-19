import React from 'react';
import { 
  Calendar, FileText, Activity, Pill, 
  Stethoscope, CheckCircle, Clock 
} from 'lucide-react';

const PatientTimeline = ({ history }) => {

  if (!history || history.length === 0) {
    return (
      <div className="py-12 flex flex-col items-center justify-center text-gray-400 border border-dashed border-gray-200 rounded-lg bg-gray-50">
        <Activity size={32} className="mb-2 opacity-50" />
        <p className="text-sm">No medical history recorded yet.</p>
      </div>
    );
  }

  const getEventStyle = (type) => {
    switch (type) {
      case 'Prescription': 
        return { icon: <Pill size={16} />, color: 'bg-blue-100 text-blue-600', border: 'border-blue-200' };
      case 'Lab': 
        return { icon: <FileText size={16} />, color: 'bg-teal-100 text-teal-600', border: 'border-teal-200' };
      case 'Surgery': 
        return { icon: <Activity size={16} />, color: 'bg-red-100 text-red-600', border: 'border-red-200' };
      case 'Checkup': 
        return { icon: <Stethoscope size={16} />, color: 'bg-purple-100 text-purple-600', border: 'border-purple-200' };
      default: 
        return { icon: <CheckCircle size={16} />, color: 'bg-gray-100 text-gray-600', border: 'border-gray-200' };
    }
  };

  return (
    <div className="px-4">
      <div className="relative border-l-2 border-gray-200 ml-3 space-y-8">
        
        {history.map((event, index) => {
          const style = getEventStyle(event.type);
          
          return (
            <div key={index} className="relative ml-8">
              
           
              <div className={`absolute -left-[43px] top-0 w-8 h-8 rounded-full border-2 ${style.border} ${style.color} flex items-center justify-center bg-white z-10`}>
                {style.icon}
              </div>

           
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold text-gray-400 flex items-center gap-1 bg-gray-50 px-2 py-0.5 rounded border border-gray-100">
                  <Calendar size={12} />
                  {new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
                <span className="text-xs font-medium text-gray-400 flex items-center gap-1">
                  <Clock size={12} />
                  {new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-gray-800 text-base">{event.title}</h3>
                  <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-full ${style.color}`}>
                    {event.type || 'General'}
                  </span>
                </div>
                
                <p className="text-sm text-gray-600 leading-relaxed">
                  {event.description}
                </p>

                {event.diagnosis && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <span className="text-xs font-semibold text-gray-500">Diagnosis: </span>
                    <span className="text-xs text-gray-700">{event.diagnosis}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}

      </div>
    </div>
  );
};

export default PatientTimeline;