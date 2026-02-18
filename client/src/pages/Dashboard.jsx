import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { 
  Search, UserPlus, ArrowRight, Activity, Users, FileText, Zap 
} from 'lucide-react';
import CreatePatientModal from '../components/CreatePatientModal';

const Dashboard = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [recentPatients, setRecentPatients] = useState([]);
  const [stats, setStats] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // --- Logic Remains Unchanged ---
  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const recentsRes = await axios.get('http://localhost:5000/api/patients');
      setRecentPatients(recentsRes.data);
    } catch (err) {
      console.error("Failed to load patients:", err);
    }

    try {
      const overviewRes = await axios.get('http://localhost:5000/api/ai/overview');
      setStats(overviewRes.data);
    } catch (err) {
      console.warn("AI Service offline.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async (e) => {
    const val = e.target.value;
    setQuery(val);
    if (val.length > 2) {
      try {
        const res = await axios.get(`http://localhost:5000/api/patients/search?query=${val}`);
        setSearchResults(res.data);
      } catch (err) { console.error(err); }
    } else {
      setSearchResults([]);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-gray-800">
      
      {/* 1. Header & Search Row */}
      <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-gray-500 text-sm">Welcome back, Dr. Sarah.</p>
        </div>

        {/* Simple Search Input */}
        <div className="relative w-full md:w-96">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
              placeholder="Search patient by name..."
              value={query}
              onChange={handleSearch}
            />
          </div>

          {/* Search Dropdown */}
          {query.length > 2 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 z-50 overflow-hidden">
              {searchResults.length > 0 ? (
                <ul>
                  {searchResults.map(p => (
                    <li key={p._id} onClick={() => navigate(`/patients/${p._id}`)} className="p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer flex justify-between items-center text-sm">
                      <span className="font-medium">{p.firstName} {p.lastName}</span>
                      <span className="text-gray-400 text-xs">{p.contactNumber}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="p-3 text-center">
                  <button onClick={() => setIsModalOpen(true)} className="text-sm text-blue-600 font-medium hover:underline">
                    + Add New Patient
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 2. Stats Grid */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3 mb-1">
              <Users size={18} className="text-blue-600" />
              <span className="text-xs font-bold text-gray-500 uppercase">Total Patients</span>
            </div>
            <p className="text-2xl font-bold">{stats.stats.total_patients}</p>
          </div>

          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3 mb-1">
              <Activity size={18} className="text-green-600" />
              <span className="text-xs font-bold text-gray-500 uppercase">Visits Today</span>
            </div>
            <p className="text-2xl font-bold">{stats.stats.today_visits}</p>
          </div>

          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3 mb-1">
              <FileText size={18} className="text-purple-600" />
              <span className="text-xs font-bold text-gray-500 uppercase">Prescriptions</span>
            </div>
            <p className="text-2xl font-bold">{stats.stats.total_prescriptions}</p>
          </div>

          {/* Simple AI Card */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 shadow-sm flex flex-col justify-center">
             <div className="flex items-center gap-2 mb-1 text-blue-800">
               <Zap size={16} />
               <span className="text-xs font-bold uppercase">AI Insight</span>
             </div>
             <p className="text-sm font-medium text-blue-900">{stats.ai_insight.trend}</p>
             <p className="text-xs text-blue-600 mt-1">{stats.ai_insight.alert}</p>
          </div>
        </div>
      )}

      {/* 3. Recent Patients Table */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="font-bold text-lg">Recent Patients</h2>
          <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-1 text-sm bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700 transition-colors">
            <UserPlus size={16} /> Add Patient
          </button>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-500 font-medium">
              <tr>
                <th className="px-6 py-3">Name</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Last Visit</th>
                <th className="px-6 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recentPatients.length === 0 ? (
                <tr><td colSpan="4" className="p-6 text-center text-gray-400">No patients found.</td></tr>
              ) : (
                recentPatients.map(p => (
                  <tr key={p._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3 font-medium text-gray-900">
                      {p.firstName} {p.lastName}
                    </td>
                    <td className="px-6 py-3">
                      <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-2"></span>
                      Active
                    </td>
                    <td className="px-6 py-3 text-gray-500">
                      {p.lastVisit ? new Date(p.lastVisit).toLocaleDateString() : 'New'}
                    </td>
                    <td className="px-6 py-3 text-right">
                      <button 
                        onClick={() => navigate(`/patients/${p._id}`)}
                        className="text-blue-600 hover:text-blue-800 font-medium flex items-center justify-end gap-1 ml-auto"
                      >
                        View <ArrowRight size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      <CreatePatientModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => { loadDashboardData(); setQuery(''); }}
        initialPhone={query}
      />
    </div>
  );
};

export default Dashboard;