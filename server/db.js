try { require('dotenv').config(); } catch (_) {}
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

// Determine storage path
const isVercel = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME;
const DATA_DIR = isVercel ? '/tmp' : path.join(__dirname, 'data');
const BACKUPS_DIR = isVercel ? '/tmp/backups' : path.join(DATA_DIR, 'backups');
const DB_FILE = path.join(DATA_DIR, 'db.json');

// REAL AUTHENTICATED CREDENTIALS & INITIAL LAUNCH STATE
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
      rollNumber: '20241BCA0000',
      section: 'BCA01',
      batchNumber: 'Batch 2021-25',
      schoolName: 'SOIS',
      hodName: 'Dr. Vettermani',
      phone: '+91 98112 23344'
    },
    {
      id: 'core-2',
      email: 'Kathuriaabhyas@gmail.com',
      password: 'Abhyas2108',
      name: 'Abhyas Kathuria',
      role: 'CORE_TEAM',
      rollNumber: '20241BCI0063',
      section: 'CSE-04',
      batchNumber: 'Batch 2024-27',
      schoolName: 'SOIS',
      hodName: 'Dr. Vetermani sir',
      phone: '+91 98223 34455'
    },
    {
      id: 'core-3',
      email: 'ashlinsiddharth1@gmail.com',
      password: 'Ashlin01',
      name: 'Ashlin Siddharth',
      role: 'CORE_TEAM',
      rollNumber: '20241BCD2234',
      section: 'BCA DS02',
      batchNumber: 'Batch 2021-25',
      schoolName: 'School of Engineering',
      hodName: 'Dr. VMS',
      phone: '+91 98334 45566'
    },
    {
      id: 'core-4',
      email: 'vimalrajsnkk@gmail.com',
      password: 'Vimal69',
      name: 'Vimal Raj',
      role: 'CORE_TEAM',
      rollNumber: '20211BCA1234',
      section: 'BCA DS03',
      batchNumber: 'Batch 2021-25',
      schoolName: 'SOIS',
      hodName: 'Dr. VMS',
      phone: '+91 98445 56677'
    }
  ],
  volunteers: [],
  teams: [],
  odRequests: [
    {
      id: 'od-core-ashlin',
      requestType: 'CORE_TEAM',
      targetId: 'core-3',
      name: 'Ashlin Siddharth',
      rollNumber: '20241BCD2234',
      section: 'BCA DS02',
      batchNumber: 'Batch 2021-25',
      schoolName: 'School of Engineering',
      hodName: 'Dr. VMS',
      teamName: 'ARENIUM CORE TEAM',
      date: '2026-11-05',
      hours: [1, 2, 3, 4],
      hoursFormatted: 'Hour 1, Hour 2, Hour 3, Hour 4',
      reason: 'Core Management, Tech Arena Setup and Event Coordination',
      submittedBy: {
        id: 'core-3',
        name: 'Ashlin Siddharth',
        role: 'CORE_TEAM'
      },
      status: 'PENDING',
      adminRemark: '',
      reviewedBy: null,
      reviewedAt: null,
      createdAt: new Date().toISOString()
    },
    {
      id: 'od-core-vimal',
      requestType: 'CORE_TEAM',
      targetId: 'core-4',
      name: 'Vimal Raj',
      rollNumber: '20211BCA1234',
      section: 'BCA DS03',
      batchNumber: 'Batch 2021-25',
      schoolName: 'SOIS',
      hodName: 'Dr. VMS',
      teamName: 'ARENIUM CORE TEAM',
      date: '2026-11-05',
      hours: [1, 2, 3, 4, 7],
      hoursFormatted: 'Hour 1, Hour 2, Hour 3, Hour 4, Hour 7',
      reason: 'Core Management, Tech Arena Setup and Event Coordination',
      submittedBy: {
        id: 'core-4',
        name: 'Vimal Raj',
        role: 'CORE_TEAM'
      },
      status: 'PENDING',
      adminRemark: '',
      reviewedBy: null,
      reviewedAt: null,
      createdAt: new Date().toISOString()
    },
    {
      id: 'od-core-kaushal',
      requestType: 'CORE_TEAM',
      targetId: 'core-1',
      name: 'Kaushal Singh',
      rollNumber: '20241BCA0000',
      section: 'BCA01',
      batchNumber: 'Batch 2021-25',
      schoolName: 'SOIS',
      hodName: 'Dr. Vettermani',
      teamName: 'ARENIUM CORE TEAM',
      date: '2026-11-05',
      hours: [1, 2, 3, 4, 5, 6, 7],
      hoursFormatted: 'Hour 1, Hour 2, Hour 3, Hour 4, Hour 5, Hour 6, Hour 7',
      reason: 'Core Management, Tech Arena Setup and Event Coordination',
      submittedBy: {
        id: 'core-1',
        name: 'Kaushal Singh',
        role: 'CORE_TEAM'
      },
      status: 'PENDING',
      adminRemark: '',
      reviewedBy: null,
      reviewedAt: null,
      createdAt: new Date().toISOString()
    },
    {
      id: 'od-core-abhyas',
      requestType: 'CORE_TEAM',
      targetId: 'core-2',
      name: 'Abhyas Kathuria',
      rollNumber: '20241BCI0063',
      section: 'CSE-04',
      batchNumber: 'Batch 2024-27',
      schoolName: 'SOIS',
      hodName: 'Dr. Vetermani sir',
      teamName: 'ARENIUM CORE TEAM',
      date: '2026-11-04',
      hours: [3, 4, 6, 7, 8],
      hoursFormatted: 'Hour 3, Hour 4, Hour 6, Hour 7, Hour 8',
      reason: 'Core Management, Tech Arena Setup and Event Coordination',
      submittedBy: {
        id: 'core-2',
        name: 'Abhyas Kathuria',
        role: 'CORE_TEAM'
      },
      status: 'PENDING',
      adminRemark: '',
      reviewedBy: null,
      reviewedAt: null,
      createdAt: new Date().toISOString()
    }
  ],
  scanLogs: []
};

