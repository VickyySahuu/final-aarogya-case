// Centralized Client Authentication Service for AAROGYA CASE
import { savePatientProfile } from '../data/patientMockData'

const API_BASE = (typeof window !== 'undefined' && window.__API_URL__) || ''
const TOKEN_KEY = 'aarogya_session_token'

async function request(endpoint, options = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null
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
    message: 'Backend service unavailable. Please verify backend server is running.',
    error: lastError
  }
}

export const AuthApi = {
  getToken() {
    return typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null
  },

  setToken(token) {
    if (typeof window !== 'undefined' && token) {
      localStorage.setItem(TOKEN_KEY, token)
      localStorage.setItem('aarogya_patient_session_token', token)
      sessionStorage.setItem('aarogya_patient_session_token', token)
    }
  },

  clearToken() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem('aarogya_patient_session_token')
      sessionStorage.removeItem('aarogya_patient_session_token')
      localStorage.removeItem('aarogya_session_data')
      localStorage.removeItem('aarogya_patient_profile')
      localStorage.removeItem('aarogya_patient_appointments')
      sessionStorage.removeItem('aarogya_active_case_id')
      sessionStorage.removeItem('aarogya_active_case')
      sessionStorage.removeItem('aarogya_doctor_active_patient')
      sessionStorage.removeItem('aarogya_active_appointment_id')
    }
  },

  setStoredPatient(patient) {
    if (typeof window !== 'undefined' && patient) {
      savePatientProfile(patient)
    }
  },

  getStoredPatient() {
    if (typeof window === 'undefined') return null
    try {
      const sessionStr = localStorage.getItem('aarogya_session_data')
      if (sessionStr) {
        const s = JSON.parse(sessionStr)
        if (s?.patient) return s.patient
      }
      const profileStr = localStorage.getItem('aarogya_patient_profile')
      if (profileStr) {
        return JSON.parse(profileStr)
      }
    } catch (e) {}
    return null
  },

  // POST /api/auth/patient/login
  async patientLogin({ mobile, identityNumber, id, identifier, otp }) {
    const res = await request('/api/auth/patient/login', {
      method: 'POST',
      body: JSON.stringify({ mobile, identityNumber, id, identifier, otp })
    })

    if (res.ok && res.data?.token && res.data?.patient) {
      this.setToken(res.data.token)
      if (res.data.session) {
        localStorage.setItem('aarogya_session_data', JSON.stringify(res.data.session))
      }
      // Keep patient profile synced with database as source of truth
      savePatientProfile(res.data.patient)
      return {
        success: true,
        token: res.data.token,
        session: res.data.session,
        patient: res.data.patient,
        message: res.data.message
      }
    }

    return {
      success: false,
      status: res.status,
      message: res.message || 'Login failed. Please check credentials.'
    }
  },

  // GET /api/auth/me
  async getMe() {
    const token = this.getToken()
    if (!token) {
      return { success: false, message: 'No active session token' }
    }

    const res = await request('/api/auth/me')
    if (res.ok && res.data?.patient) {
      savePatientProfile(res.data.patient)
      return {
        success: true,
        session: res.data.session,
        user: res.data.user,
        patient: res.data.patient
      }
    }

    return {
      success: false,
      status: res.status,
      message: res.message || 'Failed to retrieve session user'
    }
  },

  // POST /api/auth/logout
  async logout() {
    const token = this.getToken()
    try {
      if (token) {
        await request('/api/auth/logout', { method: 'POST' })
      }
    } catch (e) {}
    this.clearToken()
    return { success: true }
  }
}
