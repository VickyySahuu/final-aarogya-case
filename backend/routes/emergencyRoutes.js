import { Router } from 'express'
import { EmergencyController } from '../controllers/emergencyController.js'
import { requirePatientAuth } from '../middleware/authMiddleware.js'

const router = Router()

// All patient emergency endpoints require patient authentication
router.post('/requests', requirePatientAuth, EmergencyController.createRequest)
router.get('/requests/:id', requirePatientAuth, EmergencyController.getRequestById)
router.get('/requests/:id/destination', requirePatientAuth, EmergencyController.getDestination)

// Hospital receiving destination assignment (no dedicated hospital portal auth)
router.patch('/requests/:id/destination', EmergencyController.assignDestination)

export default router
