// Centralized Doctor API Client for AAROGYA CASE Doctor Portal
const API_BASE = '/api'

let cachedDoctorToken = null

export const DoctorApi = {
  /**
   * Retrieves or establishes the prototype doctor session
   */
  async getDoctorToken() {
    if (cachedDoctorToken) return cachedDoctorToken

    if (typeof window !== 'undefined') {
      const stored = window.sessionStorage.getItem('aarogya_doctor_session_token')
      if (stored) {
        cachedDoctorToken = stored
        return stored
      }
    }

    // Transparent login for prototype doctor
    try {
      const res = await fetch(`${API_BASE}/auth/doctor/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doctorId: 'DOC-1042' })
      })
      const data = await res.json()
      if (data.success && data.token) {
        cachedDoctorToken = data.token
        if (typeof window !== 'undefined') {
          window.sessionStorage.setItem('aarogya_doctor_session_token', data.token)
        }
        return data.token
      }
    } catch (e) {
      console.warn('[DoctorApi] Automatic doctor login failed:', e.message)
    }

    return null
  },

  /**
   * Explicit doctor login
   */
  async loginDoctor(doctorId = 'DOC-1042', password = '') {
    const currentHost = (typeof window !== 'undefined' && window.location.hostname) ? window.location.hostname : 'localhost'
    const urls = [
      `${API_BASE}/auth/doctor/login`,
      `http://${currentHost}:5000/api/auth/doctor/login`,
      `http://localhost:5000/api/auth/doctor/login`
    ]
    let lastData = null
    for (const url of urls) {
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ doctorId, password })
        })
        const data = await res.json().catch(() => null)
        if (data) {
          if (data.success && data.token) {
            cachedDoctorToken = data.token
            if (typeof window !== 'undefined') {
              window.sessionStorage.setItem('aarogya_doctor_session_token', data.token)
              window.localStorage.setItem('aarogya_doctor_session_token', data.token)
            }
          }
          return data
        }
      } catch (e) {
        lastData = { success: false, message: e.message }
      }
    }
    return lastData || { success: false, message: 'Doctor login service unavailable' }
  },

  /**
   * Clears doctor session on logout
   */
  logoutDoctor() {
    cachedDoctorToken = null
    if (typeof window !== 'undefined') {
      window.sessionStorage.removeItem('aarogya_doctor_session_token')
      window.localStorage.removeItem('aarogya_doctor_session_token')
    }
  },

  /**
   * Fetches the OPD Queue for the authenticated doctor
   */
  async getOpdQueue(filter = 'ALL') {
    const token = await this.getDoctorToken()
    const url = filter && filter !== 'ALL'
      ? `${API_BASE}/doctor/opd-queue?filter=${encodeURIComponent(filter)}`
      : `${API_BASE}/doctor/opd-queue`

    const res = await fetch(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    })
    const data = await res.json()
    return data.queue || []
  },

  /**
   * Fetches single appointment dossier with patient demographics and case info
   */
  async getQueueItem(id) {
    const token = await this.getDoctorToken()
    const res = await fetch(`${API_BASE}/doctor/opd-queue/${id}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    })
    const data = await res.json()
    return data.success ? data.queueItem : null
  },

  /**
   * Updates an appointment's queue status (Waiting -> Current -> Completed / Skipped)
   */
  async updateQueueStatus(id, status) {
    const token = await this.getDoctorToken()
    const res = await fetch(`${API_BASE}/doctor/opd-queue/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ status })
    })
    const data = await res.json()
    return data
  },

  /**
   * Searches patients by Name, ID, Token, or Unique Code in PostgreSQL
   */
  async searchPatients(query = '') {
    const token = await this.getDoctorToken()
    const url = query
      ? `${API_BASE}/doctor/patients/search?q=${encodeURIComponent(query)}`
      : `${API_BASE}/doctor/patients/search`

    const res = await fetch(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    })
    const data = await res.json()
    return data.patients || []
  },

  /**
   * Saves consultation clinical notes
   */
  async saveNotes({ appointmentId, caseId, patientId, complaint, examination, diagnosis, plan }) {
    const token = await this.getDoctorToken()
    const res = await fetch(`${API_BASE}/doctor/notes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ appointmentId, caseId, patientId, complaint, examination, diagnosis, plan })
    })
    return await res.json()
  },

  /**
   * Fetches real patient history (past appointments, cases, prescriptions) from backend
   */
  async getPatientHistory(patientId) {
    if (!patientId) return { appointments: [], prescriptions: [], cases: [], reports: [], timeline: [] }
    const token = await this.getDoctorToken()
    const currentHost = (typeof window !== 'undefined' && window.location.hostname) ? window.location.hostname : 'localhost'
    const urls = [
      `${API_BASE}/patients/${encodeURIComponent(patientId)}/history`,
      `http://${currentHost}:5000/api/patients/${encodeURIComponent(patientId)}/history`,
      `http://localhost:5000/api/patients/${encodeURIComponent(patientId)}/history`
    ]
    for (const url of urls) {
      try {
        const res = await fetch(url, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        })
        const data = await res.json().catch(() => null)
        if (data && data.success) {
          return data.data || { appointments: [], prescriptions: [], cases: [], reports: [], timeline: [] }
        }
      } catch (e) {}
    }
    return { appointments: [], prescriptions: [], cases: [], reports: [], timeline: [] }
  },

  /**
   * Fetches unified chronological medical timeline for a patient
   */
  async getPatientTimeline(patientId) {
    if (!patientId) return { events: [], totalEvents: 0 }
    const token = await this.getDoctorToken()
    const currentHost = (typeof window !== 'undefined' && window.location.hostname) ? window.location.hostname : 'localhost'
    const urls = [
      `${API_BASE}/patients/${encodeURIComponent(patientId)}/timeline`,
      `http://${currentHost}:5000/api/patients/${encodeURIComponent(patientId)}/timeline`,
      `http://localhost:5000/api/patients/${encodeURIComponent(patientId)}/timeline`
    ]
    for (const url of urls) {
      try {
        const res = await fetch(url, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        })
        const data = await res.json().catch(() => null)
        if (data && data.success) {
          return { events: data.events || [], totalEvents: data.totalEvents || 0, patient: data.patient }
        }
      } catch (e) {}
    }
    return { events: [], totalEvents: 0 }
  },

  /**
   * Fetches physician-ready AI clinical summary for a specific case
   */
  async getCaseAiSummary(caseId) {
    if (!caseId) return null
    const token = await this.getDoctorToken()
    const currentHost = (typeof window !== 'undefined' && window.location.hostname) ? window.location.hostname : 'localhost'
    const urls = [
      `${API_BASE}/patient-cases/${encodeURIComponent(caseId)}/summary`,
      `http://${currentHost}:5000/api/patient-cases/${encodeURIComponent(caseId)}/summary`,
      `http://localhost:5000/api/patient-cases/${encodeURIComponent(caseId)}/summary`
    ]
    for (const url of urls) {
      try {
        const res = await fetch(url, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        })
        const data = await res.json().catch(() => null)
        if (data && data.success && data.summary) {
          return data.summary
        }
      } catch (e) {}
    }
    return null
  }
}
