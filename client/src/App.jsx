import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import LoginScreen from './components/LoginScreen';
import AdminPortal from './components/AdminPortal';
import CorePortal from './components/CorePortal';
import VolunteerPortal from './components/VolunteerPortal';
import ParticipantPortal from './components/ParticipantPortal';
import { apiFetch } from './utils/api';

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('arenium_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [serverOnline, setServerOnline] = useState(false);

  useEffect(() => {
    checkServer();
    const interval = setInterval(checkServer, 10000);
    return () => clearInterval(interval);
  }, []);

  const checkServer = async () => {
    try {
      const res = await apiFetch('/system/status');
      if (res && res.status === 'online') {
        setServerOnline(true);
      }
    } catch (e) {
      setServerOnline(false);
    }
  };

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    localStorage.setItem('arenium_user', JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('arenium_user');
  };

  return (
    <div className="min-h-screen bg-[#FBFBFB] text-slate-800 flex flex-col font-sans selection:bg-[#92EEFF] selection:text-slate-900">
      {/* Top Brand Navigation */}
      <Navbar
        currentUser={currentUser}
        onLogout={handleLogout}
        serverOnline={serverOnline}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {!currentUser ? (
          <LoginScreen onLoginSuccess={handleLoginSuccess} />
        ) : currentUser.role === 'ADMIN' ? (
          <AdminPortal currentUser={currentUser} />
        ) : currentUser.role === 'CORE_TEAM' ? (
          <CorePortal currentUser={currentUser} />
        ) : currentUser.role === 'VOLUNTEER' ? (
          <VolunteerPortal currentUser={currentUser} />
        ) : currentUser.role === 'PARTICIPANT' ? (
          <ParticipantPortal currentUser={currentUser} />
        ) : (
          <div className="p-12 text-center">
            <p className="text-sm font-bold text-slate-600">Unrecognized session role.</p>
            <button
              onClick={handleLogout}
              className="mt-4 px-4 py-2 bg-[#30AFFF] text-white rounded-xl text-xs font-bold"
            >
              Sign In Again
            </button>
          </div>
        )}
      </main>

      {/* Light Clean Footer */}
      <footer className="border-t border-slate-200/80 bg-white/80 backdrop-blur-xs py-4 px-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="ARENIUM" className="w-5 h-5 rounded-md object-contain bg-slate-900 p-0.5" />
            <span className="font-black text-slate-900">ARENIUM</span>
            <span>• Presidency University Tech Fest Attendance & OD Engine</span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium">
            <span>Color Palette:</span>
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#30AFFF]" title="#30AFFF"></span>
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#92EEFF]" title="#92EEFF"></span>
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#D8FFC5]" title="#D8FFC5"></span>
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#C4F7CA]" title="#C4F7CA"></span>
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#FBFBFB] border border-slate-300" title="#FBFBFB"></span>
          </div>
        </div>
      </footer>
    </div>
  );
}
