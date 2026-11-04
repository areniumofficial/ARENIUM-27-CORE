import React, { useState, useEffect } from 'react';
import { Camera, CheckCircle2, ShieldCheck, UserCheck, Clock, Users, ArrowRight, Search, Sparkles, AlertCircle, RefreshCw, Layers } from 'lucide-react';
import QRScannerModal from './QRScannerModal';
import { apiFetch } from '../utils/api';

export default function VolunteerPortal({ currentUser }) {
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannerMode, setScannerMode] = useState('PARTICIPANT'); // 'PARTICIPANT' or 'TEAM'
  const [feedback, setFeedback] = useState(null);
  const [activity, setActivity] = useState({ scans: [], submissions: [] });
  const [loading, setLoading] = useState(false);

  // Scanned participant staging for attendance allotment
  const [activeParticipant, setActiveParticipant] = useState(null);
  const [attDate, setAttDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedHours, setSelectedHours] = useState([1, 2, 3]);
  const [dutyRemark, setDutyRemark] = useState('Hourly Physical Verification at Gate/Arena Desk');

  // Search lookup state
  const [lookupQuery, setLookupQuery] = useState('');
  const [lookupResults, setLookupResults] = useState(null);

  const HOURS_LIST = [1, 2, 3, 4, 5, 6, 7, 8];

  useEffect(() => {
    fetchActivity();
  }, []);

  const fetchActivity = async () => {
    try {
      const data = await apiFetch(`/volunteer/activity?volunteerId=${currentUser.id}`);
      setActivity(data || { scans: [], submissions: [] });
    } catch (err) {
      console.error('Failed to load volunteer activity:', err);
    }
  };

  const handleOpenScanner = (mode) => {
    setScannerMode(mode);
    setScannerOpen(true);
    setFeedback(null);
  };

  const handleScanSuccess = async (scannedRaw) => {
    let payload = null;
    try {
      payload = JSON.parse(scannedRaw);
    } catch (e) {
      // If not JSON, could be a team name or roll number string
      payload = { raw: scannedRaw };
    }

    if (scannerMode === 'TEAM') {
      const teamName = payload.teamName || (payload.type === 'ARENIUM_TEAM' ? payload.teamName : payload.raw);
      await verifyTeam(teamName, payload.teamId);
    } else {
      // Participant QR scan
      if (payload.type === 'ARENIUM_PARTICIPANT' || payload.rollNumber) {
        setActiveParticipant(payload);
        setFeedback({
          type: 'success',
          message: `Participant QR recognized: ${payload.name} (${payload.rollNumber}). Now select hours and submit for Admin approval.`
        });
      } else {
        // Fallback search participant by query
        handleDirectLookup(scannedRaw);
      }
    }
  };

  const verifyTeam = async (teamName, teamId) => {
    setLoading(true);
    try {
      const res = await apiFetch('/volunteer/verify-team', {
        method: 'POST',
        body: JSON.stringify({
          teamId,
          teamName,
          volunteerId: currentUser.id,
          volunteerName: currentUser.name
        })
      });

      if (res.success) {
        setFeedback({
          type: 'success',
          message: `Team "${res.team.teamName}" verified with ${res.team.members.length} members!`
        });
        fetchActivity();
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Team verification failed' });
    } finally {
      setLoading(false);
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

  // Submit Hourly Attendance to Admin
  const handleSubmitAttendance = async (e) => {
    e.preventDefault();
    if (!activeParticipant) {
      setFeedback({ type: 'error', message: 'No participant scanned yet' });
      return;
    }
    if (selectedHours.length === 0) {
      setFeedback({ type: 'error', message: 'Please select at least one hour (1-8)' });
      return;
    }

    setLoading(true);
    try {
      const res = await apiFetch('/volunteer/submit-attendance', {
        method: 'POST',
        body: JSON.stringify({
          participantId: activeParticipant.id,
          name: activeParticipant.name,
          rollNumber: activeParticipant.rollNumber,
          section: activeParticipant.section,
          batchNumber: activeParticipant.batchNumber,
          schoolName: activeParticipant.schoolName,
          hodName: activeParticipant.hodName,
          teamName: activeParticipant.teamName,
          date: attDate,
          hours: selectedHours,
          reason: dutyRemark,
          volunteerId: currentUser.id,
          volunteerName: currentUser.name
        })
      });

      if (res.success) {
        setFeedback({
          type: 'success',
          message: `Hourly attendance (${selectedHours.map(h => `H${h}`).join(',')}) for ${activeParticipant.name} sent to Admin for approval!`
        });
        setActiveParticipant(null);
        fetchActivity();
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to submit attendance' });
    } finally {
      setLoading(false);
    }
  };

  const handleDirectLookup = async (query) => {
    if (!query || !query.trim()) return;
    try {
      const res = await apiFetch(`/volunteer/lookup?q=${encodeURIComponent(query.trim())}`);
      setLookupResults(res);
      if (res.members && res.members.length > 0) {
        setActiveParticipant(res.members[0]);
        setFeedback({
          type: 'success',
          message: `Found participant: ${res.members[0].name} (${res.members[0].rollNumber})`
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Volunteer Hero Header */}
      <div className="rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-[#C4F7CA] via-[#92EEFF] to-[#30AFFF] text-slate-900 border border-white/60 shadow-lg shadow-emerald-500/10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-md">
              <UserCheck className="w-8 h-8 text-[#92EEFF]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-slate-900 text-white">
                  APPROVED VOLUNTEER
                </span>
                <span className="text-xs font-semibold text-slate-700">Presidency University</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-950 mt-1">
                {currentUser.name}
              </h1>
              <p className="text-xs font-semibold text-slate-700">
                Duty: {currentUser.dutyRole || 'Verification & Attendance'} • Roll: {currentUser.rollNumber}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 bg-white/70 backdrop-blur-xs p-3 rounded-2xl border border-white">
            <div className="px-3 py-1.5 text-center">
              <div className="text-xl font-black text-slate-900">{activity.scans.length}</div>
              <div className="text-[10px] font-bold uppercase text-slate-500">Total Scans</div>
            </div>
            <div className="w-px h-8 bg-slate-300"></div>
            <div className="px-3 py-1.5 text-center">
              <div className="text-xl font-black text-slate-900">{activity.submissions.length}</div>
              <div className="text-[10px] font-bold uppercase text-slate-500">Attendance Sent</div>
            </div>
          </div>
        </div>

        {/* Quick Action Buttons for Scanners */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6 pt-4 border-t border-slate-900/10">
          <button
            onClick={() => handleOpenScanner('PARTICIPANT')}
            className="flex items-center justify-center gap-2.5 py-3.5 px-5 rounded-2xl font-black text-xs uppercase tracking-wide bg-slate-900 text-white hover:bg-slate-800 shadow-md transition-all cursor-pointer"
          >
            <Camera className="w-4 h-4 text-[#92EEFF]" />
            <span>Scan Participant QR (Allot Hourly Attendance)</span>
          </button>

          <button
            onClick={() => handleOpenScanner('TEAM')}
            className="flex items-center justify-center gap-2.5 py-3.5 px-5 rounded-2xl font-black text-xs uppercase tracking-wide bg-white hover:bg-slate-50 text-slate-900 border border-slate-200 shadow-sm transition-all cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Scan Team QR (Verify Team Registration)</span>
          </button>
        </div>
      </div>

      {/* Notification Banner */}
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

      {/* Main Grid: Attendance Allotment Desk & Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Attendance Allotment Desk */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-[#30AFFF]" />
                Hourly Attendance Allotment Desk
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Scan participant QR badge or select student to allot Hours 1-8 for Admin approval
              </p>
            </div>
            {activeParticipant && (
              <button
                onClick={() => setActiveParticipant(null)}
                className="text-xs font-bold text-rose-600 hover:underline"
              >
                Clear
              </button>
            )}
          </div>

          {/* Quick Fallback Search / Roll Number Bar */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Lookup participant by name or roll no (e.g. Tanmay or 20221CSE0552)"
                value={lookupQuery}
                onChange={(e) => {
                  setLookupQuery(e.target.value);
                  handleDirectLookup(e.target.value);
                }}
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#30AFFF]"
              />
            </div>
            <button
              onClick={() => handleOpenScanner('PARTICIPANT')}
              className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-[#30AFFF] to-[#92EEFF] text-slate-950 font-bold text-xs rounded-xl shadow-xs cursor-pointer"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Camera Scan</span>
            </button>
          </div>

          {/* Scanned Participant Card */}
          {activeParticipant ? (
            <div className="p-5 rounded-2xl bg-[#92EEFF]/15 border-2 border-[#30AFFF] space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider bg-[#30AFFF] text-white px-2 py-0.5 rounded">
                    Scanned & Verified
                  </span>
                  <h3 className="text-base font-black text-slate-900 mt-1">
                    {activeParticipant.name}
                  </h3>
                  <div className="text-xs font-semibold text-slate-600 mt-0.5">
                    Roll: <span className="font-mono text-slate-900">{activeParticipant.rollNumber}</span> • Team: {activeParticipant.teamName || 'Individual'}
                  </div>
                </div>
                <div className="text-right text-xs text-slate-500 font-medium">
                  <div>{activeParticipant.section} • {activeParticipant.batchNumber}</div>
                  <div className="text-[11px] text-slate-600 font-bold">{activeParticipant.schoolName}</div>
                  <div className="text-[11px] text-slate-500">HOD: {activeParticipant.hodName}</div>
                </div>
              </div>

              {/* Attendance Form */}
              <form onSubmit={handleSubmitAttendance} className="space-y-4 pt-3 border-t border-slate-200">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                      Attendance Date
                    </label>
                    <input
                      type="date"
                      value={attDate}
                      onChange={(e) => setAttDate(e.target.value)}
                      required
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-900 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                      Volunteer Remark
                    </label>
                    <input
                      type="text"
                      value={dutyRemark}
                      onChange={(e) => setDutyRemark(e.target.value)}
                      required
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white"
                    />
                  </div>
                </div>

                {/* Hours Checkbox Pills */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                      Select Hours to Award (1 to 8):
                    </label>
                    <button
                      type="button"
                      onClick={selectAllHours}
                      className="text-[11px] font-bold text-[#006ca8] hover:underline"
                    >
                      {selectedHours.length === 8 ? 'Deselect All' : 'Select All Hours'}
                    </button>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {HOURS_LIST.map((hr) => {
                      const isSel = selectedHours.includes(hr);
                      return (
                        <button
                          key={hr}
                          type="button"
                          onClick={() => toggleHour(hr)}
                          className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                            isSel
                              ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                              : 'bg-white text-slate-700 border-slate-300 hover:border-slate-400'
                          }`}
                        >
                          Hour {hr}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-black tracking-wide text-slate-950 bg-gradient-to-r from-[#D8FFC5] via-[#C4F7CA] to-[#92EEFF] hover:opacity-95 shadow-md shadow-emerald-500/20 cursor-pointer disabled:opacity-50"
                >
                  <ArrowRight className="w-4 h-4" />
                  <span>DISPATCH HOURLY ATTENDANCE FOR ADMIN APPROVAL</span>
                </button>
              </form>
            </div>
          ) : (
            <div className="p-8 text-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 space-y-3">
              <Camera className="w-10 h-10 text-slate-300 mx-auto" />
              <div className="text-sm font-bold text-slate-700">No Participant Badge Scanned</div>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Click <strong>"Camera Scan"</strong> above or select a preset to pull up a participant badge and allot hourly attendance.
              </p>
              <div className="flex justify-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => handleOpenScanner('PARTICIPANT')}
                  className="px-4 py-2 rounded-xl bg-[#30AFFF] text-white text-xs font-bold hover:bg-[#2090e0] shadow-xs cursor-pointer"
                >
                  Open Participant Scanner
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Recent Volunteer Submissions & Activity */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-black text-slate-900">Submitted Approvals</h2>
              <p className="text-xs text-slate-500">Live Admin approval synchronization</p>
            </div>
            <button
              onClick={fetchActivity}
              className="text-xs font-bold text-[#30AFFF] hover:underline"
            >
              Refresh
            </button>
          </div>

          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {activity.submissions.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-xs">
                No attendance submissions made by you yet.
              </div>
            ) : (
              activity.submissions.map((sub) => (
                <div
                  key={sub.id}
                  className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50 space-y-1.5 shadow-2xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">{sub.name}</span>
                    {sub.status === 'APPROVED' ? (
                      <span className="text-[10px] font-bold text-emerald-700 bg-[#C4F7CA] px-2 py-0.5 rounded-full border border-emerald-300">
                        Approved by Admin
                      </span>
                    ) : sub.status === 'REJECTED' ? (
                      <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full border border-rose-300">
                        Rejected
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300">
                        Pending Admin Review
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Roll: <span className="font-semibold text-slate-700">{sub.rollNumber}</span> • {sub.teamName}
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-600 pt-1 border-t border-slate-200">
                    <span className="font-bold text-[#006ca8]">{sub.hoursFormatted}</span>
                    <span>Date: {sub.date}</span>
                  </div>
                </div>
              ))
            )}
          </div>

        </div>

      </div>

      {/* QR Scanner Modal */}
      <QRScannerModal
        isOpen={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScanSuccess={handleScanSuccess}
        mode={scannerMode}
        title={scannerMode === 'TEAM' ? 'Team QR Verification Scanner' : 'Participant Attendance Scanner'}
      />

    </div>
  );
}
