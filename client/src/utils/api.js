// API helper with base URL and error handling
const API_BASE = '/api';

export async function apiFetch(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  };

  try {
    const res = await fetch(url, config);
    const contentType = res.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Server request failed');
      }
      return data;
    }

    if (!res.ok) {
      throw new Error(`HTTP Error: ${res.status}`);
    }
    return res;
  } catch (err) {
    console.error(`API Error on ${endpoint}:`, err);
    throw err;
  }
}

export function getExcelExportUrl(params = {}) {
  const query = new URLSearchParams(params).toString();
  return `${API_BASE}/admin/export-excel?${query}`;
}

export function getBackupExportUrl() {
  return `${API_BASE}/admin/export-backup`;
}
