import React, { useState } from 'react';
import { Shield, Users, UserCheck, Award, LogOut, Smartphone } from 'lucide-react';
import PhoneConnectModal from './PhoneConnectModal';

export default function Navbar({ currentUser, onLogout, serverOnline }) {
  const [phoneModalOpen, setPhoneModalOpen] = useState(false);

  const getRoleBadge = (role) => {
    switch (role) {
      case 'ADMIN':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <Shield className="w-3 h-3 text-rose-500" />
            ADMIN
          </span>
        );
      case 'CORE_TEAM':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#30AFFF]/10 text-[#006dae] border border-[#30AFFF]/30">
            <Award className="w-3 h-3 text-[#30AFFF]" />
            CORE
          </span>
        );
      case 'VOLUNTEER':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#D8FFC5]/70 text-emerald-900 border border-[#C4F7CA]">
            <UserCheck className="w-3 h-3 text-emerald-600" />
            VOLUNTEER
          </span>
        );
      case 'PARTICIPANT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#92EEFF]/25 text-sky-900 border border-[#92EEFF]/60">
            <Users className="w-3 h-3 text-sky-600" />
            TEAM
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        
        {/* Main Navbar */}
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-15 sm:h-17 flex items-center justify-between">
          
          {/* Brand */}
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="ARENIUM"
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl object-contain shadow-sm shrink-0 bg-slate-900 p-0.5"
            />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-lg sm:text-xl font-black tracking-tight text-slate-900">
                  ARENIUM
                </span>
                <span className="text-[9px] sm:text-[10px] font-extrabold tracking-widest uppercase bg-[#30AFFF]/15 text-[#006dae] px-1.5 py-0.5 rounded-md border border-[#30AFFF]/30">
                  PORTAL
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium line-clamp-1">
                Attendance & OD Platform
              </p>
            </div>
          </div>

          {/* User state & Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {currentUser ? (
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <span className="text-xs sm:text-sm font-bold text-slate-800 max-w-[120px] sm:max-w-none truncate">
                      {currentUser.name || currentUser.teamName}
                    </span>
                    {getRoleBadge(currentUser.role)}
                  </div>
                  <div className="text-[10px] sm:text-xs text-slate-400 truncate max-w-[140px] sm:max-w-[200px] hidden sm:block">
                    {currentUser.role === 'PARTICIPANT'
                      ? `Team: ${currentUser.teamName}`
                      : currentUser.email || currentUser.rollNumber}
                  </div>
                </div>

                {/* Direct Link to Main Fest Website */}
                <a
                  href={typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') ? 'http://localhost:8000' : 'https://kaushal-13-23.github.io/Arenium/'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-[#30AFFF]/10 text-[#006dae] hover:bg-[#30AFFF]/20 border border-[#30AFFF]/30 transition-all shadow-2xs"
                  title="Open ARENIUM 27 Tech Fest Public Website (Student Registration & Pass Portal)"
                >
                  <span>🌐</span>
                  <span>Fest Website</span>
                </a>

                {/* Mobile / Tablet QR modal trigger */}
                <button
                  onClick={() => setPhoneModalOpen(true)}
                  className="hidden md:flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors"
                >
                  <Smartphone className="w-3.5 h-3.5 text-[#006dae]" />
                  <span>Connect Phone</span>
                </button>

                {/* Logout Button */}
                <button
                  onClick={onLogout}
                  title="Sign out or select different role"
                  className="flex items-center gap-1 p-2 sm:px-3 sm:py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-50 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 border border-slate-200 transition-all shadow-2xs"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => setPhoneModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 hover:bg-slate-100"
              >
                <Smartphone className="w-3.5 h-3.5 text-[#006dae]" />
                <span className="text-[11px]">Phone QR</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Phone & Tablet QR Connect Modal */}
      <PhoneConnectModal
        isOpen={phoneModalOpen}
        onClose={() => setPhoneModalOpen(false)}
      />
    </>
  );
}
