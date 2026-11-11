try { require('dotenv').config(); } catch (_) {}
const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const { connectDB, readDB, writeDB, initDB, resetToRealData, restoreFromBackup, getStorageMode } = require('./db');
const { generateODExcel, generateRegistrationsExcel, parseRegistrationsExcel } = require('./excel');

// Eager initialization of DB connection
initDB().catch(err => console.warn('[ARENIUM API] Startup DB init note:', err.message));

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// API route compatibility: handles requests whether proxy preserves or strips /api
app.use((req, res, next) => {
  if (!req.url.startsWith('/api') && req.url !== '/' && !req.url.startsWith('/health')) {
    req.url = '/api' + req.url;
  }
  next();
});

// Health check endpoints for Vercel and service monitoring
app.get(['/', '/health', '/api/health'], (req, res) => {
  const storage = getStorageMode();
  res.json({
    status: 'ok',
    service: 'ARENIUM API',
    timestamp: new Date().toISOString(),
    storage
  });
});

// Helper for generating IDs
const generateId = (prefix) => `${prefix}-${crypto.randomBytes(4).toString('hex')}`;

// Format hours nicely
const formatHours = (hoursArray) => {
  if (!Array.isArray(hoursArray) || hoursArray.length === 0) return 'None';
  return hoursArray.map(h => `Hour ${h}`).join(', ');
};

// ==========================================
// AUTHENTICATION ROUTES
// ==========================================

app.post('/api/auth/login', async (req, res) => {
  const { role, email, password, teamName } = req.body;
  const db = await readDB();

  if (role === 'ADMIN') {
    const admin = db.admins.find(
      a => a.email.toLowerCase() === (email || '').toLowerCase().trim() &&
           a.password === (password || '').trim()
    );
    if (!admin) {
      return res.status(401).json({ error: 'Invalid Admin credentials' });
    }
    return res.json({
      success: true,
      user: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: 'ADMIN',
        designation: admin.designation
      }
    });
  }

  if (role === 'CORE_TEAM') {
    const core = db.coreTeam.find(
      c => c.email.toLowerCase() === (email || '').toLowerCase().trim() &&
           c.password === (password || '').trim()
    );
    if (!core) {
      return res.status(401).json({ error: 'Invalid Core Team credentials' });
    }
    return res.json({
      success: true,
      user: {
        id: core.id,
        name: core.name,
        email: core.email,
        role: 'CORE_TEAM',
        rollNumber: core.rollNumber,
        section: core.section,
        batchNumber: core.batchNumber,
        schoolName: core.schoolName,
        hodName: core.hodName,
        phone: core.phone
      }
    });
  }

  if (role === 'VOLUNTEER') {
    const vol = (db.volunteers || []).find(
      v => v.email.toLowerCase() === (email || '').toLowerCase().trim() &&
           v.password === (password || '').trim()
    );
    if (!vol) {
      return res.status(401).json({ error: 'Invalid Volunteer credentials' });
    }
    if (vol.status !== 'APPROVED') {
      return res.status(403).json({
        error: `Your volunteer account is currently ${vol.status || 'PENDING'}. Please await Admin approval.`
      });
    }
    return res.json({
      success: true,
      user: {
        id: vol.id,
        name: vol.name,
        email: vol.email,
        role: 'VOLUNTEER',
        rollNumber: vol.rollNumber,
        section: vol.section,
        batchNumber: vol.batchNumber,
        schoolName: vol.schoolName,
        hodName: vol.hodName,
        dutyRole: vol.dutyRole,
        phone: vol.phone
      }
    });
  }

  if (role === 'PARTICIPANT') {
    const cleanTeamName = (teamName || '').trim();
    if (!cleanTeamName) {
      return res.status(400).json({ error: 'Team name is required for Participants' });
    }

    let team = (db.teams || []).find(
      t => t.teamName.toLowerCase() === cleanTeamName.toLowerCase()
    );

    // If team doesn't exist, auto-create a starting team with 1 leader
    if (!team) {
      team = {
        id: generateId('team'),
        teamName: cleanTeamName,
        category: 'General Hackathon & Events',
        verified: false,
        verifiedAt: null,
        verifiedBy: null,
        members: [
          {
            id: generateId('mem'),
            name: `${cleanTeamName} Leader`,
            rollNumber: '20231CSE' + Math.floor(100 + Math.random() * 900),
            section: 'CSE-01',
            batchNumber: 'Batch 2023-27',
            schoolName: 'School of Engineering',
            hodName: 'Dr. Ramesh Kumar',
            isLeader: true
          }
        ]
      };
      if (!Array.isArray(db.teams)) db.teams = [];
      db.teams.push(team);
      await writeDB(db);
    }

    return res.json({
      success: true,
      user: {
        role: 'PARTICIPANT',
        teamId: team.id,
        teamName: team.teamName,
        verified: team.verified,
        members: team.members
      }
    });
  }

  return res.status(400).json({ error: 'Invalid login role specified' });
});

// Quick seed status route
app.get('/api/system/status', async (req, res) => {
  const db = await readDB();
  res.json({
    status: 'online',
    counts: {
      admins: (db.admins || []).length,
      coreTeam: (db.coreTeam || []).length,
      volunteers: (db.volunteers || []).length,
      teams: (db.teams || []).length,
      odRequests: (db.odRequests || []).length
    },
    storage: getStorageMode()
  });
});

// ==========================================
// CORE TEAM ROUTES
// ==========================================

// Add a volunteer (submits to admin for approval)
app.post('/api/core/add-volunteer', async (req, res) => {
  const {
    name,
    email,
    password,
    rollNumber,
    section,
    batchNumber,
    schoolName,
    hodName,
    dutyRole,
    phone,
    addedBy
  } = req.body;

  if (!name || !email || !rollNumber) {
    return res.status(400).json({ error: 'Name, email, and roll number are required' });
  }

  const db = await readDB();
  if (!Array.isArray(db.volunteers)) db.volunteers = [];

  const existing = db.volunteers.find(v => v.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(400).json({ error: 'A volunteer with this email already exists' });
  }

  const newVolunteer = {
    id: generateId('vol'),
    name: name.trim(),
    email: email.trim().toLowerCase(),
    password: password || 'Vol123',
    rollNumber: rollNumber.trim().toUpperCase(),
    section: section || 'CSE-01',
    batchNumber: batchNumber || 'Batch 2022-26',
    schoolName: schoolName || 'School of Engineering',
    hodName: hodName || 'Dr. Ramesh Kumar',
    dutyRole: dutyRole || 'Event Operations & Verification',
    phone: phone || '+91 90000 00000',
    status: 'PENDING',
    addedBy: addedBy || 'Core Team Member',
    addedAt: new Date().toISOString(),
    approvedBy: null,
    approvedAt: null
  };

  db.volunteers.unshift(newVolunteer);
  await writeDB(db);

  res.json({
    success: true,
    message: 'Volunteer registered and submitted to Admin for approval',
    volunteer: newVolunteer
  });
});

