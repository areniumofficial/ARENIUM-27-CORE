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
  const [dutyRemark, setDutyRemark] = useState('Hourly Physical Verification at Arena Gate');

  // Search lookup state
  const [lookupQuery, setLookupQuery] = useState('');
  const [lookupResults, setLookupResults] = useState(null);

  const TIMETABLE_HOURS = [
    { hr: 1, label: 'Hour 1', time: '09:00 - 10:00' },
    { hr: 2, label: 'Hour 2', time: '10:00 - 11:00' },
    { hr: 3, label: 'Hour 3', time: '11:00 - 12:00' },
    { hr: 4, label: 'Hour 4', time: '12:00 - 13:00' },
    { hr: 5, label: 'Hour 5', time: '13:45 - 14:45' },
    { hr: 6, label: 'Hour 6', time: '14:45 - 15:45' },
    { hr: 7, label: 'Hour 7', time: '15:45 - 16:45' },
    { hr: 8, label: 'Hour 8', time: '16:45 - 17:30' }
  ];

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
      payload = { raw: scannedRaw };
    }

    // Check if this is an ARENIUM 27 Delegate Gate Pass
    const rawStr = String(scannedRaw);
    const isDelegatePass = (
      scannerMode === 'GATE_PASS' ||
      rawStr.includes('ARENIUM27-REG-') ||
      rawStr.includes('OFFICIAL GATE PASS') ||
      rawStr.includes('DELEGATE PASS') ||
      (payload && (payload.type === 'ARENIUM_PASS' || payload.regId))
    );

    if (isDelegatePass) {
      await verifyGatePass(scannedRaw);
      return;
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
          message: `QR Scanned: ${payload.name} (${payload.rollNumber}). Choose hours and dispatch to Admin.`
        });
      } else {
        handleDirectLookup(scannedRaw);
      }
    }
  };

  const verifyGatePass = async (qrData) => {
    setLoading(true);
    try {
      const res = await apiFetch('/registrations/scan', {
        method: 'POST',
        body: JSON.stringify({
          qrData,
          volunteerId: currentUser.id,
          volunteerName: currentUser.name,
          scannerSource: 'VOLUNTEER_PORTAL'
        })
      });

      if (res.cleared) {
        setFeedback({
          type: 'success',
          message: `${res.message} • Lead: ${res.registration?.fullName} (${res.registration?.usn || 'N/A'}) • Arenas: ${res.registration?.event1Name || res.registration?.eventName || 'General'}`
        });
        fetchActivity();
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.message || '⚠️ Gate pass verification failed or payment is unverified!'
      });
    } finally {
      setLoading(false);
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
          message: `Team "${res.team.teamName}" verified successfully with ${res.team.members.length} members!`
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

  const setHourPreset = (preset) => {
    if (preset === 'ALL') setSelectedHours([1, 2, 3, 4, 5, 6, 7, 8]);
    else if (preset === 'MORNING') setSelectedHours([1, 2, 3, 4]);
    else if (preset === 'AFTERNOON') setSelectedHours([5, 6, 7, 8]);
    else if (preset === 'CLEAR') setSelectedHours([]);
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
          message: `Attendance (${selectedHours.map(h => `H${h}`).join(',')}) for ${activeParticipant.name} sent to Admin!`
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
          message: `Found student: ${res.members[0].name} (${res.members[0].rollNumber})`
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-7">
      
      {/* Light Volunteer Header */}
      <div className="rounded-3xl p-6 sm:p-8 bg-white border border-slate-200/80 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#D8FFC5]/70 border border-[#C4F7CA] flex items-center justify-center shadow-xs">
              <UserCheck className="w-7 h-7 text-emerald-700" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[#D8FFC5]/70 text-emerald-950 border border-[#C4F7CA]">
                  APPROVED VOLUNTEER
                </span>
                <span className="text-xs font-semibold text-slate-500">Presidency University</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
                {currentUser.name}
              </h1>
              <p className="text-xs font-medium text-slate-600">
                Duty: {currentUser.dutyRole || 'Verification & Attendance'} • Roll: {currentUser.rollNumber}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-2xl border border-slate-200/80">
            <div className="px-3.5 py-1.5 text-center bg-white rounded-xl border border-slate-200/70 shadow-2xs">
              <div className="text-lg font-black text-slate-900">{activity.scans.length}</div>
              <div className="text-[10px] font-bold uppercase text-slate-500">Total Scans</div>
            </div>
            <div className="px-3.5 py-1.5 text-center bg-white rounded-xl border border-slate-200/70 shadow-2xs">
              <div className="text-lg font-black text-emerald-700">{activity.submissions.length}</div>
              <div className="text-[10px] font-bold uppercase text-slate-500">Attendance Sent</div>
            </div>
          </div>
        </div>

        {/* Quick Action Buttons for Scanners */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6 pt-5 border-t border-slate-100">
          <button
            onClick={() => handleOpenScanner('GATE_PASS')}
            className="flex items-center justify-center gap-2 py-3 px-3 rounded-2xl font-bold text-xs uppercase tracking-wide bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:brightness-105 shadow-sm shadow-emerald-500/25 transition-all cursor-pointer"
          >
            <Camera className="w-4 h-4" />
            <span>🎫 Scan Gate Pass (ARENIUM 27)</span>
          </button>

          <button
            onClick={() => handleOpenScanner('PARTICIPANT')}
            className="flex items-center justify-center gap-2 py-3 px-3 rounded-2xl font-bold text-xs uppercase tracking-wide bg-gradient-to-r from-[#30AFFF] to-[#2598e0] text-white hover:brightness-105 shadow-sm shadow-[#30AFFF]/25 transition-all cursor-pointer"
          >
            <Camera className="w-4 h-4" />
            <span>Participant Attendance</span>
          </button>

          <button
            onClick={() => handleOpenScanner('TEAM')}
            className="flex items-center justify-center gap-2 py-3 px-3 rounded-2xl font-bold text-xs uppercase tracking-wide bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200 shadow-2xs transition-all cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Team Verification QR</span>
          </button>
        </div>
      </div>

      {/* Notification Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl flex items-center gap-3 text-sm font-semibold transition-all ${
            feedback.type === 'success'
              ? 'bg-[#D8FFC5]/70 border border-[#C4F7CA] text-emerald-950'
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

      {/* Attendance Allotment Desk & Activity Tracker */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-7">
        
        {/* Attendance Allotment Desk */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-[#30AFFF]" />
                Hourly Attendance Allotment Desk
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Scan participant QR badge or search student to allot Hours 1-8 for Admin approval
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
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Lookup by student name or roll no (e.g. Tanmay or 20221CSE0552)..."
                value={lookupQuery}
                onChange={(e) => {
                  setLookupQuery(e.target.value);
                  handleDirectLookup(e.target.value);
                }}
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#30AFFF]"
              />
            </div>
            <button
              onClick={() => handleOpenScanner('PARTICIPANT')}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#30AFFF] text-white font-bold text-xs rounded-xl hover:bg-[#2090e0] shadow-xs cursor-pointer"
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
                  <div className="text-[11px] text-slate-700 font-bold">{activeParticipant.schoolName}</div>
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

                {/* Smart Hours Checkbox Pills */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                      Select Hours to Award:
                    </label>
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => setHourPreset('ALL')}
                        className="text-[10px] font-bold text-[#006dae] hover:bg-[#30AFFF]/10 px-1.5 py-0.5 rounded"
                      >
                        All (H1-8)
                      </button>
                      <button
                        type="button"
                        onClick={() => setHourPreset('MORNING')}
                        className="text-[10px] font-bold text-[#006dae] hover:bg-[#30AFFF]/10 px-1.5 py-0.5 rounded"
                      >
                        H1-4
                      </button>
                      <button
                        type="button"
                        onClick={() => setHourPreset('AFTERNOON')}
                        className="text-[10px] font-bold text-[#006dae] hover:bg-[#30AFFF]/10 px-1.5 py-0.5 rounded"
                      >
                        H5-8
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {TIMETABLE_HOURS.map(({ hr, label, time }) => {
                      const isSel = selectedHours.includes(hr);
                      return (
                        <button
                          key={hr}
                          type="button"
                          onClick={() => toggleHour(hr)}
                          className={`p-2 rounded-xl text-center transition-all border ${
                            isSel
                              ? 'bg-[#30AFFF] text-white border-[#30AFFF] shadow-xs'
                              : 'bg-white text-slate-700 border-slate-300 hover:border-slate-400'
                          }`}
                        >
                          <div className="text-xs font-extrabold">{label}</div>
                          <div className={`text-[9px] ${isSel ? 'text-white/80' : 'text-slate-400'}`}>
                            {time}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-black tracking-wide text-emerald-950 bg-gradient-to-r from-[#D8FFC5] to-[#C4F7CA] hover:brightness-95 border border-emerald-300 shadow-sm cursor-pointer disabled:opacity-50"
                >
                  <ArrowRight className="w-4 h-4" />
                  <span>DISPATCH HOURLY ATTENDANCE FOR ADMIN APPROVAL</span>
                </button>
              </form>
            </div>
          ) : (
            <div className="p-8 text-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/70 space-y-3">
              <Camera className="w-10 h-10 text-slate-300 mx-auto" />
              <div className="text-sm font-bold text-slate-700">No Participant Badge Scanned</div>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Click <strong>"Camera Scan"</strong> or search by roll number above to pull up a student pass and allot attendance.
              </p>
              <div className="flex justify-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleOpenScanner('PARTICIPANT')}
                  className="px-4 py-2 rounded-xl bg-[#30AFFF] text-white text-xs font-bold hover:bg-[#2090e0] shadow-xs cursor-pointer"
                >
                  Open Camera Scanner
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Recent Volunteer Submissions & Activity */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-lg font-black text-slate-900">Submitted Approvals</h2>
              <p className="text-xs text-slate-500">Live Admin approval synchronization</p>
            </div>
            <button
              onClick={fetchActivity}
              className="text-xs font-bold text-[#006dae] hover:underline"
            >
              Refresh
            </button>
          </div>

          <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
            {activity.submissions.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-xs">
                No attendance submissions logged yet.
              </div>
            ) : (
              activity.submissions.map((sub) => (
                <div
                  key={sub.id}
                  className="p-3.5 rounded-2xl border border-slate-200 bg-white hover:border-[#30AFFF]/40 transition-all space-y-1.5 shadow-2xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">{sub.name}</span>
                    {sub.status === 'APPROVED' ? (
                      <span className="text-[10px] font-bold text-emerald-800 bg-[#D8FFC5]/70 px-2 py-0.5 rounded-full border border-[#C4F7CA]">
                        Approved
                      </span>
                    ) : sub.status === 'REJECTED' ? (
                      <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                        Rejected
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                        Pending Admin
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Roll: <span className="font-semibold text-slate-700">{sub.rollNumber}</span> • {sub.teamName}
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-600 pt-1 border-t border-slate-100">
                    <span className="font-bold text-[#006dae]">{sub.hoursFormatted}</span>
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
