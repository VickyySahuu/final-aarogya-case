import { Router } from 'express'
import { PatientController } from '../controllers/patientController.js'
import { requirePatientAuth } from '../middleware/authMiddleware.js'

const router = Router()

// Register a new patient or return existing matching record
router.post('/register', PatientController.register)

// Patient Prescriptions (Process 7)
router.get('/prescriptions', requirePatientAuth, PatientController.getPrescriptions)
router.get('/prescriptions/:id', requirePatientAuth, PatientController.getPrescriptionById)

// Lookup by permanent Patient Unique Code (e.g. AC-7F42K9)
router.get('/code/:code', PatientController.getByUniqueCode)

// Lookup patient history
router.get('/:patientId/history', PatientController.getPatientHistory)

// Unified Medical Timeline (Process 16 - Chronological Clinical Timeline)
router.get('/timeline/me', requirePatientAuth, (req, res, next) => {
  req.params.patientId = 'me'
  return PatientController.getPatientTimeline(req, res, next)
})
router.get('/:patientId/timeline', PatientController.getPatientTimeline)

// Lookup by ID or Unique Code
router.get('/:id', PatientController.getById)

export default router