// List volunteers added by core
app.get('/api/core/volunteers', async (req, res) => {
  const db = await readDB();
  res.json(db.volunteers || []);
});

// Apply for OD leave for Hours 1-8
app.post('/api/core/apply-od', async (req, res) => {
  const {
    coreId,
    name,
    rollNumber,
    section,
    batchNumber,
    schoolName,
    hodName,
    date,
    hours,
    reason
  } = req.body;

  if (!hours || !Array.isArray(hours) || hours.length === 0) {
    return res.status(400).json({ error: 'Please select at least one hour (1-8)' });
  }
  if (!date) {
    return res.status(400).json({ error: 'Date is required' });
  }

  const db = await readDB();
  if (!Array.isArray(db.odRequests)) db.odRequests = [];

  const newRequest = {
    id: generateId('od-core'),
    requestType: 'CORE_TEAM',
    targetId: coreId || 'core-unknown',
    name: name || 'Core Team Member',
    rollNumber: (rollNumber || '20211CSE0000').toUpperCase(),
    section: section || 'CSE-04',
    batchNumber: batchNumber || 'Batch 2021-25',
    schoolName: schoolName || 'School of Engineering',
    hodName: hodName || 'Dr. Ramesh Kumar',
    teamName: 'ARENIUM CORE TEAM',
    date: date,
    hours: hours.sort((a, b) => a - b),
    hoursFormatted: formatHours(hours),
    reason: reason || 'Core Management, Tech Arena Setup and Event Coordination',
    submittedBy: {
      id: coreId,
      name: name,
      role: 'CORE_TEAM'
    },
    status: 'PENDING',
    adminRemark: '',
    reviewedBy: null,
    reviewedAt: null,
    createdAt: new Date().toISOString()
  };

  db.odRequests.unshift(newRequest);
  await writeDB(db);

  res.json({
    success: true,
    message: 'OD Leave application submitted to Admin successfully',
    request: newRequest
  });
});

// Get Core OD requests (supports both view=ALL for full team visibility and view=MY for personal filter)
app.get('/api/core/od-history', async (req, res) => {
  const { coreId, view } = req.query;
  const db = await readDB();
  const allCoreRequests = (db.odRequests || []).filter(r => r.requestType === 'CORE_TEAM');

  if (view === 'MY' && coreId) {
    return res.json(allCoreRequests.filter(r => r.targetId === coreId));
  }
  // Default returns all core team requests so all core members have mutual visibility
  res.json(allCoreRequests);
});

// ==========================================
// VOLUNTEER ROUTES
// ==========================================

// Verify Team via Team QR
app.post('/api/volunteer/verify-team', async (req, res) => {
  const { teamId, teamName, volunteerId, volunteerName } = req.body;
  const db = await readDB();
  if (!Array.isArray(db.teams)) db.teams = [];
  if (!Array.isArray(db.scanLogs)) db.scanLogs = [];

  let team = db.teams.find(t => 
    (teamId && t.id === teamId) || 
    (teamName && t.teamName.toLowerCase() === teamName.toLowerCase().trim())
  );

  if (!team) {
    return res.status(404).json({ error: 'Team not found with the scanned QR payload' });
  }

  team.verified = true;
  team.verifiedAt = new Date().toISOString();
  team.verifiedBy = `${volunteerName || 'Volunteer'} (${volunteerId || 'Vol'})`;

  // Log scan event
  const scanLog = {
    id: generateId('scan'),
    volunteerId: volunteerId || 'vol-unknown',
    volunteerName: volunteerName || 'Volunteer',
    scanType: 'TEAM_VERIFICATION',
    teamId: team.id,
    teamName: team.teamName,
    timestamp: new Date().toISOString(),
    details: `Verified ${team.members ? team.members.length : 0} members of ${team.teamName}`
  };
  db.scanLogs.unshift(scanLog);

  await writeDB(db);

  res.json({
    success: true,
    message: `Team "${team.teamName}" verified successfully!`,
    team
  });
});

// Submit participant hourly attendance (allotted by volunteer after QR scan)
app.post('/api/volunteer/submit-attendance', async (req, res) => {
  const {
    participantId,
    name,
    rollNumber,
    section,
    batchNumber,
    schoolName,
    hodName,
    teamName,
    date,
    hours,
    reason,
    volunteerId,
    volunteerName
  } = req.body;

  if (!name || !rollNumber) {
    return res.status(400).json({ error: 'Participant name and roll number are required' });
  }
  if (!hours || !Array.isArray(hours) || hours.length === 0) {
    return res.status(400).json({ error: 'Please select attendance hours (Hour 1 to 8)' });
  }

  const db = await readDB();
  if (!Array.isArray(db.odRequests)) db.odRequests = [];
  if (!Array.isArray(db.scanLogs)) db.scanLogs = [];

  const newAttendance = {
    id: generateId('od-vol'),
    requestType: 'VOLUNTEER',
    targetId: participantId || generateId('part'),
    name: name.trim(),
    rollNumber: rollNumber.trim().toUpperCase(),
    section: section || 'CSE-01',
    batchNumber: batchNumber || 'Batch 2022-26',
    schoolName: schoolName || 'School of Engineering',
    hodName: hodName || 'Dr. Ramesh Kumar',
    teamName: teamName || 'Individual Participant',
    date: date || new Date().toISOString().split('T')[0],
    hours: hours.sort((a, b) => a - b),
    hoursFormatted: formatHours(hours),
    reason: reason || `Volunteer Hourly Attendance Check (Verified by ${volunteerName || 'Volunteer'})`,
    submittedBy: {
      id: volunteerId || 'vol-unknown',
      name: volunteerName || 'Volunteer',
      role: 'VOLUNTEER'
    },
    status: 'PENDING',
    adminRemark: '',
    reviewedBy: null,
    reviewedAt: null,
    createdAt: new Date().toISOString()
  };

  db.odRequests.unshift(newAttendance);

  // Log scan event
  db.scanLogs.unshift({
    id: generateId('scan'),
    volunteerId: volunteerId || 'vol-unknown',
    volunteerName: volunteerName || 'Volunteer',
    scanType: 'PARTICIPANT_ATTENDANCE',
    targetName: name,
    rollNumber: rollNumber,
    hours: hours,
    timestamp: new Date().toISOString(),
    details: `Logged ${hours.length} hours attendance for ${name} (${rollNumber})`
  });

  await writeDB(db);

  res.json({
    success: true,
    message: `Hourly attendance for ${name} submitted to Admin for approval`,
    record: newAttendance
  });
});

