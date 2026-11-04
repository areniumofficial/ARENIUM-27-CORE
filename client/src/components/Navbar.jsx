import React, { useState } from 'react';
import { Shield, Users, UserCheck, Award, LogOut, Zap, Smartphone, Sparkles } from 'lucide-react';
import PhoneConnectModal from './PhoneConnectModal';

export default function Navbar({ currentUser, onLogout, onQuickSwitch, serverOnline }) {
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

  const QUICK_PERSONAS = [
    { label: 'Admin (Prof. Keren)', role: 'ADMIN', email: 'kerenlois@presidencyuniversity.in', pass: 'Kerensois27' },
    { label: 'Admin (Abhyas)', role: 'ADMIN', email: 'Kathuriaabhyas0@gmail.com', pass: 'Abhyas2108' },
    { label: 'Core (Kaushal)', role: 'CORE_TEAM', email: 'singhkaushal.2507@gmail.com', pass: 'Kaush2507' },
    { label: 'Volunteer (Rohan)', role: 'VOLUNTEER', email: 'volunteer1@arenium.com', pass: 'Vol123' },
    { label: 'Team: CyberKnights', role: 'PARTICIPANT', teamName: 'CyberKnights' },
    { label: 'Team: QuantumForge', role: 'PARTICIPANT', teamName: 'QuantumForge' }
  ];

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        
        {/* Top Demo Quick-Persona Bar (Touch-scrollable on phone) */}
        <div className="bg-gradient-to-r from-[#92EEFF]/15 via-[#FBFBFB] to-[#D8FFC5]/20 border-b border-slate-200/60 px-3 sm:px-4 py-1.5 overflow-x-auto no-scrollbar touch-pan-x">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-2.5 text-[11px]">
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="flex items-center gap-1 font-bold text-slate-700 uppercase tracking-wider text-[10px] bg-white px-2 py-0.5 rounded-full border border-slate-200 shadow-2xs">
                <Sparkles className="w-3 h-3 text-[#30AFFF]" />
                Switch Role:
              </span>
            </div>

            <div className="flex items-center gap-1.5 shrink-0 overflow-x-auto py-0.5">
              {QUICK_PERSONAS.map((p, idx) => {
                const isActive = currentUser && (
                  (p.role === 'PARTICIPANT' && currentUser.role === 'PARTICIPANT' && currentUser.teamName === p.teamName) ||
                  (p.email && currentUser.email === p.email)
                );

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => onQuickSwitch(p)}
                    className={`px-2.5 py-1 rounded-full font-semibold transition-all border text-[11px] whitespace-nowrap active:scale-95 ${
                      isActive
                        ? 'bg-[#30AFFF] text-white border-[#30AFFF] shadow-xs'
                        : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200'
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>

            {/* Mobile / Tablet QR Link button */}
            <button
              onClick={() => setPhoneModalOpen(true)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#92EEFF]/30 hover:bg-[#92EEFF]/50 text-sky-950 font-bold border border-[#92EEFF]/60 text-[10px] uppercase tracking-wider shrink-0 transition-colors shadow-2xs"
              title="Show QR Code to open on phone/tablet"
            >
              <Smartphone className="w-3 h-3 text-[#006dae]" />
              <span className="hidden sm:inline">Phone/Tablet Link</span>
              <span className="sm:hidden">📱 Phone</span>
            </button>
          </div>
        </div>

        {/* Main Navbar */}
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-15 sm:h-17 flex items-center justify-between">
          
          {/* Brand */}
          <div className="flex items-center gap-2.5">
            <div className="relative flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-[#30AFFF] via-[#92EEFF] to-[#D8FFC5] shadow-xs shadow-[#30AFFF]/20 border border-white shrink-0">
              <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-slate-900 fill-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-lg sm:text-xl font-black tracking-tight text-slate-900">
                  ARENIUM <span className="text-[#30AFFF]">27</span>
                </span>
                <span className="text-[9px] sm:text-[10px] font-extrabold tracking-widest uppercase bg-[#30AFFF]/15 text-[#006dae] px-1.5 py-0.5 rounded-md border border-[#30AFFF]/30">
                  CORE
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
