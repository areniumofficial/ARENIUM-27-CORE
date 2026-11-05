const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const { connectDB, readDB, writeDB, initDB, resetToRealData, restoreFromBackup, getStorageMode } = require('./db');
const { generateODExcel } = require('./excel');

// Eager initialization of DB connection
initDB().catch(err => console.warn('[ARENIUM API] Startup DB init note:', err.message));

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

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

if (require.main === module) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[ARENIUM 27 CORE] Server running on port ${PORT} (All network interfaces)`);
  });
}

module.exports = app;
