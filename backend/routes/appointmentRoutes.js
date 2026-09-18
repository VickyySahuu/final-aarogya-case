import { Router } from 'express'
import { AppointmentController } from '../controllers/appointmentController.js'
import { requirePatientAuth } from '../middleware/authMiddleware.js'

const router = Router()

// Public or session-aware slot availability
router.get('/slots', AppointmentController.getSlots)

// Protected appointment actions for patient
router.post('/', requirePatientAuth, AppointmentController.book)
router.post('/book', requirePatientAuth, AppointmentController.book)
router.get('/', requirePatientAuth, AppointmentController.getAllForPatient)
router.get('/:id', requirePatientAuth, AppointmentController.getById)

export default router
