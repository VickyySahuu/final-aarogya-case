import { MedicineModel } from '../models/medicineModel.js'
import { PrescriptionModel } from '../models/prescriptionModel.js'
import { DispensingModel } from '../models/dispensingModel.js'

export const PharmacyController = {
  async getStock(req, res, next) {
    try {
      const medicines = await MedicineModel.getAll()
      return res.json({ success: true, medicines })
    } catch (err) {
      next(err)
    }
  },

  async addMedicine(req, res, next) {
    try {
      const { name, medicineId, category, availableQty, unit, rack, status } = req.body
      const med = await MedicineModel.create({
        medicineId: medicineId || `MED-${Date.now().toString().slice(-4)}`,
        name,
        category,
        availableQty: parseInt(availableQty, 10) || 100,
        unit,
        rack,
        status: status || 'Available'
      })
      return res.status(201).json({ success: true, medicine: med })
    } catch (err) {
      next(err)
    }
  },

  // GET /api/pharmacy/prescriptions (Queue of active issued prescriptions awaiting dispensing)
  async getPrescriptionQueue(req, res, next) {
    try {
      const allPrescriptions = await PrescriptionModel.getPharmacyQueue()
      
      // Filter only issued and sent prescriptions (not yet dispensed/delivered)
      const activeQueue = allPrescriptions.filter(p => {
        const isIssued = (p.status || '').toLowerCase() === 'issued'
        const isSent = (p.pharmacyStatus || p.pharmacy_status || '').toLowerCase() === 'sent'
        return isIssued && isSent
      })

      const formatted = activeQueue.map(p => ({
        id: p.id,
        prescriptionId: p.id,
        rxNumber: p.rxNumber || p.prescriptionNumber,
        prescriptionNumber: p.prescriptionNumber || p.rxNumber,
        patientName: p.patientName,
        patientId: p.patientId,
        patientUniqueCode: p.patientUniqueCode,
        doctorName: p.doctorName,
        hospital: p.hospitalName,
        hospitalName: p.hospitalName,
        appointmentDate: p.appointment?.date || (p.createdAt ? p.createdAt.split('T')[0] : '2026-09-09'),
        prescriptionStatus: p.status,
        status: p.status,
        pharmacyStatus: p.pharmacyStatus || p.pharmacy_status || 'Sent',
        medicineItems: p.medicines || p.items || [],
        medicines: p.medicines || p.items || [],
        items: p.medicines || p.items || [],
        dispensingStatus: 'Pending',
        createdAt: p.createdAt
      }))

      return res.json({ success: true, prescriptions: formatted })
    } catch (err) {
      next(err)
    }
  },

  // GET /api/pharmacy/prescriptions/:id
  async getPrescriptionById(req, res, next) {
    try {
      const { id } = req.params
      const prescription = await PrescriptionModel.findByIdOrRx(id)
      if (!prescription) {
        return res.status(404).json({
          success: false,
          message: 'Prescription record not found.'
        })
      }

      // Check for associated dispensing record
      const dispensing = await DispensingModel.findByPrescriptionId(prescription.id)

      return res.json({
        success: true,
        prescription: {
          ...prescription,
          dispensing: dispensing || null
        }
      })
    } catch (err) {
      next(err)
    }
  },

  // POST /api/pharmacy/dispensings
  async dispense(req, res, next) {
    try {
      const targetId = req.params.id || req.body.prescriptionId || req.body.id
      if (!targetId) {
        return res.status(400).json({
          success: false,
          message: 'Prescription ID is required for dispensing.'
        })
      }

      const prescription = await PrescriptionModel.findByIdOrRx(targetId)
      if (!prescription) {
        return res.status(404).json({
          success: false,
          message: 'Prescription record not found.'
        })
      }

      // Status check: prescription must be Issued / eligible for dispensing
      if (prescription.status !== 'Issued' && prescription.pharmacyStatus !== 'Sent') {
        return res.status(400).json({
          success: false,
          message: `Prescription is in '${prescription.status}' status and cannot be dispensed.`
        })
      }

      // Duplicate dispensing check
      const existingDispensing = await DispensingModel.findByPrescriptionId(prescription.id)
      if (existingDispensing) {
        return res.status(400).json({
          success: false,
          message: 'Duplicate dispensing prevented: this prescription already has a dispensing record.'
        })
      }

      // Validate items to dispense
      let dispensedItems = req.body.dispensedItems || req.body.items
      if (!dispensedItems || !Array.isArray(dispensedItems) || dispensedItems.length === 0) {
        // If not provided in body, fall back to prescription's prescribed items
        dispensedItems = prescription.medicines || prescription.items || []
      }

      if (dispensedItems.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'At least one medicine item must be specified for dispensing.'
        })
      }

      // Validate quantities and belonging
      const rxMedicines = prescription.medicines || prescription.items || []
      for (const item of dispensedItems) {
        const qty = parseInt(item.quantity || item.requiredQty, 10)
        if (isNaN(qty) || qty <= 0) {
          return res.status(400).json({
            success: false,
            message: `Invalid quantity '${item.quantity}' for item '${item.name || item.medicineName}'. Quantity must be greater than 0.`
          })
        }

        // Verify item belongs to prescription
        const itemMedName = (item.medicineName || item.name || '').trim().toLowerCase()
        const itemMedId = item.medicineId ? parseInt(item.medicineId, 10) : null

        const belongs = rxMedicines.some(rxMed => {
          const rxName = (rxMed.name || rxMed.medicineName || '').trim().toLowerCase()
          const rxMedId = rxMed.medicineId ? parseInt(rxMed.medicineId, 10) : null
          if (itemMedId && rxMedId && itemMedId === rxMedId) return true
          if (itemMedName && rxName && (itemMedName.includes(rxName) || rxName.includes(itemMedName))) return true
          return false
        })

        if (!belongs) {
          return res.status(400).json({
            success: false,
            message: `Medicine '${item.name || item.medicineName}' does not belong to this prescription.`
          })
        }
      }

      const dispenserName = req.pharmacyStaff?.dispenserName || req.body.dispensedBy || 'Pharmacist Lead'

      // Create dispensing record
      const dispensing = await DispensingModel.create({
        prescriptionId: prescription.id,
        rxNumber: prescription.rxNumber,
        patientId: prescription.patientId,
        patientUniqueCode: prescription.patientUniqueCode,
        dispensedItems,
        dispensedBy: dispenserName,
        status: 'Dispensed'
      })

      // Update prescription status to Dispensed
      const updatedRx = await PrescriptionModel.markDispensed(prescription.id, {
        dispensedBy: dispenserName
      })

      return res.status(201).json({
        success: true,
        message: 'Medicines dispensed successfully. Awaiting delivery verification.',
        dispensing,
        prescription: updatedRx
      })
    } catch (err) {
      next(err)
    }
  },

  // POST /api/pharmacy/dispensings/:id/verify-delivery
  async verifyDelivery(req, res, next) {
    try {
      const { id } = req.params
      const { patientUniqueCode, deliveredBy } = req.body || {}

      if (!patientUniqueCode || !patientUniqueCode.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Patient Unique Code is required for delivery verification.'
        })
      }

      // Lookup dispensing by dispensing ID, dispensing number, or prescription reference
      const dispensing = await DispensingModel.findByIdOrRef(id)
      if (!dispensing) {
        return res.status(404).json({
          success: false,
          message: 'Dispensing record not found for verification.'
        })
      }

      // Check if already completed / delivered
      if (dispensing.status === 'Completed' || dispensing.status === 'Delivered') {
        return res.status(400).json({
          success: false,
          message: 'Duplicate verification prevented: this dispensing has already been completed.'
        })
      }

      // Verify patient unique code matches the dispensing / prescription patient
      const expectedCode = (dispensing.patientUniqueCode || dispensing.patient_unique_code || '').trim().toUpperCase()
      const providedCode = patientUniqueCode.trim().toUpperCase()

      if (providedCode !== expectedCode) {
        return res.status(400).json({
          success: false,
          message: `Delivery verification failed: Provided code '${providedCode}' does not match patient unique code on prescription.`
        })
      }

      const verifier = req.pharmacyStaff?.dispenserName || deliveredBy || 'Pharmacist Lead'

      // Mark dispensing completed
      const completedDispensing = await DispensingModel.verifyDelivery(dispensing.id, {
        verifiedBy: verifier
      })

      // Mark prescription delivered / completed
      const completedRx = await PrescriptionModel.markDelivered(dispensing.prescriptionId, {
        deliveredBy: verifier
      })

      return res.status(200).json({
        success: true,
        message: 'Delivery verified successfully. Medication handed over to patient.',
        dispensing: completedDispensing,
        prescription: completedRx
      })
    } catch (err) {
      next(err)
    }
  },

  // GET /api/pharmacy/history
  async getHistory(req, res, next) {
    try {
      const history = await DispensingModel.getHistory()
      return res.json({ success: true, history })
    } catch (err) {
      next(err)
    }
  },

  // Legacy deliver alias
  async deliver(req, res, next) {
    return PharmacyController.verifyDelivery(req, res, next)
  }
}