// Get volunteer scan history and recent submissions
app.get('/api/volunteer/activity', async (req, res) => {
  const { volunteerId } = req.query;
  const db = await readDB();
  const scanLogs = db.scanLogs || [];
  const odRequests = db.odRequests || [];

  const scans = volunteerId 
    ? scanLogs.filter(s => s.volunteerId === volunteerId)
    : scanLogs;
  const submissions = volunteerId
    ? odRequests.filter(r => r.submittedBy && r.submittedBy.id === volunteerId)
    : odRequests.filter(r => r.requestType === 'VOLUNTEER');

  res.json({
    scans,
    submissions
  });
});

// Search participant or team for quick scan fallback
app.get('/api/volunteer/lookup', async (req, res) => {
  const { q } = req.query;
  if (!q) return res.json({ teams: [], members: [] });

  const db = await readDB();
  const query = q.toLowerCase().trim();
  const teams = db.teams || [];

  const matchingTeams = teams.filter(t => 
    t.teamName.toLowerCase().includes(query)
  );

  const matchingMembers = [];
  teams.forEach(t => {
    (t.members || []).forEach(m => {
      if (
        m.name.toLowerCase().includes(query) ||
        m.rollNumber.toLowerCase().includes(query)
      ) {
        matchingMembers.push({
          ...m,
          teamName: t.teamName,
          teamVerified: t.verified
        });
      }
    });
  });

  // Also search through Delegate Registrations & Excel Imports
  const registrations = db.registrations || [];
  registrations.forEach(r => {
    const isMatch = (
      (r.fullName && r.fullName.toLowerCase().includes(query)) ||
      (r.usn && r.usn.toLowerCase().includes(query)) ||
      (r.id && r.id.toLowerCase().includes(query)) ||
      (r.teamName && r.teamName.toLowerCase().includes(query)) ||
      (r.utrId && r.utrId.toLowerCase().includes(query))
    );

    if (isMatch && !matchingMembers.some(m => m.rollNumber && r.usn && m.rollNumber.toLowerCase() === r.usn.toLowerCase())) {
      const isPaid = (r.paymentVerified || r.status === 'Confirmed' || r.status === 'Checked In');
      matchingMembers.push({
        id: r.id,
        regId: r.id,
        name: r.fullName,
        rollNumber: r.usn || r.id,
        section: r.department || 'Delegate',
        batchNumber: r.yearSem || '2024-27',
        schoolName: r.college || 'Presidency University',
        teamName: r.teamName || 'Solo Delegate',
        teamVerified: isPaid,
        paymentVerified: isPaid,
        status: r.status,
        feePaid: r.feePaid,
        utrId: r.utrId,
        isRegistration: true
      });
    }
  });

  res.json({
    teams: matchingTeams,
    members: matchingMembers
  });
});

// ==========================================
// PARTICIPANT ROUTES
// ==========================================

// Get Team info by teamName
app.get('/api/participant/team/:teamName', async (req, res) => {
  const db = await readDB();
  const teams = db.teams || [];
  const team = teams.find(
    t => t.teamName.toLowerCase() === req.params.teamName.toLowerCase().trim()
  );
  if (!team) {
    return res.status(404).json({ error: 'Team not found' });
  }
  res.json(team);
});

// Add member to team
app.post('/api/participant/add-member', async (req, res) => {
  const { teamName, name, rollNumber, section, batchNumber, schoolName, hodName } = req.body;
  if (!teamName || !name || !rollNumber) {
    return res.status(400).json({ error: 'Team name, member name, and roll number are required' });
  }

  const db = await readDB();
  if (!Array.isArray(db.teams)) db.teams = [];
  const team = db.teams.find(t => t.teamName.toLowerCase() === teamName.toLowerCase().trim());
  if (!team) {
    return res.status(404).json({ error: 'Team not found' });
  }

  if (!Array.isArray(team.members)) team.members = [];

  const newMember = {
    id: generateId('mem'),
    name: name.trim(),
    rollNumber: rollNumber.trim().toUpperCase(),
    section: section || 'CSE-01',
    batchNumber: batchNumber || 'Batch 2023-27',
    schoolName: schoolName || 'School of Engineering',
    hodName: hodName || 'Dr. Ramesh Kumar',
    isLeader: false
  };

  team.members.push(newMember);
  await writeDB(db);

  res.json({
    success: true,
    message: 'Member added to team successfully',
    team
  });
});

// Participant self apply for OD
app.post('/api/participant/apply-od', async (req, res) => {
  const {
    memberId,
    name,
    rollNumber,
    section,
    batchNumber,
    schoolName,
    hodName,
    teamName,
    date,
    hours,
    reason
  } = req.body;

  if (!hours || !Array.isArray(hours) || hours.length === 0) {
    return res.status(400).json({ error: 'Please select hours for OD (1-8)' });
  }
  if (!date) {
    return res.status(400).json({ error: 'Date is required' });
  }

  const db = await readDB();
  if (!Array.isArray(db.odRequests)) db.odRequests = [];

  const newRequest = {
    id: generateId('od-part'),
    requestType: 'PARTICIPANT',
    targetId: memberId || generateId('part'),
    name: name || 'Participant',
    rollNumber: (rollNumber || '20231CSE0000').toUpperCase(),
    section: section || 'CSE-01',
    batchNumber: batchNumber || 'Batch 2023-27',
    schoolName: schoolName || 'School of Engineering',
    hodName: hodName || 'Dr. Ramesh Kumar',
    teamName: teamName || 'General Team',
    date: date,
    hours: hours.sort((a, b) => a - b),
    hoursFormatted: formatHours(hours),
    reason: reason || 'Participant Project Presentation / Arena Competition',
    submittedBy: {
      id: memberId,
      name: name,
      role: 'PARTICIPANT'
    },
    status: 'PENDING',
    adminRemark: '',
    reviewedBy: null,
    reviewedAt: null,
    createdAt: new Date().toISOString()
  };

  db.odRequests.unshift(newRequest);
  await writeDB(db);

  res.json({
    success: true,
    message: 'Participant OD applied successfully and sent to Admin',
    request: newRequest
  });
});

