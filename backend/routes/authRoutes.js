import { Router } from 'express'
import { AuthController } from '../controllers/authController.js'

const router = Router()

// Patient-specific login & session verification
router.post('/patient/login', AuthController.patientLogin)

// Doctor-specific login & session creation
router.post('/doctor/login', AuthController.doctorLogin)

// Pharmacy-specific login & session creation
router.post('/pharmacy/login', AuthController.pharmacyLogin)

// Ambulance-specific login & session creation
router.post('/ambulance/login', AuthController.ambulanceLogin)

// Admin-specific login & session creation
router.post('/admin/login', AuthController.adminLogin)

// Session user / patient profile lookup
router.get('/me', AuthController.me)

// Session invalidation
router.post('/logout', AuthController.logout)

// General / legacy role login
router.post('/login', AuthController.login)

export default router
