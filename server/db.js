const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

const INITIAL_DATA = {
  admins: [
    {
      id: 'admin-1',
      email: 'kerenlois@presidencyuniversity.in',
      password: 'Kerensois27',
      name: 'Prof. Keren Lois',
      role: 'ADMIN',
      designation: 'Faculty Coordinator & Admin',
      phone: '+91 98765 43210'
    },
    {
      id: 'admin-2',
      email: 'Kathuriaabhyas0@gmail.com',
      password: 'Abhyas2108',
      name: 'Abhyas Kathuria (Admin)',
      role: 'ADMIN',
      designation: 'Lead Administrator',
      phone: '+91 99887 76655'
    }
  ],
  coreTeam: [
    {
      id: 'core-1',
      email: 'singhkaushal.2507@gmail.com',
      password: 'Kaush2507',
      name: 'Kaushal Singh',
      role: 'CORE_TEAM',
      rollNumber: '20211CSE0112',
      section: 'CSE-04',
      batchNumber: 'Batch 2021-25',
      schoolName: 'School of Engineering',
      hodName: 'Dr. Ramesh Kumar',
      phone: '+91 98112 23344'
    },
    {
      id: 'core-2',
      email: 'Kathuriaabhyas@gmail.com',
      password: 'Abhyas2108',
      name: 'Abhyas Kathuria',
      role: 'CORE_TEAM',
      rollNumber: '20211CSE0145',
      section: 'CSE-04',
      batchNumber: 'Batch 2021-25',
      schoolName: 'School of Engineering',
      hodName: 'Dr. Ramesh Kumar',
      phone: '+91 98223 34455'
    },
    {
      id: 'core-3',
      email: 'ashlinsiddharth1@gmail.com',
      password: 'Ashlin01',
      name: 'Ashlin Siddharth',
      role: 'CORE_TEAM',
      rollNumber: '20211CSE0089',
      section: 'CSE-02',
      batchNumber: 'Batch 2021-25',
      schoolName: 'School of Engineering',
      hodName: 'Dr. Ramesh Kumar',
      phone: '+91 98334 45566'
    },
    {
      id: 'core-4',
      email: 'vimalrajsnkk@gmail.com',
      password: 'Vimal69',
      name: 'Vimal Raj',
      role: 'CORE_TEAM',
      rollNumber: '20211CSE0204',
      section: 'CSE-06',
      batchNumber: 'Batch 2021-25',
      schoolName: 'School of Engineering',
      hodName: 'Dr. Ramesh Kumar',
      phone: '+91 98445 56677'
    }
  ],
  volunteers: [
    {
      id: 'vol-1',
      name: 'Rohan Verma',
      email: 'volunteer1@arenium.com',
      password: 'Vol123',
      rollNumber: '20221CSE0321',
      section: 'CSE-05',
      batchNumber: 'Batch 2022-26',
      schoolName: 'School of Engineering',
      hodName: 'Dr. Ramesh Kumar',
      dutyRole: 'Gate & Verification Lead',
      phone: '+91 91234 56789',
      status: 'APPROVED',
      addedBy: 'Kaushal Singh (Core)',
      addedAt: '2026-11-01T10:00:00Z',
      approvedBy: 'Prof. Keren Lois',
      approvedAt: '2026-11-01T11:00:00Z'
    },
    {
      id: 'vol-2',
      name: 'Ananya Sharma',
      email: 'ananya.vol@arenium.com',
      password: 'Vol123',
      rollNumber: '20221ECE0044',
      section: 'ECE-01',
      batchNumber: 'Batch 2022-26',
      schoolName: 'School of Engineering',
      hodName: 'Dr. Smitha Rao',
      dutyRole: 'Floor Attendance Supervisor',
      phone: '+91 92345 67890',
      status: 'PENDING',
      addedBy: 'Abhyas Kathuria (Core)',
      addedAt: '2026-11-03T18:30:00Z',
      approvedBy: null,
      approvedAt: null
    }
  ],
  teams: [
    {
      id: 'team-1',
      teamName: 'CyberKnights',
      category: 'Hackathon Track A',
      verified: true,
      verifiedAt: '2026-11-03T09:15:00Z',
      verifiedBy: 'Rohan Verma (Volunteer)',
      members: [
        {
          id: 'mem-1',
          name: 'Tanmay Bhattacharya',
          rollNumber: '20221CSE0552',
          section: 'CSE-08',
          batchNumber: 'Batch 2022-26',
          schoolName: 'School of Engineering',
          hodName: 'Dr. Ramesh Kumar',
          isLeader: true
        },
        {
          id: 'mem-2',
          name: 'Sneha Kulkarni',
          rollNumber: '20221CSE0558',
          section: 'CSE-08',
          batchNumber: 'Batch 2022-26',
          schoolName: 'School of Engineering',
          hodName: 'Dr. Ramesh Kumar',
          isLeader: false
        },
        {
          id: 'mem-3',
          name: 'Aditya Nair',
          rollNumber: '20221AIML022',
          section: 'AIML-01',
          batchNumber: 'Batch 2022-26',
          schoolName: 'School of Computing',
          hodName: 'Dr. Anita Desai',
          isLeader: false
        }
      ]
    },
    {
      id: 'team-2',
      teamName: 'QuantumForge',
      category: 'Robotics Track B',
      verified: false,
      verifiedAt: null,
      verifiedBy: null,
      members: [
        {
          id: 'mem-4',
          name: 'Meera Nambiar',
          rollNumber: '20231MEC0014',
          section: 'MEC-01',
          batchNumber: 'Batch 2023-27',
          schoolName: 'School of Engineering',
          hodName: 'Dr. Priya Sharma',
          isLeader: true
        },
        {
          id: 'mem-5',
          name: 'Rahul Sen',
          rollNumber: '20231ECE0092',
          section: 'ECE-02',
          batchNumber: 'Batch 2023-27',
          schoolName: 'School of Engineering',
          hodName: 'Dr. Smitha Rao',
          isLeader: false
        }
      ]
    }
  ],
  odRequests: [
    {
      id: 'od-core-101',
      requestType: 'CORE_TEAM',
      targetId: 'core-1',
      name: 'Kaushal Singh',
      rollNumber: '20211CSE0112',
      section: 'CSE-04',
      batchNumber: 'Batch 2021-25',
      schoolName: 'School of Engineering',
      hodName: 'Dr. Ramesh Kumar',
      teamName: 'ARENIUM CORE',
      date: '2026-11-03',
      hours: [1, 2, 3, 4],
      hoursFormatted: 'Hour 1, Hour 2, Hour 3, Hour 4',
      reason: 'Arenium 27 Main Stage Setup and Tech Infrastructure Operations',
      submittedBy: {
        id: 'core-1',
        name: 'Kaushal Singh',
        role: 'CORE_TEAM'
      },
      status: 'APPROVED',
      adminRemark: 'Approved for event staging duty',
      reviewedBy: 'Prof. Keren Lois',
      reviewedAt: '2026-11-03T11:30:00Z',
      createdAt: '2026-11-03T08:30:00Z'
    },
    {
      id: 'od-vol-201',
      requestType: 'VOLUNTEER',
      targetId: 'mem-1',
      name: 'Tanmay Bhattacharya',
      rollNumber: '20221CSE0552',
      section: 'CSE-08',
      batchNumber: 'Batch 2022-26',
      schoolName: 'School of Engineering',
      hodName: 'Dr. Ramesh Kumar',
      teamName: 'CyberKnights',
      date: '2026-11-03',
      hours: [1, 2, 3],
      hoursFormatted: 'Hour 1, Hour 2, Hour 3',
      reason: 'Volunteer In-Person Hourly Attendance Check at Gate 2',
      submittedBy: {
        id: 'vol-1',
        name: 'Rohan Verma',
        role: 'VOLUNTEER'
      },
      status: 'PENDING',
      adminRemark: '',
      reviewedBy: null,
      reviewedAt: null,
      createdAt: '2026-11-03T10:15:00Z'
    },
    {
      id: 'od-part-301',
      requestType: 'PARTICIPANT',
      targetId: 'mem-4',
      name: 'Meera Nambiar',
      rollNumber: '20231MEC0014',
      section: 'MEC-01',
      batchNumber: 'Batch 2023-27',
      schoolName: 'School of Engineering',
      hodName: 'Dr. Priya Sharma',
      teamName: 'QuantumForge',
      date: '2026-11-03',
      hours: [5, 6, 7, 8],
      hoursFormatted: 'Hour 5, Hour 6, Hour 7, Hour 8',
      reason: 'Participating in Arena Round 1 Technical Project Showcase',
      submittedBy: {
        id: 'mem-4',
        name: 'Meera Nambiar',
        role: 'PARTICIPANT'
      },
      status: 'PENDING',
      adminRemark: '',
      reviewedBy: null,
      reviewedAt: null,
      createdAt: '2026-11-03T12:00:00Z'
    }
  ],
  scanLogs: [
    {
      id: 'scan-1',
      volunteerId: 'vol-1',
      volunteerName: 'Rohan Verma',
      scanType: 'TEAM_VERIFICATION',
      teamId: 'team-1',
      teamName: 'CyberKnights',
      timestamp: '2026-11-03T09:15:00Z',
      details: 'Verified 3 members of CyberKnights'
    }
  ]
};

function initDB() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(INITIAL_DATA, null, 2), 'utf-8');
  }
}

function readDB() {
  initDB();
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading db.json, returning initial state:', err);
    return INITIAL_DATA;
  }
}

function writeDB(data) {
  initDB();
  const tempFile = `${DB_FILE}.tmp`;
  fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
  fs.renameSync(tempFile, DB_FILE);
  return data;
}

module.exports = {
  readDB,
  writeDB,
  initDB
};
