import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Users, FileText, Plus, 
  LogOut, Search, User
} from 'lucide-react';
import Dashboard from './pages/Dashboard';
import PatientProfile from './pages/PatientProfile';
import Prescriptions from './pages/Prescriptions';
import CreatePatientModal from './components/CreatePatientModal';

// --- Simple Sidebar ---
const Sidebar = ({ onOpenNew }) => {
  const location = useLocation();

  const menu = [
    { icon: <LayoutDashboard size={20} />, label: 'Dashboard', path: '/' },
    { icon: <Users size={20} />, label: 'Patients', path: '/patients' },
    { icon: <FileText size={20} />, label: 'Prescriptions', path: '/rx' },
  ];

  return (
    <aside className="w-64 h-screen bg-white border-r border-gray-200 flex flex-col fixed left-0 top-0 z-20">
      {/* Logo Area */}
      <div className="h-16 flex items-center px-6 border-b border-gray-100">
        <h1 className="text-lg font-bold text-gray-800">MediFlow</h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {menu.map((item) => {
          const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
          return (
            <Link 
              key={item.path} 
              to={item.path} 
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                isActive 
                  ? 'bg-blue-50 text-blue-700' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              {item.icon} 
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 border border-gray-200">
            <User size={16} />
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-semibold text-gray-700 truncate">Dr. Sarah Smith</p>
            <p className="text-xs text-gray-500 truncate">Cardiology</p>
          </div>
          <button className="text-gray-400 hover:text-red-500 transition-colors">
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </aside>
  );
};

function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0); 

  const handleSuccess = () => {
    setRefreshKey(old => old + 1); 
  };

  return (
    <Router>
      <div className="flex min-h-screen bg-gray-50 font-sans text-gray-900">
        <Sidebar onOpenNew={() => setIsModalOpen(true)} />
        
        {/* Main Content Wrapper */}
        <div className="flex-1 ml-64 flex flex-col min-w-0">

          {/* Scrollable Content Area */}
          <main className="flex-1 p-8 overflow-y-auto">
            <div className="max-w-6xl mx-auto">
              <Routes>
                <Route path="/" element={<Dashboard key={refreshKey} />} />
                <Route path="/patients" element={<Dashboard key={refreshKey} />} />
                <Route path="/patients/:id" element={<PatientProfile />} />
                <Route path="/rx" element={<Prescriptions />} />
              </Routes>
            </div>
          </main>
        </div>

        <CreatePatientModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          onSuccess={handleSuccess} 
        />
      </div>
    </Router>
  );
}

export default App;