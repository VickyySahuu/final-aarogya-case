import { DoctorModel } from '../models/doctorModel.js'
import { AppointmentModel } from '../models/appointmentModel.js'
import { PrescriptionModel } from '../models/prescriptionModel.js'
import { DiagnosticModel } from '../models/diagnosticModel.js'
import { PatientModel } from '../models/patientModel.js'
import { CaseModel } from '../models/caseModel.js'
import { MedicineModel } from '../models/medicineModel.js'
import { DiagnosticController } from './diagnosticController.js'

export const DoctorController = {
  // Returns all active doctors (for prototype, exactly one doctor)
  async getAll(req, res, next) {
    try {
      const doctors = await DoctorModel.getAll()
      return res.json({ success: true, doctors })
    } catch (err) {
      next(err)
    }
  },

  // Returns the single doctor record
  async getProfile(req, res, next) {
    try {
      const doctor = await DoctorModel.getSingleDoctor()
      return res.json({ success: true, doctor })
    } catch (err) {
      next(err)
    }
  },

  // Returns appointments queued for OPD
  async getOpdQueue(req, res, next) {
    try {
      const doctor = req.doctor || (await DoctorModel.getSingleDoctor())
      if (!doctor) return res.json({ success: true, queue: [], count: 0 })

      const filter = req.query.filter || 'ALL'
      const queue = await AppointmentModel.getOpdQueueForDoctor(doctor.id, filter)
      return res.json({ success: true, queue, count: queue.length, filter })
    } catch (err) {
      next(err)
    }
  },

  // Returns single appointment + patient + case record for doctor consultation
  async getQueueItemById(req, res, next) {
    try {
      const { id } = req.params
      const item = await AppointmentModel.getQueueItemById(id)
      if (!item) {
        return res.status(404).json({
          success: false,
          message: 'Appointment record not found in OPD queue.'
        })
      }
      return res.json({
        success: true,
        ...item,
        queueItem: item,
        patient: {
          id: item.patientId,
          patientDbId: item.patientDbId,
          name: item.name,
          uniqueCode: item.uniqueCode,
          age: item.age,
          patientAge: item.patientAge,
          patientGender: item.patientGender,
          mobile: item.patientMobile,
          bloodGroup: item.patientBloodGroup,
          address: item.patientAddress,
          token: item.tokenNumber,
          chiefComplaint: item.chiefComplaint
        },
        appointment: {
          id: item.id,
          appointmentNumber: item.appointmentNumber,
          tokenNumber: item.tokenNumber,
          appointmentDate: item.date,
          timeSlot: item.time,
          opdRoom: item.room,
          status: item.status,
          problem: item.problem,
          severity: item.severity,
          category: item.category
        },
        case: item.caseDetails
      })
    } catch (err) {
      next(err)
    }
  },

  // Updates appointment queue status (Waiting -> Current -> Completed / Skipped)
  async updateQueueStatus(req, res, next) {
    try {
      const { id } = req.params
      const { status } = req.body || {}

      if (!status) {
        return res.status(400).json({
          success: false,
          message: 'Target queue status is required.'
        })
      }

      const validStatuses = ['Waiting', 'Current', 'Completed', 'Skipped', 'Waiting for Doctor', 'In Consultation']
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: `Invalid queue status: "${status}". Must be Waiting, Current, Completed, or Skipped.`
        })
      }

      const updated = await AppointmentModel.updateQueueStatus(id, status)
      if (!updated) {
        return res.status(404).json({
          success: false,
          message: 'Appointment record not found to update status.'
        })
      }

      return res.json({
        success: true,
        message: `Appointment queue status updated to "${status}".`,
        queueItem: updated
      })
    } catch (err) {
      next(err)
    }
  },

  // Search patients by Name, ID, Token, or Unique Code
  async searchPatients(req, res, next) {
    try {
      const doctor = req.doctor || (await DoctorModel.getSingleDoctor())
      const queryTerm = req.query.q || req.query.query || req.query.searchTerm || ''
      const results = await AppointmentModel.searchDoctorPatients(queryTerm, doctor?.id || 1)

      return res.json({
        success: true,
        patients: results,
        count: results.length,
        message: results.length === 0 ? 'No patients found' : `Found ${results.length} patient record(s).`
      })
    } catch (err) {
      next(err)
    }
  },

  // Save clinical consultation notes
  async saveNotes(req, res, next) {
    try {
      const {
        appointmentId,
        caseId,
        patientId,
        complaint,
        examination,
        diagnosis,
        plan
      } = req.body || {}

      if (!complaint && !diagnosis && !plan && !examination) {
        return res.status(400).json({
          success: false,
          message: 'At least one clinical note field is required.'
        })
      }

      const notesRecord = {
        complaint: complaint || '',
        examination: examination || '',
        diagnosis: diagnosis || '',
        plan: plan || '',
        updatedAt: new Date().toISOString()
      }

      const targetId = req.params?.id || appointmentId
      if (targetId) {
        let appointment = null
        if (/^\d+$/.test(String(targetId))) {
          appointment = await AppointmentModel.findById(targetId)
        }
        if (!appointment) {
          appointment = await AppointmentModel.findByAppointmentNumber(targetId)
        }
        if (appointment) {
          appointment.doctor_notes = notesRecord
        }
      }

      if (caseId) {
        const caseItem = await CaseModel.findById(caseId) || await CaseModel.findByCaseNumber(caseId)
        if (caseItem) {
          caseItem.doctor_notes = notesRecord
        }
      }

      return res.json({
        success: true,
        message: 'Doctor consultation notes saved successfully.',
        notes: notesRecord
      })
    } catch (err) {
      next(err)
    }
  },

  // Doctor creates prescription
  async createPrescription(req, res, next) {
    try {
      const doctor = req.doctor || (await DoctorModel.getSingleDoctor())
      if (!doctor) {
        return res.status(401).json({
          success: false,
          message: 'Doctor authentication required.'
        })
      }

      const {
        patientId,
        patientUniqueCode,
        appointmentId,
        caseId,
        medicines,
        diagnosis,
        icdCode,
        vitals
      } = req.body || {}

      // 1. Validate patient existence
      if (!patientId && !patientUniqueCode) {
        return res.status(400).json({
          success: false,
          message: 'Patient reference is required to issue a prescription.'
        })
      }

      let patient = null
      if (patientId) {
        patient = await PatientModel.findById(patientId)
      }
      if (!patient && patientUniqueCode) {
        patient = await PatientModel.findByUniqueCode(patientUniqueCode)
      }
      if (!patient && patientId) {
        patient = await PatientModel.findByPatientId(patientId)
      }

      if (!patient) {
        return res.status(404).json({
          success: false,
          message: 'Patient record not found in hospital registry.'
        })
      }

      // 2. Validate appointment existence and link to patient & doctor
      if (!appointmentId) {
        return res.status(400).json({
          success: false,
          message: 'Appointment reference is required to issue a prescription.'
        })
      }

      let appointment = null
      if (/^\d+$/.test(String(appointmentId))) {
        appointment = await AppointmentModel.findById(appointmentId)
      }
      if (!appointment) {
        appointment = await AppointmentModel.findByAppointmentNumber(appointmentId)
      }

      if (!appointment) {
        return res.status(404).json({
          success: false,
          message: 'Appointment record not found.'
        })
      }

      // Verify appointment belongs to patient
      const appPatientId = appointment.patient_id || appointment.patientId
      if (String(appPatientId) !== String(patient.id)) {
        return res.status(400).json({
          success: false,
          message: 'Appointment does not belong to the selected patient.'
        })
      }

      // Verify appointment belongs to doctor
      const appDoctorId = appointment.doctor_id || appointment.doctorId
      if (String(appDoctorId) !== String(doctor.id)) {
        return res.status(403).json({
          success: false,
          message: 'Doctor is not authorized for this appointment.'
        })
      }

      // 3. Validate case existence and link to patient
      if (!caseId) {
        return res.status(400).json({
          success: false,
          message: 'Patient case reference is required to issue a prescription.'
        })
      }

      let caseItem = null
      if (/^\d+$/.test(String(caseId))) {
        caseItem = await CaseModel.findById(caseId)
      }
      if (!caseItem) {
        caseItem = await CaseModel.findByCaseNumber(caseId)
      }

      if (!caseItem) {
        return res.status(404).json({
          success: false,
          message: 'Patient case record not found.'
        })
      }

      // Verify case belongs to patient
      const casePatientId = caseItem.patient_id || caseItem.patientId
      if (String(casePatientId) !== String(patient.id)) {
        return res.status(400).json({
          success: false,
          message: 'Patient case does not belong to the selected patient.'
        })
      }

      // 4. Validate medicines
      if (!Array.isArray(medicines) || medicines.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Prescription must contain at least one medicine item.'
        })
      }

      for (let i = 0; i < medicines.length; i++) {
        const m = medicines[i]
        const name = m.medicine_name || m.medicineName || m.name || m.medicine
        if (!name || !String(name).trim()) {
          return res.status(400).json({
            success: false,
            message: `Medicine item #${i + 1} requires a valid medicine name.`
          })
        }
        if (!m.dosage || !String(m.dosage).trim()) {
          return res.status(400).json({
            success: false,
            message: `Medicine "${name}" requires a dosage specification.`
          })
        }
        if (!m.frequency || !String(m.frequency).trim()) {
          return res.status(400).json({
            success: false,
            message: `Medicine "${name}" requires a frequency specification.`
          })
        }
        if (!m.duration || !String(m.duration).trim()) {
          return res.status(400).json({
            success: false,
            message: `Medicine "${name}" requires a duration specification.`
          })
        }
      }

      // 5. Duplicate submission check
      const existing = await PrescriptionModel.findByAppointmentId(appointment.id)
      if (existing) {
        return res.status(200).json({
          success: true,
          isDuplicate: true,
          message: 'Prescription already issued for this appointment.',
          prescription: existing
        })
      }

      // 6. Generate prescription number
      const rxNumber = PrescriptionModel.generateRxNumber()

      // 7. Create prescription
      const prescription = await PrescriptionModel.create({
        rxNumber,
        appointmentId: appointment.id,
        caseId: caseItem.id,
        patientId: patient.id,
        patientUniqueCode: patient.patient_unique_code || patient.patientUniqueCode,
        doctorId: doctor.id,
        hospitalName: doctor.hospital_name || 'District Civil Hospital',
        roomNumber: doctor.room || 'Room 104',
        token: appointment.token_number || '#14',
        diagnosis: diagnosis || caseItem.problem || 'Outpatient Consultation',
        icdCode: icdCode || null,
        vitals: vitals || null,
        medicines,
        status: 'Issued',
        pharmacyStatus: 'Sent'
      })

      return res.status(201).json({
        success: true,
        message: 'e-Prescription issued successfully.',
        prescription
      })
    } catch (err) {
      next(err)
    }
  },

  // GET /api/doctor/prescriptions
  async getPrescriptions(req, res, next) {
    try {
      const doctor = req.doctor || (await DoctorModel.getSingleDoctor())
      const prescriptions = await PrescriptionModel.getByDoctorId(doctor?.id || 1)
      return res.json({
        success: true,
        prescriptions,
        count: prescriptions.length
      })
    } catch (err) {
      next(err)
    }
  },

  // GET /api/doctor/prescriptions/:id
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
      return res.json({
        success: true,
        prescription
      })
    } catch (err) {
      next(err)
    }
  },

  // GET /api/doctor/medicines
  async getMedicines(req, res, next) {
    try {
      const medicines = await MedicineModel.getAll()
      return res.json({
        success: true,
        medicines,
        count: medicines.length
      })
    } catch (err) {
      next(err)
    }
  },

  // GET /api/doctor/diagnostics
  async getDiagnostics(req, res, next) {
    try {
      const { DiagnosticTestModel } = await import('../models/diagnosticTestModel.js')
      const diagnostics = await DiagnosticTestModel.getAll()
      return res.json({
        success: true,
        diagnostics,
        count: diagnostics.length
      })
    } catch (err) {
      next(err)
    }
  },

  // Doctor orders a test/scan
  async requestDiagnostic(req, res, next) {
    return DiagnosticController.createRequest(req, res, next)
  },

  // Doctor queries patient diagnostic reports
  async getDiagnosticReports(req, res, next) {
    return DiagnosticController.getPatientReports(req, res, next)
  }
}
