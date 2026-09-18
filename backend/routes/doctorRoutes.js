import { Router } from 'express'
import { DoctorController } from '../controllers/doctorController.js'
import { PatientController } from '../controllers/patientController.js'
import { requireDoctorAuth } from '../middleware/authMiddleware.js'

const router = Router()

// Public / General doctor listing & profile
router.get('/', DoctorController.getAll)
router.get('/profile', DoctorController.getProfile)

// Process 5: Doctor OPD Queue & Consultation endpoints (Protected by Doctor Auth)
router.get('/opd-queue', requireDoctorAuth, DoctorController.getOpdQueue)
router.get('/opd-queue/:id', requireDoctorAuth, DoctorController.getQueueItemById)
router.patch('/opd-queue/:id/status', requireDoctorAuth, DoctorController.updateQueueStatus)
router.post('/opd-queue/:id/complete', requireDoctorAuth, (req, res, next) => {
  req.body = { ...req.body, status: 'Completed' }
  return DoctorController.updateQueueStatus(req, res, next)
})
router.post('/final-approval', requireDoctorAuth, async (req, res, next) => {
  const appointmentId = req.body.appointmentId || req.body.id
  if (appointmentId) {
    req.params = { ...req.params, id: appointmentId }
    req.body = { ...req.body, status: 'Completed' }
    return DoctorController.updateQueueStatus(req, res, next)
  }
  return res.json({ success: true, message: 'Consultation signed off.' })
})
router.get('/patients/search', requireDoctorAuth, DoctorController.searchPatients)
router.get('/patient/:patientId/history', requireDoctorAuth, (req, res, next) => {
  return PatientController.getPatientHistory(req, res, next)
})
router.get('/patients/:patientId/history', requireDoctorAuth, (req, res, next) => {
  return PatientController.getPatientHistory(req, res, next)
})

// Legacy alias
router.get('/queue', requireDoctorAuth, DoctorController.getOpdQueue)

// Clinical actions
router.post('/notes', requireDoctorAuth, DoctorController.saveNotes)
router.post('/opd-queue/:id/notes', requireDoctorAuth, DoctorController.saveNotes)
router.post('/prescriptions', requireDoctorAuth, DoctorController.createPrescription)
router.post('/prescription', requireDoctorAuth, DoctorController.createPrescription)
router.get('/prescriptions', requireDoctorAuth, DoctorController.getPrescriptions)
router.get('/prescriptions/:id', requireDoctorAuth, DoctorController.getPrescriptionById)
router.get('/prescription/:id', requireDoctorAuth, DoctorController.getPrescriptionById)
router.get('/medicines', requireDoctorAuth, DoctorController.getMedicines)
router.get('/diagnostics', requireDoctorAuth, DoctorController.getDiagnostics)
router.post('/diagnostic-request', requireDoctorAuth, DoctorController.requestDiagnostic)
router.get('/diagnostic-reports/:patientId', requireDoctorAuth, DoctorController.getDiagnosticReports)

export default router

