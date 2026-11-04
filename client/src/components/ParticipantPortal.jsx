import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Users, QrCode, UserCheck, Clock, CheckCircle2, XCircle, Clock3, Plus, Send, AlertCircle, Sparkles, ShieldCheck } from 'lucide-react';
import { apiFetch } from '../utils/api';

export default function ParticipantPortal({ currentUser }) {
  const [team, setTeam] = useState(null);
  const [selectedMember, setSelectedMember] = useState(null);
  const [activeTab, setActiveTab] = useState('QR_PASSES'); // 'QR_PASSES' or 'APPLY_OD'
  const [odHistory, setOdHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Apply OD Form State
  const [odDate, setOdDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedHours, setSelectedHours] = useState([1, 2, 3, 4]);
  const [odReason, setOdReason] = useState('Participating in Arena Hackathon Competition and Project Presentation');

  // Add Member State
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMemName, setNewMemName] = useState('');
  const [newMemRoll, setNewMemRoll] = useState('');
  const [newMemSection, setNewMemSection] = useState('CSE-02');
  const [newMemBatch, setNewMemBatch] = useState('Batch 2023-27');
  const [newMemSchool, setNewMemSchool] = useState('School of Engineering');
  const [newMemHod, setNewMemHod] = useState('Dr. Ramesh Kumar');

  const HOURS_LIST = [1, 2, 3, 4, 5, 6, 7, 8];

  useEffect(() => {
    fetchTeamData();
  }, [currentUser.teamName]);

  const fetchTeamData = async () => {
    try {
      const data = await apiFetch(`/participant/team/${encodeURIComponent(currentUser.teamName)}`);
      setTeam(data);
      if (data.members && data.members.length > 0 && !selectedMember) {
        setSelectedMember(data.members[0]);
      }
      const history = await apiFetch(`/participant/od-history/${encodeURIComponent(currentUser.teamName)}`);
      setOdHistory(history || []);
    } catch (err) {
      console.error('Failed to load team data:', err);
    }
  };

  const toggleHour = (hr) => {
    if (selectedHours.includes(hr)) {
      setSelectedHours(selectedHours.filter(h => h !== hr));
    } else {
      setSelectedHours([...selectedHours, hr].sort((a, b) => a - b));
    }
  };

  const selectAllHours = () => {
    if (selectedHours.length === 8) {
      setSelectedHours([]);
    } else {
      setSelectedHours([1, 2, 3, 4, 5, 6, 7, 8]);
    }
  };

  // Submit OD Request
  const handleApplyOD = async (e) => {
    e.preventDefault();
    if (!selectedMember) {
      setFeedback({ type: 'error', message: 'Please select a team member' });
      return;
    }
    if (selectedHours.length === 0) {
      setFeedback({ type: 'error', message: 'Please select at least one hour (Hour 1 to 8)' });
      return;
    }

    setLoading(true);
    setFeedback(null);

    try {
      const res = await apiFetch('/participant/apply-od', {
        method: 'POST',
        body: JSON.stringify({
          memberId: selectedMember.id,
          name: selectedMember.name,
          rollNumber: selectedMember.rollNumber,
          section: selectedMember.section,
          batchNumber: selectedMember.batchNumber,
          schoolName: selectedMember.schoolName,
          hodName: selectedMember.hodName,
          teamName: team.teamName,
          date: odDate,
          hours: selectedHours,
          reason: odReason
        })
      });

      if (res.success) {
        setFeedback({
          type: 'success',
          message: `OD leave application submitted for ${selectedMember.name}! Sent to Admin for review.`
        });
        fetchTeamData();
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to apply for OD' });
    } finally {
      setLoading(false);
    }
  };

  // Add Member
  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!newMemName.trim() || !newMemRoll.trim()) return;

    setLoading(true);
    try {
      const res = await apiFetch('/participant/add-member', {
        method: 'POST',
        body: JSON.stringify({
          teamName: team.teamName,
          name: newMemName.trim(),
          rollNumber: newMemRoll.trim().toUpperCase(),
          section: newMemSection,
          batchNumber: newMemBatch,
          schoolName: newMemSchool,
          hodName: newMemHod
        })
      });

      if (res.success) {
        setFeedback({ type: 'success', message: `Added ${newMemName} to ${team.teamName}!` });
        setNewMemName('');
        setNewMemRoll('');
        setShowAddMember(false);
        fetchTeamData();
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to add member' });
    } finally {
      setLoading(false);
    }
  };

  if (!team) {
    return (
      <div className="p-12 text-center text-slate-500 font-bold">
        Loading Team Portal...
      </div>
    );
  }

  // Construct payloads for QR codes
  const teamQRPayload = JSON.stringify({
    type: 'ARENIUM_TEAM',
    teamId: team.id,
    teamName: team.teamName,
    memberCount: team.members.length
  });

  const memberQRPayload = selectedMember ? JSON.stringify({
    type: 'ARENIUM_PARTICIPANT',
    id: selectedMember.id,
    name: selectedMember.name,
    rollNumber: selectedMember.rollNumber,
    teamName: team.teamName,
    section: selectedMember.section,
    batchNumber: selectedMember.batchNumber,
    schoolName: selectedMember.schoolName,
    hodName: selectedMember.hodName
  }) : '';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Team Header Ribbon */}
      <div className="rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-[#92EEFF] via-[#30AFFF] to-[#C4F7CA] text-slate-900 border border-white/60 shadow-lg shadow-[#30AFFF]/15">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-md">
              <Users className="w-8 h-8 text-[#92EEFF]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-slate-900 text-white">
                  PARTICIPANT TEAM
                </span>
                {team.verified ? (
                  <span className="flex items-center gap-1 text-[11px] font-bold bg-[#D8FFC5] text-emerald-950 px-2.5 py-0.5 rounded-full border border-emerald-300">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                    VERIFIED TEAM
                  </span>
                ) : (
                  <span className="text-[11px] font-bold bg-amber-100 text-amber-900 px-2.5 py-0.5 rounded-full border border-amber-300">
                    Pending Gate Verification
                  </span>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-950 mt-1">
                {team.teamName}
              </h1>
              <p className="text-xs font-semibold text-slate-800">
                {team.category || 'General Events'} • {team.members?.length || 0} Registered Members
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => { setActiveTab('QR_PASSES'); setFeedback(null); }}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition-all ${
                activeTab === 'QR_PASSES'
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'bg-white/80 hover:bg-white text-slate-800'
              }`}
            >
              <QrCode className="w-4 h-4 text-[#92EEFF]" />
              <span>Team & Self QR Passes</span>
            </button>

            <button
              onClick={() => { setActiveTab('APPLY_OD'); setFeedback(null); }}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition-all ${
                activeTab === 'APPLY_OD'
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'bg-white/80 hover:bg-white text-slate-800'
              }`}
            >
              <Clock className="w-4 h-4 text-[#30AFFF]" />
              <span>Apply Hourly OD</span>
            </button>
          </div>
        </div>
      </div>

      {/* Feedback Alert */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl flex items-center gap-3 text-sm font-semibold transition-all ${
            feedback.type === 'success'
              ? 'bg-[#D8FFC5] border border-[#C4F7CA] text-emerald-950'
              : 'bg-rose-50 border border-rose-200 text-rose-800'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* TAB 1: QR PASSES (TEAM VALIDATION QR & SELF ENTRY QR) */}
      {activeTab === 'QR_PASSES' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* TEAM QR CODE CARD (For Team Validation by Volunteers) */}
          <div className="lg:col-span-5 bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm flex flex-col items-center text-center space-y-4">
            <div className="w-full text-left border-b border-slate-100 pb-3 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-[#30AFFF]">Pass 01</span>
                <h2 className="text-base font-black text-slate-900">TEAM VALIDATION QR</h2>
              </div>
              {team.verified ? (
                <span className="text-[10px] font-bold text-emerald-700 bg-[#C4F7CA] px-2 py-0.5 rounded-md">
                  Verified
                </span>
              ) : (
                <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md">
                  Show to Volunteer
                </span>
              )}
            </div>

            <p className="text-xs text-slate-500">
              Present this QR to any Volunteer to verify your full team presence and register arena check-in.
            </p>

            {/* QR SVG Frame */}
            <div className="p-4 rounded-3xl bg-gradient-to-tr from-[#92EEFF]/30 to-[#D8FFC5]/50 border-2 border-[#30AFFF] shadow-md inline-block">
              <div className="bg-white p-3 rounded-2xl shadow-inner">
                <QRCodeSVG
                  value={teamQRPayload}
                  size={190}
                  level="H"
                  includeMargin={true}
                />
              </div>
            </div>

            <div className="w-full text-xs font-semibold text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div>Team: <span className="font-bold text-slate-900">{team.teamName}</span></div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                {team.verified
                  ? `Verified at ${new Date(team.verifiedAt).toLocaleTimeString()} by ${team.verifiedBy || 'Volunteer'}`
                  : 'Awaiting first volunteer optical check'}
              </div>
            </div>
          </div>

          {/* SELF ENTRY QR CODE (Individual Gate Pass for Hourly Attendance) */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-5">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600">Pass 02</span>
                <h2 className="text-base font-black text-slate-900">MEMBER SELF-ENTRY QR BADGE</h2>
              </div>
              <button
                onClick={() => setShowAddMember(!showAddMember)}
                className="flex items-center gap-1 text-xs font-bold text-[#30AFFF] hover:underline"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Member</span>
              </button>
            </div>

            {/* Add Member Drawer */}
            {showAddMember && (
              <form onSubmit={handleAddMember} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <span className="text-xs font-bold text-slate-900 block">Add Team Member</span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <input
                    type="text"
                    placeholder="Member Name"
                    value={newMemName}
                    onChange={(e) => setNewMemName(e.target.value)}
                    required
                    className="p-2 rounded-lg border border-slate-300"
                  />
                  <input
                    type="text"
                    placeholder="Roll Number (e.g. 20231CSE0401)"
                    value={newMemRoll}
                    onChange={(e) => setNewMemRoll(e.target.value)}
                    required
                    className="p-2 rounded-lg border border-slate-300"
                  />
                  <input
                    type="text"
                    placeholder="Section (e.g. CSE-02)"
                    value={newMemSection}
                    onChange={(e) => setNewMemSection(e.target.value)}
                    className="p-2 rounded-lg border border-slate-300"
                  />
                  <input
                    type="text"
                    placeholder="Batch (e.g. Batch 2023-27)"
                    value={newMemBatch}
                    onChange={(e) => setNewMemBatch(e.target.value)}
                    className="p-2 rounded-lg border border-slate-300"
                  />
                  <input
                    type="text"
                    placeholder="School Name"
                    value={newMemSchool}
                    onChange={(e) => setNewMemSchool(e.target.value)}
                    className="p-2 rounded-lg border border-slate-300"
                  />
                  <input
                    type="text"
                    placeholder="HOD Name"
                    value={newMemHod}
                    onChange={(e) => setNewMemHod(e.target.value)}
                    className="p-2 rounded-lg border border-slate-300"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddMember(false)}
                    className="px-3 py-1 text-xs text-slate-600 hover:underline"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-[#30AFFF] text-white text-xs font-bold hover:bg-[#2090e0]"
                  >
                    Save Member
                  </button>
                </div>
              </form>
            )}

            {/* Member Selector Pills */}
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-2">
                Select Member to Display Individual QR:
              </label>
              <div className="flex flex-wrap gap-2">
                {team.members.map((mem) => (
                  <button
                    key={mem.id}
                    type="button"
                    onClick={() => setSelectedMember(mem)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
                      selectedMember?.id === mem.id
                        ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {mem.name} {mem.isLeader ? '(Leader)' : ''}
                  </button>
                ))}
              </div>
            </div>

            {/* Active Selected Member QR Display */}
            {selectedMember && (
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center gap-6">
                <div className="p-3 bg-white rounded-2xl border-2 border-[#C4F7CA] shadow-sm shrink-0">
                  <QRCodeSVG
                    value={memberQRPayload}
                    size={150}
                    level="H"
                    includeMargin={true}
                  />
                </div>

                <div className="space-y-1.5 text-xs text-slate-600 flex-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-[#C4F7CA] px-2 py-0.5 rounded">
                    Individual Entry Badge
                  </span>
                  <div className="text-base font-black text-slate-900">
                    {selectedMember.name}
                  </div>
                  <div>
                    Roll Number: <span className="font-mono font-bold text-slate-800">{selectedMember.rollNumber}</span>
                  </div>
                  <div>Section: {selectedMember.section} • Batch: {selectedMember.batchNumber}</div>
                  <div>School: {selectedMember.schoolName}</div>
                  <div>HOD: {selectedMember.hodName}</div>
                  <p className="text-[11px] text-slate-500 italic pt-1 border-t border-slate-200">
                    Show this badge to Volunteers to mark hourly attendance (Hours 1-8).
                  </p>
                </div>
              </div>
            )}

          </div>

        </div>
      )}

      {/* TAB 2: APPLY HOURLY OD & VIEW HISTORY */}
      {activeTab === 'APPLY_OD' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Apply Form */}
          <div className="lg:col-span-5 bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-[#30AFFF]" />
                Apply Participant OD Leave
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Select your event date and required hours (1-8). Submitted straight to Admin supervisor for approval.
              </p>
            </div>

            <form onSubmit={handleApplyOD} className="space-y-5">
              {/* Member Selector */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Applicant Member
                </label>
                <select
                  value={selectedMember?.id || ''}
                  onChange={(e) => {
                    const found = team.members.find(m => m.id === e.target.value);
                    if (found) setSelectedMember(found);
                  }}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-900 bg-white"
                >
                  {team.members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.rollNumber})
                    </option>
                  ))}
                </select>
              </div>

              {/* Date */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  OD Date
                </label>
                <input
                  type="date"
                  value={odDate}
                  onChange={(e) => setOdDate(e.target.value)}
                  required
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-900 bg-white"
                />
              </div>

              {/* Hours Selector 1-8 */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                    Select Hours (1 to 8)
                  </label>
                  <button
                    type="button"
                    onClick={selectAllHours}
                    className="text-[11px] font-bold text-[#006ca8] hover:underline"
                  >
                    {selectedHours.length === 8 ? 'Deselect All' : 'Select All 8 Hours'}
                  </button>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {HOURS_LIST.map((hr) => {
                    const isSelected = selectedHours.includes(hr);
                    return (
                      <button
                        key={hr}
                        type="button"
                        onClick={() => toggleHour(hr)}
                        className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                          isSelected
                            ? 'bg-[#30AFFF] text-white border-[#30AFFF] shadow-xs scale-102'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        Hour {hr}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Reason */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Event Duty / Competition Reason
                </label>
                <textarea
                  value={odReason}
                  onChange={(e) => setOdReason(e.target.value)}
                  rows={2}
                  required
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#30AFFF]"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl text-xs font-black tracking-wide text-slate-950 bg-gradient-to-r from-[#30AFFF] via-[#92EEFF] to-[#D8FFC5] hover:opacity-95 shadow-md shadow-[#30AFFF]/20 cursor-pointer disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>SUBMIT OD APPLICATION TO ADMIN</span>
              </button>
            </form>
          </div>

          {/* OD History */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-lg font-black text-slate-900">Team OD Application Status</h2>
                <p className="text-xs text-slate-500">Live review status from Admin Supervisor</p>
              </div>
              <button
                onClick={fetchTeamData}
                className="text-xs font-bold text-[#30AFFF] hover:underline"
              >
                Refresh
              </button>
            </div>

            {odHistory.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-sm">
                No OD applications submitted for this team yet.
              </div>
            ) : (
              <div className="space-y-3">
                {odHistory.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-white hover:border-slate-300 transition-all space-y-2 shadow-2xs"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-slate-900 block">{item.name}</span>
                        <span className="text-[11px] text-slate-500 font-mono">{item.rollNumber}</span>
                      </div>

                      {item.status === 'APPROVED' ? (
                        <span className="flex items-center gap-1 text-xs font-bold text-emerald-700 bg-[#C4F7CA] px-2.5 py-0.5 rounded-full border border-emerald-300">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Approved
                        </span>
                      ) : item.status === 'REJECTED' ? (
                        <span className="flex items-center gap-1 text-xs font-bold text-rose-700 bg-rose-100 px-2.5 py-0.5 rounded-full border border-rose-300">
                          <XCircle className="w-3.5 h-3.5" /> Rejected
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-300">
                          <Clock3 className="w-3.5 h-3.5" /> Pending Admin
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-slate-600 font-bold">Date: {item.date}</span>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-[#30AFFF]/15 text-[#006ca8] border border-[#30AFFF]/30">
                        {item.hoursFormatted}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 font-medium">
                      {item.reason}
                    </p>

                    {item.adminRemark && (
                      <div className="text-[11px] text-slate-600 italic bg-white p-2 rounded-lg border border-slate-100">
                        Admin Note: "{item.adminRemark}"
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
}