// Get team OD history
app.get('/api/participant/od-history/:teamName', async (req, res) => {
  const db = await readDB();
  const teamName = req.params.teamName.toLowerCase().trim();
  const odRequests = db.odRequests || [];
  const requests = odRequests.filter(
    r => (r.teamName && r.teamName.toLowerCase() === teamName) ||
         (r.requestType === 'PARTICIPANT' && r.teamName && r.teamName.toLowerCase() === teamName)
  );
  res.json(requests);
});

// ==========================================
// ADMIN ROUTES & REQUEST PORTAL
// ==========================================

// Overview stats
app.get('/api/admin/overview', async (req, res) => {
  const db = await readDB();
  const odRequests = db.odRequests || [];
  const volunteers = db.volunteers || [];
  const teams = db.teams || [];

  const totalCoreRequests = odRequests.filter(r => r.requestType === 'CORE_TEAM').length;
  const totalVolunteerScans = odRequests.filter(r => r.requestType === 'VOLUNTEER').length;
  const totalParticipantODs = odRequests.filter(r => r.requestType === 'PARTICIPANT').length;

  const pendingCore = odRequests.filter(r => r.requestType === 'CORE_TEAM' && r.status === 'PENDING').length;
  const pendingVolunteers = volunteers.filter(v => v.status === 'PENDING').length +
                           odRequests.filter(r => r.requestType === 'VOLUNTEER' && r.status === 'PENDING').length;
  const pendingParticipants = odRequests.filter(r => r.requestType === 'PARTICIPANT' && r.status === 'PENDING').length;

  const totalApproved = odRequests.filter(r => r.status === 'APPROVED').length;

  const registrations = db.registrations || [];
  const totalRegistrations = registrations.length;
  const verifiedRegistrations = registrations.filter(r => r.status === 'Confirmed' || r.status === 'Checked In' || r.paymentVerified).length;
  const pendingRegistrations = registrations.filter(r => !r.status || r.status === 'Pending Verification' || (!r.paymentVerified && r.status !== 'Rejected' && r.status !== 'Confirmed' && r.status !== 'Checked In')).length;
  const checkedInRegistrations = registrations.filter(r => r.checkedIn || r.status === 'Checked In').length;

  res.json({
    totalCoreRequests,
    totalVolunteerScans,
    totalParticipantODs,
    pendingCore,
    pendingVolunteers,
    pendingParticipants,
    totalApproved,
    totalTeams: teams.length,
    verifiedTeams: teams.filter(t => t.verified).length,
    totalVolunteers: volunteers.length,
    approvedVolunteers: volunteers.filter(v => v.status === 'APPROVED').length,
    totalRegistrations,
    verifiedRegistrations,
    pendingRegistrations,
    checkedInRegistrations,
    storageMode: getStorageMode()
  });
});

// Get Request Portal items partitioned into 3 sections:
// 1. CORE TEAM
// 2. VOLUNTEERS (both volunteer accounts pending approval + attendance records pending approval)
// 3. PARTICIPANTS
app.get('/api/admin/requests', async (req, res) => {
  const db = await readDB();
  const odRequests = db.odRequests || [];
  const volunteers = db.volunteers || [];

  const coreRequests = odRequests.filter(r => r.requestType === 'CORE_TEAM');
  const volunteerAttendanceRequests = odRequests.filter(r => r.requestType === 'VOLUNTEER');
  const volunteerAccountRequests = volunteers.filter(v => v.status === 'PENDING');
  const participantRequests = odRequests.filter(r => r.requestType === 'PARTICIPANT');

  res.json({
    coreRequests,
    volunteers: {
      accountApprovals: volunteerAccountRequests,
      attendanceApprovals: volunteerAttendanceRequests,
      allVolunteers: volunteers
    },
    participantRequests
  });
});

// Review OD Request (Core, Volunteer attendance, Participant)
app.post('/api/admin/review-od', async (req, res) => {
  const { requestId, action, adminName, remark } = req.body;
  if (!['APPROVED', 'REJECTED'].includes(action)) {
    return res.status(400).json({ error: 'Action must be APPROVED or REJECTED' });
  }

  const db = await readDB();
  const odRequests = db.odRequests || [];
  const request = odRequests.find(r => r.id === requestId);
  if (!request) {
    return res.status(404).json({ error: 'Request not found' });
  }

  request.status = action;
  request.adminRemark = remark || (action === 'APPROVED' ? 'Approved by Admin' : 'Rejected by Admin');
  request.reviewedBy = adminName || 'Admin';
  request.reviewedAt = new Date().toISOString();

  await writeDB(db);

  res.json({
    success: true,
    message: `Request ${action} successfully`,
    request
  });
});

// Batch Review OD Requests
app.post('/api/admin/batch-review-od', async (req, res) => {
  const { requestIds, action, adminName, remark } = req.body;
  if (!['APPROVED', 'REJECTED'].includes(action)) {
    return res.status(400).json({ error: 'Action must be APPROVED or REJECTED' });
  }
  if (!Array.isArray(requestIds) || requestIds.length === 0) {
    return res.status(400).json({ error: 'No request IDs provided' });
  }

  const db = await readDB();
  const odRequests = db.odRequests || [];
  let updatedCount = 0;
  const now = new Date().toISOString();

  odRequests.forEach(r => {
    if (requestIds.includes(r.id)) {
      r.status = action;
      r.adminRemark = remark || (action === 'APPROVED' ? 'Batch Approved by Admin' : 'Batch Rejected by Admin');
      r.reviewedBy = adminName || 'Admin';
      r.reviewedAt = now;
      updatedCount++;
    }
  });

  await writeDB(db);

  res.json({
    success: true,
    message: `Successfully ${action.toLowerCase()} ${updatedCount} requests`,
    count: updatedCount
  });
});

// Review Volunteer Account Addition (submitted by Core)
app.post('/api/admin/review-volunteer', async (req, res) => {
  const { volunteerId, action, adminName, remark } = req.body;
  if (!['APPROVED', 'REJECTED'].includes(action)) {
    return res.status(400).json({ error: 'Action must be APPROVED or REJECTED' });
  }

  const db = await readDB();
  const volunteers = db.volunteers || [];
  const vol = volunteers.find(v => v.id === volunteerId);
  if (!vol) {
    return res.status(404).json({ error: 'Volunteer not found' });
  }

  vol.status = action;
  vol.approvedBy = adminName || 'Admin';
  vol.approvedAt = new Date().toISOString();
  if (remark) vol.adminRemark = remark;

  await writeDB(db);

  res.json({
    success: true,
    message: `Volunteer account ${action} successfully`,
    volunteer: vol
  });
});

