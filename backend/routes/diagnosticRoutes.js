import { Router } from 'express'
import { DiagnosticController } from '../controllers/diagnosticController.js'
import { requireDoctorAuth, requireDiagnosticAuth } from '../middleware/authMiddleware.js'

const router = Router()

// Process 6 Endpoints:
// 1. Doctor creates diagnostic / scan request (Protected by Doctor Auth)
router.post('/requests', requireDoctorAuth, DiagnosticController.createRequest)
router.post('/request', requireDoctorAuth, DiagnosticController.createRequest)

// 2. Diagnostic portal gets list of requests (filter by ?status=Pending)
router.get('/requests', requireDiagnosticAuth, DiagnosticController.getRequests)

// 3. Diagnostic portal gets single request details
router.get('/requests/:id', requireDiagnosticAuth, DiagnosticController.getRequestById)

// 4. Diagnostic portal updates request status (Pending -> In Progress -> Completed)
router.patch('/requests/:id/status', requireDiagnosticAuth, DiagnosticController.updateStatus)

// 5. Diagnostic portal uploads report linked to request
router.post('/requests/:id/report', requireDiagnosticAuth, DiagnosticController.uploadReport)

// Aliases for compatibility
router.post('/reports', requireDiagnosticAuth, DiagnosticController.uploadReport)
router.get('/reports/patient/:patientId', requireDiagnosticAuth, DiagnosticController.getPatientReports)

export default router
