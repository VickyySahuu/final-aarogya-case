import { query, pool, isConnected } from '../db/index.js'
import { memoryDispensings, scheduleSaveFallbackState } from '../db/fallbackStore.js'
import { PatientModel } from './patientModel.js'
import { PrescriptionModel } from './prescriptionModel.js'

let dispCounter = 1

export function generateDispensingNumber() {
  const year = new Date().getFullYear()
  const seq = String(dispCounter++).padStart(6, '0')
  return `DISP-${year}-${seq}`
}

function formatDispensedItems(items) {
  if (!items) return []
  let list = items
  if (typeof items === 'string') {
    try {
      list = JSON.parse(items)
    } catch {
      list = []
    }
  }
  if (!Array.isArray(list)) return []

  return list.map(item => ({
    medicineId: item.medicineId || item.medicine_id || null,
    medicineName: item.medicineName || item.medicine_name || item.name || 'Medication',
    name: item.medicineName || item.medicine_name || item.name || 'Medication',
    quantity: parseInt(item.quantity || item.requiredQty || item.required_qty, 10) || 1,
    requiredQty: parseInt(item.requiredQty || item.quantity || item.required_qty, 10) || 1,
    unit: item.unit || 'Units',
    status: item.status || 'Available'
  }))
}

async function formatDispensingRecord(record) {
  if (!record) return null

  // Resolve prescription
  let rx = null
  if (record.prescription_id || record.prescriptionId) {
    rx = await PrescriptionModel.findById(record.prescription_id || record.prescriptionId)
  }

  // Resolve patient
  let patient = null
  const patientId = record.patient_id || record.patientId || rx?.patientId || rx?.patient_id
  if (patientId) {
    patient = await PatientModel.findById(patientId)
  }
  const patientCode = record.patient_unique_code || record.patientUniqueCode || rx?.patientUniqueCode || patient?.patient_unique_code || 'AC-7F42K9'

  const items = formatDispensedItems(record.dispensed_items || record.dispensedItems || rx?.medicines)
  const dispNum = record.dispensing_number || record.dispensingNumber || `DISP-2026-${String(record.id).padStart(6, '0')}`
  const rxNum = record.rx_number || record.rxNumber || rx?.rxNumber || rx?.prescriptionNumber

  return {
    id: record.id,
    dispensingNumber: dispNum,
    dispensing_number: dispNum,
    prescriptionId: record.prescription_id || record.prescriptionId,
    prescription_id: record.prescription_id || record.prescriptionId,
    rxNumber: rxNum,
    rx_number: rxNum,
    prescriptionNumber: rxNum,
    patientId: patientId,
    patient_id: patientId,
    patientUniqueCode: patientCode,
    patient_unique_code: patientCode,
    patientName: patient?.name || rx?.patientName || (patientId ? `Patient #${patientId}` : 'Patient'),
    patient_name: patient?.name || rx?.patientName || (patientId ? `Patient #${patientId}` : 'Patient'),
    doctorName: rx?.doctorName || 'Dr. Ramanathan Venkatraman',
    hospitalName: rx?.hospitalName || 'District Civil Hospital',
    dispensedItems: items,
    dispensed_items: items,
    items,
    medicines: items,
    dispensedBy: record.dispensed_by || record.dispensedBy || 'Pharmacist Lead',
    dispensed_by: record.dispensed_by || record.dispensedBy || 'Pharmacist Lead',
    deliveryVerifiedBy: record.delivery_verified_by || record.deliveryVerifiedBy || null,
    delivery_verified_by: record.delivery_verified_by || record.deliveryVerifiedBy || null,
    status: record.status || 'Dispensed',
    dispensedAt: record.dispensed_at || record.dispensedAt || new Date().toISOString(),
    dispensed_at: record.dispensed_at || record.dispensedAt || new Date().toISOString(),
    deliveredAt: record.delivered_at || record.deliveredAt || null,
    delivered_at: record.delivered_at || record.deliveredAt || null,
    verifiedAt: record.verified_at || record.verifiedAt || null,
    verified_at: record.verified_at || record.verifiedAt || null,
    date: record.delivered_at || record.dispensed_at || new Date().toISOString()
  }
}

