import { PatientModel } from '../models/patientModel.js'
import { CaseModel } from '../models/caseModel.js'
import { AppointmentModel } from '../models/appointmentModel.js'
import { PrescriptionModel } from '../models/prescriptionModel.js'
import { DiagnosticModel } from '../models/diagnosticModel.js'
import { SessionService } from '../services/sessionService.js'
import { TimelineService } from '../services/timelineService.js'

export function formatPatient(p) {
  if (!p) return null
  return {
    ...p,
    id: p.id,
    userId: p.user_id || p.userId || null,
    patientId: p.patient_id || p.patientId,
    patientUniqueCode: p.patient_unique_code || p.patientUniqueCode,
    name: p.name,
    mobile: p.mobile,
    rawMobile: (p.mobile || '').replace(/\D/g, '').slice(-10),
    dob: p.dob,
    age: p.age,
    gender: p.gender,
    identityType: p.identity_type || p.identityType || 'Aadhaar',
    identityNumber: p.identity_number || p.identityNumber,
    bloodGroup: p.blood_group || p.bloodGroup || 'B+',
    address: p.address || '',
    createdAt: p.created_at || p.createdAt
  }
}

export const PatientController = {
  // GET /api/patients/:id
  async getById(req, res, next) {
    try {
      const { id } = req.params
      if (!id) {
        return res.status(400).json({ success: false, message: 'Identifier is required' })
      }

      // Check numeric ID
      if (/^\d+$/.test(id)) {
        const patient = await PatientModel.findById(id)
        if (patient) return res.json({ success: true, patient: formatPatient(patient) })
      }

      // Check Patient ID (e.g. AC-2025-884920)
      if (id.startsWith('AC-202')) {
        const patient = await PatientModel.findByPatientId(id)
        if (patient) return res.json({ success: true, patient: formatPatient(patient) })
      }

      // Check Patient Unique Code (e.g. AC-7F42K9)
      const patient = await PatientModel.findByUniqueCode(id)
      if (patient) {
        return res.json({ success: true, patient: formatPatient(patient) })
      }

      return res.status(404).json({ success: false, message: 'Patient record not found' })
    } catch (err) {
      next(err)
    }
  },

  // GET /api/patients/code/:code
  async getByUniqueCode(req, res, next) {
    try {
      const { code } = req.params
      const patient = await PatientModel.findByUniqueCode(code)
      if (!patient) {
        return res.status(404).json({ success: false, message: 'Patient with this unique code not found' })
      }
      return res.json({ success: true, patient: formatPatient(patient) })
    } catch (err) {
      next(err)
    }
  },

  // POST /api/patients/register
  async register(req, res, next) {
    try {
      const { name, mobile, dob, age, gender, identityType, identityNumber, bloodGroup, address } = req.body

      // 1. Validation
      if (!name || !name.trim()) {
        return res.status(400).json({ success: false, message: 'Patient Name is required' })
      }
      const rawMobile = (mobile || '').replace(/\D/g, '')
      if (!rawMobile || rawMobile.length < 10) {
        return res.status(400).json({ success: false, message: 'Valid 10-digit mobile number required' })
      }
      if (!identityNumber || !identityNumber.trim()) {
        return res.status(400).json({ success: false, message: 'Identity / Document number is required' })
      }

      // 2. Check for duplicate patient record (by mobile or identity number)
      const existing = await PatientModel.findByMobileOrIdentity(rawMobile, identityNumber)
      if (existing) {
        console.log(`[Registration] Existing patient found for mobile ${rawMobile}: ${existing.patient_unique_code}`)
        const session = SessionService.createPatientSession(existing)
        return res.status(200).json({
          success: true,
          isExisting: true,
          message: 'Existing patient record found. Retaining permanent patient identity.',
          token: session.token,
          session: {
            userId: session.userId,
            patientId: session.patientId,
            patientUniqueCode: session.patientUniqueCode,
            patientName: session.patientName,
            expiresAt: session.expiresAt
          },
          patient: formatPatient(existing)
        })
      }

      // 3. Generate permanent Patient Unique Code (ONCE, never regenerated)
      const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'
      let randomCode = ''
      for (let i = 0; i < 6; i++) {
        randomCode += chars.charAt(Math.floor(Math.random() * chars.length))
      }
      const patientUniqueCode = `AC-${randomCode}`

      // 4. Generate system Patient ID
      const patientId = `AC-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`

      // 5. Create in database
      const patient = await PatientModel.create({
        patientId,
        patientUniqueCode,
        name: name.trim(),
        mobile: `+91 ${rawMobile.slice(-10)}`,
        dob: dob || '14/05/1977',
        age: age || '48',
        gender: gender || 'Male',
        identityType: identityType || 'Aadhaar',
        identityNumber: identityNumber.trim(),
        bloodGroup: bloodGroup || 'B+',
        address: address || ''
      })

      console.log(`[Registration] New patient created: ID=${patient.patient_id}, UniqueCode=${patient.patient_unique_code}`)
      const session = SessionService.createPatientSession(patient)

      return res.status(201).json({
        success: true,
        isExisting: false,
        message: 'Patient registered successfully in central registry.',
        token: session.token,
        session: {
          userId: session.userId,
          patientId: session.patientId,
          patientUniqueCode: session.patientUniqueCode,
          patientName: session.patientName,
          expiresAt: session.expiresAt
        },
        patient: formatPatient(patient)
      })
    } catch (err) {
      next(err)
    }
  },

  // GET /api/patients/:patientId/history
  async getPatientHistory(req, res, next) {
    try {
      let targetId = req.params.patientId
      const authHeader = req.headers.authorization || ''
      const token = authHeader.startsWith('Bearer ')
        ? authHeader.slice(7).trim()
        : (req.headers['x-session-token'] || req.query.token || '')

      let callerPatient = req.patient || null
      let isDoctor = false

      if (token) {
        const session = SessionService.getSession(token)
        if (session) {
          if (session.role === 'doctor') {
            isDoctor = true
          } else {
            callerPatient = await PatientModel.findById(session.patientDatabaseId)
            if (!callerPatient) {
              callerPatient = await PatientModel.findByUniqueCode(session.patientUniqueCode)
            }
          }
        }
      }

      if (targetId === 'me' && callerPatient) {
        targetId = callerPatient.id
      } else if (callerPatient && !isDoctor && targetId) {
        const pIdStr = String(callerPatient.id)
        const pCodeStr = String(callerPatient.patient_id || '')
        const pUniqueStr = String(callerPatient.patient_unique_code || '').toUpperCase()
        if (targetId !== pIdStr && targetId !== pCodeStr && targetId.toUpperCase() !== pUniqueStr) {
          return res.status(403).json({
            success: false,
            message: 'Access denied: You are not authorized to view another citizen medical history.'
          })
        }
      }

      // Resolve numeric patient ID if string code passed
      let resolvedId = targetId
      let patientRecord = callerPatient
      if (typeof targetId === 'string' && (targetId.startsWith('AC-') || isNaN(targetId))) {
        const found = await PatientModel.findByUniqueCode(targetId) || await PatientModel.findByPatientId(targetId)
        if (found) {
          resolvedId = found.id
          patientRecord = found
        }
      } else if (targetId) {
        const found = await PatientModel.findById(targetId)
        if (found) {
          patientRecord = found
        }
      }

      const appointments = await AppointmentModel.getByPatientId(resolvedId)
      const prescriptions = await PrescriptionModel.getByPatientId(resolvedId)
      const cases = await CaseModel.getByPatientId(resolvedId)
      const reports = await DiagnosticModel.getReportsByPatientId(resolvedId)
      const timelineResult = await TimelineService.getPatientTimeline(resolvedId)

      return res.json({
        success: true,
        patient: patientRecord ? formatPatient(patientRecord) : null,
        appointments,
        prescriptions,
        cases,
        reports,
        timeline: timelineResult?.events || [],
        data: {
          appointments,
          prescriptions,
          cases,
          reports,
          timeline: timelineResult?.events || []
        }
      })
    } catch (err) {
      next(err)
    }
  },

  // GET /api/patients/:patientId/timeline or /api/patients/me/timeline
  async getPatientTimeline(req, res, next) {
    try {
      let targetId = req.params.patientId
      const authHeader = req.headers.authorization || ''
      const token = authHeader.startsWith('Bearer ')
        ? authHeader.slice(7).trim()
        : (req.headers['x-session-token'] || req.query.token || '')

      let callerPatient = req.patient || null
      let isDoctorOrStaff = false

      if (token) {
        const session = SessionService.getSession(token)
        if (session) {
          if (session.role === 'doctor' || session.role === 'admin' || session.role === 'staff' || session.role === 'diagnostic' || session.role === 'pharmacy') {
            isDoctorOrStaff = true
          } else {
            callerPatient = await PatientModel.findById(session.patientDatabaseId)
            if (!callerPatient && session.patientUniqueCode) {
              callerPatient = await PatientModel.findByUniqueCode(session.patientUniqueCode)
            }
          }
        }
      }

      if (!callerPatient && !isDoctorOrStaff) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required: Valid patient or doctor session required to access timeline.'
        })
      }

      if (targetId === 'me') {
        if (!callerPatient) {
          return res.status(401).json({
            success: false,
            message: 'Patient session required for /timeline/me'
          })
        }
        targetId = callerPatient.id
      } else if (!isDoctorOrStaff && callerPatient) {
        const pIdStr = String(callerPatient.id)
        const pCodeStr = String(callerPatient.patient_id || '')
        const pUniqueStr = String(callerPatient.patient_unique_code || '').toUpperCase()
        if (targetId !== pIdStr && targetId !== pCodeStr && targetId.toUpperCase() !== pUniqueStr) {
          return res.status(403).json({
            success: false,
            message: 'Access denied: You are not authorized to view another citizen medical timeline.'
          })
        }
      }

      // Resolve numeric patient ID if string code passed
      let resolvedId = targetId
      if (typeof targetId === 'string' && (targetId.startsWith('AC-') || isNaN(targetId))) {
        const found = await PatientModel.findByUniqueCode(targetId) || await PatientModel.findByPatientId(targetId)
        if (found) {
          resolvedId = found.id
        }
      }

      const timelineResult = await TimelineService.getPatientTimeline(resolvedId)
      return res.json({
        success: true,
        patient: timelineResult.patient,
        events: timelineResult.events,
        totalEvents: timelineResult.totalEvents
      })
    } catch (err) {
      next(err)
    }
  },

  // GET /api/patient/prescriptions
  async getPrescriptions(req, res, next) {
    try {
      const patientId = req.patient?.id || req.params.patientId
      if (!patientId) {
        return res.status(401).json({
          success: false,
          message: 'Patient authentication required.'
        })
      }

      const prescriptions = await PrescriptionModel.getByPatientId(patientId)
      return res.json({
        success: true,
        prescriptions,
        count: prescriptions.length
      })
    } catch (err) {
      next(err)
    }
  },

  // GET /api/patient/prescriptions/:id
  async getPrescriptionById(req, res, next) {
    try {
      const { id } = req.params
      const prescription = await PrescriptionModel.findByIdOrRx(id)

      if (!prescription) {
        return res.status(404).json({
          success: false,
          message: 'Prescription record not found.'
        })
      }

      // Prevent access to another patient's prescription
      const rxPatientId = prescription.patient_id || prescription.patientId
      if (req.patient && rxPatientId !== req.patient.id) {
        return res.status(403).json({
          success: false,
          message: 'Unauthorized. You cannot access another patient\'s prescription.'
        })
      }

      return res.json({
        success: true,
        prescription
      })
    } catch (err) {
      next(err)
    }
  }
}
