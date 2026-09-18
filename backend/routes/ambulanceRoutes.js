import { Router } from 'express'
import { AmbulanceController } from '../controllers/ambulanceController.js'
import { requireAmbulanceAuth } from '../middleware/authMiddleware.js'

const router = Router()

// Ambulance Portal Authenticated API Endpoints
router.get('/requests', requireAmbulanceAuth, AmbulanceController.listRequests)
router.get('/requests/:id', requireAmbulanceAuth, AmbulanceController.getRequest)
router.get('/requests/:id/location', requireAmbulanceAuth, AmbulanceController.getPatientLocation)
router.post('/requests/:id/assign', requireAmbulanceAuth, AmbulanceController.assignRequest)
router.patch('/requests/:id/status', requireAmbulanceAuth, AmbulanceController.updateRequestStatus)
router.post('/requests/:id/assessment', requireAmbulanceAuth, AmbulanceController.saveSceneAssessment)
router.post('/requests/:id/prearrival-alert', requireAmbulanceAuth, AmbulanceController.sendPreArrivalAlert)
router.patch('/requests/:id/destination', requireAmbulanceAuth, AmbulanceController.assignDestination)
router.get('/requests/:id/destination', requireAmbulanceAuth, AmbulanceController.getDestination)
router.patch('/location', requireAmbulanceAuth, AmbulanceController.updateAmbulanceLocation)
router.patch('/requests/:id/ambulance-location', requireAmbulanceAuth, AmbulanceController.updateAmbulanceLocation)
// Legacy endpoints for backward compatibility
router.get('/unit', AmbulanceController.getUnit)
router.patch('/status', AmbulanceController.updateStatus)
router.post('/emergency-request', AmbulanceController.createRequest)
router.get('/emergency-request/latest', AmbulanceController.getLatestRequest)

export default router
