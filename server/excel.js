const XLSX = require('xlsx');

/**
 * Generate Excel workbook for approved/filtered OD requests
 */
function generateODExcel(records, metadata = {}) {
  const { date = 'All Dates', filterHours = 'All Hours', reportType = 'Consolidated' } = metadata;

  const rows = records.map((rec, index) => {
    const hoursStr = Array.isArray(rec.hours) 
      ? rec.hours.map(h => `Hour ${h}`).join(', ')
      : (rec.hoursFormatted || String(rec.hours || ''));

    return {
      'sno': index + 1,
      'name': rec.name || 'N/A',
      'roll number': rec.rollNumber || 'N/A',
      'section': rec.section || 'N/A',
      'batch number': rec.batchNumber || 'N/A',
      'hours': hoursStr || 'N/A',
      'school name': rec.schoolName || 'N/A',
      'hod name': rec.hodName || 'N/A'
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);
  worksheet['!cols'] = [
    { wch: 8 },  // sno
    { wch: 26 }, // name
    { wch: 18 }, // roll number
    { wch: 12 }, // section
    { wch: 18 }, // batch number
    { wch: 32 }, // hours
    { wch: 28 }, // school name
    { wch: 24 }  // hod name
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'OD & Attendance Report');

  const summaryRows = [
    { 'Parameter': 'Event Name', 'Value': 'ARENIUM - University Tech Festival' },
    { 'Parameter': 'Report Type', 'Value': reportType },
    { 'Parameter': 'Date Filter', 'Value': date },
    { 'Parameter': 'Hours Filter', 'Value': filterHours },
    { 'Parameter': 'Total Approved Students', 'Value': records.length },
    { 'Parameter': 'Generated At', 'Value': new Date().toLocaleString() }
  ];
  const summarySheet = XLSX.utils.json_to_sheet(summaryRows);
  summarySheet['!cols'] = [{ wch: 25 }, { wch: 45 }];
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

  return XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });
}

/**
 * Generate Excel workbook for delegate registrations with payment and gate status
 */
