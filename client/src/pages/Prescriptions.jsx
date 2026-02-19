import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  Search, Download, FileText, Loader2, Calendar 
} from 'lucide-react';
import moment from 'moment';

const Prescriptions = () => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [downloadingId, setDownloadingId] = useState(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/patients/prescriptions/all');
      setPrescriptions(res.data);
    } catch (err) {
      console.error("Failed to load history", err);
    } finally {
      setLoading(false);
    }
  };


  const handleDownload = async (rxId) => {
    setDownloadingId(rxId);
    try {
      const res = await axios.get(`http://localhost:5000/api/patients/prescription/${rxId}/download`, {
        responseType: 'blob' 
      });
      
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Rx_${rxId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert("Failed to download PDF");
    } finally {
      setDownloadingId(null);
    }
  };


  const filtered = prescriptions.filter(rx => 
    rx.patientId?.firstName.toLowerCase().includes(search.toLowerCase()) ||
    rx.diagnosis.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6">
      

      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Prescriptions</h1>
          <p className="text-gray-500 text-sm">View and download patient records.</p>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 w-64"
          />
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        
        {loading ? (
          <div className="h-64 flex flex-col items-center justify-center text-gray-400">
            <Loader2 size={32} className="animate-spin mb-2 text-blue-500" />
            <span>Loading data...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-gray-400">
            <FileText size={32} className="mb-2" />
            <span>No prescriptions found</span>
          </div>
        ) : (
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 border-b border-gray-200 font-medium text-gray-500 uppercase text-xs">
              <tr>
                <th className="px-6 py-4">Patient Name</th>
                <th className="px-6 py-4">Diagnosis</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((rx) => (
                <tr key={rx._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-bold text-gray-800">
                      {rx.patientId?.firstName} {rx.patientId?.lastName}
                    </p>
                    <p className="text-xs text-gray-400">
                      {rx.patientId?.gender}, {moment().diff(rx.patientId?.dateOfBirth, 'years')} yrs
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-semibold">
                      {rx.diagnosis}
                    </span>
                    <p className="text-xs text-gray-400 mt-1 truncate max-w-[200px]">
                      {rx.medications.map(m => m.name).join(', ')}
                    </p>
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} />
                      {moment(rx.visitDate).format('MMM DD, YYYY')}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => handleDownload(rx._id)}
                      disabled={downloadingId === rx._id}
                      className="text-blue-600 hover:text-blue-800 font-medium text-sm disabled:opacity-50"
                    >
                      {downloadingId === rx._id ? 'Downloading...' : 'Download PDF'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Prescriptions;