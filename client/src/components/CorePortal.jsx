import React, { useState, useEffect } from 'react';
import { Award, UserPlus, Clock, CheckCircle, Clock3, XCircle, Send, AlertCircle, Sparkles, Calendar, BookOpen, Layers, Search, Check } from 'lucide-react';
import { apiFetch } from '../utils/api';

export default function CorePortal({ currentUser }) {
  const [activeTab, setActiveTab] = useState('OD_LEAVE'); // 'OD_LEAVE' or 'ADD_VOLUNTEERS'
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // OD Leave Form State
  const [odDate, setOdDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedHours, setSelectedHours] = useState([1, 2, 3, 4]);
  const [odReason, setOdReason] = useState('Core Management, Tech Arena Setup and Event Coordination');
  const [coreRollNumber, setCoreRollNumber] = useState(currentUser.rollNumber || '20211CSE0112');
  const [coreSection, setCoreSection] = useState(currentUser.section || 'CSE-04');
  const [coreBatch, setCoreBatch] = useState(currentUser.batchNumber || 'Batch 2021-25');
  const [coreSchool, setCoreSchool] = useState(currentUser.schoolName || 'School of Engineering');
  const [coreHod, setCoreHod] = useState(currentUser.hodName || 'Dr. Ramesh Kumar');
  const [odHistory, setOdHistory] = useState([]);

  // Volunteer Addition Form State
  const [volName, setVolName] = useState('');
  const [volEmail, setVolEmail] = useState('');
  const [volPassword, setVolPassword] = useState('Vol123');
  const [volRollNumber, setVolRollNumber] = useState('');
  const [volSection, setVolSection] = useState('CSE-03');
  const [volBatch, setVolBatch] = useState('Batch 2022-26');
  const [volSchool, setVolSchool] = useState('School of Engineering');
  const [volHod, setVolHod] = useState('Dr. Ramesh Kumar');
  const [volDutyRole, setVolDutyRole] = useState('Participant QR Attendance & Floor Usher');
  const [volPhone, setVolPhone] = useState('+91 9');
  const [volunteerList, setVolunteerList] = useState([]);
  const [volSearch, setVolSearch] = useState('');

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
    fetchCoreData();
  }, []);

  const fetchCoreData = async () => {
    try {
      const [history, vols] = await Promise.all([
        apiFetch(`/core/od-history?coreId=${currentUser.id}`),
        apiFetch('/core/volunteers')
      ]);
      setOdHistory(history || []);
      setVolunteerList(vols || []);
    } catch (err) {
      console.error('Failed to load core data:', err);
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

  // Submit OD Request to Admin
  const handleApplyOD = async (e) => {
    e.preventDefault();
    if (selectedHours.length === 0) {
      setFeedback({ type: 'error', message: 'Please select at least one hour (Hour 1 to 8)' });
      return;
    }

    setLoading(true);
    setFeedback(null);

    try {
      const res = await apiFetch('/core/apply-od', {
        method: 'POST',
        body: JSON.stringify({
          coreId: currentUser.id,
          name: currentUser.name,
          rollNumber: coreRollNumber,
          section: coreSection,
          batchNumber: coreBatch,
          schoolName: coreSchool,
          hodName: coreHod,
          date: odDate,
          hours: selectedHours,
          reason: odReason
        })
      });

      if (res.success) {
        setFeedback({ type: 'success', message: 'OD Leave application submitted! Sent to Admin for approval.' });
        fetchCoreData();
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to submit OD application' });
    } finally {
      setLoading(false);
    }
  };

  // Submit Volunteer to Admin for Approval
  const handleAddVolunteer = async (e) => {
    e.preventDefault();
    if (!volName.trim() || !volEmail.trim() || !volRollNumber.trim()) {
      setFeedback({ type: 'error', message: 'Volunteer name, email, and roll number are required' });
      return;
    }

    setLoading(true);
    setFeedback(null);

    try {
      const res = await apiFetch('/core/add-volunteer', {
        method: 'POST',
        body: JSON.stringify({
          name: volName,
          email: volEmail,
          password: volPassword,
          rollNumber: volRollNumber,
          section: volSection,
          batchNumber: volBatch,
          schoolName: volSchool,
          hodName: volHod,
          dutyRole: volDutyRole,
          phone: volPhone,
          addedBy: `${currentUser.name} (Core)`
        })
      });

      if (res.success) {
        setFeedback({
          type: 'success',
          message: `Volunteer "${volName}" registered! Awaiting Admin approval before login activation.`
        });
        setVolName('');
        setVolEmail('');
        setVolRollNumber('');
        fetchCoreData();
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to add volunteer' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-7">
      
      {/* Light Core Profile Header */}
      <div className="rounded-3xl p-6 sm:p-8 bg-white border border-slate-200/80 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#30AFFF]/15 to-[#92EEFF]/30 border border-[#30AFFF]/30 flex items-center justify-center shadow-xs">
              <Award className="w-7 h-7 text-[#30AFFF]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[#30AFFF]/15 text-[#006dae] border border-[#30AFFF]/30">
                  CORE TEAM OFFICER
                </span>
                <span className="text-xs font-semibold text-slate-500">Presidency University</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
                {currentUser.name}
              </h1>
              <p className="text-xs font-medium text-slate-600">
                {currentUser.email} • Roll: {currentUser.rollNumber} • {currentUser.schoolName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-2xl border border-slate-200/80">
            <div className="px-3.5 py-1.5 text-center bg-white rounded-xl border border-slate-200/70 shadow-2xs">
              <div className="text-lg font-black text-slate-900">{odHistory.length}</div>
              <div className="text-[10px] font-bold uppercase text-slate-500">My OD Apps</div>
            </div>
            <div className="px-3.5 py-1.5 text-center bg-white rounded-xl border border-slate-200/70 shadow-2xs">
              <div className="text-lg font-black text-slate-900">{volunteerList.length}</div>
              <div className="text-[10px] font-bold uppercase text-slate-500">Volunteers Added</div>
            </div>
            <div className="px-3.5 py-1.5 text-center bg-white rounded-xl border border-slate-200/70 shadow-2xs">
              <div className="text-lg font-black text-emerald-700">
                {volunteerList.filter(v => v.status === 'APPROVED').length}
              </div>
              <div className="text-[10px] font-bold uppercase text-slate-500">Approved Vols</div>
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-2.5 mt-6 pt-5 border-t border-slate-100">
          <button
            onClick={() => { setActiveTab('OD_LEAVE'); setFeedback(null); }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition-all border ${
              activeTab === 'OD_LEAVE'
                ? 'bg-gradient-to-r from-[#30AFFF] to-[#2598e0] text-white border-[#30AFFF] shadow-xs'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Apply Hourly OD Leave (Hours 1–8)</span>
          </button>

          <button
            onClick={() => { setActiveTab('ADD_VOLUNTEERS'); setFeedback(null); }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition-all border ${
              activeTab === 'ADD_VOLUNTEERS'
                ? 'bg-gradient-to-r from-[#30AFFF] to-[#2598e0] text-white border-[#30AFFF] shadow-xs'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Volunteers & Track Approvals</span>
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
            <CheckCircle className="w-5 h-5 text-emerald-700 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* TAB 1: APPLY OD LEAVE */}
      {activeTab === 'OD_LEAVE' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-7">
          
          {/* Form */}
          <div className="lg:col-span-5 bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-5">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-[#30AFFF]" />
                Apply Hourly On-Duty (OD)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Select your required event duty hours. Dispatched to Admin for approval.
              </p>
            </div>

            <form onSubmit={handleApplyOD} className="space-y-4">
              {/* Date */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  OD Date
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="date"
                    value={odDate}
                    onChange={(e) => setOdDate(e.target.value)}
                    required
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-900 bg-white"
                  />
                </div>
              </div>

              {/* Smart Hours Preset Buttons (Fast & Feasible) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                    Select Hours (1 to 8):
                  </label>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => setHourPreset('ALL')}
                      className="text-[10px] font-bold text-[#006dae] hover:bg-[#30AFFF]/10 px-1.5 py-0.5 rounded"
                    >
                      Full Day
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
                    <button
                      type="button"
                      onClick={() => setHourPreset('CLEAR')}
                      className="text-[10px] font-bold text-slate-500 hover:bg-slate-100 px-1.5 py-0.5 rounded"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {TIMETABLE_HOURS.map(({ hr, label, time }) => {
                    const isSelected = selectedHours.includes(hr);
                    return (
                      <button
                        key={hr}
                        type="button"
                        onClick={() => toggleHour(hr)}
                        className={`p-2 rounded-xl text-center transition-all border ${
                          isSelected
                            ? 'bg-[#30AFFF] text-white border-[#30AFFF] shadow-xs'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="text-xs font-extrabold">{label}</div>
                        <div className={`text-[9px] ${isSelected ? 'text-white/80' : 'text-slate-400'}`}>
                          {time}
                        </div>
                      </button>
                    );
                  })}
                </div>
                <div className="mt-2 text-[11px] text-slate-500 font-medium">
                  Selected: <strong className="text-slate-800">{selectedHours.length} hours</strong> ({selectedHours.map(h => `H${h}`).join(', ') || 'None'})
                </div>
              </div>

              {/* Readonly Academic Details (Excel fields) */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  Official Academic Record (Exported to Excel):
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Roll Number</span>
                    <input
                      type="text"
                      value={coreRollNumber}
                      onChange={(e) => setCoreRollNumber(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 font-semibold text-slate-800"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Section</span>
                    <input
                      type="text"
                      value={coreSection}
                      onChange={(e) => setCoreSection(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 font-semibold text-slate-800"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Batch Number</span>
                    <input
                      type="text"
                      value={coreBatch}
                      onChange={(e) => setCoreBatch(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 font-semibold text-slate-800"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">School Name</span>
                    <input
                      type="text"
                      value={coreSchool}
                      onChange={(e) => setCoreSchool(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 font-semibold text-slate-800"
                    />
                  </div>
                  <div className="col-span-2">
                    <span className="text-[10px] text-slate-400 block">HOD Name</span>
                    <input
                      type="text"
                      value={coreHod}
                      onChange={(e) => setCoreHod(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 font-semibold text-slate-800"
                    />
                  </div>
                </div>
              </div>

              {/* Reason */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Duty Reason / Responsibility
                </label>
                <textarea
                  value={odReason}
                  onChange={(e) => setOdReason(e.target.value)}
                  rows={2}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#30AFFF]"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-black tracking-wide text-white bg-gradient-to-r from-[#30AFFF] to-[#1e96e6] hover:brightness-105 shadow-sm shadow-[#30AFFF]/25 cursor-pointer disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>SUBMIT OD APPLICATION TO ADMIN</span>
              </button>
            </form>
          </div>

          {/* Core OD History */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-lg font-black text-slate-900">My OD Request History</h2>
                <p className="text-xs text-slate-500">Live approval status from Admin Supervisor</p>
              </div>
              <button
                onClick={fetchCoreData}
                className="text-xs font-bold text-[#006dae] hover:underline"
              >
                Refresh
              </button>
            </div>

            {odHistory.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-sm">
                No OD applications submitted yet.
              </div>
            ) : (
              <div className="space-y-3">
                {odHistory.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-[#30AFFF]/40 transition-all space-y-2 shadow-2xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">
                          Date: {item.date}
                        </span>
                        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-md bg-[#30AFFF]/15 text-[#006dae] border border-[#30AFFF]/30">
                          {item.hoursFormatted}
                        </span>
                      </div>

                      {item.status === 'APPROVED' ? (
                        <span className="flex items-center gap-1 text-xs font-bold text-emerald-800 bg-[#D8FFC5]/70 px-2.5 py-0.5 rounded-full border border-[#C4F7CA]">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-700" /> Approved
                        </span>
                      ) : item.status === 'REJECTED' ? (
                        <span className="flex items-center gap-1 text-xs font-bold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
                          <XCircle className="w-3.5 h-3.5 text-rose-600" /> Rejected
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                          <Clock3 className="w-3.5 h-3.5 text-amber-600" /> Pending Admin
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-600 font-medium">
                      {item.reason}
                    </p>

                    <div className="flex flex-wrap items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                      <span>Roll: {item.rollNumber} • {item.section} • {item.schoolName}</span>
                      {item.adminRemark && (
                        <span className="font-semibold text-slate-700 italic">
                          Remark: "{item.adminRemark}"
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

      {/* TAB 2: ADD VOLUNTEERS */}
      {activeTab === 'ADD_VOLUNTEERS' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-7">
          
          {/* Add Volunteer Form */}
          <div className="lg:col-span-5 bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-5">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-emerald-600" />
                Add New Volunteer
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Core Team adds volunteers. Admin approves them before their login is active.
              </p>
            </div>

            <form onSubmit={handleAddVolunteer} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold uppercase text-slate-600 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={volName}
                  onChange={(e) => setVolName(e.target.value)}
                  placeholder="e.g. Varun Teja"
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium text-slate-900 bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-bold uppercase text-slate-600 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={volEmail}
                    onChange={(e) => setVolEmail(e.target.value)}
                    placeholder="varun@arenium.com"
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium text-slate-900 bg-white"
                  />
                </div>
                <div>
                  <label className="block font-bold uppercase text-slate-600 mb-1">
                    Password
                  </label>
                  <input
                    type="text"
                    value={volPassword}
                    onChange={(e) => setVolPassword(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium text-slate-900 bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-bold uppercase text-slate-600 mb-1">
                    Roll Number
                  </label>
                  <input
                    type="text"
                    value={volRollNumber}
                    onChange={(e) => setVolRollNumber(e.target.value)}
                    placeholder="20221CSE0884"
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium text-slate-900 bg-white"
                  />
                </div>
                <div>
                  <label className="block font-bold uppercase text-slate-600 mb-1">
                    Section
                  </label>
                  <input
                    type="text"
                    value={volSection}
                    onChange={(e) => setVolSection(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium text-slate-900 bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-bold uppercase text-slate-600 mb-1">
                    Batch
                  </label>
                  <input
                    type="text"
                    value={volBatch}
                    onChange={(e) => setVolBatch(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium text-slate-900 bg-white"
                  />
                </div>
                <div>
                  <label className="block font-bold uppercase text-slate-600 mb-1">
                    School
                  </label>
                  <input
                    type="text"
                    value={volSchool}
                    onChange={(e) => setVolSchool(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium text-slate-900 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold uppercase text-slate-600 mb-1">
                  HOD Name
                </label>
                <input
                  type="text"
                  value={volHod}
                  onChange={(e) => setVolHod(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium text-slate-900 bg-white"
                />
              </div>

              <div>
                <label className="block font-bold uppercase text-slate-600 mb-1">
                  Duty Role
                </label>
                <input
                  type="text"
                  value={volDutyRole}
                  onChange={(e) => setVolDutyRole(e.target.value)}
                  placeholder="Gate 1 Verification or Stage Attendance"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium text-slate-900 bg-white"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-black tracking-wide text-emerald-950 bg-gradient-to-r from-[#D8FFC5] to-[#C4F7CA] hover:brightness-95 border border-emerald-300 shadow-sm cursor-pointer disabled:opacity-50 mt-2"
              >
                <UserPlus className="w-4 h-4 text-emerald-800" />
                <span>SUBMIT VOLUNTEER FOR ADMIN APPROVAL</span>
              </button>
            </form>
          </div>

          {/* Volunteer Roster */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-lg font-black text-slate-900">Volunteer Approval Pipeline</h2>
                <p className="text-xs text-slate-500">
                  Volunteers awaiting Admin review or active for duty
                </p>
              </div>
              <button
                onClick={fetchCoreData}
                className="text-xs font-bold text-[#006dae] hover:underline"
              >
                Refresh
              </button>
            </div>

            <div className="space-y-3">
              {volunteerList.map((vol) => (
                <div
                  key={vol.id}
                  className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-[#30AFFF]/40 transition-all space-y-2 shadow-2xs"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-bold text-slate-900 block">{vol.name}</span>
                      <span className="text-xs text-slate-500">{vol.email} • Roll: {vol.rollNumber}</span>
                    </div>

                    {vol.status === 'APPROVED' ? (
                      <span className="flex items-center gap-1 text-xs font-bold text-emerald-800 bg-[#D8FFC5]/70 px-2.5 py-0.5 rounded-full border border-[#C4F7CA]">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-700" /> Approved
                      </span>
                    ) : vol.status === 'REJECTED' ? (
                      <span className="flex items-center gap-1 text-xs font-bold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
                        <XCircle className="w-3.5 h-3.5 text-rose-600" /> Rejected
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                        <Clock3 className="w-3.5 h-3.5 text-amber-600" /> Pending Admin
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 flex flex-wrap gap-x-4 gap-y-1">
                    <span><strong>Duty:</strong> {vol.dutyRole}</span>
                    <span><strong>Section:</strong> {vol.section}</span>
                    <span><strong>Batch:</strong> {vol.batchNumber}</span>
                    <span><strong>School:</strong> {vol.schoolName}</span>
                    <span><strong>HOD:</strong> {vol.hodName}</span>
                  </div>

                  <div className="text-[11px] text-slate-400 flex justify-between">
                    <span>Added by: {vol.addedBy || 'Core'}</span>
                    <span>{vol.approvedBy ? `Approved by: ${vol.approvedBy}` : 'Pending Admin Approval'}</span>
                  </div>
                </div>
              ))}
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
