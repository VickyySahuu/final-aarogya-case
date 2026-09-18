import { Router } from 'express'
import { AdminController } from '../controllers/adminController.js'
import { requireAdminAuth } from '../middleware/authMiddleware.js'

const router = Router()

// Dashboard stats
router.get('/dashboard', requireAdminAuth, AdminController.getDashboard)

// Doctor management
router.get('/doctors', requireAdminAuth, AdminController.listDoctors)
router.get('/doctors/:id', requireAdminAuth, AdminController.getDoctor)
router.patch('/doctors/:id', requireAdminAuth, AdminController.updateDoctor)
router.put('/doctors/:id', requireAdminAuth, AdminController.updateDoctor)

// Hospital management
router.get('/hospitals', requireAdminAuth, AdminController.listHospitals)
router.get('/hospitals/:id', requireAdminAuth, AdminController.getHospital)
router.patch('/hospitals/:id', requireAdminAuth, AdminController.updateHospital)
router.put('/hospitals/:id', requireAdminAuth, AdminController.updateHospital)

// Medicine management
router.get('/medicines', requireAdminAuth, AdminController.listMedicines)
router.post('/medicines', requireAdminAuth, AdminController.createMedicine)
router.patch('/medicines/:id', requireAdminAuth, AdminController.updateMedicine)
router.put('/medicines/:id', requireAdminAuth, AdminController.updateMedicine)

// Diagnostic management
router.get('/diagnostics', requireAdminAuth, AdminController.listDiagnostics)
router.post('/diagnostics', requireAdminAuth, AdminController.createDiagnostic)
router.patch('/diagnostics/:id', requireAdminAuth, AdminController.updateDiagnostic)

// Ambulance management
router.get('/ambulances', requireAdminAuth, AdminController.listAmbulances)
router.get('/ambulances/:id', requireAdminAuth, AdminController.getAmbulance)
router.post('/ambulances', requireAdminAuth, AdminController.createAmbulance)
router.patch('/ambulances/:id', requireAdminAuth, AdminController.updateAmbulance)

// Legacy endpoints for backwards compatibility
router.get('/overview', AdminController.getOverview)
router.put('/doctor', AdminController.updateDoctor)
router.put('/hospital', AdminController.updateHospital)
router.put('/medicine/:id', AdminController.updateMedicine)
router.put('/ambulance', AdminController.updateAmbulance)

export default router
