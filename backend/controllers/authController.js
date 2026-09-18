import { UserModel } from '../models/userModel.js'
import { PatientModel } from '../models/patientModel.js'
import { DoctorModel } from '../models/doctorModel.js'
import { AmbulanceModel } from '../models/ambulanceModel.js'
import { SessionService } from '../services/sessionService.js'
import { formatPatient } from './patientController.js'


export const AuthController = {
  // POST /api/auth/patient/login
  async patientLogin(req, res, next) {
    try {
      const { mobile, identityNumber, id, identifier, otp } = req.body || {}

      const rawMobile = mobile || ''
      const rawIdentity = identityNumber || id || ''
      const rawIdentifier = identifier || ''

      // 1. Validation: Missing credentials
      if (!rawMobile && !rawIdentity && !rawIdentifier) {
        return res.status(400).json({
          success: false,
          message: 'Mobile number or ABHA/Aadhaar identity number is required for login.'
        })
      }

      const cleanMobile = rawMobile.replace(/\D/g, '')
      const cleanIdentity = rawIdentity.replace(/\s+/g, '')

      // 2. Format validation
      if (rawMobile && cleanMobile.length !== 10) {
        return res.status(400).json({
          success: false,
          message: 'Please enter a valid 10-digit Indian mobile number.'
        })
      }

      if (rawIdentity && cleanIdentity.length < 12) {
        return res.status(400).json({
          success: false,
          message: 'Please enter a valid 14-digit ABHA or 12-digit Aadhaar ID.'
        })
      }

      // 3. Look up patient in PostgreSQL / PatientModel
      let patient = null

      if (cleanMobile === '9546011026' || rawIdentifier.includes('9546011026') || rawIdentifier.toUpperCase() === 'AC-VK2604') {
        const { DemoSeedService } = await import('../services/demoSeedService.js')
        await DemoSeedService.ensureDemoPatient()
      }

      if (cleanMobile || cleanIdentity) {
        patient = await PatientModel.findByMobileOrIdentity(cleanMobile, cleanIdentity)
      }

      if (!patient && rawIdentifier) {
        const cleanIdentMobile = rawIdentifier.replace(/\D/g, '')
        if (cleanIdentMobile.length === 10) {
          patient = await PatientModel.findByMobileOrIdentity(cleanIdentMobile, '')
        }
        if (!patient && rawIdentifier.toUpperCase().startsWith('AC-')) {
          patient = await PatientModel.findByUniqueCode(rawIdentifier)
          if (!patient) {
            patient = await PatientModel.findByPatientId(rawIdentifier)
          }
        }
      }

      // 4. Patient not found
      if (!patient) {
        return res.status(404).json({
          success: false,
          message: 'Patient record not found. No registered citizen matches the provided credentials. Please register first.'
        })
      }

      // 5. Create secure session
      const session = SessionService.createPatientSession(patient)
      const formatted = formatPatient(patient)

      console.log(`[Auth] Patient login successful: ${formatted.name} (Code: ${formatted.patientUniqueCode}, Token: ${session.token.slice(0, 14)}...)`)

      return res.status(200).json({
        success: true,
        message: 'Patient authentication successful.',
        token: session.token,
        session: {
          userId: session.userId,
          patientId: session.patientId,
          patientUniqueCode: session.patientUniqueCode,
          patientName: session.patientName,
          expiresAt: session.expiresAt
        },
        patient: formatted
      })
    } catch (err) {
      next(err)
    }
  },

  // GET /api/auth/me
  async me(req, res, next) {
    try {
      const authHeader = req.headers.authorization || ''
      const token = authHeader.startsWith('Bearer ')
        ? authHeader.slice(7).trim()
        : (req.headers['x-session-token'] || req.query.token || '')

      if (!token) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required. No session token provided.'
        })
      }

      const session = SessionService.getSession(token)
      if (!session) {
        return res.status(401).json({
          success: false,
          message: 'Session expired or invalid. Please log in again.'
        })
      }

      // Load patient record from database
      let patient = await PatientModel.findById(session.patientDatabaseId)
      if (!patient) {
        patient = await PatientModel.findByUniqueCode(session.patientUniqueCode)
      }

      if (!patient) {
        return res.status(404).json({
          success: false,
          message: 'Associated patient record not found in central registry.'
        })
      }

      const formatted = formatPatient(patient)

      return res.status(200).json({
        success: true,
        session: {
          userId: session.userId,
          patientId: session.patientId,
          patientUniqueCode: session.patientUniqueCode,
          patientName: session.patientName,
          expiresAt: session.expiresAt
        },
        user: {
          id: session.userId,
          role: session.role || 'patient',
          name: formatted.name,
          patient_unique_code: formatted.patientUniqueCode
        },
        patient: formatted
      })
    } catch (err) {
      next(err)
    }
  },

  // POST /api/auth/logout
  async logout(req, res, next) {
    try {
      const authHeader = req.headers.authorization || ''
      const token = authHeader.startsWith('Bearer ')
        ? authHeader.slice(7).trim()
        : (req.headers['x-session-token'] || req.body?.token || '')

      if (token) {
        SessionService.deleteSession(token)
      }

      return res.status(200).json({
        success: true,
        message: 'Logged out successfully. Session invalidated.'
      })
    } catch (err) {
      next(err)
    }
  },

  // POST /api/auth/doctor/login
  async doctorLogin(req, res, next) {
    try {
      const { doctorId, username, password } = req.body || {}

      let doctor = null
      if (doctorId) {
        doctor = await DoctorModel.findByDoctorId(doctorId)
        if (!doctor && !isNaN(doctorId)) {
          doctor = await DoctorModel.findById(doctorId)
        }
      } else if (username) {
        doctor = await DoctorModel.findByDoctorId(username)
      }

      // If no identifier is passed or not found, fall back to prototype doctor
      if (!doctor) {
        doctor = await DoctorModel.getSingleDoctor()
      }

      if (!doctor) {
        return res.status(404).json({
          success: false,
          message: 'Doctor record not found.'
        })
      }

      const session = SessionService.createDoctorSession(doctor, doctor.user_id || 2)

      return res.status(200).json({
        success: true,
        message: 'Doctor authenticated successfully.',
        token: session.token,
        session: {
          doctorId: session.doctorId,
          doctorCodeId: session.doctorCodeId,
          doctorName: session.doctorName,
          role: session.role,
          expiresAt: session.expiresAt
        },
        doctor
      })
    } catch (err) {
      next(err)
    }
  },

  // POST /api/auth/pharmacy/login
  async pharmacyLogin(req, res, next) {
    try {
      const { pharmacyId, username } = req.body || {}
      const staffId = pharmacyId || username || 'PHARM-01'

      const session = SessionService.createPharmacySession({
        pharmacyId: staffId,
        pharmacyName: 'District Civil Hospital Dispensary',
        dispenserName: 'Pharmacist Lead',
        user_id: 4
      }, 4)

      return res.status(200).json({
        success: true,
        message: 'Pharmacy counter authenticated successfully.',
        token: session.token,
        session: {
          pharmacyId: session.pharmacyId,
          pharmacyName: session.pharmacyName,
          dispenserName: session.dispenserName,
          role: session.role,
          expiresAt: session.expiresAt
        }
      })
    } catch (err) {
      next(err)
    }
  },

  // POST /api/auth/ambulance/login
  async ambulanceLogin(req, res, next) {
    try {
      const { ambulanceId, username, password } = req.body || {}
      const unitIdentifier = ambulanceId || username || 'AMB-DL-01-4402'

      let ambulance = null
      if (unitIdentifier) {
        ambulance = await AmbulanceModel.findByUnitOrVehicle(unitIdentifier)
      }
      if (!ambulance) {
        ambulance = await AmbulanceModel.getPrimaryAmbulance()
      }

      const session = SessionService.createAmbulanceSession({
        ambulanceId: ambulance?.id || 1,
        ambulanceNumber: ambulance?.ambulance_number || ambulance?.ambulanceNumber || 'Ambulance Unit #08',
        vehicleNumber: ambulance?.vehicle_number || ambulance?.vehicleNumber || 'DL-01-EQ-9041',
        operatorName: ambulance?.operator_name || ambulance?.operatorName || 'Paramedic Lead Paramveer / Ravi',
        operatorId: ambulance?.operator_id || ambulance?.operatorId || 'AMB-OP-104',
        user_id: 5
      }, 5)

      return res.status(200).json({
        success: true,
        message: 'Ambulance unit authenticated successfully.',
        token: session.token,
        session: {
          ambulanceId: session.ambulanceId,
          ambulanceNumber: session.ambulanceNumber,
          vehicleNumber: session.vehicleNumber,
          operatorName: session.operatorName,
          role: session.role,
          expiresAt: session.expiresAt
        },
        ambulance
      })
    } catch (err) {
      next(err)
    }
  },

  // POST /api/auth/admin/login
  async adminLogin(req, res, next) {
    try {
      const { username, adminId, passcode, password } = req.body || {}
      const identifier = username || adminId || 'admin'
      const key = passcode || password || ''

      // Validate prototype admin passcode
      if (key && key !== 'admin123' && key !== 'admin') {
        return res.status(401).json({
          success: false,
          message: 'Invalid administrative credentials or passcode.'
        })
      }

      const session = SessionService.createAdminSession({
        adminId: identifier,
        username: identifier,
        name: 'Central Ministry Administrator',
        role: 'admin',
        user_id: 6
      }, 6)

      return res.status(200).json({
        success: true,
        message: 'Admin authenticated successfully.',
        token: session.token,
        role: 'admin',
        session: {
          adminId: session.adminId,
          username: session.username,
          name: session.name,
          role: session.role,
          expiresAt: session.expiresAt
        }
      })
    } catch (err) {
      next(err)
    }
  },

  // Legacy prototype general login for other roles
  async login(req, res, next) {
    try {
      const { username, password, role } = req.body
      if (!username) {
        return res.status(400).json({ success: false, message: 'Username/ID is required' })
      }

      const user = await UserModel.findByUsername(username)
      if (user) {
        return res.json({
          success: true,
          user: { id: user.id, username: user.username, role: user.role }
        })
      }

      return res.json({
        success: true,
        user: { id: 1, username, role: role || 'patient' }
      })
    } catch (err) {
      next(err)
    }
  }
}
