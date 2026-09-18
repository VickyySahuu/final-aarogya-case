import crypto from 'crypto'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const SESSIONS_FILE = path.join(__dirname, '../.sessions.json')

// Active server sessions store (token -> sessionData)
const sessions = new Map()

function loadSessionsFromDisk() {
  try {
    if (fs.existsSync(SESSIONS_FILE)) {
      const data = JSON.parse(fs.readFileSync(SESSIONS_FILE, 'utf8'))
      for (const [k, v] of Object.entries(data)) {
        if (new Date(v.expiresAt) > new Date()) {
          sessions.set(k, v)
        }
      }
    }
  } catch (e) {}
}

function saveSessionsToDisk() {
  try {
    const obj = {}
    for (const [k, v] of sessions.entries()) {
      obj[k] = v
    }
    fs.writeFileSync(SESSIONS_FILE, JSON.stringify(obj, null, 2), 'utf8')
  } catch (e) {}
}

loadSessionsFromDisk()

export const SessionService = {
  /**
   * Set or restore a session
   */
  setSession(token, session) {
    sessions.set(token, session)
    saveSessionsToDisk()
    return session
  },

  /**
   * Creates a new session for a patient
   */
  createPatientSession(patient, userId = null) {
    const token = 'PAT-SES-' + crypto.randomBytes(24).toString('hex')
    const session = {
      token,
      userId: userId || patient.user_id || patient.id,
      patientDatabaseId: patient.id,
      patientId: patient.patient_id || patient.patientId,
      patientUniqueCode: patient.patient_unique_code || patient.patientUniqueCode,
      patientName: patient.name,
      role: 'patient',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    }
    sessions.set(token, session)
    saveSessionsToDisk()
    return session
  },

  /**
   * Creates a new session for the prototype doctor
   */
  createDoctorSession(doctor, userId = 2) {
    const token = 'DOC-SES-' + crypto.randomBytes(24).toString('hex')
    const session = {
      token,
      userId: userId || doctor.user_id || 2,
      doctorId: doctor.id,
      doctorCodeId: doctor.doctor_id || 'DOC-1042',
      doctorName: doctor.name,
      role: 'doctor',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    }
    sessions.set(token, session)
    return session
  },

  /**
   * Creates a new session for diagnostic lab workstation / staff
   */
  createDiagnosticSession(staff = {}, userId = 3) {
    const token = 'DIAG-SES-' + crypto.randomBytes(24).toString('hex')
    const session = {
      token,
      userId: userId || staff.user_id || 3,
      labId: staff.labId || 'LAB-AIIMS-02',
      operatorName: staff.operatorName || staff.name || 'Radiographer S. Varma',
      role: 'diagnostic',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    }
    sessions.set(token, session)
    return session
  },

  /**
   * Creates a new session for pharmacy workstation / staff
   */
  createPharmacySession(staff = {}, userId = 4) {
    const token = 'PHARM-SES-' + crypto.randomBytes(24).toString('hex')
    const session = {
      token,
      userId: userId || staff.user_id || 4,
      pharmacyId: staff.pharmacyId || 'PHARM-01',
      pharmacyName: staff.pharmacyName || 'District Civil Hospital Dispensary',
      dispenserName: staff.dispenserName || staff.name || 'Pharmacist Lead',
      role: 'pharmacy',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    }
    sessions.set(token, session)
    return session
  },

  /**
   * Creates a new session for ambulance unit / paramedic operator
   */
  createAmbulanceSession(staff = {}, userId = 5) {
    const token = 'AMB-SES-' + crypto.randomBytes(24).toString('hex')
    const session = {
      token,
      userId: userId || staff.user_id || 5,
      ambulanceId: staff.ambulanceId || staff.id || 1,
      ambulanceNumber: staff.ambulanceNumber || staff.unit || 'Ambulance Unit #08',
      vehicleNumber: staff.vehicleNumber || 'DL-01-EQ-9041',
      operatorName: staff.operatorName || 'Paramedic Lead Paramveer / Ravi',
      operatorId: staff.operatorId || 'AMB-OP-104',
      role: 'ambulance',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    }
    sessions.set(token, session)
    return session
  },

  /**
   * Creates a new session for central system administrator
   */
  createAdminSession(admin = {}, userId = 6) {
    const token = 'ADM-SES-' + crypto.randomBytes(24).toString('hex')
    const session = {
      token,
      userId: userId || admin.user_id || 6,
      adminId: admin.adminId || admin.id || 'ADMIN-01',
      username: admin.username || 'admin',
      name: admin.name || 'Central Ministry Administrator',
      role: 'admin',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    }
    sessions.set(token, session)
    return session
  },

  /**
   * Retrieves a session by token.
   * Returns null if expired or not found.
   */
  getSession(token) {
    if (!token) return null
    let session = sessions.get(token)
    if (!session) {
      loadSessionsFromDisk()
      session = sessions.get(token)
    }
    if (!session) return null

    // Check expiration
    if (new Date(session.expiresAt) < new Date()) {
      sessions.delete(token)
      saveSessionsToDisk()
      return null
    }

    return session
  },

  /**
   * Deletes a session by token (logout)
   */
  deleteSession(token) {
    if (!token) return false
    const res = sessions.delete(token)
    saveSessionsToDisk()
    return res
  },

  /**
   * Clear all sessions (for test teardowns)
   */
  clearAll() {
    sessions.clear()
  }
}
