import { Router } from 'express'
import { PharmacyController } from '../controllers/pharmacyController.js'
import { requirePharmacyAuth, optionalPharmacyAuth } from '../middleware/authMiddleware.js'

const router = Router()

// Stock formulary endpoints
router.get('/stock', PharmacyController.getStock)
router.post('/stock', PharmacyController.addMedicine)

// Prescriptions queue & details
router.get('/prescriptions', optionalPharmacyAuth, PharmacyController.getPrescriptionQueue)
router.get('/prescriptions/:id', optionalPharmacyAuth, PharmacyController.getPrescriptionById)

// Core Process 8 Dispensing & Delivery Verification
router.post('/dispensings', requirePharmacyAuth, PharmacyController.dispense)
router.post('/dispensings/:id/verify-delivery', requirePharmacyAuth, PharmacyController.verifyDelivery)
router.get('/history', requirePharmacyAuth, PharmacyController.getHistory)

// Backwards-compatible aliases
router.post('/prescriptions/:id/dispense', requirePharmacyAuth, PharmacyController.dispense)
router.post('/prescriptions/:id/deliver', requirePharmacyAuth, PharmacyController.verifyDelivery)

export default router
