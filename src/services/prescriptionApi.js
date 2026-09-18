// Centralized Prescription API Client for AAROGYA CASE e-Prescription Lifecycle (Process 7)
import { DoctorApi } from './doctorApi'

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
    message: 'Prescription backend service unavailable. Please ensure backend is running.',
    error: lastError
  }
}

function getPatientToken() {
  if (typeof window === 'undefined') return null
  return (
    window.sessionStorage.getItem('aarogya_patient_session_token') ||
    window.localStorage.getItem('aarogya_patient_session_token') ||
    window.localStorage.getItem('aarogya_session_token') ||
    null
  )
}

function getPharmacyToken() {
  if (typeof window === 'undefined') return null
  return (
    window.sessionStorage.getItem('aarogya_pharmacy_session_token') ||
    window.localStorage.getItem('aarogya_pharmacy_session_token') ||
    null
  )
}

export const PrescriptionApi = {
  // Pharmacy Auth: POST /api/auth/pharmacy/login
  async loginPharmacy(pharmacyId, password) {
    const res = await request('/api/auth/pharmacy/login', {
      method: 'POST',
      body: JSON.stringify({ pharmacyId, password })
    })

    if (res.ok && res.data?.token && typeof window !== 'undefined') {
      window.sessionStorage.setItem('aarogya_pharmacy_session_token', res.data.token)
      window.localStorage.setItem('aarogya_pharmacy_session_token', res.data.token)
    }

    return res
  },

  getPharmacyToken,

  // POST /api/doctor/prescriptions
  async createPrescription(payload) {
    const token = await DoctorApi.getDoctorToken()
    const headers = token ? { Authorization: `Bearer ${token}` } : {}

    return request('/api/doctor/prescriptions', {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    })
  },

  // GET /api/doctor/prescriptions
  async getDoctorPrescriptions() {
    const token = await DoctorApi.getDoctorToken()
    const headers = token ? { Authorization: `Bearer ${token}` } : {}

    const res = await request('/api/doctor/prescriptions', { headers })
    return res.ok && res.data?.prescriptions ? res.data.prescriptions : []
  },

  // GET /api/doctor/prescriptions/:id
  async getDoctorPrescription(id) {
    const token = await DoctorApi.getDoctorToken()
    const headers = token ? { Authorization: `Bearer ${token}` } : {}

    const res = await request(`/api/doctor/prescriptions/${id}`, { headers })
    return res.ok && res.data?.prescription ? res.data.prescription : null
  },

  // GET /api/patient/prescriptions
  async getPatientPrescriptions() {
    const token = getPatientToken()
    const headers = token ? { Authorization: `Bearer ${token}` } : {}

    const res = await request('/api/patient/prescriptions', { headers })
    return res.ok && res.data?.prescriptions ? res.data.prescriptions : []
  },

  // GET /api/patient/prescriptions/:id
  async getPatientPrescription(id) {
    const token = getPatientToken()
    const headers = token ? { Authorization: `Bearer ${token}` } : {}

    const res = await request(`/api/patient/prescriptions/${id}`, { headers })
    return res.ok && res.data?.prescription ? res.data.prescription : null
  },

  // GET /api/pharmacy/prescriptions (active queue)
  async getPharmacyPrescriptions() {
    const token = getPharmacyToken()
    const headers = token ? { Authorization: `Bearer ${token}` } : {}

    const res = await request('/api/pharmacy/prescriptions', { headers })
    return res.ok && res.data?.prescriptions ? res.data.prescriptions : []
  },

  // GET /api/pharmacy/prescriptions/:id
  async getPharmacyPrescription(id) {
    const token = getPharmacyToken()
    const headers = token ? { Authorization: `Bearer ${token}` } : {}

    const res = await request(`/api/pharmacy/prescriptions/${id}`, { headers })
    return res.ok && res.data?.prescription ? res.data.prescription : null
  },

  // POST /api/pharmacy/dispensings
  async dispenseMedicines(payload) {
    let token = getPharmacyToken()
    if (!token) {
      // Auto-authenticate pharmacy workstation session if needed
      await this.loginPharmacy('PHARM-01', 'demo')
      token = getPharmacyToken()
    }
    const headers = token ? { Authorization: `Bearer ${token}` } : {}

    return request('/api/pharmacy/dispensings', {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    })
  },

  // POST /api/pharmacy/dispensings/:id/verify-delivery
  async verifyDelivery(dispensingIdOrRx, payload) {
    let token = getPharmacyToken()
    if (!token) {
      await this.loginPharmacy('PHARM-01', 'demo')
      token = getPharmacyToken()
    }
    const headers = token ? { Authorization: `Bearer ${token}` } : {}

    return request(`/api/pharmacy/dispensings/${dispensingIdOrRx}/verify-delivery`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    })
  },

  // GET /api/pharmacy/history
  async getPharmacyHistory() {
    let token = getPharmacyToken()
    if (!token) {
      await this.loginPharmacy('PHARM-01', 'demo')
      token = getPharmacyToken()
    }
    const headers = token ? { Authorization: `Bearer ${token}` } : {}

    const res = await request('/api/pharmacy/history', { headers })
    return res.ok && res.data?.history ? res.data.history : []
  },

  // GET /api/doctor/medicines
  async getMedicinesCatalog() {
    const token = await DoctorApi.getDoctorToken()
    const headers = token ? { Authorization: `Bearer ${token}` } : {}

    const res = await request('/api/doctor/medicines', { headers })
    return res.ok && res.data?.medicines ? res.data.medicines : []
  },

  // GET /api/pharmacy/stock
  async getPharmacyStock() {
    let token = getPharmacyToken()
    if (!token) {
      await this.loginPharmacy('PHARM-01', 'demo')
      token = getPharmacyToken()
    }
    const headers = token ? { Authorization: `Bearer ${token}` } : {}
    const res = await request('/api/pharmacy/stock', { headers })
    return res.ok && Array.isArray(res.data?.stock) ? res.data.stock : []
  },

  // POST /api/pharmacy/stock
  async addPharmacyStock(payload) {
    let token = getPharmacyToken()
    if (!token) {
      await this.loginPharmacy('PHARM-01', 'demo')
      token = getPharmacyToken()
    }
    const headers = token ? { Authorization: `Bearer ${token}` } : {}
    return request('/api/pharmacy/stock', {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    })
  }
}