// Global Mongoose Cache for Serverless Lambdas
let cached = global.mongoose;
if (!cached) {
  cached = global.mongoose = {
    conn: null,
    promise: null,
    mongoConnected: false,
    lastError: null,
    memoryCache: null
  };
}

// System Data Schema
const SystemDataSchema = new mongoose.Schema({
  key: { type: String, unique: true, default: 'arenium_main_state' },
  data: { type: mongoose.Schema.Types.Mixed },
  updatedAt: { type: Date, default: Date.now }
});

const SystemDataModel = mongoose.models.SystemData || mongoose.model('SystemData', SystemDataSchema);

// Detect if user provided an incomplete placeholder (e.g. "mongodb+srv://...")
function isPlaceholderUri(uri) {
  if (!uri) return false;
  const clean = String(uri).trim();
  return clean.includes('...') || clean === 'mongodb+srv://' || clean.endsWith('@') || !clean.includes('@');
}

// Connect to MongoDB Atlas with connection caching
async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    cached.mongoConnected = false;
    cached.lastError = 'MONGODB_URI environment variable is not defined.';
    return null;
  }

  if (isPlaceholderUri(uri)) {
    cached.mongoConnected = false;
    cached.lastError = 'MONGODB_URI is set to a placeholder ("' + uri.trim() + '"). Please replace it with your real MongoDB Atlas connection string in Vercel settings.';
    return null;
  }

  if (cached.conn) {
    cached.mongoConnected = true;
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000
    };

    cached.promise = mongoose.connect(uri.trim(), opts).then((m) => {
      cached.mongoConnected = true;
      cached.lastError = null;
      console.log('[ARENIUM DB] MongoDB Atlas connected successfully for zero-loss cloud persistence.');
      return m;
    });
  }

  try {
    cached.conn = await cached.promise;
    cached.mongoConnected = true;
    return cached.conn;
  } catch (err) {
    cached.promise = null;
    cached.conn = null;
    cached.mongoConnected = false;
    cached.lastError = err.message;
    console.warn('[ARENIUM DB] MongoDB connection error:', err.message);
    return null;
  }
}

// Ensure local directories exist
function ensureDirs() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(BACKUPS_DIR)) {
      fs.mkdirSync(BACKUPS_DIR, { recursive: true });
    }
  } catch (_) {}
}

