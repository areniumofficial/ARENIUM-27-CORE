const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

// Determine storage path
const isVercel = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME;
const DATA_DIR = isVercel ? '/tmp' : path.join(__dirname, 'data');
const BACKUPS_DIR = isVercel ? '/tmp/backups' : path.join(DATA_DIR, 'backups');
const DB_FILE = path.join(DATA_DIR, 'db.json');

// REAL AUTHENTICATED CREDENTIALS ONLY (Zero Demo Data)
const INITIAL_REAL_DATA = {
  admins: [
    {
      id: 'admin-1',
      email: 'kerenlois@presidencyuniversity.in',
      password: 'Kerensois27',
      name: 'Prof. Keren Lois',
      role: 'ADMIN',
      designation: 'Faculty Coordinator & Lead Admin',
      phone: '+91 98765 43210'
    },
    {
      id: 'admin-2',
      email: 'Kathuriaabhyas0@gmail.com',
      password: 'Abhyas2108',
      name: 'Abhyas Kathuria',
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
  volunteers: [],
  teams: [],
  odRequests: [],
  scanLogs: []
};

// In-memory cache for fast synchronous operations
let memoryCache = null;
let mongoConnected = false;

// Mongoose Schema for MongoDB persistence (500+ Concurrent Students)
const SystemDataSchema = new mongoose.Schema({
  key: { type: String, unique: true, default: 'arenium_main_state' },
  data: { type: mongoose.Schema.Types.Mixed },
  updatedAt: { type: Date, default: Date.now }
});
let SystemDataModel = null;

async function initMongoDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri || mongoConnected) return;

  try {
    await mongoose.connect(uri, {
      maxPoolSize: 50, // High concurrency pool for 500+ users
      serverSelectionTimeoutMS: 5000
    });
    SystemDataModel = mongoose.models.SystemData || mongoose.model('SystemData', SystemDataSchema);
    mongoConnected = true;
    console.log('[ARENIUM DB] MongoDB Atlas connected for high-concurrency cloud storage.');

    // Fetch initial state from Mongo
    const doc = await SystemDataModel.findOne({ key: 'arenium_main_state' });
    if (doc && doc.data) {
      memoryCache = doc.data;
    } else {
      await SystemDataModel.create({ key: 'arenium_main_state', data: INITIAL_REAL_DATA });
      memoryCache = JSON.parse(JSON.stringify(INITIAL_REAL_DATA));
    }
  } catch (err) {
    console.warn('[ARENIUM DB] MongoDB connection failed, falling back to local storage:', err.message);
    mongoConnected = false;
  }
}

// Ensure local directories exist
function ensureDirs() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(BACKUPS_DIR)) {
    fs.mkdirSync(BACKUPS_DIR, { recursive: true });
  }
}

function initDB() {
  ensureDirs();
  initMongoDB();

  if (!fs.existsSync(DB_FILE)) {
    const seedFile = path.join(__dirname, 'data', 'db.json');
    if (fs.existsSync(seedFile)) {
      try {
        const seedData = fs.readFileSync(seedFile, 'utf-8');
        fs.writeFileSync(DB_FILE, seedData, 'utf-8');
        memoryCache = JSON.parse(seedData);
        return memoryCache;
      } catch (_) {}
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(INITIAL_REAL_DATA, null, 2), 'utf-8');
    memoryCache = JSON.parse(JSON.stringify(INITIAL_REAL_DATA));
  } else if (!memoryCache) {
    try {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      memoryCache = JSON.parse(raw);
    } catch (e) {
      memoryCache = JSON.parse(JSON.stringify(INITIAL_REAL_DATA));
    }
  }
  return memoryCache;
}

function readDB() {
  if (memoryCache) return memoryCache;
  return initDB();
}

function writeDB(data) {
  memoryCache = data;

  // Asynchronously sync to MongoDB Atlas if connected
  if (mongoConnected && SystemDataModel) {
    SystemDataModel.updateOne(
      { key: 'arenium_main_state' },
      { data: data, updatedAt: new Date() },
      { upsert: true }
    ).catch(err => console.error('[ARENIUM DB] Mongo sync error:', err));
  }

  // Atomically persist to local disk
  try {
    ensureDirs();
    const tempFile = `${DB_FILE}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tempFile, DB_FILE);

    // Create periodic rolling backup (1 per 10 writes or if none exists)
    createRotatingBackup(data);
  } catch (err) {
    console.error('[ARENIUM DB] Error writing to local file:', err);
  }

  return data;
}

// Create timestamped backup file
function createRotatingBackup(data) {
  try {
    ensureDirs();
    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(BACKUPS_DIR, `backup-${timestamp}.json`);

    fs.writeFileSync(backupFile, JSON.stringify(data, null, 2), 'utf-8');

    // Retain only last 30 backup files
    const files = fs.readdirSync(BACKUPS_DIR)
      .filter(f => f.startsWith('backup-') && f.endsWith('.json'))
      .sort();
    if (files.length > 30) {
      const toDelete = files.slice(0, files.length - 30);
      toDelete.forEach(f => {
        try { fs.unlinkSync(path.join(BACKUPS_DIR, f)); } catch (_) {}
      });
    }
  } catch (err) {
    // Ignore backup disk errors in restricted environments
  }
}

// Reset data to clean launch state
function resetToRealData() {
  memoryCache = JSON.parse(JSON.stringify(INITIAL_REAL_DATA));
  return writeDB(memoryCache);
}

// Restore data from user-uploaded backup
function restoreFromBackup(backupData) {
  if (!backupData || typeof backupData !== 'object') {
    throw new Error('Invalid backup data format');
  }

  const restored = {
    admins: backupData.admins || INITIAL_REAL_DATA.admins,
    coreTeam: backupData.coreTeam || INITIAL_REAL_DATA.coreTeam,
    volunteers: Array.isArray(backupData.volunteers) ? backupData.volunteers : [],
    teams: Array.isArray(backupData.teams) ? backupData.teams : [],
    odRequests: Array.isArray(backupData.odRequests) ? backupData.odRequests : [],
    scanLogs: Array.isArray(backupData.scanLogs) ? backupData.scanLogs : []
  };

  memoryCache = restored;
  writeDB(restored);
  return restored;
}

module.exports = {
  readDB,
  writeDB,
  initDB,
  resetToRealData,
  restoreFromBackup,
  getStorageMode: () => ({
    isVercel: !!isVercel,
    mongoConnected,
    storagePath: DB_FILE
  })
};
