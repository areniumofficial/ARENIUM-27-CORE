import React from 'react';
import { Shield, Users, UserCheck, Award, LogOut, Zap, ChevronRight, Sparkles } from 'lucide-react';

export default function Navbar({ currentUser, onLogout, onQuickSwitch, serverOnline }) {
  const getRoleBadge = (role) => {
    switch (role) {
      case 'ADMIN':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200/80 shadow-2xs">
            <Shield className="w-3.5 h-3.5 text-rose-500" />
            ADMIN SUPERVISOR
          </span>
        );
      case 'CORE_TEAM':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#30AFFF]/10 text-[#006dae] border border-[#30AFFF]/30 shadow-2xs">
            <Award className="w-3.5 h-3.5 text-[#30AFFF]" />
            CORE TEAM
          </span>
        );
      case 'VOLUNTEER':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#D8FFC5]/70 text-emerald-900 border border-[#C4F7CA] shadow-2xs">
            <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
            VOLUNTEER
          </span>
        );
      case 'PARTICIPANT':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#92EEFF]/25 text-sky-900 border border-[#92EEFF]/60 shadow-2xs">
            <Users className="w-3.5 h-3.5 text-sky-600" />
            PARTICIPANT TEAM
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
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      
      {/* Top Demo Quick-Persona Bar (Makes testing effortlessly feasible) */}
      <div className="bg-gradient-to-r from-[#92EEFF]/15 via-[#FBFBFB] to-[#D8FFC5]/20 border-b border-slate-200/60 px-4 py-1.5 overflow-x-auto no-scrollbar">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 text-[11px]">
          <div className="flex items-center gap-2 shrink-0">
            <span className="flex items-center gap-1 font-bold text-slate-700 uppercase tracking-wider text-[10px] bg-white px-2 py-0.5 rounded-full border border-slate-200/80 shadow-2xs">
              <Sparkles className="w-3 h-3 text-[#30AFFF]" />
              Quick Switch Role:
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
                  className={`px-2.5 py-1 rounded-full font-semibold transition-all border text-[11px] ${
                    isActive
                      ? 'bg-[#30AFFF] text-white border-[#30AFFF] shadow-xs'
                      : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>

          <div className="hidden lg:flex items-center gap-2 text-slate-500 font-medium shrink-0">
            <span>Presidency University Tech Fest</span>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-17 flex items-center justify-between">
        
        {/* Brand identity */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-[#30AFFF] via-[#92EEFF] to-[#D8FFC5] shadow-xs shadow-[#30AFFF]/20 border border-white">
            <Zap className="w-5 h-5 text-slate-900 fill-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-black tracking-tight text-slate-900">
                ARENIUM <span className="text-[#30AFFF]">27</span>
              </span>
              <span className="text-[10px] font-extrabold tracking-widest uppercase bg-[#30AFFF]/15 text-[#006dae] px-2 py-0.5 rounded-md border border-[#30AFFF]/30">
                CORE
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              Attendance, QR Scans & Hourly OD Platform
            </p>
          </div>
        </div>

        {/* User state & Actions */}
        <div className="flex items-center gap-3">
          {/* Server status pill */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-50 border border-slate-200 text-xs text-slate-600 font-medium">
            <span className={`w-2 h-2 rounded-full ${serverOnline ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
            <span>{serverOnline ? 'Server Online' : 'Connecting...'}</span>
          </div>

          {currentUser ? (
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <div className="flex items-center justify-end gap-2">
                  <span className="text-sm font-bold text-slate-800">
                    {currentUser.name || currentUser.teamName}
                  </span>
                  {getRoleBadge(currentUser.role)}
                </div>
                <div className="text-xs text-slate-500 truncate max-w-[240px]">
                  {currentUser.role === 'PARTICIPANT'
                    ? `Team: ${currentUser.teamName} • ${currentUser.members?.length || 0} Members`
                    : currentUser.email || currentUser.rollNumber}
                </div>
              </div>

              {/* Logout Button */}
              <button
                onClick={onLogout}
                title="Sign out or select different role"
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-50 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 border border-slate-200 transition-all shadow-2xs"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500 hidden sm:inline">
                Not signed in
              </span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
