import React, { useState, useEffect } from 'react';
import { 
  Shield, CheckCircle2, XCircle, Clock3, FileSpreadsheet, Download, 
  Users, Award, UserCheck, Filter, RefreshCw, AlertCircle, Layers, Check, X, Sparkles, Search, CheckSquare, Square,
  Database, UploadCloud, Server
} from 'lucide-react';
import { apiFetch, getExcelExportUrl, getBackupExportUrl } from '../utils/api';

export default function AdminPortal({ currentUser }) {
  const [activeSection, setActiveSection] = useState('CORE_TEAM'); // 'CORE_TEAM', 'VOLUNTEERS', 'PARTICIPANTS', 'EXCEL_EXPORT', or 'BACKUP'
  const [loading, setLoading] = useState(false);
  const [restoring, setRestoring] = useState(false);
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

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('PENDING'); // 'PENDING', 'APPROVED', 'REJECTED', 'ALL'
  const [selectedIds, setSelectedIds] = useState([]); // for batch selection

  // Excel Export Filter State
  const [exportDate, setExportDate] = useState(new Date().toISOString().split('T')[0]);
  const [exportHour, setExportHour] = useState('ALL');
  const [exportSection, setExportSection] = useState('ALL');
  const [exportStatus, setExportStatus] = useState('APPROVED');

  // Single Action Remark Modal State
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

  // Clear selections when switching sections
  useEffect(() => {
    setSelectedIds([]);
  }, [activeSection, statusFilter]);

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

  // Batch Review OD Requests
  const handleBatchReviewOD = async (idsToReview, action) => {
    if (!idsToReview || idsToReview.length === 0) return;
    setLoading(true);
    try {
      const res = await apiFetch('/admin/batch-review-od', {
        method: 'POST',
        body: JSON.stringify({
          requestIds: idsToReview,
          action,
          adminName: currentUser.name,
          remark: `Batch ${action.toLowerCase()} by Admin Supervisor`
        })
      });
      if (res.success) {
        setFeedback({
          type: 'success',
          message: `${res.message || `Batch ${action.toLowerCase()} completed!`}`
        });
        setSelectedIds([]);
        fetchAdminData();
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Batch action failed' });
    } finally {
      setLoading(false);
    }
  };

  // Batch Review Volunteers
  const handleBatchReviewVolunteers = async (volIds, action) => {
    if (!volIds || volIds.length === 0) return;
    setLoading(true);
    try {
      const res = await apiFetch('/admin/batch-review-volunteers', {
        method: 'POST',
        body: JSON.stringify({
          volunteerIds: volIds,
          action,
          adminName: currentUser.name,
          remark: `Batch ${action.toLowerCase()} by Admin Supervisor`
        })
      });
      if (res.success) {
        setFeedback({
          type: 'success',
          message: `${res.message || `Batch ${action.toLowerCase()} volunteers completed!`}`
        });
        setSelectedIds([]);
        fetchAdminData();
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Batch action failed' });
    } finally {
      setLoading(false);
    }
  };

  // Toggle single item selection
  const toggleSelectId = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(x => x !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  // Filter helper for requests
  const filterList = (items) => {
    return items.filter(r => {
      const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || (
        (r.name && r.name.toLowerCase().includes(q)) ||
        (r.rollNumber && r.rollNumber.toLowerCase().includes(q)) ||
        (r.teamName && r.teamName.toLowerCase().includes(q)) ||
        (r.reason && r.reason.toLowerCase().includes(q)) ||
        (r.schoolName && r.schoolName.toLowerCase().includes(q))
      );
      return matchesStatus && matchesSearch;
    });
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

  const handleDownloadBackup = () => {
    window.open(getBackupExportUrl(), '_blank');
  };

  const handleRestoreFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        setRestoring(true);
        const parsed = JSON.parse(event.target.result);
        const res = await apiFetch('/admin/restore-backup', {
          method: 'POST',
          body: JSON.stringify({ backupData: parsed })
        });
        if (res.success) {
          setFeedback({
            type: 'success',
            message: `Snapshot restored successfully: ${res.counts.teams} teams, ${res.counts.volunteers} volunteers, ${res.counts.odRequests} OD records.`
          });
          fetchAdminData();
        }
      } catch (err) {
        setFeedback({
          type: 'error',
          message: err.message || 'Invalid backup JSON file'
        });
      } finally {
        setRestoring(false);
        e.target.value = '';
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-7">
      
      {/* Light Admin Executive Header */}
      <div className="rounded-3xl p-6 sm:p-8 bg-white border border-slate-200/80 shadow-sm shadow-[#30AFFF]/5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-rose-50 to-rose-100 border border-rose-200 flex items-center justify-center shadow-xs">
              <Shield className="w-7 h-7 text-rose-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200">
                  ADMIN SUPERVISOR
                </span>
                <span className="text-xs font-semibold text-slate-500">Presidency University</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
                {currentUser.name}
              </h1>
              <p className="text-xs font-medium text-slate-600">
                {currentUser.email} • {currentUser.designation || 'Lead Administrator'}
              </p>
              {overview?.storageMode && (
                <div className="flex items-center gap-2 mt-2">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                    overview.storageMode.mongoConnected
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-amber-50 text-amber-800 border-amber-200'
                  }`}>
                    <span className={`w-2 h-2 rounded-full ${
                      overview.storageMode.mongoConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                    }`} />
                    {overview.storageMode.mongoConnected ? 'MongoDB Cloud Active (500+ Students)' : 'Local File Persistence Mode'}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Quick Metrics Counter Cards */}
          {overview && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-slate-50 p-2.5 rounded-2xl border border-slate-200/80">
              <div className="px-3.5 py-2 rounded-xl bg-white border border-slate-200/70 text-center shadow-2xs">
                <div className="text-lg font-black text-amber-600">{overview.pendingCore}</div>
                <div className="text-[10px] font-bold uppercase text-slate-500">Pending Core</div>
              </div>
              <div className="px-3.5 py-2 rounded-xl bg-white border border-slate-200/70 text-center shadow-2xs">
                <div className="text-lg font-black text-amber-600">{overview.pendingVolunteers}</div>
                <div className="text-[10px] font-bold uppercase text-slate-500">Pending Vols</div>
              </div>
              <div className="px-3.5 py-2 rounded-xl bg-white border border-slate-200/70 text-center shadow-2xs">
                <div className="text-lg font-black text-amber-600">{overview.pendingParticipants}</div>
                <div className="text-[10px] font-bold uppercase text-slate-500">Pending Part.</div>
              </div>
              <div className="px-3.5 py-2 rounded-xl bg-white border border-slate-200/70 text-center shadow-2xs">
                <div className="text-lg font-black text-emerald-700">{overview.totalApproved}</div>
                <div className="text-[10px] font-bold uppercase text-slate-500">Total Approved</div>
              </div>
            </div>
          )}
        </div>

        {/* REQUEST PORTAL TABS IN 3 DISTINCT SECTIONS + EXCEL EXPORT + DATA BACKUP */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 mt-6 pt-5 border-t border-slate-100">
          
          {/* Section 1: CORE TEAM */}
          <button
            onClick={() => { setActiveSection('CORE_TEAM'); setFeedback(null); }}
            className={`flex items-center justify-center gap-2 py-3 px-3 rounded-2xl font-bold text-xs transition-all border ${
              activeSection === 'CORE_TEAM'
                ? 'bg-gradient-to-r from-[#30AFFF] to-[#2598e0] text-white border-[#30AFFF] shadow-xs'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>1. CORE TEAM ({requestsData.coreRequests.filter(r => r.status === 'PENDING').length})</span>
          </button>

          {/* Section 2: VOLUNTEERS */}
          <button
            onClick={() => { setActiveSection('VOLUNTEERS'); setFeedback(null); }}
            className={`flex items-center justify-center gap-2 py-3 px-3 rounded-2xl font-bold text-xs transition-all border ${
              activeSection === 'VOLUNTEERS'
                ? 'bg-gradient-to-r from-[#30AFFF] to-[#2598e0] text-white border-[#30AFFF] shadow-xs'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>
              2. VOLUNTEERS (
              {requestsData.volunteers.accountApprovals.length + 
               requestsData.volunteers.attendanceApprovals.filter(r => r.status === 'PENDING').length})
            </span>
          </button>

          {/* Section 3: PARTICIPANTS */}
          <button
            onClick={() => { setActiveSection('PARTICIPANTS'); setFeedback(null); }}
            className={`flex items-center justify-center gap-2 py-3 px-3 rounded-2xl font-bold text-xs transition-all border ${
              activeSection === 'PARTICIPANTS'
                ? 'bg-gradient-to-r from-[#30AFFF] to-[#2598e0] text-white border-[#30AFFF] shadow-xs'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>3. PARTICIPANTS ({requestsData.participantRequests.filter(r => r.status === 'PENDING').length})</span>
          </button>

          {/* Excel Export Studio */}
          <button
            onClick={() => { setActiveSection('EXCEL_EXPORT'); setFeedback(null); }}
            className={`flex items-center justify-center gap-2 py-3 px-3 rounded-2xl font-bold text-xs transition-all border ${
              activeSection === 'EXCEL_EXPORT'
                ? 'bg-gradient-to-r from-emerald-600 to-emerald-700 text-white border-emerald-600 shadow-xs'
                : 'bg-[#D8FFC5]/50 hover:bg-[#D8FFC5] text-emerald-950 border-[#C4F7CA]'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
            <span>DAILY EXCEL EXPORT</span>
          </button>

          {/* Data Backup & Cloud */}
          <button
            onClick={() => { setActiveSection('BACKUP'); setFeedback(null); }}
            className={`flex items-center justify-center gap-2 py-3 px-3 rounded-2xl font-bold text-xs transition-all border col-span-2 sm:col-span-1 ${
              activeSection === 'BACKUP'
                ? 'bg-gradient-to-r from-sky-600 to-blue-700 text-white border-sky-600 shadow-xs'
                : 'bg-sky-50 hover:bg-sky-100 text-sky-950 border-sky-200'
            }`}
          >
            <Database className="w-4 h-4 text-sky-700" />
            <span>DATA BACKUP & CLOUD</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
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

      {/* SECTION 1: CORE TEAM REQUESTS */}
      {activeSection === 'CORE_TEAM' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-[#006dae] bg-[#30AFFF]/10 px-2.5 py-0.5 rounded-full border border-[#30AFFF]/20">
                REQUEST PORTAL • SECTION 1
              </span>
              <h2 className="text-xl font-black text-slate-900 mt-1">
                Core Team Hourly OD Leave Applications
              </h2>
              <p className="text-xs text-slate-500">
                Hourly OD leave requests submitted by Core Team organizers (Hours 1–8).
              </p>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1.5 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
              {['PENDING', 'APPROVED', 'REJECTED', 'ALL'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    statusFilter === st
                      ? 'bg-white text-slate-900 shadow-2xs border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Search Bar & Batch Approval Toolbar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200/80">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search by student name or roll number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#30AFFF]"
              />
            </div>

            {/* Batch Action Buttons */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              {selectedIds.length > 0 && (
                <>
                  <span className="text-xs font-bold text-slate-600">
                    {selectedIds.length} Selected
                  </span>
                  <button
                    onClick={() => handleBatchReviewOD(selectedIds, 'APPROVED')}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#D8FFC5] hover:bg-[#C4F7CA] text-emerald-950 font-bold text-xs rounded-xl border border-emerald-300 shadow-2xs"
                  >
                    <Check className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Approve Selected</span>
                  </button>
                  <button
                    onClick={() => handleBatchReviewOD(selectedIds, 'REJECTED')}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 font-bold text-xs rounded-xl border border-rose-200 shadow-2xs"
                  >
                    <X className="w-3.5 h-3.5 text-rose-600" />
                    <span>Reject</span>
                  </button>
                </>
              )}

              {/* Quick "Approve All Pending" */}
              {statusFilter === 'PENDING' && requestsData.coreRequests.filter(r => r.status === 'PENDING').length > 0 && (
                <button
                  onClick={() => {
                    const pendingIds = requestsData.coreRequests.filter(r => r.status === 'PENDING').map(r => r.id);
                    handleBatchReviewOD(pendingIds, 'APPROVED');
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-[#D8FFC5] to-[#C4F7CA] text-emerald-950 font-extrabold text-xs rounded-xl border border-emerald-300 hover:brightness-95 shadow-2xs"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Approve All Pending ({requestsData.coreRequests.filter(r => r.status === 'PENDING').length})</span>
                </button>
              )}
            </div>
          </div>

          {/* List of Core Requests */}
          <div className="space-y-3">
            {filterList(requestsData.coreRequests).length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-sm">
                No Core Team OD requests found matching "{statusFilter}".
              </div>
            ) : (
              filterList(requestsData.coreRequests).map((req) => (
                <div
                  key={req.id}
                  className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-[#30AFFF]/40 transition-all space-y-2.5 shadow-2xs"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {/* Checkbox for batch action */}
                      <button
                        type="button"
                        onClick={() => toggleSelectId(req.id)}
                        className="text-slate-400 hover:text-slate-600"
                      >
                        {selectedIds.includes(req.id) ? (
                          <CheckSquare className="w-5 h-5 text-[#30AFFF]" />
                        ) : (
                          <Square className="w-5 h-5 text-slate-300" />
                        )}
                      </button>

                      <div className="w-9 h-9 rounded-xl bg-[#30AFFF]/10 border border-[#30AFFF]/20 flex items-center justify-center font-bold text-[#006dae] text-xs">
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
                        <span className="flex items-center gap-1 text-xs font-bold text-emerald-800 bg-[#D8FFC5]/70 px-3 py-1 rounded-full border border-[#C4F7CA]">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" /> Approved
                        </span>
                      ) : req.status === 'REJECTED' ? (
                        <span className="flex items-center gap-1 text-xs font-bold text-rose-700 bg-rose-50 px-3 py-1 rounded-full border border-rose-200">
                          <XCircle className="w-3.5 h-3.5 text-rose-600" /> Rejected
                        </span>
                      ) : (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openActionPrompt('OD', req.id, 'APPROVED', `Approve OD for ${req.name}`)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#D8FFC5] text-emerald-950 font-bold text-xs hover:bg-[#C4F7CA] border border-emerald-300 shadow-2xs"
                          >
                            <Check className="w-3.5 h-3.5 text-emerald-700" />
                            <span>Approve</span>
                          </button>
                          <button
                            onClick={() => openActionPrompt('OD', req.id, 'REJECTED', `Reject OD for ${req.name}`)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-50 text-rose-800 font-bold text-xs hover:bg-rose-100 border border-rose-200 shadow-2xs"
                          >
                            <X className="w-3.5 h-3.5 text-rose-600" />
                            <span>Reject</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-700">Date: {req.date}</span>
                      <span className="font-bold px-2 py-0.5 rounded-md bg-[#30AFFF]/15 text-[#006dae] border border-[#30AFFF]/30">
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

      {/* SECTION 2: VOLUNTEERS (ACCOUNTS + HOURLY ATTENDANCE APPROVALS) */}
      {activeSection === 'VOLUNTEERS' && (
        <div className="space-y-7">
          
          {/* Sub-section A: Volunteer Account Approvals */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-emerald-800 bg-[#D8FFC5]/70 px-2.5 py-0.5 rounded-full border border-[#C4F7CA]">
                  REQUEST PORTAL • SECTION 2 (PART A)
                </span>
                <h2 className="text-xl font-black text-slate-900 mt-1">
                  Volunteer Account Addition Approvals
                </h2>
                <p className="text-xs text-slate-500">
                  Volunteers added by Core Team. Approving activates their login credentials.
                </p>
              </div>

              {/* Bulk Approve All Pending Volunteers */}
              {requestsData.volunteers.accountApprovals.length > 0 && (
                <button
                  onClick={() => {
                    const ids = requestsData.volunteers.accountApprovals.map(v => v.id);
                    handleBatchReviewVolunteers(ids, 'APPROVED');
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-[#D8FFC5] to-[#C4F7CA] text-emerald-950 font-bold text-xs rounded-xl border border-emerald-300 shadow-2xs"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Approve All ({requestsData.volunteers.accountApprovals.length}) Volunteers</span>
                </button>
              )}
            </div>

            {requestsData.volunteers.allVolunteers.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-sm">
                No volunteers added by Core Team yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {requestsData.volunteers.allVolunteers.map((vol) => (
                  <div
                    key={vol.id}
                    className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-[#30AFFF]/40 transition-all space-y-2.5 shadow-2xs"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-sm font-black text-slate-900 block">{vol.name}</span>
                        <span className="text-xs text-slate-500">{vol.email}</span>
                      </div>
                      
                      {vol.status === 'APPROVED' ? (
                        <span className="text-xs font-bold text-emerald-800 bg-[#D8FFC5]/70 px-2.5 py-0.5 rounded-full border border-[#C4F7CA]">
                          Approved Volunteer
                        </span>
                      ) : vol.status === 'REJECTED' ? (
                        <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
                          Rejected
                        </span>
                      ) : (
                        <span className="text-xs font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                          Pending Approval
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 space-y-1">
                      <div><strong>Duty:</strong> {vol.dutyRole}</div>
                      <div><strong>Roll No:</strong> {vol.rollNumber} • {vol.section} ({vol.batchNumber})</div>
                      <div><strong>School:</strong> {vol.schoolName} • HOD: {vol.hodName}</div>
                      <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-200">
                        Added By: {vol.addedBy}
                      </div>
                    </div>

                    {vol.status === 'PENDING' && (
                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={() => openActionPrompt('VOLUNTEER', vol.id, 'APPROVED', `Approve Volunteer ${vol.name}`)}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-[#D8FFC5] text-emerald-950 font-bold text-xs hover:bg-[#C4F7CA] border border-emerald-300"
                        >
                          <Check className="w-3.5 h-3.5 text-emerald-700" />
                          <span>Approve Volunteer</span>
                        </button>
                        <button
                          onClick={() => openActionPrompt('VOLUNTEER', vol.id, 'REJECTED', `Reject Volunteer ${vol.name}`)}
                          className="px-3.5 py-2 rounded-xl bg-rose-50 text-rose-800 font-bold text-xs hover:bg-rose-100 border border-rose-200"
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
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-[#006dae] bg-[#30AFFF]/10 px-2.5 py-0.5 rounded-full border border-[#30AFFF]/20">
                  REQUEST PORTAL • SECTION 2 (PART B)
                </span>
                <h2 className="text-xl font-black text-slate-900 mt-1">
                  Volunteer-Scanned Hourly Attendance Submissions
                </h2>
                <p className="text-xs text-slate-500">
                  In-person participant scans marked by Volunteers. Approving includes them in the official Excel export.
                </p>
              </div>

              {/* Bulk Approve All Pending Scans */}
              {requestsData.volunteers.attendanceApprovals.filter(r => r.status === 'PENDING').length > 0 && (
                <button
                  onClick={() => {
                    const ids = requestsData.volunteers.attendanceApprovals.filter(r => r.status === 'PENDING').map(r => r.id);
                    handleBatchReviewOD(ids, 'APPROVED');
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-[#D8FFC5] to-[#C4F7CA] text-emerald-950 font-bold text-xs rounded-xl border border-emerald-300 shadow-2xs"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Approve All ({requestsData.volunteers.attendanceApprovals.filter(r => r.status === 'PENDING').length}) Scans</span>
                </button>
              )}
            </div>

            <div className="space-y-3">
              {requestsData.volunteers.attendanceApprovals.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-sm">
                  No attendance records logged by volunteers yet.
                </div>
              ) : (
                requestsData.volunteers.attendanceApprovals.map((req) => (
                  <div
                    key={req.id}
                    className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-[#30AFFF]/40 transition-all space-y-2.5 shadow-2xs"
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
                          <span className="flex items-center gap-1 text-xs font-bold text-emerald-800 bg-[#D8FFC5]/70 px-3 py-1 rounded-full border border-[#C4F7CA]">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" /> Approved
                          </span>
                        ) : req.status === 'REJECTED' ? (
                          <span className="flex items-center gap-1 text-xs font-bold text-rose-700 bg-rose-50 px-3 py-1 rounded-full border border-rose-200">
                            <XCircle className="w-3.5 h-3.5 text-rose-600" /> Rejected
                          </span>
                        ) : (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => openActionPrompt('OD', req.id, 'APPROVED', `Approve attendance for ${req.name}`)}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#D8FFC5] text-emerald-950 font-bold text-xs hover:bg-[#C4F7CA] border border-emerald-300 shadow-2xs"
                            >
                              <Check className="w-3.5 h-3.5 text-emerald-700" />
                              <span>Approve</span>
                            </button>
                            <button
                              onClick={() => openActionPrompt('OD', req.id, 'REJECTED', `Reject attendance for ${req.name}`)}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-50 text-rose-800 font-bold text-xs hover:bg-rose-100 border border-rose-200 shadow-2xs"
                            >
                              <X className="w-3.5 h-3.5 text-rose-600" />
                              <span>Reject</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-slate-800">Date: {req.date}</span>
                        <span className="font-bold px-2 py-0.5 rounded-md bg-[#30AFFF]/15 text-[#006dae] border border-[#30AFFF]/30">
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
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-sky-800 bg-[#92EEFF]/30 px-2.5 py-0.5 rounded-full border border-[#92EEFF]/60">
                REQUEST PORTAL • SECTION 3
              </span>
              <h2 className="text-xl font-black text-slate-900 mt-1">
                Participant Self-Applied OD Requests
              </h2>
              <p className="text-xs text-slate-500">
                Direct OD applications submitted by participant teams for event rounds and projects.
              </p>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
              {['PENDING', 'APPROVED', 'REJECTED', 'ALL'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    statusFilter === st
                      ? 'bg-white text-slate-900 shadow-2xs border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Search & Bulk Approval Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200/80">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search participant or team name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#30AFFF]"
              />
            </div>

            {/* Quick Bulk Approve All Pending Participants */}
            {statusFilter === 'PENDING' && requestsData.participantRequests.filter(r => r.status === 'PENDING').length > 0 && (
              <button
                onClick={() => {
                  const ids = requestsData.participantRequests.filter(r => r.status === 'PENDING').map(r => r.id);
                  handleBatchReviewOD(ids, 'APPROVED');
                }}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-[#D8FFC5] to-[#C4F7CA] text-emerald-950 font-bold text-xs rounded-xl border border-emerald-300 shadow-2xs"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                <span>Approve All ({requestsData.participantRequests.filter(r => r.status === 'PENDING').length}) Participants</span>
              </button>
            )}
          </div>

          <div className="space-y-3">
            {filterList(requestsData.participantRequests).length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-sm">
                No Participant OD requests found matching "{statusFilter}".
              </div>
            ) : (
              filterList(requestsData.participantRequests).map((req) => (
                <div
                  key={req.id}
                  className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-[#30AFFF]/40 transition-all space-y-2.5 shadow-2xs"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-[#92EEFF]/30 border border-[#92EEFF]/60 flex items-center justify-center font-bold text-sky-950 text-xs">
                        TEAM
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-900">{req.name}</span>
                          <span className="text-xs font-mono font-semibold text-slate-600">
                            {req.rollNumber}
                          </span>
                          <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-[#30AFFF]/15 text-[#006dae] border border-[#30AFFF]/30">
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
                        <span className="flex items-center gap-1 text-xs font-bold text-emerald-800 bg-[#D8FFC5]/70 px-3 py-1 rounded-full border border-[#C4F7CA]">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" /> Approved
                        </span>
                      ) : req.status === 'REJECTED' ? (
                        <span className="flex items-center gap-1 text-xs font-bold text-rose-700 bg-rose-50 px-3 py-1 rounded-full border border-rose-200">
                          <XCircle className="w-3.5 h-3.5 text-rose-600" /> Rejected
                        </span>
                      ) : (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openActionPrompt('OD', req.id, 'APPROVED', `Approve OD for ${req.name}`)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#D8FFC5] text-emerald-950 font-bold text-xs hover:bg-[#C4F7CA] border border-emerald-300 shadow-2xs"
                          >
                            <Check className="w-3.5 h-3.5 text-emerald-700" />
                            <span>Approve</span>
                          </button>
                          <button
                            onClick={() => openActionPrompt('OD', req.id, 'REJECTED', `Reject OD for ${req.name}`)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-50 text-rose-800 font-bold text-xs hover:bg-rose-100 border border-rose-200 shadow-2xs"
                          >
                            <X className="w-3.5 h-3.5 text-rose-600" />
                            <span>Reject</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-700">Date: {req.date}</span>
                      <span className="font-black px-2 py-0.5 rounded-md bg-[#30AFFF]/15 text-[#006dae] border border-[#30AFFF]/30">
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
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-emerald-800 bg-[#D8FFC5]/70 px-2.5 py-0.5 rounded-full border border-[#C4F7CA]">
                DAILY EXCEL REPORT GENERATOR
              </span>
              <h2 className="text-xl font-black text-slate-900 mt-1">
                Export OD & Attendance Spreadsheet (.xlsx)
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Generates a clean spreadsheet containing exact columns: <strong>sno, name, roll number, section, batch number, hours, school name, hod name</strong>.
              </p>
            </div>

            <button
              onClick={handleDownloadExcel}
              className="flex items-center gap-2 py-3 px-5 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-black text-xs uppercase tracking-wide hover:brightness-105 shadow-sm shadow-emerald-600/25 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>DOWNLOAD EXCEL SHEET (.XLSX)</span>
            </button>
          </div>

          {/* Export Filter Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 p-5 rounded-2xl bg-slate-50 border border-slate-200/80">
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
                className="text-[10px] font-bold text-[#006dae] hover:underline mt-1"
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
                <thead className="bg-[#92EEFF]/30 text-slate-900 font-extrabold uppercase tracking-wider text-[11px] border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-3">sno</th>
                    <th className="py-3 px-3">name</th>
                    <th className="py-3 px-3">roll number</th>
                    <th className="py-3 px-3">section</th>
                    <th className="py-3 px-3">batch number</th>
                    <th className="py-3 px-3">hours</th>
                    <th className="py-3 px-3">school name</th>
                    <th className="py-3 px-3">hod name</th>
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
                        <td className="py-2.5 px-3 font-semibold text-[#006dae]">{rec.hoursFormatted}</td>
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

      {/* DATA BACKUP & CLOUD STORAGE SECTION (500+ CONCURRENT STUDENTS) */}
      {activeSection === 'BACKUP' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-7">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-sky-800 bg-[#92EEFF]/40 px-2.5 py-0.5 rounded-full border border-sky-300">
                SYSTEM RELIABILITY & BACKUP
              </span>
              <h2 className="text-xl font-black text-slate-900 mt-1">
                Data Persistence & High-Concurrency Scaling
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Download offline data snapshots, restore past backups, and verify readiness for 500+ concurrent students.
              </p>
            </div>

            <button
              onClick={fetchAdminData}
              className="flex items-center gap-1.5 self-start sm:self-auto px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh Status</span>
            </button>
          </div>

          {/* Backup & Restore Action Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            
            {/* Card 1: Download Snapshot */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-white to-sky-50/50 border border-sky-200/80 shadow-2xs space-y-4 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-xl bg-[#30AFFF]/15 text-[#006dae] flex items-center justify-center font-bold">
                  <Download className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-black text-slate-900">
                  Export Full System Backup (.json)
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Downloads an atomic snapshot of all current data: Admin accounts, Core organizers, registered Teams, Participants, Volunteer accounts, attendance scans, and OD requests.
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleDownloadBackup}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#30AFFF] hover:bg-[#2090e0] text-white font-bold text-xs uppercase tracking-wide shadow-xs active:scale-98 transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Live Backup (.json)</span>
                </button>
              </div>
            </div>

            {/* Card 2: Restore Snapshot */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-white to-emerald-50/40 border border-emerald-200/80 shadow-2xs space-y-4 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-black text-slate-900">
                  Restore Database from JSON Snapshot
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Upload a previously downloaded <code className="bg-emerald-100/70 px-1 py-0.5 rounded font-mono text-[11px]">ARENIUM27_FULL_BACKUP_*.json</code> file to restore all student data, teams, and records without server restart.
                </p>
              </div>

              <div className="pt-2">
                <label className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-bold text-xs uppercase tracking-wide shadow-xs active:scale-98 transition-all cursor-pointer">
                  <UploadCloud className="w-4 h-4" />
                  <span>{restoring ? 'Restoring Snapshot...' : 'Upload & Restore (.json)'}</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleRestoreFile}
                    disabled={restoring}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

          </div>

          {/* High-Concurrency & Deployment Card */}
          <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-3">
              <div className="flex items-center gap-2.5">
                <Server className="w-5 h-5 text-slate-700" />
                <h3 className="text-sm font-bold text-slate-900">
                  500+ Concurrent Students Scaling Architecture
                </h3>
              </div>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold border ${
                overview?.storageMode?.mongoConnected
                  ? 'bg-[#D8FFC5] text-emerald-950 border-[#C4F7CA]'
                  : 'bg-amber-100 text-amber-900 border-amber-300'
              }`}>
                <span className={`w-2 h-2 rounded-full ${
                  overview?.storageMode?.mongoConnected ? 'bg-emerald-600 animate-pulse' : 'bg-amber-600'
                }`} />
                {overview?.storageMode?.mongoConnected
                  ? 'MongoDB Cloud Active (Zero-Loss Multi-Node Pool)'
                  : 'Local / Vercel Ephemeral Storage Mode'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-600">
              <div className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-1">
                <div className="font-bold text-slate-900">1. Instant Rolling Backups</div>
                <p>Every write creates an atomic timestamped disk snapshot (<code className="font-mono text-[10px]">backup-*.json</code>) with the last 30 snapshots automatically retained.</p>
              </div>
              <div className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-1">
                <div className="font-bold text-slate-900">2. High Concurrency Pool</div>
                <p>Configured with MongoDB connection pool (<code className="font-mono text-[10px]">maxPoolSize: 50</code>) to effortlessly handle 500+ students and volunteers at the same time.</p>
              </div>
              <div className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-1">
                <div className="font-bold text-slate-900">3. Vercel Deployment Ready</div>
                <p>When deploying to Vercel, simply provide the <code className="font-mono text-[10px]">MONGODB_URI</code> environment variable to sync across all Vercel serverless lambdas.</p>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* Action Remark Modal */}
      {actionModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-2xs">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden space-y-4 p-6">
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
              Confirm <strong>{actionModal.action}</strong> for this request? Add an optional remark below:
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
