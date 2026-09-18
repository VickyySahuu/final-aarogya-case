// Client Service for Diagnostic / Scan Requests & Reports connecting to Express/PostgreSQL backend
import { DoctorApi } from './doctorApi'

const API_BASE = (typeof window !== 'undefined' && window.__API_URL__) || ''

async function request(endpoint, options = {}, requiresDoctor = false) {
  let token = null
  if (requiresDoctor) {
    token = await DoctorApi.getDoctorToken()
  } else if (typeof window !== 'undefined') {
    token = window.sessionStorage.getItem('aarogya_doctor_session_token') ||
            window.sessionStorage.getItem('aarogya_diagnostic_session_token')
  }

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {})
  }

  const currentHost = (typeof window !== 'undefined' && window.location.hostname) ? window.location.hostname : 'localhost'
  const urls = [
    `${API_BASE}${endpoint}`,
    `http://${currentHost}:5000${endpoint}`,
    `http://localhost:5000${endpoint}`
  ]

  let lastError = null

  for (const url of urls) {
    try {
      const res = await fetch(url, { ...options, headers })
      const data = await res.json().catch(() => null)
      if (res.ok) {
        return { ok: true, status: res.status, data }
      } else {
        return {
          ok: false,
          status: res.status,
          message: data?.message || `Server responded with status ${res.status}`,
          data
        }
      }
    } catch (err) {
      lastError = err
    }
  }

  return {
    ok: false,
    status: 0,
    message: 'Diagnostic backend service unavailable. Please ensure the backend server is running.',
    error: lastError
  }
}

export const DiagnosticApi = {
  // Doctor creates diagnostic / scan request: POST /api/diagnostic/requests
  async createRequest(requestData) {
    return request('/api/diagnostic/requests', {
      method: 'POST',
      body: JSON.stringify(requestData)
    }, true)
  },

  // Diagnostic portal lists requests: GET /api/diagnostic/requests
  async getRequests(status = '') {
    const query = status ? `?status=${encodeURIComponent(status)}` : ''
    return request(`/api/diagnostic/requests${query}`, {
      method: 'GET'
    })
  },

  // Diagnostic portal gets single request: GET /api/diagnostic/requests/:id
  async getRequestById(id) {
    return request(`/api/diagnostic/requests/${encodeURIComponent(id)}`, {
      method: 'GET'
    })
  },

  // Update status: PATCH /api/diagnostic/requests/:id/status
  async updateStatus(id, status) {
    return request(`/api/diagnostic/requests/${encodeURIComponent(id)}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    })
  },

  // Upload report: POST /api/diagnostic/requests/:id/report
  async uploadReport(requestId, reportData) {
    return request(`/api/diagnostic/requests/${encodeURIComponent(requestId)}/report`, {
      method: 'POST',
      body: JSON.stringify(reportData)
    })
  },

  // Doctor or Diagnostic portal retrieves patient reports: GET /api/doctor/diagnostic-reports/:patientId
  async getPatientReports(patientId) {
    // Try doctor authenticated route first
    const docRes = await request(`/api/doctor/diagnostic-reports/${encodeURIComponent(patientId)}`, {
      method: 'GET'
    }, true)

    if (docRes.ok) return docRes

    // Fallback to public/diagnostic reports route
    return request(`/api/diagnostic/reports/patient/${encodeURIComponent(patientId)}`, {
      method: 'GET'
    })
  }
}