// Batch Review Volunteers
app.post('/api/admin/batch-review-volunteers', async (req, res) => {
  const { volunteerIds, action, adminName, remark } = req.body;
  if (!['APPROVED', 'REJECTED'].includes(action)) {
    return res.status(400).json({ error: 'Action must be APPROVED or REJECTED' });
  }
  if (!Array.isArray(volunteerIds) || volunteerIds.length === 0) {
    return res.status(400).json({ error: 'No volunteer IDs provided' });
  }

  const db = await readDB();
  const volunteers = db.volunteers || [];
  let updatedCount = 0;
  const now = new Date().toISOString();

  volunteers.forEach(v => {
    if (volunteerIds.includes(v.id)) {
      v.status = action;
      v.approvedBy = adminName || 'Admin';
      v.approvedAt = now;
      if (remark) v.adminRemark = remark;
      updatedCount++;
    }
  });

  await writeDB(db);

  res.json({
    success: true,
    message: `Successfully ${action.toLowerCase()} ${updatedCount} volunteers`,
    count: updatedCount
  });
});

// List all teams and verification
app.get('/api/admin/teams', async (req, res) => {
  const db = await readDB();
  res.json(db.teams || []);
});

// ==========================================
// DAILY EXCEL EXPORT ROUTE
// ==========================================

app.get('/api/admin/export-excel', async (req, res) => {
  const { date = 'ALL', hour = 'ALL', sectionType = 'ALL', status = 'ALL' } = req.query;
  const db = await readDB();

  let records = db.odRequests || [];

  // Filter by status (default APPROVED or ALL)
  if (status && status !== 'ALL') {
    records = records.filter(r => r.status === status);
  }

  // Filter by date if provided
  if (date && date !== 'ALL') {
    records = records.filter(r => r.date === date);
  }

  // Filter by hour if provided
  if (hour && hour !== 'ALL') {
    const hrNum = parseInt(hour, 10);
    records = records.filter(r => Array.isArray(r.hours) && r.hours.includes(hrNum));
  }

  // Filter by section if provided
  if (sectionType && sectionType !== 'ALL') {
    records = records.filter(r => r.requestType === sectionType);
  }

  const metadata = {
    date: date || 'All Dates',
    filterHours: hour ? `Hour ${hour}` : 'All Hours (1-8)',
    reportType: sectionType ? `${sectionType} Section Report` : 'All Sections Consolidated'
  };

  const excelBuffer = generateODExcel(records, metadata);

  const cleanDateStr = date && date !== 'ALL' ? date : new Date().toISOString().split('T')[0];
  const filename = `ARENIUM_OD_REPORT_${cleanDateStr}.xlsx`;

  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-Length', excelBuffer.length);

  return res.send(excelBuffer);
});

// Download full system backup as JSON
app.get('/api/admin/export-backup', async (req, res) => {
  const db = await readDB();
  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `ARENIUM_FULL_BACKUP_${dateStr}.json`;

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(JSON.stringify(db, null, 2));
});

// Restore system from uploaded JSON backup
app.post('/api/admin/restore-backup', async (req, res) => {
  const { backupData } = req.body;
  if (!backupData) {
    return res.status(400).json({ error: 'No backup data provided' });
  }

  try {
    const restored = await restoreFromBackup(backupData);
    res.json({
      success: true,
      message: 'System successfully restored from backup snapshot',
      counts: {
        volunteers: (restored.volunteers || []).length,
        teams: (restored.teams || []).length,
        odRequests: (restored.odRequests || []).length
      }
    });
  } catch (err) {
    res.status(400).json({ error: err.message || 'Failed to restore backup' });
  }
});

// Reset to clean real state (zero demo data)
app.post('/api/system/reset-demo', async (req, res) => {
  const db = await resetToRealData();
  res.json({ success: true, message: 'Database reset to clean real state' });
});

// ==========================================
// REGISTRATION ENGINE & GATE SCANNER SYNC
// ==========================================

// 1. Get all registrations (with filters & stats)
app.get('/api/registrations', async (req, res) => {
  const db = await readDB();
  let list = db.registrations || [];
  const { status, event, search, limit } = req.query;

  if (status && status !== 'ALL') {
    list = list.filter(r => r.status === status || (status === 'Confirmed' && r.paymentVerified));
  }
  if (event && event !== 'ALL') {
    list = list.filter(r => r.eventId === event || r.event1Id === event || (r.eventName && r.eventName.toLowerCase().includes(event.toLowerCase())));
  }
  if (search) {
    const q = search.toLowerCase().trim();
    list = list.filter(r => 
      (r.id && r.id.toLowerCase().includes(q)) ||
      (r.fullName && r.fullName.toLowerCase().includes(q)) ||
      (r.email && r.email.toLowerCase().includes(q)) ||
      (r.college && r.college.toLowerCase().includes(q)) ||
      (r.usn && r.usn.toLowerCase().includes(q)) ||
      (r.utrId && r.utrId.toLowerCase().includes(q)) ||
      (r.teamName && r.teamName.toLowerCase().includes(q))
    );
  }

  const allRegs = db.registrations || [];
  const stats = {
    total: allRegs.length,
    verified: allRegs.filter(r => r.status === 'Confirmed' || r.status === 'Checked In' || r.paymentVerified).length,
    pending: allRegs.filter(r => !r.status || r.status === 'Pending Verification' || (!r.paymentVerified && r.status !== 'Rejected' && r.status !== 'Confirmed' && r.status !== 'Checked In')).length,
    checkedIn: allRegs.filter(r => r.checkedIn || r.status === 'Checked In').length,
    rejected: allRegs.filter(r => r.status === 'Rejected').length
  };

  const parsedLimit = parseInt(limit, 10);
  if (!isNaN(parsedLimit) && parsedLimit > 0) {
    list = list.slice(0, parsedLimit);
  }

  res.json({
    registrations: list,
    stats
  });
});

