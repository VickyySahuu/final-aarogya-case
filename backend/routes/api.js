import { Router } from 'express'
import authRoutes from './authRoutes.js'
import patientRoutes from './patientRoutes.js'
import doctorRoutes from './doctorRoutes.js'
import hospitalRoutes from './hospitalRoutes.js'
import appointmentRoutes from './appointmentRoutes.js'
import pharmacyRoutes from './pharmacyRoutes.js'
import diagnosticRoutes from './diagnosticRoutes.js'
import ambulanceRoutes from './ambulanceRoutes.js'
import emergencyRoutes from './emergencyRoutes.js'
import adminRoutes from './adminRoutes.js'
import caseRoutes from './caseRoutes.js'
import { isConnected } from '../db/index.js'

const router = Router()

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    status: 'online',
    service: 'AAROGYA CASE Unified Backend API',
    timestamp: new Date().toISOString(),
    database: {
      connected: isConnected(),
      type: 'PostgreSQL'
    }
  })
})

// Feature endpoints
router.use('/auth', authRoutes)
router.use('/patient', patientRoutes)
router.use('/patients', patientRoutes)
router.use('/patient-cases', caseRoutes)
router.use('/cases', caseRoutes)
router.use('/doctor', doctorRoutes)
router.use('/doctors', doctorRoutes)
router.use('/hospital', hospitalRoutes)
router.use('/hospitals', hospitalRoutes)
router.use('/appointment', appointmentRoutes)
router.use('/appointments', appointmentRoutes)
router.use('/pharmacy', pharmacyRoutes)
router.use('/diagnostic', diagnosticRoutes)
router.use('/diagnostics', diagnosticRoutes)
router.use('/ambulance', ambulanceRoutes)
router.use('/emergency', emergencyRoutes)
router.use('/admin', adminRoutes)

export default router
