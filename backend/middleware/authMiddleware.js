import crypto from 'crypto'
import { SessionService } from '../services/sessionService.js'
import { PatientModel } from '../models/patientModel.js'
import { DoctorModel } from '../models/doctorModel.js'

export async function requirePatientAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || ''
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.slice(7).trim()
      : (req.headers['x-session-token'] || req.query.token || '')

    const clientUniqueCode = req.headers['x-patient-unique-code']
    const clientPatientId = req.headers['x-patient-id']

    if (!token && !clientUniqueCode && !clientPatientId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. No session token provided.'
      })
    }

    let session = token ? SessionService.getSession(token) : null

    // If session was lost (e.g. server reload), auto-reconstitute for registered patient
    if (!session && (token?.startsWith('PAT-SES-') || clientUniqueCode || clientPatientId)) {
      let recoveredPatient = null
      if (clientUniqueCode) {
        recoveredPatient = await PatientModel.findByUniqueCode(clientUniqueCode)
      }
      if (!recoveredPatient && clientPatientId) {
        recoveredPatient = await PatientModel.findById(clientPatientId) || await PatientModel.findByPatientId(clientPatientId)
      }
      if (!recoveredPatient && token && token.startsWith('PAT-SES-')) {
        const allPatients = await PatientModel.getAll()
        if (allPatients && allPatients.length > 0) {
          recoveredPatient = allPatients[allPatients.length - 1]
        }
      }

      if (recoveredPatient) {
        const sessionToken = (token && token.startsWith('PAT-SES-')) ? token : ('PAT-SES-' + crypto.randomBytes(24).toString('hex'))
        session = {
          token: sessionToken,
          userId: recoveredPatient.user_id || recoveredPatient.id,
          patientDatabaseId: recoveredPatient.id,
          patientId: recoveredPatient.patient_id,
          patientUniqueCode: recoveredPatient.patient_unique_code,
          patientName: recoveredPatient.name,
          role: 'patient',
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        }
        SessionService.setSession(session.token, session)
      }
    }

    if (!session) {
      return res.status(401).json({
        success: false,
        message: 'Session expired or invalid. Please log in again.'
      })
    }

    let patient = await PatientModel.findById(session.patientDatabaseId)
    if (!patient) {
      patient = await PatientModel.findByUniqueCode(session.patientUniqueCode)
    }

    if (!patient) {
      return res.status(401).json({
        success: false,
        message: 'Authenticated citizen record not found in registry.'
      })
    }

    req.session = session
    req.patient = patient
    next()
  } catch (err) {
    next(err)
  }
}

export async function requireDoctorAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || ''
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.slice(7).trim()
      : (req.headers['x-session-token'] || req.query.token || '')

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Doctor authentication required. No session token provided.'
      })
    }

    const session = SessionService.getSession(token)
    if (!session) {
      return res.status(401).json({
        success: false,
        message: 'Doctor session expired or invalid. Please log in again.'
      })
    }

    if (session.role !== 'doctor') {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized access. Doctor credentials required.'
      })
    }

    let doctor = null
    if (session.doctorId) {
      doctor = await DoctorModel.findById(session.doctorId)
    }
    if (!doctor && session.doctorCodeId) {
      doctor = await DoctorModel.findByDoctorId(session.doctorCodeId)
    }
    if (!doctor) {
      doctor = await DoctorModel.getSingleDoctor()
    }

    if (!doctor) {
      return res.status(401).json({
        success: false,
        message: 'Doctor record not found in central hospital registry.'
      })
    }

    req.session = session
    req.doctor = doctor
    next()
  } catch (err) {
    next(err)
  }
}

export async function requireDiagnosticAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || ''
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.slice(7).trim()
      : (req.headers['x-session-token'] || req.query.token || '')

    if (token) {
      const session = SessionService.getSession(token)
      if (!session) {
        return res.status(401).json({
          success: false,
          message: 'Diagnostic session expired or invalid. Please authenticate.'
        })
      }
      req.session = session
      return next()
    }

    // Prototype mode: attach default workstation session if header omitted
    req.session = {
      role: 'diagnostic',
      labId: 'LAB-AIIMS-02',
      operatorName: 'Radiographer S. Varma'
    }
    next()
  } catch (err) {
    next(err)
  }
}

export async function requirePharmacyAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || ''
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.slice(7).trim()
      : (req.headers['x-session-token'] || req.query.token || '')

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Pharmacy authentication required. No session token provided.'
      })
    }

    const session = SessionService.getSession(token)
    if (!session) {
      return res.status(401).json({
        success: false,
        message: 'Pharmacy session expired or invalid. Please authenticate.'
      })
    }

    if (session.role !== 'pharmacy') {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized access. Pharmacy credentials required.'
      })
    }

    req.session = session
    req.pharmacyStaff = {
      pharmacyId: session.pharmacyId,
      pharmacyName: session.pharmacyName,
      dispenserName: session.dispenserName
    }
    next()
  } catch (err) {
    next(err)
  }
}

export async function optionalPharmacyAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || ''
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.slice(7).trim()
      : (req.headers['x-session-token'] || req.query.token || '')

    if (token) {
      const session = SessionService.getSession(token)
      if (!session) {
        return res.status(401).json({
          success: false,
          message: 'Pharmacy session expired or invalid. Please authenticate.'
        })
      }
      if (session.role !== 'pharmacy') {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized access. Pharmacy credentials required.'
        })
      }
      req.session = session
      req.pharmacyStaff = {
        pharmacyId: session.pharmacyId,
        pharmacyName: session.pharmacyName,
        dispenserName: session.dispenserName
      }
    }
    next()
  } catch (err) {
    next(err)
  }
}

export async function requireAmbulanceAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || ''
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.slice(7).trim()
      : (req.headers['x-session-token'] || req.query.token || '')

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Ambulance authentication required. No session token provided.'
      })
    }

    const session = SessionService.getSession(token)
    if (!session) {
      return res.status(401).json({
        success: false,
        message: 'Ambulance session expired or invalid. Please authenticate.'
      })
    }

    if (session.role !== 'ambulance') {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized access. Ambulance unit credentials required.'
      })
    }

    req.session = session
    req.ambulance = {
      ambulanceId: session.ambulanceId,
      ambulanceNumber: session.ambulanceNumber,
      vehicleNumber: session.vehicleNumber,
      operatorName: session.operatorName,
      operatorId: session.operatorId
    }
    next()
  } catch (err) {
    next(err)
  }
}

export async function requireAdminAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || ''
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.slice(7).trim()
      : (req.headers['x-session-token'] || req.query.token || '')

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Admin authentication required. No session token provided.'
      })
    }

    const session = SessionService.getSession(token)
    if (!session) {
      return res.status(401).json({
        success: false,
        message: 'Admin session expired or invalid. Please authenticate.'
      })
    }

    if (session.role !== 'admin') {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized access. Central Administrator credentials required.'
      })
    }

    req.session = session
    req.admin = {
      adminId: session.adminId,
      username: session.username,
      name: session.name
    }
    next()
  } catch (err) {
    next(err)
  }
}

export async function requirePatientOrStaffAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || ''
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.slice(7).trim()
      : (req.headers['x-session-token'] || req.query.token || '')

    if (token) {
      const session = SessionService.getSession(token)
      if (session && ['doctor', 'admin', 'diagnostic', 'pharmacy'].includes(session.role)) {
        req.session = session
        return next()
      }
    }
    return requirePatientAuth(req, res, next)
  } catch (err) {
    next(err)
  }
}