// 2. Submit new student registration (Defaults to 'Pending Verification')
app.post('/api/registrations', async (req, res) => {
  const regData = req.body;
  if (!regData || !regData.fullName) {
    return res.status(400).json({ error: 'Participant name and details are required' });
  }

  const db = await readDB();
  if (!Array.isArray(db.registrations)) db.registrations = [];

  const regId = regData.id || `ARENIUM27-REG-${Math.floor(1000 + Math.random() * 9000)}`;
  const isVerified = (regData.status === 'Confirmed' || regData.status === 'Checked In' || regData.paymentVerified === true);

  const newReg = {
    ...regData,
    id: regId,
    status: isVerified ? 'Confirmed' : (regData.status || 'Pending Verification'),
    paymentVerified: isVerified,
    paymentVerifiedAt: isVerified ? (regData.paymentVerifiedAt || new Date().toISOString()) : null,
    paymentVerifiedBy: isVerified ? (regData.paymentVerifiedBy || 'Admin') : null,
    checkedIn: regData.status === 'Checked In',
    checkedInAt: regData.status === 'Checked In' ? new Date().toISOString() : null,
    timestamp: regData.timestamp || new Date().toISOString()
  };

  // Upsert if ID or USN already exists
  const existingIndex = db.registrations.findIndex(r => r.id === regId || (r.usn && regData.usn && r.usn.toLowerCase() === regData.usn.toLowerCase()));
  if (existingIndex >= 0) {
    db.registrations[existingIndex] = { ...db.registrations[existingIndex], ...newReg };
  } else {
    db.registrations.unshift(newReg);
  }

  await writeDB(db);

  res.json({
    success: true,
    message: isVerified 
      ? 'Registration confirmed and verified!' 
      : 'Registration submitted! Payment proof is pending admin verification before pass is unlocked.',
    registration: newReg
  });
});

// 3. Student Pass Lookup (By Registration ID, USN, or Email)
// Enforces: Pass is only unlocked if payment is verified by admin!
app.get('/api/registrations/lookup/:query', async (req, res) => {
  const query = (req.params.query || '').trim().toLowerCase();
  if (!query) {
    return res.status(400).json({ error: 'Search query is required' });
  }

  const db = await readDB();
  const list = db.registrations || [];

  const reg = list.find(r => 
    (r.id && r.id.toLowerCase() === query) ||
    (r.usn && r.usn.toLowerCase() === query) ||
    (r.email && r.email.toLowerCase() === query) ||
    (r.utrId && r.utrId.toLowerCase() === query)
  );

  if (!reg) {
    return res.status(404).json({
      found: false,
      error: 'No registration record found for: ' + req.params.query
    });
  }

  const isVerified = (reg.status === 'Confirmed' || reg.status === 'Checked In' || reg.paymentVerified);

  if (reg.status === 'Rejected') {
    return res.json({
      found: true,
      verified: false,
      passUnlocked: false,
      status: 'Rejected',
      message: 'Registration / Payment verification was marked as REJECTED. Please contact fest administration.',
      registration: {
        id: reg.id,
        fullName: reg.fullName,
        college: reg.college,
        usn: reg.usn,
        status: 'Rejected',
        feePaid: reg.feePaid
      }
    });
  }

  if (!isVerified) {
    // Payment Pending: Return public summary but DO NOT unlock full pass QR
    return res.json({
      found: true,
      verified: false,
      passUnlocked: false,
      status: 'Pending Verification',
      message: 'Your registration is received, but payment (UTR: ' + (reg.utrId || 'N/A') + ') is currently under verification by the admin. Your official delegate entry pass & QR code will unlock once payment is approved.',
      registration: {
        id: reg.id,
        fullName: reg.fullName,
        college: reg.college,
        usn: reg.usn,
        eventName: reg.eventName || reg.event1Name,
        event1Name: reg.event1Name || reg.eventName,
        event2Name: reg.event2Name || '',
        event3Name: reg.event3Name || '',
        feePaid: reg.feePaid,
        utrId: reg.utrId,
        regType: reg.regType,
        teamName: reg.teamName,
        status: 'Pending Verification',
        timestamp: reg.timestamp
      }
    });
  }

  // Payment is Verified: Return full unlocked pass payload
  res.json({
    found: true,
    verified: true,
    passUnlocked: true,
    status: reg.status,
    message: 'Payment verified! Official Delegate Gate Pass is unlocked and valid for entry.',
    registration: reg
  });
});

// 4. Verify Registration Payment (Admin Approval)
app.post('/api/registrations/:id/verify-payment', async (req, res) => {
  const { id } = req.params;
  const { adminName } = req.body;

  const db = await readDB();
  if (!Array.isArray(db.registrations)) db.registrations = [];

  const reg = db.registrations.find(r => r.id === id);
  if (!reg) {
    return res.status(404).json({ error: 'Registration not found' });
  }

  reg.status = 'Confirmed';
  reg.paymentVerified = true;
  reg.paymentVerifiedAt = new Date().toISOString();
  reg.paymentVerifiedBy = adminName || 'Admin';

  await writeDB(db);

  res.json({
    success: true,
    message: `Payment for ${reg.fullName} (${reg.id}) verified successfully! Entry pass unlocked for student.`,
    registration: reg
  });
});

// 5. Reject Registration Payment (Admin Action)
app.post('/api/registrations/:id/reject-payment', async (req, res) => {
  const { id } = req.params;
  const { reason, adminName } = req.body;

  const db = await readDB();
  if (!Array.isArray(db.registrations)) db.registrations = [];

  const reg = db.registrations.find(r => r.id === id);
  if (!reg) {
    return res.status(404).json({ error: 'Registration not found' });
  }

  reg.status = 'Rejected';
  reg.paymentVerified = false;
  reg.rejectReason = reason || 'Payment transaction verification failed';
  reg.rejectedAt = new Date().toISOString();
  reg.rejectedBy = adminName || 'Admin';

  await writeDB(db);

  res.json({
    success: true,
    message: `Registration ${reg.id} marked as rejected.`,
    registration: reg
  });
});

// 6. Delete Registration
app.delete('/api/registrations/:id', async (req, res) => {
  const { id } = req.params;
  const db = await readDB();
  if (!Array.isArray(db.registrations)) db.registrations = [];

  const prevLen = db.registrations.length;
  db.registrations = db.registrations.filter(r => r.id !== id);

  if (db.registrations.length === prevLen) {
    return res.status(404).json({ error: 'Registration not found' });
  }

  await writeDB(db);
  res.json({ success: true, message: `Registration ${id} deleted.` });
});

// 7. Batch Verify Payments
app.post('/api/registrations/batch-verify', async (req, res) => {
  const { ids, adminName } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'No registration IDs supplied' });
  }

  const db = await readDB();
  if (!Array.isArray(db.registrations)) db.registrations = [];

  let count = 0;
  db.registrations.forEach(r => {
    if (ids.includes(r.id)) {
      r.status = 'Confirmed';
      r.paymentVerified = true;
      r.paymentVerifiedAt = new Date().toISOString();
      r.paymentVerifiedBy = adminName || 'Admin Batch';
      count++;
    }
  });

  await writeDB(db);
  res.json({
    success: true,
    message: `Successfully verified payments for ${count} registrations!`,
    count
  });
});

