import React, { useState } from 'react';
import { Shield, Award, UserCheck, Users, ArrowRight, KeyRound, Mail, Sparkles, AlertCircle } from 'lucide-react';
import { apiFetch } from '../utils/api';

export default function LoginScreen({ onLoginSuccess }) {
  const [selectedRole, setSelectedRole] = useState('PARTICIPANT');
  const [teamName, setTeamName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleRoleChange = (role) => {
    setSelectedRole(role);
    setErrorMessage('');
    setEmail('');
    setPassword('');
    setTeamName('');
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setErrorMessage('');

    try {
      const payload = {
        role: selectedRole,
        email: email.trim(),
        password: password.trim(),
        teamName: teamName.trim()
      };

      const res = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (res.success && res.user) {
        onLoginSuccess(res.user);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-7rem)] flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-gradient-to-b from-[#FBFBFB] to-slate-50">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-lg shadow-slate-200/60 border border-slate-200/80 overflow-hidden">
        
        {/* Light Header Ribbon */}
        <div className="p-6 sm:p-8 bg-gradient-to-r from-[#92EEFF]/30 via-white to-[#D8FFC5]/30 border-b border-slate-200/80">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <img
                src="/logo.png"
                alt="ARENIUM"
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-contain shadow-md shrink-0 bg-slate-900 p-1"
              />
              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#30AFFF]/15 text-[#006dae] border border-[#30AFFF]/30 mb-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#30AFFF]" />
                  Event Portal Sign In
                </span>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
                  ARENIUM
                </h1>
                <p className="text-xs sm:text-sm font-medium text-slate-600 mt-0.5">
                  Event Operations, QR Attendance, Leave Approvals & Daily Reports
                </p>
              </div>
            </div>
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-xs font-bold text-slate-800">Presidency University</span>
              <span className="text-[11px] text-slate-500 font-medium">Tech Fest Operations</span>
            </div>
          </div>

          {/* Clean Light Role Navigation Tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-6">
            <button
              type="button"
              onClick={() => handleRoleChange('PARTICIPANT')}
              className={`flex items-center justify-center gap-2 py-3 px-3 rounded-2xl font-bold text-xs transition-all border ${
                selectedRole === 'PARTICIPANT'
                  ? 'bg-gradient-to-r from-[#30AFFF] to-[#2598e0] text-white border-[#30AFFF] shadow-sm shadow-[#30AFFF]/25 scale-101'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200/80 shadow-2xs'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>PARTICIPANTS</span>
            </button>

            <button
              type="button"
              onClick={() => handleRoleChange('CORE_TEAM')}
              className={`flex items-center justify-center gap-2 py-3 px-3 rounded-2xl font-bold text-xs transition-all border ${
                selectedRole === 'CORE_TEAM'
                  ? 'bg-gradient-to-r from-[#30AFFF] to-[#2598e0] text-white border-[#30AFFF] shadow-sm shadow-[#30AFFF]/25 scale-101'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200/80 shadow-2xs'
              }`}
            >
              <Award className="w-4 h-4" />
              <span>CORE TEAM</span>
            </button>

            <button
              type="button"
              onClick={() => handleRoleChange('VOLUNTEER')}
              className={`flex items-center justify-center gap-2 py-3 px-3 rounded-2xl font-bold text-xs transition-all border ${
                selectedRole === 'VOLUNTEER'
                  ? 'bg-gradient-to-r from-[#30AFFF] to-[#2598e0] text-white border-[#30AFFF] shadow-sm shadow-[#30AFFF]/25 scale-101'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200/80 shadow-2xs'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              <span>VOLUNTEERS</span>
            </button>

            <button
              type="button"
              onClick={() => handleRoleChange('ADMIN')}
              className={`flex items-center justify-center gap-2 py-3 px-3 rounded-2xl font-bold text-xs transition-all border ${
                selectedRole === 'ADMIN'
                  ? 'bg-gradient-to-r from-[#30AFFF] to-[#2598e0] text-white border-[#30AFFF] shadow-sm shadow-[#30AFFF]/25 scale-101'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200/80 shadow-2xs'
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>ADMIN</span>
            </button>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-6 sm:p-8">
          {errorMessage && (
            <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* PARTICIPANT LOGIN FORM */}
            {selectedRole === 'PARTICIPANT' && (
              <div className="space-y-5">
                <div className="p-4 rounded-2xl bg-[#92EEFF]/15 border border-[#92EEFF]/40">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#30AFFF]" />
                    Participant Login with Team Name
                  </h3>
                  <p className="text-xs text-slate-600 mt-1">
                    Enter your registered <strong>Team Name</strong> to access your Team QR code, individual gate passes, and submit hourly OD applications. New teams are automatically created upon initial sign in.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                    Enter Team Name:
                  </label>
                  <input
                    type="text"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    placeholder="e.g. Your Team Name / Project Title"
                    required
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#30AFFF] text-sm font-semibold text-slate-900 bg-white"
                  />
                  <p className="text-[11px] text-slate-400 mt-1.5">
                    All members of your team can log in using this team name.
                  </p>
                </div>
              </div>
            )}

            {/* CORE TEAM LOGIN FORM */}
            {selectedRole === 'CORE_TEAM' && (
              <div className="space-y-5">
                <div className="p-4 rounded-2xl bg-[#30AFFF]/10 border border-[#30AFFF]/30">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Award className="w-4 h-4 text-[#30AFFF]" />
                    Core Team Credentials Login
                  </h3>
                  <p className="text-xs text-slate-600 mt-1">
                    Add volunteers and apply for event OD leave for Hours 1-8.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your registered core email"
                      required
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#30AFFF] text-sm text-slate-900 bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#30AFFF] text-sm text-slate-900 bg-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* VOLUNTEER LOGIN FORM */}
            {selectedRole === 'VOLUNTEER' && (
              <div className="space-y-5">
                <div className="p-4 rounded-2xl bg-[#D8FFC5]/40 border border-[#C4F7CA]">
                  <h3 className="text-sm font-bold text-emerald-950 flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-emerald-700" />
                    Volunteer Portal Sign In
                  </h3>
                  <p className="text-xs text-emerald-800 mt-1">
                    Scan participant QR passes to allot hourly attendance and verify team registrations.
                    <span className="block font-semibold mt-0.5 text-slate-700">
                      Note: Volunteers are registered by the Core Team and must be approved by the Admin before logging in.
                    </span>
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                    Volunteer Email
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your registered volunteer email"
                      required
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#30AFFF] text-sm text-slate-900 bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#30AFFF] text-sm text-slate-900 bg-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ADMIN LOGIN FORM */}
            {selectedRole === 'ADMIN' && (
              <div className="space-y-5">
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200">
                  <h3 className="text-sm font-bold text-rose-950 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-rose-600" />
                    Admin Supervisor Login
                  </h3>
                  <p className="text-xs text-rose-800 mt-1">
                    Supervise operations, review requests across Core Team, Volunteers & Participants, and export the daily Excel report.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                    Admin Email
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your admin email"
                      required
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#30AFFF] text-sm text-slate-900 bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#30AFFF] text-sm text-slate-900 bg-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Submit Action */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl font-black text-sm tracking-wide text-white bg-gradient-to-r from-[#30AFFF] to-[#1e96e6] hover:brightness-105 shadow-md shadow-[#30AFFF]/25 transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <span>Signing in...</span>
              ) : (
                <>
                  <span>
                    SIGN IN TO {selectedRole === 'PARTICIPANT' ? 'PARTICIPANT PORTAL' : `${selectedRole} PORTAL`}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer info */}
        <div className="px-8 py-3.5 bg-slate-50 border-t border-slate-200/80 text-center">
          <p className="text-xs text-slate-500 font-medium">
            ARENIUM • Presidency University Tech Festival • Production Launch Ready
          </p>
        </div>

      </div>
    </div>
  );
}
