// Centralized Emergency & Ambulance API Client for AAROGYA CASE (Process 9)

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
    message: 'Emergency dispatch backend service unavailable. Please ensure backend is running.',
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

function setPatientToken(token) {
  if (typeof window === 'undefined' || !token) return
  try {
    window.localStorage.setItem('aarogya_session_token', token)
    window.localStorage.setItem('aarogya_patient_session_token', token)
    window.sessionStorage.setItem('aarogya_patient_session_token', token)
  } catch (e) {}
}

function getAmbulanceToken() {
  if (typeof window === 'undefined') return null
  return (
    window.sessionStorage.getItem('aarogya_ambulance_session_token') ||
    window.localStorage.getItem('aarogya_ambulance_session_token') ||
    window.localStorage.getItem('aarogya_ambulance_token') ||
    null
  )
}

export const EmergencyApi = {
  getPatientToken,
  setPatientToken,

  // --- Patient Emergency Endpoints ---

  /**
   * Submit an emergency ambulance request with coordinates detected via Geolocation API
   */
  async createEmergencyRequest({ latitude, longitude, locationAccuracy, pickupLocation, landmark, destination, destinationBay }) {
    let token = getPatientToken()

    // If no active session token exists, auto-authenticate registered citizen to establish emergency telemetry session
    if (!token) {
      try {
        const loginRes = await fetch('/api/auth/patient/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mobile: '9876543210' })
        })
        const loginData = await loginRes.json().catch(() => null)
        if (loginData?.token) {
          token = loginData.token
          setPatientToken(token)
        }
      } catch (e) {
        console.warn('[EmergencyApi] Auto-auth attempt notice:', e)
      }
    }

    const headers = {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      'x-patient-unique-code': 'AC-7F42K9'
    }

    return request('/api/emergency/requests', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        latitude,
        longitude,
        locationAccuracy,
        pickupLocation,
        landmark,
        destination,
        destinationBay
      })
    })
  },

  /**
   * Retrieve details for a specific emergency request by ID or request number (EMG-YYYY-XXXXXX)
   */
  async getEmergencyRequest(id) {
    let token = getPatientToken()
    const headers = {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      'x-patient-unique-code': 'AC-7F42K9'
    }

    return request(`/api/emergency/requests/${id}`, {
      method: 'GET',
      headers
    })
  },

  // --- Ambulance Portal Endpoints ---

  /**
   * Authenticate ambulance unit or paramedic operator
   */
  async ambulanceLogin({ ambulanceId, username, password }) {
    const res = await request('/api/auth/ambulance/login', {
      method: 'POST',
      body: JSON.stringify({ ambulanceId, username, password })
    })

    if (res.ok && res.data?.token) {
      try {
        window.localStorage.setItem('aarogya_ambulance_session_token', res.data.token)
        window.localStorage.setItem('aarogya_ambulance_token', res.data.token)
        if (res.data.session) {
          window.localStorage.setItem('aarogya_ambulance_unit', JSON.stringify(res.data.session))
        }
      } catch (e) {
        // Storage access handled
      }
    }

    return res
  },

  /**
   * List emergency requests
   */
  async getAmbulanceRequests(params = {}) {
    const token = getAmbulanceToken()
    const headers = token ? { Authorization: `Bearer ${token}` } : {}

    const query = new URLSearchParams()
    if (params.status) query.append('status', params.status)
    if (params.activeOnly !== undefined) query.append('activeOnly', params.activeOnly)

    const qs = query.toString() ? `?${query.toString()}` : ''
    return request(`/api/ambulance/requests${qs}`, {
      method: 'GET',
      headers
    })
  },

  /**
   * Get single emergency request details for ambulance
   */
  async getAmbulanceRequestDetails(id) {
    const token = getAmbulanceToken()
    const headers = token ? { Authorization: `Bearer ${token}` } : {}

    return request(`/api/ambulance/requests/${id}`, {
      method: 'GET',
      headers
    })
  },

  /**
   * Retrieve patient telemetry / GPS location for ambulance route
   */
  async getPatientLocation(id) {
    const token = getAmbulanceToken()
    const headers = token ? { Authorization: `Bearer ${token}` } : {}

    return request(`/api/ambulance/requests/${id}/location`, {
      method: 'GET',
      headers
    })
  },

  /**
   * Assign emergency request to ambulance
   */
  async assignAmbulance(id, ambulanceId) {
    const token = getAmbulanceToken()
    const headers = token ? { Authorization: `Bearer ${token}` } : {}

    return request(`/api/ambulance/requests/${id}/assign`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ ambulanceId })
    })
  },

  /**
   * Update emergency request operational status
   */
  async updateAmbulanceRequestStatus(id, status) {
    const token = getAmbulanceToken()
    const headers = token ? { Authorization: `Bearer ${token}` } : {}

    return request(`/api/ambulance/requests/${id}/status`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ status })
    })
  },

  /**
   * Submit scene assessment (paramedic fills in after arriving at scene)
   */
  async saveSceneAssessment(id, assessmentData) {
    const token = getAmbulanceToken()
    const headers = token ? { Authorization: `Bearer ${token}` } : {}

    return request(`/api/ambulance/requests/${id}/assessment`, {
      method: 'POST',
      headers,
      body: JSON.stringify(assessmentData)
    })
  },

  /**
   * Send pre-arrival alert to receiving hospital
   */
  async sendPreArrivalAlert(id) {
    const token = getAmbulanceToken()
    const headers = token ? { Authorization: `Bearer ${token}` } : {}

    return request(`/api/ambulance/requests/${id}/prearrival-alert`, {
      method: 'POST',
      headers
    })
  },

  /**
   * Assign receiving destination (hospital assigns building/floor/unit/room)
   */
  async assignReceivingDestination(id, destinationData) {
    return request(`/api/emergency/requests/${id}/destination`, {
      method: 'PATCH',
      body: JSON.stringify(destinationData)
    })
  },

  /**
   * Get receiving destination for ambulance view
   */
  async getReceivingDestination(id) {
    const token = getAmbulanceToken()
    const headers = token ? { Authorization: `Bearer ${token}` } : {}

    return request(`/api/ambulance/requests/${id}/destination`, {
      method: 'GET',
      headers
    })
  },

  /**
   * Get receiving destination for patient view
   */
  async getPatientDestination(id) {
    const token = getPatientToken()
    const headers = token ? { Authorization: `Bearer ${token}` } : {}

    return request(`/api/emergency/requests/${id}/destination`, {
      method: 'GET',
      headers
    })
  },

  /**
   * Update real-time ambulance GPS location
   */
  async updateAmbulanceLocation({ latitude, longitude, id }) {
    const token = getAmbulanceToken()
    const headers = token ? { Authorization: `Bearer ${token}` } : {}
    const endpoint = id ? `/api/ambulance/requests/${id}/ambulance-location` : '/api/ambulance/location'

    return request(endpoint, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ latitude, longitude })
    })
  }
}

export default EmergencyApi