// 8. UNIFIED GATE SCANNER VERIFICATION
// Scans delegate pass, verifies payment approval, and checks participant into festival
app.post('/api/registrations/scan', async (req, res) => {
  const { qrData, volunteerId, volunteerName, scannerSource } = req.body;
  if (!qrData) {
    return res.status(400).json({ cleared: false, error: 'No QR data provided' });
  }

  const raw = String(qrData).trim();
  const db = await readDB();
  if (!Array.isArray(db.registrations)) db.registrations = [];
  if (!Array.isArray(db.scanLogs)) db.scanLogs = [];

  // 1. Try to extract Registration ID or Roll No
  let targetId = null;
  const idMatch = raw.match(/ARENIUM27-REG-[0-9]+/i) || raw.match(/AR27-[A-Z0-9-]+/i) || raw.match(/TEST-[A-Z0-9-]+/i);
  if (idMatch) {
    targetId = idMatch[0].toUpperCase();
  }

  // 2. Try JSON parsing
  let jsonPayload = null;
  try {
    jsonPayload = JSON.parse(raw);
    if (jsonPayload.regId) targetId = jsonPayload.regId.toUpperCase();
    if (jsonPayload.id && String(jsonPayload.id).startsWith('ARENIUM')) targetId = jsonPayload.id.toUpperCase();
  } catch (_) {}

  // 3. Find registration in unified database
  let matchedReg = db.registrations.find(r => 
    (targetId && r.id && r.id.toUpperCase() === targetId) ||
    (r.id && r.id.toUpperCase() === raw.toUpperCase()) ||
    (r.usn && r.usn.toUpperCase() === raw.toUpperCase()) ||
    (r.utrId && r.utrId.toUpperCase() === raw.toUpperCase()) ||
    (jsonPayload && jsonPayload.rollNumber && r.usn && r.usn.toUpperCase() === jsonPayload.rollNumber.toUpperCase()) ||
    (r.fullName && r.fullName.toUpperCase() === raw.toUpperCase())
  );

  // If not found in registrations, also check if it's a team name
  if (!matchedReg) {
    matchedReg = db.registrations.find(r => r.teamName && r.teamName.toLowerCase() === raw.toLowerCase());
  }

  if (!matchedReg) {
    // Log unsuccessful scan
    db.scanLogs.unshift({
      id: generateId('scan'),
      volunteerId: volunteerId || 'scanner',
      volunteerName: volunteerName || 'Gate Scanner',
      scanType: 'UNREGISTERED_PASS',
      timestamp: new Date().toISOString(),
      details: `Unregistered barcode scanned: ${raw.slice(0, 100)}`
    });
    await writeDB(db);

    return res.status(404).json({
      cleared: false,
      error: 'NOT_FOUND',
      message: '⚠️ UNREGISTERED PASS: No matching registration found in ARENIUM 27 database.'
    });
  }

  // PAYMENT VERIFICATION CHECK:
  const isVerified = (matchedReg.status === 'Confirmed' || matchedReg.status === 'Checked In' || matchedReg.paymentVerified);

  if (!isVerified) {
    const isRejected = matchedReg.status === 'Rejected';
    return res.status(403).json({
      cleared: false,
      error: isRejected ? 'PAYMENT_REJECTED' : 'PAYMENT_NOT_VERIFIED',
      message: isRejected 
        ? `🛑 ACCESS DENIED: Registration for ${matchedReg.fullName} was REJECTED by fest admin!` 
        : `⚠️ ACCESS DENIED: Payment for ${matchedReg.fullName} (UTR: ${matchedReg.utrId || 'N/A'}) has NOT been verified by Admin yet! Direct delegate to Admin Registration Desk.`,
      registration: matchedReg
    });
  }

  // Payment is verified! Check-in gate pass
  const wasAlreadyCheckedIn = (matchedReg.status === 'Checked In' || matchedReg.checkedIn);
  matchedReg.status = 'Checked In';
  matchedReg.checkedIn = true;
  if (!matchedReg.checkedInAt) {
    matchedReg.checkedInAt = new Date().toISOString();
    matchedReg.checkedInBy = volunteerName ? `${volunteerName} (${volunteerId || 'Vol'})` : 'Gate Terminal Scanner';
  }

  // Log scan event
  db.scanLogs.unshift({
    id: generateId('scan'),
    volunteerId: volunteerId || 'scanner',
    volunteerName: volunteerName || 'Gate Scanner',
    scanType: 'GATE_ENTRY_PASS',
    regId: matchedReg.id,
    participantName: matchedReg.fullName,
    teamName: matchedReg.teamName,
    timestamp: new Date().toISOString(),
    details: `${wasAlreadyCheckedIn ? 'Repeat scan for' : 'Admitted'} ${matchedReg.fullName} (${matchedReg.regType || 'Solo'}) - Arenas: ${matchedReg.event1Name || matchedReg.eventName || 'Arenas'}`
  });

  // Automatically sync admitted students into the Daily OD Attendance roster for the official Excel Report
  if (!Array.isArray(db.odRequests)) db.odRequests = [];
  const todayDate = new Date().toISOString().slice(0, 10);
  const studentsToRecord = [];

  // Add registered delegate / team lead
  if (matchedReg.usn) {
    studentsToRecord.push({
      name: matchedReg.fullName || 'Delegate',
      usn: matchedReg.usn,
      section: matchedReg.department || 'Fest Participant',
      batch: matchedReg.yearSem || 'Batch 2024-27',
      school: matchedReg.college || 'Presidency University'
    });
  }

  // Add any team members if this is a team registration
  if (Array.isArray(matchedReg.teamMembersList)) {
    matchedReg.teamMembersList.forEach(m => {
      if (m.usn && !studentsToRecord.some(s => s.usn.toLowerCase() === m.usn.toLowerCase())) {
        studentsToRecord.push({
          name: m.name || 'Team Member',
          usn: m.usn,
          section: matchedReg.department || 'Fest Participant',
          batch: matchedReg.yearSem || 'Batch 2024-27',
          school: matchedReg.college || 'Presidency University'
        });
      }
    });
  }

  studentsToRecord.forEach((st, sIdx) => {
    const existingOD = db.odRequests.find(od =>
      od.date === todayDate &&
      od.rollNumber &&
      od.rollNumber.toLowerCase() === st.usn.toLowerCase()
    );

    if (!existingOD) {
      db.odRequests.unshift({
        id: `od-gate-${matchedReg.id}-${sIdx + 1}`,
        requestType: 'PARTICIPANT',
        targetId: matchedReg.id,
        name: st.name,
        rollNumber: st.usn,
        section: st.section,
        batchNumber: st.batch,
        schoolName: st.school,
        hodName: 'Dr. VMS / Dr. Vettermani',
        teamName: matchedReg.teamName || 'ARENIUM DELEGATE',
        date: todayDate,
        hours: [1, 2, 3, 4, 5, 6, 7, 8],
        hoursFormatted: 'Hour 1, Hour 2, Hour 3, Hour 4, Hour 5, Hour 6, Hour 7, Hour 8',
        reason: `Festival Delegate Attendance Verified at Gate Scanner (${matchedReg.event1Name || matchedReg.eventName || 'Arena'})`,
        status: 'APPROVED',
        adminRemark: 'Auto-verified via Gate Terminal Pass Verification',
        reviewedBy: volunteerName || 'Gate Scanner',
        reviewedAt: new Date().toISOString(),
        createdAt: new Date().toISOString()
      });
    } else if (existingOD.status !== 'APPROVED') {
      existingOD.status = 'APPROVED';
      existingOD.reviewedBy = volunteerName || 'Gate Scanner';
      existingOD.reviewedAt = new Date().toISOString();
      existingOD.adminRemark = 'Auto-approved via Gate Terminal Scan';
    }
  });

  await writeDB(db);

  res.json({
    cleared: true,
    alreadyCheckedIn: wasAlreadyCheckedIn,
    status: 'Checked In',
    message: wasAlreadyCheckedIn 
      ? `ℹ️ ALREADY CHECKED IN: ${matchedReg.fullName} cleared at ${new Date(matchedReg.checkedInAt).toLocaleTimeString()}` 
      : `✅ ACCESS GRANTED: ${matchedReg.fullName} (${matchedReg.regType || 'Solo'}) checked in!`,
    registration: matchedReg
  });
});

