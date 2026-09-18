// Centralized API client for Patient module connecting to Express/PostgreSQL backend

const API_BASE = (typeof window !== 'undefined' && window.__API_URL__) || ''

async function request(endpoint, options = {}) {
  const token = typeof window !== 'undefined'
    ? (localStorage.getItem('aarogya_session_token') || localStorage.getItem('aarogya_patient_session_token') || sessionStorage.getItem('aarogya_patient_session_token'))
    : null

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
      // Continue to next URL attempt if network failed
    }
  }

  return {
    ok: false,
    status: 0,
    message: 'Backend service unavailable. Please ensure the backend server is running.',
    error: lastError
  }
}

export const PatientApi = {
  // POST /api/patients/register
  async register(patientData) {
    const res = await request('/api/patients/register', {
      method: 'POST',
      body: JSON.stringify(patientData)
    })

    if (res.ok && res.data?.patient) {
      return {
        success: true,
        patient: res.data.patient,
        isExisting: res.data.isExisting || false,
        message: res.data.message
      }
    }

    return {
      success: false,
      message: res.message || 'Failed to complete patient registration',
      status: res.status
    }
  },

  // GET /api/patients/:id
  async getById(id) {
    const res = await request(`/api/patients/${encodeURIComponent(id)}`)
    if (res.ok && res.data?.patient) {
      return { success: true, patient: res.data.patient }
    }
    return { success: false, message: res.message || 'Patient not found' }
  },

  // GET /api/patients/code/:code
  async getByUniqueCode(code) {
    const res = await request(`/api/patients/code/${encodeURIComponent(code)}`)
    if (res.ok && res.data?.patient) {
      return { success: true, patient: res.data.patient }
    }
    return { success: false, message: res.message || 'Patient not found' }
  },

  // GET /api/patients/:id/timeline (or /api/patients/timeline/me)
  async getTimeline(patientId = 'me') {
    const target = patientId || 'me'
    const res = await request(`/api/patients/${encodeURIComponent(target)}/timeline`)
    if (res.ok && res.data) {
      return {
        success: true,
        patient: res.data.patient,
        events: res.data.events || [],
        totalEvents: res.data.totalEvents || 0
      }
    }
    return {
      success: false,
      events: [],
      totalEvents: 0,
      message: res.message || 'Failed to load medical timeline'
    }
  },

  // GET /api/patients/:id/history
  async getHistory(patientId = 'me') {
    const target = patientId || 'me'
    const res = await request(`/api/patients/${encodeURIComponent(target)}/history`)
    if (res.ok && res.data) {
      return {
        success: true,
        patient: res.data.patient,
        data: res.data.data || {},
        timeline: res.data.data?.timeline || []
      }
    }
    return {
      success: false,
      data: {},
      timeline: [],
      message: res.message || 'Failed to load patient history'
    }
  }
}