function generateRegistrationsExcel(registrations = []) {
  const rows = registrations.map((r, index) => {
    const isVerified = (r.status === 'Confirmed' || r.status === 'Checked In' || r.paymentVerified);
    const paymentStatusText = isVerified 
      ? (r.status === 'Checked In' ? 'Verified (Checked In)' : 'Verified (Confirmed)')
      : (r.status === 'Rejected' ? 'Rejected' : 'Pending Verification');

    const arenas = [r.event1Name || r.eventName, r.event2Name, r.event3Name]
      .filter(Boolean)
      .filter(x => x !== '-')
      .join(' | ');

    return {
      'S.No': index + 1,
      'Registration ID': r.id || '',
      'Full Name': r.fullName || '',
      'Email': r.email || '',
      'Phone': r.phone || '',
      'College': r.college || '',
      'USN / Roll No': r.usn || '',
      'Department': r.department || '',
      'Year / Sem': r.yearSem || '',
      'Category': r.categoryLabel || (r.category === 'internal' ? 'Internal' : 'External'),
      'Participation Type': r.regType || (r.teamName ? 'Team' : 'Solo'),
      'Team / Squad Name': r.teamName || '',
      'Team Members': r.teamMembers || '',
      'Primary Arena (Event 1)': r.event1Name || r.eventName || '',
      'Second Arena (Event 2)': r.event2Name || '',
      'Third Arena (Event 3)': r.event3Name || '',
      'All Arenas': arenas,
      'Fee Paid': r.feePaid || '₹200',
      'UTR / Transaction ID': r.utrId || '',
      'Payment Status': paymentStatusText,
      'Payment Verified': isVerified ? 'YES' : 'NO',
      'Gate Check-In': r.checkedIn ? 'CHECKED IN' : 'NOT CHECKED IN',
      'Check-In Time': r.checkedInAt ? new Date(r.checkedInAt).toLocaleString() : '',
      'Registration Date': r.timestamp ? new Date(r.timestamp).toLocaleString() : ''
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);
  worksheet['!cols'] = [
    { wch: 6 },  // S.No
    { wch: 22 }, // Reg ID
    { wch: 24 }, // Name
    { wch: 28 }, // Email
    { wch: 15 }, // Phone
    { wch: 30 }, // College
    { wch: 18 }, // USN
    { wch: 25 }, // Dept
    { wch: 16 }, // Year
    { wch: 12 }, // Category
    { wch: 12 }, // Type
    { wch: 20 }, // Team Name
    { wch: 35 }, // Team Members
    { wch: 24 }, // Event 1
    { wch: 24 }, // Event 2
    { wch: 24 }, // Event 3
    { wch: 35 }, // All Arenas
    { wch: 12 }, // Fee Paid
    { wch: 22 }, // UTR
    { wch: 22 }, // Payment Status
    { wch: 16 }, // Verified
    { wch: 16 }, // Gate Check-in
    { wch: 22 }, // Check-In Time
    { wch: 22 }  // Reg Date
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Delegate Registrations');

  const verifiedCount = registrations.filter(r => r.status === 'Confirmed' || r.status === 'Checked In' || r.paymentVerified).length;
  const pendingCount = registrations.filter(r => !r.status || r.status === 'Pending Verification' || (!r.paymentVerified && r.status !== 'Rejected' && r.status !== 'Confirmed' && r.status !== 'Checked In')).length;
  const checkedInCount = registrations.filter(r => r.checkedIn || r.status === 'Checked In').length;

  const summaryRows = [
    { 'Parameter': 'Event', 'Value': 'ARENIUM 27 - Official Tech Fest' },
    { 'Parameter': 'Total Registrations', 'Value': registrations.length },
    { 'Parameter': 'Payment Verified (Passes Unlocked)', 'Value': verifiedCount },
    { 'Parameter': 'Pending Verification', 'Value': pendingCount },
    { 'Parameter': 'Gate Checked In', 'Value': checkedInCount },
    { 'Parameter': 'Generated At', 'Value': new Date().toLocaleString() }
  ];
  const summarySheet = XLSX.utils.json_to_sheet(summaryRows);
  summarySheet['!cols'] = [{ wch: 32 }, { wch: 45 }];
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary & Stats');

  return XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });
}

/**
 * Parse an Excel file (Buffer or Base64 string) containing delegate registrations
 */
function parseRegistrationsExcel(inputData) {
  let workbook;
  if (typeof inputData === 'string') {
    // If base64 data URL, strip header
    const cleanBase64 = inputData.includes(',') ? inputData.split(',')[1] : inputData;
    const buffer = Buffer.from(cleanBase64, 'base64');
    workbook = XLSX.read(buffer, { type: 'buffer' });
  } else if (Buffer.isBuffer(inputData)) {
    workbook = XLSX.read(inputData, { type: 'buffer' });
  } else {
    throw new Error('Unsupported input format for Excel parsing');
  }

  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    throw new Error('No sheets found in Excel file');
  }

  const worksheet = workbook.Sheets[sheetName];
  const rawRows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

  if (!rawRows || rawRows.length === 0) {
    return { records: [], totalRows: 0, warnings: ['Excel sheet is empty'] };
  }

  const normalizedRecords = rawRows.map((row, index) => {
    // Normalize keys (case-insensitive and trimmed)
    const normalizedRow = {};
    for (const [key, val] of Object.entries(row)) {
      normalizedRow[key.toLowerCase().replace(/[^a-z0-9]/g, '')] = typeof val === 'string' ? val.trim() : val;
    }

    const getVal = (...variants) => {
      for (const v of variants) {
        const clean = v.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (normalizedRow[clean] !== undefined && normalizedRow[clean] !== '') {
          return String(normalizedRow[clean]).trim();
        }
      }
      return '';
    };

    const id = getVal('registrationid', 'regid', 'id', 'ticketid', 'passid') || 
               `ARENIUM27-REG-${Math.floor(1000 + Math.random() * 9000)}`;

    const fullName = getVal('fullname', 'name', 'studentname', 'participantname', 'delegatename', 'leadname') || 'Delegate';
    const email = getVal('email', 'emailid', 'emailaddress', 'mail') || '';
    const phone = getVal('phone', 'phonenumber', 'mobile', 'mobilenumber', 'contact', 'whatsapp') || '';
    const college = getVal('college', 'collegename', 'university', 'institution') || 'Presidency University, Bengaluru';
    const usn = getVal('usn', 'rollno', 'rollnumber', 'studentid', 'usnrollno', 'registrationnumber') || '';
    const department = getVal('department', 'dept', 'branch', 'course') || 'Information Science & Engineering';
    const yearSem = getVal('yearsem', 'year', 'semester', 'yearsemester', 'sem') || '3rd Year';

    const categoryRaw = getVal('category', 'delegatecategory', 'type', 'internalexternal').toLowerCase();
    const isInternal = !categoryRaw || categoryRaw.includes('int') || college.toLowerCase().includes('presidency');
    const category = isInternal ? 'internal' : 'external';
    const categoryLabel = isInternal ? 'Internal (Presidency University)' : 'External (Other College)';

    const event1Name = getVal('primaryarenaevent1', 'event1', 'primaryevent', 'event', 'eventname', 'arena1', 'arena') || 'TECH ODYSSEY';
    const event2Name = getVal('secondarenaevent2', 'event2', 'secondevent', 'arena2') || '';
    const event3Name = getVal('thirdarenaevent3', 'event3', 'thirdevent', 'arena3') || '';

    const regTypeRaw = getVal('participationtype', 'type', 'regtype', 'teamsolo').toLowerCase();
    const teamName = getVal('teamsquadname', 'teamname', 'squadname', 'team') || '';
    const isTeam = regTypeRaw.includes('team') || !!teamName;
    const regType = isTeam ? 'Team' : 'Solo';
    const teamMembers = getVal('teammembers', 'members', 'squadmembers', 'roster') || '';

    const feePaid = getVal('feepaid', 'fee', 'amount', 'totalfee', 'paidamount') || '₹200';
    const utrId = getVal('utrtransactionid', 'utrid', 'utr', 'transactionid', 'refno', 'referenceid', 'txnid') || 
                  `UTR-${Date.now().toString().slice(-8)}`;

    const paymentStatusRaw = getVal('paymentstatus', 'status', 'paid').toLowerCase();
    const paymentVerifiedVal = getVal('paymentverified', 'verified').toLowerCase();

    // Check if verified: must not be pending or rejected
    const isPending = paymentStatusRaw.includes('pending') || paymentStatusRaw.includes('awaiting');
    const isRejected = paymentStatusRaw.includes('reject') || paymentStatusRaw.includes('fail') || paymentStatusRaw.includes('declined');

    const isExplicitlyVerified = (
      paymentVerifiedVal === 'yes' ||
      paymentVerifiedVal === 'true' ||
      paymentVerifiedVal === 'verified'
    );

    const isStatusConfirmed = (
      paymentStatusRaw === 'confirmed' ||
      paymentStatusRaw === 'verified' ||
      paymentStatusRaw === 'approved' ||
      paymentStatusRaw === 'paid' ||
      paymentStatusRaw.includes('cleared')
    );

    const isPaymentVerified = !isPending && !isRejected && (isExplicitlyVerified || isStatusConfirmed);

    const gateCheckInVal = getVal('gatecheckin', 'checkin', 'gatecheckinstatus').toLowerCase();
    const isCheckedIn = (
      paymentStatusRaw.includes('checked in') ||
      (gateCheckInVal.includes('checked in') && !gateCheckInVal.includes('not'))
    );

    let status = 'Pending Verification';
    if (isRejected) {
      status = 'Rejected';
    } else if (isCheckedIn && isPaymentVerified) {
      status = 'Checked In';
    } else if (isPaymentVerified) {
      status = 'Confirmed';
    }

    return {
      id,
      fullName,
      email,
      phone,
      college,
      usn,
      department,
      yearSem,
      category,
      categoryLabel,
      eventId: event1Name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      eventName: event1Name,
      event1Id: event1Name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      event1Name,
      event2Id: event2Name ? event2Name.toLowerCase().replace(/[^a-z0-9]/g, '-') : '',
      event2Name,
      event3Id: event3Name ? event3Name.toLowerCase().replace(/[^a-z0-9]/g, '-') : '',
      event3Name,
      eventCount: (event3Name ? 3 : (event2Name ? 2 : 1)),
      regType,
      teamName,
      teamMembers,
      feePaid,
      utrId,
      status,
      paymentVerified: (status === 'Confirmed' || status === 'Checked In'),
      paymentVerifiedAt: (status === 'Confirmed' || status === 'Checked In') ? new Date().toISOString() : null,
      paymentVerifiedBy: (status === 'Confirmed' || status === 'Checked In') ? 'Excel Import' : null,
      checkedIn: (status === 'Checked In'),
      checkedInAt: (status === 'Checked In') ? new Date().toISOString() : null,
      source: 'EXCEL_IMPORT',
      timestamp: new Date().toISOString()
    };
  });

  return {
    records: normalizedRecords,
    totalRows: rawRows.length
  };
}

module.exports = {
  generateODExcel,
  generateRegistrationsExcel,
  parseRegistrationsExcel
};