// 9. IMPORT REGISTRATIONS FROM EXCEL (.xlsx / .xls / .csv)
app.post('/api/registrations/import-excel', async (req, res) => {
  const rawBase64 = req.body.base64 || req.body.fileBase64;
  const records = req.body.records;
  const db = await readDB();
  if (!Array.isArray(db.registrations)) db.registrations = [];

  let parsedRecords = [];

  try {
    if (rawBase64) {
      const result = parseRegistrationsExcel(rawBase64);
      parsedRecords = result.records || [];
    } else if (Array.isArray(records)) {
      parsedRecords = records;
    } else {
      return res.status(400).json({ error: 'Please provide either base64 Excel file string or parsed records array' });
    }

    if (parsedRecords.length === 0) {
      return res.status(400).json({ error: 'No valid registration rows found in Excel sheet' });
    }

    let importedCount = 0;
    let updatedCount = 0;

    parsedRecords.forEach(row => {
      const rowId = row.id || `ARENIUM27-REG-${Math.floor(1000 + Math.random() * 9000)}`;
      row.id = rowId;

      // Find existing by ID or USN
      const idx = db.registrations.findIndex(r => 
        (r.id && r.id.toLowerCase() === rowId.toLowerCase()) ||
        (r.usn && row.usn && r.usn.toLowerCase() === row.usn.toLowerCase())
      );

      if (idx >= 0) {
        // Merge, preserving screenshot if exists
        const prev = db.registrations[idx];
        db.registrations[idx] = {
          ...prev,
          ...row,
          paymentScreenshot: row.paymentScreenshot || prev.paymentScreenshot || ''
        };
        updatedCount++;
      } else {
        db.registrations.unshift(row);
        importedCount++;
      }
    });

    await writeDB(db);

    res.json({
      success: true,
      message: `Successfully processed Excel! ${importedCount} new registrations added, ${updatedCount} records updated.`,
      total: parsedRecords.length,
      imported: importedCount,
      updated: updatedCount,
      stats: {
        totalRegistrations: db.registrations.length,
        verified: db.registrations.filter(r => r.status === 'Confirmed' || r.status === 'Checked In' || r.paymentVerified).length
      }
    });
  } catch (err) {
    console.error('Excel Import Error:', err);
    res.status(500).json({ error: 'Failed to process Excel file: ' + err.message });
  }
});

// 10. EXPORT REGISTRATIONS AS EXCEL (.xlsx)
app.get('/api/registrations/export-excel', async (req, res) => {
  try {
    const db = await readDB();
    const list = db.registrations || [];
    const buffer = generateRegistrationsExcel(list);

    const dateStr = new Date().toISOString().slice(0, 10);
    const filename = `ARENIUM27_Registrations_${dateStr}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', buffer.length);
    res.end(buffer);
  } catch (err) {
    console.error('Excel Export Error:', err);
    res.status(500).json({ error: 'Failed to export Excel report: ' + err.message });
  }
});

// 11. BIDIRECTIONAL SYNC WITH FESTDB (ARENIUM 27 Website)
app.post('/api/sync/registrations', async (req, res) => {
  const incomingList = req.body.clientRegistrations || req.body.registrations;
  const db = await readDB();
  if (!Array.isArray(db.registrations)) db.registrations = [];

  if (Array.isArray(incomingList)) {
    incomingList.forEach(clientReg => {
      const idx = db.registrations.findIndex(r => r.id === clientReg.id || (r.usn && clientReg.usn && r.usn.toLowerCase() === clientReg.usn.toLowerCase()));
      if (idx >= 0) {
        // If client record is newer or has verified payment, merge
        db.registrations[idx] = {
          ...db.registrations[idx],
          ...clientReg,
          paymentScreenshot: clientReg.paymentScreenshot || db.registrations[idx].paymentScreenshot || ''
        };
      } else {
        db.registrations.unshift(clientReg);
      }
    });
    await writeDB(db);
  }

  res.json({
    success: true,
    serverRegistrations: db.registrations,
    registrations: db.registrations,
    total: db.registrations.length,
    verifiedCount: db.registrations.filter(r => r.paymentVerified || r.status === 'Confirmed' || r.status === 'Checked In').length
  });
});

if (require.main === module) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[ARENIUM 27 CORE] Server running on port ${PORT} (All network interfaces)`);
  });
}

module.exports = app;
