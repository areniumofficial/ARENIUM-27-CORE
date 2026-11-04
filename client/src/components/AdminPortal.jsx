import React, { useState, useEffect } from 'react';
import { 
  Shield, CheckCircle2, XCircle, Clock3, FileSpreadsheet, Download, 
  Users, Award, UserCheck, Filter, RefreshCw, AlertCircle, Layers, Check, X, Sparkles
} from 'lucide-react';
import { apiFetch, getExcelExportUrl } from '../utils/api';

export default function AdminPortal({ currentUser }) {
  const [activeSection, setActiveSection] = useState('CORE_TEAM'); // 'CORE_TEAM', 'VOLUNTEERS', 'PARTICIPANTS', or 'EXCEL_EXPORT'
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Portal data
  const [overview, setOverview] = useState(null);
  const [requestsData, setRequestsData] = useState({
    coreRequests: [],
    volunteers: {
      accountApprovals: [],
      attendanceApprovals: [],
      allVolunteers: []
    },
    participantRequests: []
  });

  // Excel Export Filter State
  const [exportDate, setExportDate] = useState(new Date().toISOString().split('T')[0]);
  const [exportHour, setExportHour] = useState('ALL');
  const [exportSection, setExportSection] = useState('ALL');
  const [exportStatus, setExportStatus] = useState('APPROVED');

  // Filter inside Request Portal
  const [statusFilter, setStatusFilter] = useState('PENDING'); // 'PENDING', 'APPROVED', 'REJECTED', 'ALL'

  // Action Remark Modal State
  const [actionModal, setActionModal] = useState({
    isOpen: false,
    type: null, // 'OD' or 'VOLUNTEER'
    id: null,
    action: null, // 'APPROVED' or 'REJECTED'
    remark: '',
    title: ''
  });

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [stats, reqs] = await Promise.all([
        apiFetch('/admin/overview'),
        apiFetch('/admin/requests')
      ]);
      setOverview(stats);
      setRequestsData(reqs);
    } catch (err) {
      console.error('Failed to load admin data:', err);
      setFeedback({ type: 'error', message: 'Failed to fetch requests data from server' });
    } finally {
      setLoading(false);
    }
  };

  const openActionPrompt = (type, id, action, title = '') => {
    setActionModal({
      isOpen: true,
      type,
      id,
      action,
      remark: action === 'APPROVED' ? 'Approved by Admin' : 'Rejected per regulations',
      title: title || `${action} Request`
    });
  };

  const handleConfirmAction = async () => {
    const { type, id, action, remark } = actionModal;
    setActionModal({ ...actionModal, isOpen: false });

    try {
      if (type === 'OD') {
        const res = await apiFetch('/admin/review-od', {
          method: 'POST',
          body: JSON.stringify({
            requestId: id,
            action,
            adminName: currentUser.name,
            remark
          })
        });
        if (res.success) {
          setFeedback({ type: 'success', message: `OD Request ${action.toLowerCase()} successfully!` });
        }
      } else if (type === 'VOLUNTEER') {
        const res = await apiFetch('/admin/review-volunteer', {
          method: 'POST',
          body: JSON.stringify({
            volunteerId: id,
            action,
            adminName: currentUser.name,
            remark
          })
        });
        if (res.success) {
          setFeedback({ type: 'success', message: `Volunteer account ${action.toLowerCase()} successfully!` });
        }
      }
      fetchAdminData();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Operation failed' });
    }
  };

  // Compute records for Excel Preview
  const getFilteredExcelRecords = () => {
    let allRecords = [
      ...requestsData.coreRequests,
      ...requestsData.volunteers.attendanceApprovals,
      ...requestsData.participantRequests
    ];

    if (exportStatus !== 'ALL') {
      allRecords = allRecords.filter(r => r.status === exportStatus);
    }
    if (exportDate && exportDate !== 'ALL') {
      allRecords = allRecords.filter(r => r.date === exportDate);
    }
    if (exportHour !== 'ALL') {
      const hrNum = parseInt(exportHour, 10);
      allRecords = allRecords.filter(r => Array.isArray(r.hours) && r.hours.includes(hrNum));
    }
    if (exportSection !== 'ALL') {
      allRecords = allRecords.filter(r => r.requestType === exportSection);
    }

    return allRecords;
  };

  const handleDownloadExcel = () => {
    const url = getExcelExportUrl({
      date: exportDate,
      hour: exportHour,
      sectionType: exportSection,
      status: exportStatus
    });
    window.open(url, '_blank');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Admin Executive Header */}
      <div className="rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-rose-100 via-[#92EEFF] to-[#D8FFC5] text-slate-900 border border-white/60 shadow-lg shadow-rose-500/5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-md">
              <Shield className="w-8 h-8 text-rose-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-slate-900 text-white">
                  ADMIN SUPERVISOR
                </span>
                <span className="text-xs font-semibold text-slate-700">Presidency University</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-950 mt-1">
                {currentUser.name}
              </h1>
              <p className="text-xs font-semibold text-slate-700">
                {currentUser.email} • {currentUser.designation || 'Lead Administrator'}
              </p>
            </div>
          </div>

          {/* Quick Metrics Counter */}
          {overview && (
            <div className="flex flex-wrap items-center gap-2 bg-white/80 backdrop-blur-xs p-3 rounded-2xl border border-white">
              <div className="px-3 py-1 text-center">
                <div className="text-xl font-black text-amber-600">{overview.pendingCore}</div>
                <div className="text-[10px] font-bold uppercase text-slate-500">Pending Core</div>
              </div>
              <div className="w-px h-8 bg-slate-300"></div>
              <div className="px-3 py-1 text-center">
                <div className="text-xl font-black text-amber-600">{overview.pendingVolunteers}</div>
                <div className="text-[10px] font-bold uppercase text-slate-500">Pending Vols</div>
              </div>
              <div className="w-px h-8 bg-slate-300"></div>
              <div className="px-3 py-1 text-center">
                <div className="text-xl font-black text-amber-600">{overview.pendingParticipants}</div>
                <div className="text-[10px] font-bold uppercase text-slate-500">Pending Part.</div>
              </div>
              <div className="w-px h-8 bg-slate-300"></div>
              <div className="px-3 py-1 text-center">
                <div className="text-xl font-black text-emerald-700">{overview.totalApproved}</div>
                <div className="text-[10px] font-bold uppercase text-slate-500">Total Approved</div>
              </div>
            </div>
          )}
        </div>

        {/* REQUEST PORTAL TABS IN 3 DISTINCT SECTIONS + EXCEL EXPORT */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-6 pt-4 border-t border-slate-900/10">
          
          {/* Section 1: CORE TEAM */}
          <button
            onClick={() => { setActiveSection('CORE_TEAM'); setFeedback(null); }}
            className={`flex items-center justify-center gap-2 py-3 px-3 rounded-2xl font-bold text-xs transition-all ${
              activeSection === 'CORE_TEAM'
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-white/80 hover:bg-white text-slate-800'
            }`}
          >
            <Award className="w-4 h-4 text-[#30AFFF]" />
            <span>1. CORE TEAM ({requestsData.coreRequests.filter(r => r.status === 'PENDING').length} PENDING)</span>
          </button>

          {/* Section 2: VOLUNTEERS */}
          <button
            onClick={() => { setActiveSection('VOLUNTEERS'); setFeedback(null); }}
            className={`flex items-center justify-center gap-2 py-3 px-3 rounded-2xl font-bold text-xs transition-all ${
              activeSection === 'VOLUNTEERS'
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-white/80 hover:bg-white text-slate-800'
            }`}
          >
            <UserCheck className="w-4 h-4 text-[#C4F7CA]" />
            <span>
              2. VOLUNTEERS (
              {requestsData.volunteers.accountApprovals.length + 
               requestsData.volunteers.attendanceApprovals.filter(r => r.status === 'PENDING').length} PENDING)
            </span>
          </button>

          {/* Section 3: PARTICIPANTS */}
          <button
            onClick={() => { setActiveSection('PARTICIPANTS'); setFeedback(null); }}
            className={`flex items-center justify-center gap-2 py-3 px-3 rounded-2xl font-bold text-xs transition-all ${
              activeSection === 'PARTICIPANTS'
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-white/80 hover:bg-white text-slate-800'
            }`}
          >
            <Users className="w-4 h-4 text-[#92EEFF]" />
            <span>3. PARTICIPANTS ({requestsData.participantRequests.filter(r => r.status === 'PENDING').length} PENDING)</span>
          </button>

          {/* Excel Export Studio */}
          <button
            onClick={() => { setActiveSection('EXCEL_EXPORT'); setFeedback(null); }}
            className={`flex items-center justify-center gap-2 py-3 px-3 rounded-2xl font-bold text-xs transition-all ${
              activeSection === 'EXCEL_EXPORT'
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-gradient-to-r from-[#D8FFC5] to-[#C4F7CA] text-emerald-950 hover:opacity-90 shadow-xs'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
            <span>DAILY EXCEL EXPORT</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
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

      {/* SECTION 1: CORE TEAM REQUESTS */}
      {activeSection === 'CORE_TEAM' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-[#30AFFF]">
                REQUEST PORTAL • SECTION 1
              </span>
              <h2 className="text-xl font-black text-slate-900">
                Core Team Hourly OD Leave Applications
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Review and approve/reject OD leaves requested by Core organizers for specific hours (1-8).
              </p>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500">Filter:</span>
              {['PENDING', 'APPROVED', 'REJECTED', 'ALL'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                    statusFilter === st
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* List of Core Requests */}
          <div className="space-y-4">
            {requestsData.coreRequests
              .filter(r => statusFilter === 'ALL' || r.status === statusFilter)
              .length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-sm">
                  No Core Team OD requests found matching "{statusFilter}".
                </div>
              ) : (
                requestsData.coreRequests
                  .filter(r => statusFilter === 'ALL' || r.status === statusFilter)
                  .map((req) => (
                    <div
                      key={req.id}
                      className="p-5 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-white hover:border-slate-300 transition-all space-y-3 shadow-2xs"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-[#30AFFF]/15 border border-[#30AFFF]/30 flex items-center justify-center font-bold text-[#006ca8] text-xs">
                            CORE
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-slate-900">{req.name}</span>
                              <span className="text-xs font-mono font-semibold text-slate-600">
                                {req.rollNumber}
                              </span>
                            </div>
                            <div className="text-xs text-slate-500">
                              {req.schoolName} • Sec: {req.section} • {req.batchNumber} • HOD: {req.hodName}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {req.status === 'APPROVED' ? (
                            <span className="flex items-center gap-1 text-xs font-bold text-emerald-700 bg-[#C4F7CA] px-3 py-1 rounded-full border border-emerald-300">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Approved
                            </span>
                          ) : req.status === 'REJECTED' ? (
                            <span className="flex items-center gap-1 text-xs font-bold text-rose-700 bg-rose-100 px-3 py-1 rounded-full border border-rose-300">
                              <XCircle className="w-3.5 h-3.5" /> Rejected
                            </span>
                          ) : (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => openActionPrompt('OD', req.id, 'APPROVED', `Approve OD for ${req.name}`)}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#D8FFC5] text-emerald-950 font-bold text-xs hover:bg-[#C4F7CA] border border-emerald-300 shadow-2xs cursor-pointer"
                              >
                                <Check className="w-3.5 h-3.5 text-emerald-700" />
                                <span>Approve</span>
                              </button>
                              <button
                                onClick={() => openActionPrompt('OD', req.id, 'REJECTED', `Reject OD for ${req.name}`)}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 text-rose-800 font-bold text-xs hover:bg-rose-100 border border-rose-200 shadow-2xs cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5 text-rose-600" />
                                <span>Reject</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="p-3 bg-white rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-700">Date: {req.date}</span>
                          <span className="font-black px-2.5 py-0.5 rounded-md bg-[#30AFFF]/15 text-[#006ca8] border border-[#30AFFF]/30">
                            {req.hoursFormatted}
                          </span>
                        </div>
                        <div className="text-slate-600 italic">
                          "{req.reason}"
                        </div>
                      </div>

                      {req.adminRemark && (
                        <div className="text-[11px] text-slate-500">
                          Reviewed by: <span className="font-bold text-slate-700">{req.reviewedBy}</span> • Remark: "{req.adminRemark}"
                        </div>
                      )}
                    </div>
                  ))
              )}
          </div>
        </div>
      )}

      {/* SECTION 2: VOLUNTEERS (ACCOUNT APPROVALS + HOURLY ATTENDANCE APPROVALS) */}
      {activeSection === 'VOLUNTEERS' && (
        <div className="space-y-8">
          
          {/* Sub-section A: Volunteer Account Approvals */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-5">
            <div className="border-b border-slate-100 pb-4">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-700">
                REQUEST PORTAL • SECTION 2 (PART A)
              </span>
              <h2 className="text-xl font-black text-slate-900">
                Volunteer Account Addition Approvals
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Core Team has nominated these volunteers. Admin must approve them to grant access to scan QR passes.
              </p>
            </div>

            {requestsData.volunteers.allVolunteers.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-sm">
                No volunteers added by Core Team yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {requestsData.volunteers.allVolunteers.map((vol) => (
                  <div
                    key={vol.id}
                    className="p-5 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-white hover:border-slate-300 transition-all space-y-3 shadow-2xs"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-sm font-black text-slate-900 block">{vol.name}</span>
                        <span className="text-xs text-slate-500">{vol.email}</span>
                      </div>
                      
                      {vol.status === 'APPROVED' ? (
                        <span className="text-xs font-bold text-emerald-700 bg-[#C4F7CA] px-2.5 py-0.5 rounded-full border border-emerald-300">
                          Approved Volunteer
                        </span>
                      ) : vol.status === 'REJECTED' ? (
                        <span className="text-xs font-bold text-rose-700 bg-rose-100 px-2.5 py-0.5 rounded-full border border-rose-300">
                          Rejected
                        </span>
                      ) : (
                        <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-300">
                          Pending Admin Approval
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-slate-600 bg-white p-3 rounded-xl border border-slate-200 space-y-1">
                      <div><strong>Duty:</strong> {vol.dutyRole}</div>
                      <div><strong>Roll No:</strong> {vol.rollNumber} • {vol.section} ({vol.batchNumber})</div>
                      <div><strong>School:</strong> {vol.schoolName} • HOD: {vol.hodName}</div>
                      <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-100">
                        Added By: {vol.addedBy}
                      </div>
                    </div>

                    {vol.status === 'PENDING' && (
                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={() => openActionPrompt('VOLUNTEER', vol.id, 'APPROVED', `Approve Volunteer ${vol.name}`)}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-[#D8FFC5] text-emerald-950 font-bold text-xs hover:bg-[#C4F7CA] border border-emerald-300 cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5 text-emerald-700" />
                          <span>Approve Volunteer</span>
                        </button>
                        <button
                          onClick={() => openActionPrompt('VOLUNTEER', vol.id, 'REJECTED', `Reject Volunteer ${vol.name}`)}
                          className="px-4 py-2 rounded-xl bg-rose-50 text-rose-800 font-bold text-xs hover:bg-rose-100 border border-rose-200 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5 text-rose-600" />
                          <span>Reject</span>
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sub-section B: Volunteer Attendance Approvals */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-5">
            <div className="border-b border-slate-100 pb-4">
              <span className="text-xs font-black uppercase tracking-wider text-[#30AFFF]">
                REQUEST PORTAL • SECTION 2 (PART B)
              </span>
              <h2 className="text-xl font-black text-slate-900">
                Volunteer-Scanned Hourly Attendance Submissions
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Volunteers scanned these participants in person and allotted hours. Approve to include in the official Excel sheet.
              </p>
            </div>

            <div className="space-y-3">
              {requestsData.volunteers.attendanceApprovals.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-sm">
                  No attendance records logged by volunteers yet.
                </div>
              ) : (
                requestsData.volunteers.attendanceApprovals.map((req) => (
                  <div
                    key={req.id}
                    className="p-4 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-white hover:border-slate-300 transition-all space-y-2.5 shadow-2xs"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-900">{req.name}</span>
                          <span className="text-xs font-mono font-semibold text-slate-600">
                            {req.rollNumber}
                          </span>
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-[#92EEFF]/30 text-sky-900">
                            Team: {req.teamName}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500">
                          {req.schoolName} • Sec: {req.section} • HOD: {req.hodName}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {req.status === 'APPROVED' ? (
                          <span className="flex items-center gap-1 text-xs font-bold text-emerald-700 bg-[#C4F7CA] px-3 py-1 rounded-full border border-emerald-300">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Approved
                          </span>
                        ) : req.status === 'REJECTED' ? (
                          <span className="flex items-center gap-1 text-xs font-bold text-rose-700 bg-rose-100 px-3 py-1 rounded-full border border-rose-300">
                            <XCircle className="w-3.5 h-3.5" /> Rejected
                          </span>
                        ) : (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => openActionPrompt('OD', req.id, 'APPROVED', `Approve attendance for ${req.name}`)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#D8FFC5] text-emerald-950 font-bold text-xs hover:bg-[#C4F7CA] border border-emerald-300 shadow-2xs cursor-pointer"
                            >
                              <Check className="w-3.5 h-3.5 text-emerald-700" />
                              <span>Approve</span>
                            </button>
                            <button
                              onClick={() => openActionPrompt('OD', req.id, 'REJECTED', `Reject attendance for ${req.name}`)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 text-rose-800 font-bold text-xs hover:bg-rose-100 border border-rose-200 shadow-2xs cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5 text-rose-600" />
                              <span>Reject</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="p-2.5 bg-white rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-slate-800">Date: {req.date}</span>
                        <span className="font-bold px-2 py-0.5 rounded-md bg-[#30AFFF]/15 text-[#006ca8]">
                          {req.hoursFormatted}
                        </span>
                      </div>
                      <span className="text-slate-500">
                        Scanned & Submitted by: <strong className="text-slate-700">{req.submittedBy?.name || 'Volunteer'}</strong>
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      )}

      {/* SECTION 3: PARTICIPANTS DIRECT OD REQUESTS */}
      {activeSection === 'PARTICIPANTS' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-sky-700">
                REQUEST PORTAL • SECTION 3
              </span>
              <h2 className="text-xl font-black text-slate-900">
                Participant Self-Applied OD Requests
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Direct OD applications submitted by participant teams for event stages and competition rounds.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500">Filter:</span>
              {['PENDING', 'APPROVED', 'REJECTED', 'ALL'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                    statusFilter === st
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            {requestsData.participantRequests
              .filter(r => statusFilter === 'ALL' || r.status === statusFilter)
              .length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-sm">
                  No Participant OD requests found matching "{statusFilter}".
                </div>
              ) : (
                requestsData.participantRequests
                  .filter(r => statusFilter === 'ALL' || r.status === statusFilter)
                  .map((req) => (
                    <div
                      key={req.id}
                      className="p-5 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-white hover:border-slate-300 transition-all space-y-3 shadow-2xs"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-[#92EEFF]/30 border border-[#92EEFF] flex items-center justify-center font-bold text-sky-950 text-xs">
                            TEAM
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-slate-900">{req.name}</span>
                              <span className="text-xs font-mono font-semibold text-slate-600">
                                {req.rollNumber}
                              </span>
                              <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-[#30AFFF]/15 text-[#006ca8]">
                                Team: {req.teamName}
                              </span>
                            </div>
                            <div className="text-xs text-slate-500">
                              {req.schoolName} • Sec: {req.section} • Batch: {req.batchNumber} • HOD: {req.hodName}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {req.status === 'APPROVED' ? (
                            <span className="flex items-center gap-1 text-xs font-bold text-emerald-700 bg-[#C4F7CA] px-3 py-1 rounded-full border border-emerald-300">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Approved
                            </span>
                          ) : req.status === 'REJECTED' ? (
                            <span className="flex items-center gap-1 text-xs font-bold text-rose-700 bg-rose-100 px-3 py-1 rounded-full border border-rose-300">
                              <XCircle className="w-3.5 h-3.5" /> Rejected
                            </span>
                          ) : (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => openActionPrompt('OD', req.id, 'APPROVED', `Approve OD for ${req.name}`)}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#D8FFC5] text-emerald-950 font-bold text-xs hover:bg-[#C4F7CA] border border-emerald-300 shadow-2xs cursor-pointer"
                              >
                                <Check className="w-3.5 h-3.5 text-emerald-700" />
                                <span>Approve</span>
                              </button>
                              <button
                                onClick={() => openActionPrompt('OD', req.id, 'REJECTED', `Reject OD for ${req.name}`)}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 text-rose-800 font-bold text-xs hover:bg-rose-100 border border-rose-200 shadow-2xs cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5 text-rose-600" />
                                <span>Reject</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="p-3 bg-white rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-700">Date: {req.date}</span>
                          <span className="font-black px-2.5 py-0.5 rounded-md bg-[#30AFFF]/15 text-[#006ca8] border border-[#30AFFF]/30">
                            {req.hoursFormatted}
                          </span>
                        </div>
                        <div className="text-slate-600 italic">
                          "{req.reason}"
                        </div>
                      </div>
                    </div>
                  ))
              )}
          </div>
        </div>
      )}

      {/* EXCEL EXPORT STUDIO (DAILY EXCEL REPORT WITH DATE AND HRS) */}
      {activeSection === 'EXCEL_EXPORT' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-emerald-700">
                DAILY EXCEL REPORT GENERATOR
              </span>
              <h2 className="text-xl font-black text-slate-900">
                Export OD & Attendance Spreadsheet (.xlsx)
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Generates a clean spreadsheet containing exact columns: <strong>sno, name, roll number, section, batch number, hours, school name, hod name</strong>.
              </p>
            </div>

            <button
              onClick={handleDownloadExcel}
              className="flex items-center gap-2 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#30AFFF] via-[#92EEFF] to-[#D8FFC5] text-slate-950 font-black text-xs uppercase tracking-wide hover:opacity-95 shadow-md shadow-[#30AFFF]/20 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>DOWNLOAD EXCEL SHEET</span>
            </button>
          </div>

          {/* Export Filter Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 p-5 rounded-2xl bg-[#D8FFC5]/20 border border-[#C4F7CA]">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Filter by Date
              </label>
              <input
                type="date"
                value={exportDate}
                onChange={(e) => setExportDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-900 bg-white"
              />
              <button
                type="button"
                onClick={() => setExportDate('ALL')}
                className="text-[10px] font-bold text-[#006ca8] hover:underline mt-1"
              >
                Include All Dates
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Filter by Hours
              </label>
              <select
                value={exportHour}
                onChange={(e) => setExportHour(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-900 bg-white"
              >
                <option value="ALL">All Hours (1-8)</option>
                {[1, 2, 3, 4, 5, 6, 7, 8].map(h => (
                  <option key={h} value={h}>Hour {h} Only</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Section / Source
              </label>
              <select
                value={exportSection}
                onChange={(e) => setExportSection(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-900 bg-white"
              >
                <option value="ALL">All Sections (Consolidated)</option>
                <option value="CORE_TEAM">Core Team Only</option>
                <option value="VOLUNTEER">Volunteers Scanned Attendance Only</option>
                <option value="PARTICIPANT">Participants Only</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Approval Status
              </label>
              <select
                value={exportStatus}
                onChange={(e) => setExportStatus(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-900 bg-white"
              >
                <option value="APPROVED">Approved Only (Recommended)</option>
                <option value="ALL">All Statuses (Approved + Pending)</option>
              </select>
            </div>
          </div>

          {/* Live Data Preview Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">
                Excel Sheet Preview ({getFilteredExcelRecords().length} Records matching filters):
              </span>
              <span className="text-[11px] text-slate-500 font-mono">
                ARENIUM27_OD_REPORT_{exportDate}.xlsx
              </span>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-2xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-gradient-to-r from-[#30AFFF] to-[#92EEFF] text-slate-950 font-black uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-3 border-b border-slate-200">sno</th>
                    <th className="py-3 px-3 border-b border-slate-200">name</th>
                    <th className="py-3 px-3 border-b border-slate-200">roll number</th>
                    <th className="py-3 px-3 border-b border-slate-200">section</th>
                    <th className="py-3 px-3 border-b border-slate-200">batch number</th>
                    <th className="py-3 px-3 border-b border-slate-200">hours</th>
                    <th className="py-3 px-3 border-b border-slate-200">school name</th>
                    <th className="py-3 px-3 border-b border-slate-200">hod name</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {getFilteredExcelRecords().length === 0 ? (
                    <tr>
                      <td colSpan="8" className="text-center py-8 text-slate-400">
                        No records match the current export criteria.
                      </td>
                    </tr>
                  ) : (
                    getFilteredExcelRecords().map((rec, index) => (
                      <tr key={rec.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{index + 1}</td>
                        <td className="py-2.5 px-3 font-bold text-slate-900">{rec.name}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-700">{rec.rollNumber}</td>
                        <td className="py-2.5 px-3">{rec.section}</td>
                        <td className="py-2.5 px-3">{rec.batchNumber}</td>
                        <td className="py-2.5 px-3 font-semibold text-[#006ca8]">{rec.hoursFormatted}</td>
                        <td className="py-2.5 px-3">{rec.schoolName}</td>
                        <td className="py-2.5 px-3">{rec.hodName}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* Review Action Dialog / Modal */}
      {actionModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden space-y-4 p-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-base text-slate-900">
                {actionModal.title}
              </h3>
              <button
                onClick={() => setActionModal({ ...actionModal, isOpen: false })}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Are you sure you want to <strong>{actionModal.action}</strong> this request? Add an optional remark below:
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                Admin Supervisor Remark
              </label>
              <input
                type="text"
                value={actionModal.remark}
                onChange={(e) => setActionModal({ ...actionModal, remark: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#30AFFF]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setActionModal({ ...actionModal, isOpen: false })}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmAction}
                className={`px-5 py-2 text-xs font-black rounded-xl text-white shadow-sm cursor-pointer ${
                  actionModal.action === 'APPROVED'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                Confirm {actionModal.action}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
