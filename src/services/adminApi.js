// Centralized Admin Portal API Client for AAROGYA CASE (Process 10)

const API_BASE = (typeof window !== 'undefined' && window.__API_URL__) || ''

async function request(endpoint, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
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
    message: 'Admin console backend service unavailable. Please ensure backend is running.',
    error: lastError
  }
}

function getAdminToken() {
  if (typeof window === 'undefined') return null
  return (
    window.sessionStorage.getItem('aarogya_admin_session_token') ||
    window.localStorage.getItem('aarogya_admin_session_token') ||
    window.localStorage.getItem('aarogya_admin_token') ||
    null
  )
}

export const AdminApi = {
  /**
   * Authenticate administrator
   */
  async adminLogin({ adminId, username, password }) {
    const res = await request('/api/auth/admin/login', {
      method: 'POST',
      body: JSON.stringify({ adminId, username, password })
    })

    if (res.ok && res.data?.token) {
      try {
        window.localStorage.setItem('aarogya_admin_session_token', res.data.token)
        window.localStorage.setItem('aarogya_admin_token', res.data.token)
        if (res.data.session) {
          window.localStorage.setItem('aarogya_admin_profile', JSON.stringify(res.data.session))
        }
      } catch (e) {}
    }

    return res
  },

  /**
   * Retrieve live database entity counts for dashboard
   */
  async getDashboard() {
    const token = getAdminToken()
    const headers = token ? { Authorization: `Bearer ${token}` } : {}

    return request('/api/admin/dashboard', {
      method: 'GET',
      headers
    })
  },

  // --- Doctor Management ---
  async getDoctors() {
    const token = getAdminToken()
    const headers = token ? { Authorization: `Bearer ${token}` } : {}
    return request('/api/admin/doctors', { method: 'GET', headers })
  },

  async getDoctor(id = 1) {
    const token = getAdminToken()
    const headers = token ? { Authorization: `Bearer ${token}` } : {}
    return request(`/api/admin/doctors/${id}`, { method: 'GET', headers })
  },

  async updateDoctor(id = 1, data) {
    const token = getAdminToken()
    const headers = token ? { Authorization: `Bearer ${token}` } : {}
    return request(`/api/admin/doctors/${id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(data)
    })
  },

  // --- Hospital Management ---
  async getHospitals() {
    const token = getAdminToken()
    const headers = token ? { Authorization: `Bearer ${token}` } : {}
    return request('/api/admin/hospitals', { method: 'GET', headers })
  },

  async getHospital(id = 1) {
    const token = getAdminToken()
    const headers = token ? { Authorization: `Bearer ${token}` } : {}
    return request(`/api/admin/hospitals/${id}`, { method: 'GET', headers })
  },

  async updateHospital(id = 1, data) {
    const token = getAdminToken()
    const headers = token ? { Authorization: `Bearer ${token}` } : {}
    return request(`/api/admin/hospitals/${id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(data)
    })
  },

  // --- Medicine Management ---
  async getMedicines() {
    const token = getAdminToken()
    const headers = token ? { Authorization: `Bearer ${token}` } : {}
    return request('/api/admin/medicines', { method: 'GET', headers })
  },

  async createMedicine(data) {
    const token = getAdminToken()
    const headers = token ? { Authorization: `Bearer ${token}` } : {}
    return request('/api/admin/medicines', {
      method: 'POST',
      headers,
      body: JSON.stringify(data)
    })
  },

  async updateMedicine(id, data) {
    const token = getAdminToken()
    const headers = token ? { Authorization: `Bearer ${token}` } : {}
    return request(`/api/admin/medicines/${id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(data)
    })
  },

  // --- Diagnostic Management ---
  async getDiagnostics() {
    const token = getAdminToken()
    const headers = token ? { Authorization: `Bearer ${token}` } : {}
    return request('/api/admin/diagnostics', { method: 'GET', headers })
  },

  async createDiagnostic(data) {
    const token = getAdminToken()
    const headers = token ? { Authorization: `Bearer ${token}` } : {}
    return request('/api/admin/diagnostics', {
      method: 'POST',
      headers,
      body: JSON.stringify(data)
    })
  },

  async updateDiagnostic(id, data) {
    const token = getAdminToken()
    const headers = token ? { Authorization: `Bearer ${token}` } : {}
    return request(`/api/admin/diagnostics/${id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(data)
    })
  },

  // --- Ambulance Management ---
  async getAmbulances() {
    const token = getAdminToken()
    const headers = token ? { Authorization: `Bearer ${token}` } : {}
    return request('/api/admin/ambulances', { method: 'GET', headers })
  },

  async getAmbulance(id = 1) {
    const token = getAdminToken()
    const headers = token ? { Authorization: `Bearer ${token}` } : {}
    return request(`/api/admin/ambulances/${id}`, { method: 'GET', headers })
  },

  async createAmbulance(data) {
    const token = getAdminToken()
    const headers = token ? { Authorization: `Bearer ${token}` } : {}
    return request('/api/admin/ambulances', {
      method: 'POST',
      headers,
      body: JSON.stringify(data)
    })
  },

  async updateAmbulance(id = 1, data) {
    const token = getAdminToken()
    const headers = token ? { Authorization: `Bearer ${token}` } : {}
    return request(`/api/admin/ambulances/${id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(data)
    })
  }
}

export default AdminApi
