const XLSX = require('xlsx');

/**
 * Generate Excel workbook for approved/filtered OD requests
 * Required columns:
 * 1. sno
 * 2. name
 * 3. roll number
 * 4. section
 * 5. batch number
 * 6. hours
 * 7. school name
 * 8. hod name
 */
function generateODExcel(records, metadata = {}) {
  const { date = 'All Dates', filterHours = 'All Hours', reportType = 'Consolidated' } = metadata;

  // Prepare row objects matching exact specified column names
  const rows = records.map((rec, index) => {
    // Format hours cleanly (e.g. "Hour 1, 2, 3" or comma separated)
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

  // Create worksheet
  const worksheet = XLSX.utils.json_to_sheet(rows);

  // Set column widths for clean readability
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

  // Create workbook
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'OD & Attendance Report');

  // Also include a summary metadata sheet
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

  // Generate buffer
  const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });
  return buffer;
}

module.exports = {
  generateODExcel
};
