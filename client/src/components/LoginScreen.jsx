import React, { useState } from 'react';
import { Shield, Award, UserCheck, Users, ArrowRight, KeyRound, Mail, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import { apiFetch } from '../utils/api';

export default function LoginScreen({ onLoginSuccess }) {
  const [selectedRole, setSelectedRole] = useState('PARTICIPANT');
  const [teamName, setTeamName] = useState('CyberKnights');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const CORE_ACCOUNTS = [
    { email: 'singhkaushal.2507@gmail.com', pass: 'Kaush2507', name: 'Kaushal Singh' },
    { email: 'Kathuriaabhyas@gmail.com', pass: 'Abhyas2108', name: 'Abhyas Kathuria' },
    { email: 'ashlinsiddharth1@gmail.com', pass: 'Ashlin01', name: 'Ashlin Siddharth' },
    { email: 'vimalrajsnkk@gmail.com', pass: 'Vimal69', name: 'Vimal Raj' }
  ];

  const ADMIN_ACCOUNTS = [
    { email: 'kerenlois@presidencyuniversity.in', pass: 'Kerensois27', name: 'Prof. Keren Lois' },
    { email: 'Kathuriaabhyas0@gmail.com', pass: 'Abhyas2108', name: 'Abhyas Kathuria' }
  ];

  const SAMPLE_TEAMS = ['CyberKnights', 'QuantumForge', 'Nexus27', 'AlgoWarriors'];

  const SAMPLE_VOLUNTEERS = [
    { email: 'volunteer1@arenium.com', pass: 'Vol123', name: 'Rohan Verma (Approved)' },
    { email: 'ananya.vol@arenium.com', pass: 'Vol123', name: 'Ananya Sharma (Pending Approval)' }
  ];

  const handleRoleChange = (role) => {
    setSelectedRole(role);
    setErrorMessage('');
    if (role === 'CORE_TEAM') {
      setEmail(CORE_ACCOUNTS[0].email);
      setPassword(CORE_ACCOUNTS[0].pass);
    } else if (role === 'ADMIN') {
      setEmail(ADMIN_ACCOUNTS[0].email);
      setPassword(ADMIN_ACCOUNTS[0].pass);
    } else if (role === 'VOLUNTEER') {
      setEmail(SAMPLE_VOLUNTEERS[0].email);
      setPassword(SAMPLE_VOLUNTEERS[0].pass);
    } else if (role === 'PARTICIPANT') {
      setTeamName('CyberKnights');
    }
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

  const pickPreset = (presetEmail, presetPass) => {
    setEmail(presetEmail);
    setPassword(presetPass);
    setErrorMessage('');
  };

  return (
    <div className="min-h-[calc(100vh-7rem)] flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-gradient-to-b from-[#FBFBFB] to-slate-50">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-lg shadow-slate-200/60 border border-slate-200/80 overflow-hidden">
        
        {/* Light Header Ribbon */}
        <div className="p-6 sm:p-8 bg-gradient-to-r from-[#92EEFF]/30 via-white to-[#D8FFC5]/30 border-b border-slate-200/80">
          <div className="flex items-center justify-between">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#30AFFF]/15 text-[#006dae] border border-[#30AFFF]/30 mb-2">
                <Sparkles className="w-3.5 h-3.5 text-[#30AFFF]" />
                Event Portal Sign In
              </span>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
                ARENIUM 27 UNIFIED PORTAL
              </h1>
              <p className="text-sm font-medium text-slate-600 mt-1">
                Select your role to access Attendance, QR Verification, Leave Approvals & Daily Reports
              </p>
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
                    Participants sign in with their registered <strong>Team Name</strong> to retrieve QR passes and submit hourly OD applications.
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
                    placeholder="e.g. CyberKnights or QuantumForge"
                    required
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#30AFFF] text-sm font-semibold text-slate-900 bg-white"
                  />
                </div>

                {/* Quick Team selector pills */}
                <div>
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                    1-Click Sample Teams:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {SAMPLE_TEAMS.map((name) => (
                      <button
                        key={name}
                        type="button"
                        onClick={() => setTeamName(name)}
                        className={`text-xs px-3.5 py-1.5 rounded-xl border transition-all font-semibold ${
                          teamName === name
                            ? 'bg-[#30AFFF] text-white border-[#30AFFF] shadow-xs'
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        {name}
                      </button>
                    ))}
                  </div>
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

                {/* Quick Presets for Core Team */}
                <div>
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                    1-Click Select Core Account:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {CORE_ACCOUNTS.map((acc) => (
                      <button
                        key={acc.email}
                        type="button"
                        onClick={() => pickPreset(acc.email, acc.pass)}
                        className={`p-3 rounded-xl text-left border transition-all ${
                          email === acc.email
                            ? 'bg-[#30AFFF]/10 border-[#30AFFF] text-slate-900 shadow-xs ring-1 ring-[#30AFFF]'
                            : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                        }`}
                      >
                        <div className="text-xs font-bold text-slate-900">{acc.name}</div>
                        <div className="text-[11px] text-slate-500 truncate">{acc.email}</div>
                      </button>
                    ))}
                  </div>
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
                      placeholder="singhkaushal.2507@gmail.com"
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
                      Note: Requires Admin approval before login is activated.
                    </span>
                  </p>
                </div>

                {/* Preset Volunteers */}
                <div>
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                    1-Click Volunteer Presets:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {SAMPLE_VOLUNTEERS.map((v) => (
                      <button
                        key={v.email}
                        type="button"
                        onClick={() => pickPreset(v.email, v.pass)}
                        className={`p-3 rounded-xl text-left border transition-all ${
                          email === v.email
                            ? 'bg-[#D8FFC5]/50 border-emerald-400 text-slate-900 shadow-xs'
                            : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                        }`}
                      >
                        <div className="text-xs font-bold text-slate-900">{v.name}</div>
                        <div className="text-[11px] text-slate-500 truncate">{v.email}</div>
                      </button>
                    ))}
                  </div>
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
                      placeholder="volunteer1@arenium.com"
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

                {/* Quick Presets for Admin */}
                <div>
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                    1-Click Select Admin Account:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {ADMIN_ACCOUNTS.map((acc) => (
                      <button
                        key={acc.email}
                        type="button"
                        onClick={() => pickPreset(acc.email, acc.pass)}
                        className={`p-3 rounded-xl text-left border transition-all ${
                          email === acc.email
                            ? 'bg-rose-50 border-rose-300 text-rose-950 shadow-xs ring-1 ring-rose-300'
                            : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                        }`}
                      >
                        <div className="text-xs font-bold text-slate-900">{acc.name}</div>
                        <div className="text-[11px] text-slate-500 truncate">{acc.email}</div>
                      </button>
                    ))}
                  </div>
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
                      placeholder="kerenlois@presidencyuniversity.in"
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
            ARENIUM 27 • Presidency University Tech Festival • Fast QR & Attendance Operations
          </p>
        </div>

      </div>
    </div>
  );
}