export const DispensingModel = {
  generateDispensingNumber,

  async create({
    prescriptionId,
    rxNumber,
    patientId,
    patientUniqueCode,
    dispensedItems = [],
    dispensedBy = 'Pharmacist Lead',
    status = 'Dispensed'
  }) {
    const dispensingNumber = generateDispensingNumber()
    const numRxId = parseInt(prescriptionId, 10)
    const numPatientId = parseInt(patientId, 10) || 1
    const itemsJson = JSON.stringify(dispensedItems)

    if (isConnected()) {
      try {
        const res = await query(
          `INSERT INTO pharmacy_dispensings (
            dispensing_number, prescription_id, rx_number, patient_id,
            patient_unique_code, dispensed_items, dispensed_by, status, dispensed_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
          RETURNING *`,
          [
            dispensingNumber,
            numRxId,
            rxNumber,
            numPatientId,
            patientUniqueCode,
            itemsJson,
            dispensedBy,
            status
          ]
        )
        if (res.rows[0]) {
          return formatDispensingRecord(res.rows[0])
        }
      } catch (err) {
        console.warn('[DispensingModel] create query failed, using memory store:', err.message)
      }
    }

    const newId = memoryDispensings.length > 0 ? Math.max(...memoryDispensings.map(d => d.id || 0)) + 1 : 1
    const record = {
      id: newId,
      dispensing_number: dispensingNumber,
      prescription_id: numRxId,
      rx_number: rxNumber,
      patient_id: numPatientId,
      patient_unique_code: patientUniqueCode,
      dispensed_items: dispensedItems,
      dispensed_by: dispensedBy,
      delivery_verified_by: null,
      status,
      dispensed_at: new Date().toISOString(),
      delivered_at: null,
      verified_at: null
    }
    memoryDispensings.unshift(record)
    scheduleSaveFallbackState()
    return formatDispensingRecord(record)
  },

  async findById(id) {
    const numId = parseInt(id, 10)
    if (isNaN(numId)) return null
    if (isConnected()) {
      try {
        const res = await query('SELECT * FROM pharmacy_dispensings WHERE id = $1', [numId])
        if (res.rows[0]) return formatDispensingRecord(res.rows[0])
      } catch (err) {
        console.warn('[DispensingModel] findById failed, using memory store:', err.message)
      }
    }
    const mem = memoryDispensings.find(d => d.id === numId)
    return mem ? formatDispensingRecord(mem) : null
  },

  async findByDispensingNumber(num) {
    if (!num) return null
    const cleanNum = String(num).trim().toUpperCase()
    if (isConnected()) {
      try {
        const res = await query('SELECT * FROM pharmacy_dispensings WHERE UPPER(dispensing_number) = $1', [cleanNum])
        if (res.rows[0]) return formatDispensingRecord(res.rows[0])
      } catch (err) {
        console.warn('[DispensingModel] findByDispensingNumber failed, using memory store:', err.message)
      }
    }
    const mem = memoryDispensings.find(d => (d.dispensing_number || '').toUpperCase() === cleanNum)
    return mem ? formatDispensingRecord(mem) : null
  },

  async findByPrescriptionId(prescriptionId) {
    const numRxId = parseInt(prescriptionId, 10)
    if (isConnected() && !isNaN(numRxId)) {
      try {
        const res = await query('SELECT * FROM pharmacy_dispensings WHERE prescription_id = $1 ORDER BY id DESC LIMIT 1', [numRxId])
        if (res.rows[0]) return formatDispensingRecord(res.rows[0])
      } catch (err) {
        console.warn('[DispensingModel] findByPrescriptionId failed, using memory store:', err.message)
      }
    }
    const mem = memoryDispensings.find(d => d.prescription_id === numRxId)
    return mem ? formatDispensingRecord(mem) : null
  },

  async findByIdOrRef(ref) {
    if (!ref) return null
    const strRef = String(ref).trim()

    // Try numeric ID
    if (/^\d+$/.test(strRef)) {
      const byId = await this.findById(strRef)
      if (byId) return byId
      // Also try as prescription_id
      const byRxId = await this.findByPrescriptionId(strRef)
      if (byRxId) return byRxId
    }

    // Try dispensing number
    if (strRef.toUpperCase().startsWith('DISP-')) {
      const byDispNum = await this.findByDispensingNumber(strRef)
      if (byDispNum) return byDispNum
    }

    // Try by Rx Number
    if (isConnected()) {
      try {
        const res = await query('SELECT * FROM pharmacy_dispensings WHERE UPPER(rx_number) = $1 ORDER BY id DESC LIMIT 1', [strRef.toUpperCase()])
        if (res.rows[0]) return formatDispensingRecord(res.rows[0])
      } catch (err) {
        console.warn('[DispensingModel] findByIdOrRef rx query failed:', err.message)
      }
    }
    const mem = memoryDispensings.find(d => (d.rx_number || '').toUpperCase() === strRef.toUpperCase())
    return mem ? formatDispensingRecord(mem) : null
  },

  async verifyDelivery(idOrRef, { verifiedBy = 'Pharmacist Lead' } = {}) {
    const record = await this.findByIdOrRef(idOrRef)
    if (!record) return null

    if (isConnected()) {
      try {
        const res = await query(
          `UPDATE pharmacy_dispensings
           SET status = 'Completed',
               delivery_verified_by = $1,
               verified_at = CURRENT_TIMESTAMP,
               delivered_at = CURRENT_TIMESTAMP
           WHERE id = $2
           RETURNING *`,
          [verifiedBy, record.id]
        )
        if (res.rows[0]) {
          return formatDispensingRecord(res.rows[0])
        }
      } catch (err) {
        console.warn('[DispensingModel] verifyDelivery failed, using memory store:', err.message)
      }
    }

    const idx = memoryDispensings.findIndex(d => d.id === record.id)
    if (idx !== -1) {
      const now = new Date().toISOString()
      memoryDispensings[idx].status = 'Completed'
      memoryDispensings[idx].delivery_verified_by = verifiedBy
      memoryDispensings[idx].verified_at = now
      memoryDispensings[idx].delivered_at = now
      scheduleSaveFallbackState()
      return formatDispensingRecord(memoryDispensings[idx])
    }

    return null
  },

  async getHistory() {
    if (isConnected()) {
      try {
        const res = await query(
          `SELECT * FROM pharmacy_dispensings
           WHERE status IN ('Completed', 'Delivered')
           ORDER BY id DESC`
        )
        if (res.rows.length > 0) {
          const list = []
          for (const row of res.rows) {
            list.push(await formatDispensingRecord(row))
          }
          return list
        }
      } catch (err) {
        console.warn('[DispensingModel] getHistory failed, using memory store:', err.message)
      }
    }

    const completed = memoryDispensings.filter(d => d.status === 'Completed' || d.status === 'Delivered')
    const list = []
    for (const d of completed) {
      list.push(await formatDispensingRecord(d))
    }
    return list
  },

  async getByPatientId(patientId) {
    if (!patientId) return []
    const resolved = await PatientModel.resolvePatient(patientId)
    const numId = resolved?.id || (parseInt(patientId, 10) || null)
    const uniqueCode = resolved?.patient_unique_code || (typeof patientId === 'string' && patientId.startsWith('AC-') ? patientId : null)
    const isNum = typeof numId === 'number' && !isNaN(numId)

    if (isConnected()) {
      try {
        let sql = `
          SELECT * FROM pharmacy_dispensings
          WHERE 1=0
        `
        const params = []
        if (isNum) {
          params.push(numId)
          sql += ` OR patient_id = $${params.length}`
        }
        if (uniqueCode) {
          params.push(uniqueCode)
          sql += ` OR UPPER(patient_unique_code) = UPPER($${params.length})`
        }
        sql += ` ORDER BY id DESC`

        const res = await query(sql, params)
        if (res.rows.length > 0) {
          const list = []
          for (const row of res.rows) {
            list.push(await formatDispensingRecord(row))
          }
          return list
        }
      } catch (err) {
        console.warn('[DispensingModel] getByPatientId failed, using memory store:', err.message)
      }
    }

    const filtered = memoryDispensings.filter(d => 
      (isNum && (d.patient_id === numId || d.patientId === numId)) ||
      (uniqueCode && d.patient_unique_code && d.patient_unique_code.toUpperCase() === uniqueCode.toUpperCase())
    )
    const list = []
    for (const d of filtered) {
      list.push(await formatDispensingRecord(d))
    }
    return list
  }
}
