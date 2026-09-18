import { Router } from 'express'
import { HospitalController } from '../controllers/hospitalController.js'

const router = Router()

router.get('/', HospitalController.getAll)
router.get('/primary', HospitalController.getPrimary)

export default router
