import { Router } from 'express'
import multer from 'multer'
import { CaseController } from '../controllers/caseController.js'
import { requirePatientAuth, requirePatientOrStaffAuth } from '../middleware/authMiddleware.js'

const router = Router()

// Configure memory storage for multipart uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }
})

// Clinical intake interview endpoints
router.post('/interview/init', requirePatientAuth, CaseController.initOrResumeInterview)
router.post('/interview/reset', requirePatientAuth, CaseController.resetInterview)
router.post('/:id/interview', requirePatientAuth, CaseController.processInterviewTurn)
router.post('/:id/interview/reset', requirePatientAuth, CaseController.resetInterview)
router.post('/:id/confirm', requirePatientAuth, CaseController.confirmCase)

// Multimodal document upload & management endpoints
router.post('/:id/documents', requirePatientAuth, upload.single('file'), CaseController.uploadAndAnalyzeDocument)
router.delete('/:id/documents/:docId', requirePatientAuth, CaseController.deleteDocument)
router.get('/:id/documents/:docId/file', requirePatientOrStaffAuth, CaseController.getDocumentFile)

// Physician AI Clinical Summary endpoint (SIH26047)
router.get('/:id/summary', requirePatientOrStaffAuth, CaseController.getAiSummary)

router.post('/', requirePatientAuth, CaseController.create)
router.get('/', requirePatientAuth, CaseController.getAll)
router.get('/:id', requirePatientAuth, CaseController.getById)
router.patch('/:id', requirePatientAuth, CaseController.update)

export default router