// Read state from local disk or seed
function readFromDisk() {
  ensureDirs();
  if (fs.existsSync(DB_FILE)) {
    try {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      cached.memoryCache = parsed;
      return parsed;
    } catch (_) {}
  }

  // Fallback to bundled seed file
  const seedFile = path.join(__dirname, 'data', 'db.json');
  if (fs.existsSync(seedFile)) {
    try {
      const seedRaw = fs.readFileSync(seedFile, 'utf-8');
      const seedParsed = JSON.parse(seedRaw);
      syncToDisk(seedParsed);
      cached.memoryCache = seedParsed;
      return seedParsed;
    } catch (_) {}
  }

  // Fallback to INITIAL_REAL_DATA
  const initial = JSON.parse(JSON.stringify(INITIAL_REAL_DATA));
  syncToDisk(initial);
  cached.memoryCache = initial;
  return initial;
}

// Atomically mirror state to local disk
function syncToDisk(data) {
  try {
    ensureDirs();
    const tempFile = `${DB_FILE}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tempFile, DB_FILE);
    createRotatingBackup(data);
  } catch (_) {}
}

// Create timestamped backup file
function createRotatingBackup(data) {
  try {
    ensureDirs();
    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(BACKUPS_DIR, `backup-${timestamp}.json`);

    fs.writeFileSync(backupFile, JSON.stringify(data, null, 2), 'utf-8');

    const files = fs.readdirSync(BACKUPS_DIR)
      .filter(f => f.startsWith('backup-') && f.endsWith('.json'))
      .sort();
    if (files.length > 30) {
      const toDelete = files.slice(0, files.length - 30);
      toDelete.forEach(f => {
        try { fs.unlinkSync(path.join(BACKUPS_DIR, f)); } catch (_) {}
      });
    }
  } catch (_) {}
}

// Asynchronously read latest state from MongoDB Atlas (with local disk fallback)
async function readDB() {
  try {
    await connectDB();
    if (cached.mongoConnected) {
      const doc = await SystemDataModel.findOne({ key: 'arenium_main_state' }).lean();
      if (doc && doc.data) {
        cached.memoryCache = doc.data;
        syncToDisk(doc.data);
        return doc.data;
      } else {
        // Document doesn't exist yet, seed with initial data
        const initial = readFromDisk();
        await SystemDataModel.create({ key: 'arenium_main_state', data: initial });
        cached.memoryCache = initial;
        return initial;
      }
    }
  } catch (err) {
    console.warn('[ARENIUM DB] Cloud read fallback to disk:', err.message);
  }

  if (cached.memoryCache) return cached.memoryCache;
  return readFromDisk();
}

// Asynchronously write and commit state to MongoDB Atlas (with local disk mirror)
async function writeDB(data) {
  cached.memoryCache = data;
  syncToDisk(data);

  try {
    await connectDB();
    if (cached.mongoConnected) {
      await SystemDataModel.updateOne(
        { key: 'arenium_main_state' },
        { $set: { data: data, updatedAt: new Date() } },
        { upsert: true }
      );
    }
  } catch (err) {
    console.error('[ARENIUM DB] Cloud write error:', err.message);
  }

  return data;
}

// Initialize on server startup
async function initDB() {
  ensureDirs();
  try {
    await connectDB();
  } catch (_) {}
  return await readDB();
}

// Reset data to clean launch state
async function resetToRealData() {
  const fresh = JSON.parse(JSON.stringify(INITIAL_REAL_DATA));
  return await writeDB(fresh);
}

// Restore data from user-uploaded backup
async function restoreFromBackup(backupData) {
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

  return await writeDB(restored);
}

module.exports = {
  connectDB,
  initDB,
  readDB,
  writeDB,
  resetToRealData,
  restoreFromBackup,
  getStorageMode: () => ({
    isVercel: !!isVercel,
    mongoConnected: !!cached.mongoConnected,
    storagePath: DB_FILE,
    hasUri: !!process.env.MONGODB_URI,
    isPlaceholderUri: isPlaceholderUri(process.env.MONGODB_URI),
    lastError: cached.lastError || null
  })
};
