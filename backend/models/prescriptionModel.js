import { query, pool, isConnected } from '../db/index.js'
import { memoryPrescriptions, memoryPrescriptionItems, scheduleSaveFallbackState } from '../db/fallbackStore.js'
import { PatientModel } from './patientModel.js'
import { DoctorModel } from './doctorModel.js'
import { AppointmentModel } from './appointmentModel.js'
import { CaseModel } from './caseModel.js'

let rxCounter = 1

export function generateRxNumber() {
  const year = new Date().getFullYear()
  const seq = String(rxCounter++).padStart(6, '0')
  return `RX-${year}-${seq}`
}

function formatItem(item) {
  if (!item) return null
  const medName = item.medicine_name || item.medicineName || item.name || item.medicine || ''
  const qty = item.required_qty || item.requiredQty || item.quantity || 1
  return {
    id: item.id,
    prescriptionId: item.prescription_id || item.prescriptionId,
    prescription_id: item.prescription_id || item.prescriptionId,
    medicineId: item.medicine_id || item.medicineId || null,
    medicine_id: item.medicine_id || item.medicineId || null,
    medicineName: medName,
    medicine_name: medName,
    name: medName,
    category: item.category || 'Prescription Medication',
    dosage: item.dosage || '1 Tablet',
    frequency: item.frequency || 'Once Daily',
    duration: item.duration || '3 Days',
    instructions: item.instructions || 'After meals',
    quantity: qty,
    requiredQty: qty,
    required_qty: qty,
    created_at: item.created_at || item.createdAt
  }
}

async function formatPrescriptionRecord(rx, items = null) {
  if (!rx) return null

  // Fetch patient details
  let patient = null
  if (rx.patient_id || rx.patientId) {
    patient = await PatientModel.findById(rx.patient_id || rx.patientId)
  }
  if (!patient && (rx.patient_unique_code || rx.patientUniqueCode)) {
    patient = await PatientModel.findByUniqueCode(rx.patient_unique_code || rx.patientUniqueCode)
  }

  // Fetch doctor details
  let doctor = null
  if (rx.doctor_id || rx.doctorId) {
    doctor = await DoctorModel.findById(rx.doctor_id || rx.doctorId)
  }
  if (!doctor) {
    doctor = await DoctorModel.getSingleDoctor()
  }

  // Fetch appointment details
  let appointment = null
  if (rx.appointment_id || rx.appointmentId) {
    appointment = await AppointmentModel.findById(rx.appointment_id || rx.appointmentId)
  }

  // Fetch case details
  let caseItem = null
  if (rx.case_id || rx.caseId) {
    caseItem = await CaseModel.findById(rx.case_id || rx.caseId)
  }

  // Determine items
  let effectiveItems = items
  if (!effectiveItems) {
    if (isConnected()) {
      try {
        const itemRes = await query(
          'SELECT * FROM prescription_items WHERE prescription_id = $1 ORDER BY id ASC',
          [rx.id]
        )
        effectiveItems = itemRes.rows
      } catch (e) {
        effectiveItems = memoryPrescriptionItems.filter(i => i.prescription_id === rx.id)
      }
    } else {
      effectiveItems = memoryPrescriptionItems.filter(i => i.prescription_id === rx.id)
    }
  }

  const formattedItems = (effectiveItems || []).map(formatItem)

  const rxNum = rx.rx_number || rx.prescriptionNumber || rx.rxNumber
  const resolvedPatientId = rx.patient_id || rx.patientId || patient?.id
  const patientCode = rx.patient_unique_code || patient?.patient_unique_code || patient?.patientUniqueCode || (resolvedPatientId ? `AC-P${resolvedPatientId}` : 'AC-000000')
  const resolvedPatientName = patient?.name || rx.patient_name || (resolvedPatientId ? `Patient #${resolvedPatientId}` : 'Patient')

  return {
    ...rx,
    id: rx.id,
    prescriptionNumber: rxNum,
    rxNumber: rxNum,
    rx_number: rxNum,
    patientId: resolvedPatientId,
    patient_id: resolvedPatientId,
    patientUniqueCode: patientCode,
    patient_unique_code: patientCode,
    patientName: resolvedPatientName,
    patient_name: resolvedPatientName,
    patient: {
      id: resolvedPatientId,
      patientId: patient?.patient_id || (resolvedPatientId ? `PAT-${resolvedPatientId}` : 'PAT-0000'),
      name: resolvedPatientName,
      patientUniqueCode: patientCode,
      age: patient?.age !== undefined ? patient.age : (rx.patient_age || ''),
      gender: patient?.gender || rx.patient_gender || '',
      mobile: patient?.mobile || rx.patient_mobile || '',
      bloodGroup: patient?.blood_group || rx.patient_blood_group || ''
    },
    doctorId: rx.doctor_id || rx.doctorId,
    doctor_id: rx.doctor_id || rx.doctorId,
    doctorName: doctor?.name || rx.doctor_name || 'Dr. Ramanathan Venkatraman',
    doctor_name: doctor?.name || rx.doctor_name || 'Dr. Ramanathan Venkatraman',
    doctor: {
      id: rx.doctor_id || doctor?.id || 1,
      doctorId: doctor?.doctor_id || 'DOC-1042',
      name: doctor?.name || 'Dr. Ramanathan Venkatraman',
      specialization: doctor?.specialization || 'General Medicine',
      hospitalName: rx.hospital_name || doctor?.hospital_name || 'District Civil Hospital',
      room: rx.room_number || doctor?.room || 'Room 104'
    },
    hospitalName: rx.hospital_name || 'District Civil Hospital',
    hospital_name: rx.hospital_name || 'District Civil Hospital',
    roomNumber: rx.room_number || 'Room 104',
    room_number: rx.room_number || 'Room 104',
    token: rx.token || '#14',
    tokenNumber: rx.token || '#14',
    appointmentId: rx.appointment_id || rx.appointmentId,
    appointment_id: rx.appointment_id || rx.appointmentId,
    appointment: appointment ? {
      id: appointment.id,
      appointmentNumber: appointment.appointment_number || appointment.appointmentNumber,
      date: appointment.appointment_date || appointment.date,
      time: appointment.time_slot || appointment.time,
      status: appointment.status
    } : null,
    caseId: rx.case_id || rx.caseId,
    case_id: rx.case_id || rx.caseId,
    caseReference: caseItem ? {
      id: caseItem.id,
      caseNumber: caseItem.case_number || caseItem.caseNumber,
      problem: caseItem.problem
    } : null,
    diagnosis: rx.diagnosis || 'Outpatient Consultation',
    icdCode: rx.icd_code || rx.icdCode || null,
    vitals: rx.vitals || null,
    medicines: formattedItems,
    items: formattedItems,
    status: rx.status || 'Issued',
    pharmacyStatus: rx.pharmacy_status || rx.pharmacyStatus || 'Sent',
    pharmacy_status: rx.pharmacy_status || rx.pharmacyStatus || 'Sent',
    patientAccess: rx.patient_access || 'Available',
    createdAt: rx.created_at || rx.createdAt || new Date().toISOString(),
    created_at: rx.created_at || rx.createdAt || new Date().toISOString(),
    updatedAt: rx.updated_at || rx.updatedAt || new Date().toISOString(),
    updated_at: rx.updated_at || rx.updatedAt || new Date().toISOString()
  }
}

export const PrescriptionModel = {
  generateRxNumber,

  async create({
    rxNumber,
    appointmentId,
    caseId,
    patientId,
    patientUniqueCode,
    doctorId,
    hospitalName,
    roomNumber,
    token,
    diagnosis,
    icdCode,
    vitals,
    medicines = [],
    status = 'Issued',
    pharmacyStatus = 'Sent'
  }) {
    const generatedRxNumber = rxNumber || generateRxNumber()
    const numPatientId = parseInt(patientId, 10) || 1
    const numDoctorId = parseInt(doctorId, 10) || 1
    const numAppointmentId = appointmentId ? parseInt(appointmentId, 10) : null
    const numCaseId = caseId ? parseInt(caseId, 10) : null

    // Determine patient unique code
    let patient = null
    if (numPatientId) {
      patient = await PatientModel.findById(numPatientId)
    }
    if (!patient && patientUniqueCode) {
      patient = await PatientModel.findByUniqueCode(patientUniqueCode)
    }
    const finalPatientUniqueCode = patient?.patient_unique_code || patientUniqueCode || 'AC-7F42K9'

    // Determine doctor details
    let doctor = null
    if (numDoctorId) {
      doctor = await DoctorModel.findById(numDoctorId)
    }
    if (!doctor) {
      doctor = await DoctorModel.getSingleDoctor()
    }

    if (isConnected()) {
      try {
        const client = await pool.connect()
        try {
          await client.query('BEGIN')

          const rxRes = await client.query(
            `INSERT INTO prescriptions (
              rx_number, appointment_id, case_id, patient_id, patient_unique_code, doctor_id,
              hospital_name, room_number, token, diagnosis, icd_code, vitals, pharmacy_status, status
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
            RETURNING *`,
            [
              generatedRxNumber,
              numAppointmentId,
              numCaseId,
              numPatientId,
              finalPatientUniqueCode,
              numDoctorId,
              hospitalName || doctor?.hospital_name || 'District Civil Hospital',
              roomNumber || doctor?.room || 'Room 104',
              token || '#14',
              diagnosis || 'Outpatient Consultation',
              icdCode || null,
              vitals || null,
              pharmacyStatus || 'Sent',
              status || 'Issued'
            ]
          )
          const prescription = rxRes.rows[0]

          const insertedItems = []
          for (const med of medicines) {
            const medName = med.medicineName || med.name || med.medicine || 'Medication'
            const itemRes = await client.query(
              `INSERT INTO prescription_items (
                prescription_id, medicine_id, medicine_name, category, dosage, frequency, duration, required_qty, instructions
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
              RETURNING *`,
              [
                prescription.id,
                med.medicineId ? parseInt(med.medicineId, 10) : null,
                medName,
                med.category || 'Prescription Medication',
                med.dosage || '1 Tablet',
                med.frequency || 'Once Daily',
                med.duration || '3 Days',
                med.requiredQty || med.quantity || 1,
                med.instructions || 'Take after meals'
              ]
            )
            insertedItems.push(itemRes.rows[0])
          }

          await client.query('COMMIT')

          const formatted = await formatPrescriptionRecord(prescription, insertedItems)
          memoryPrescriptions.unshift(prescription)
          insertedItems.forEach(i => memoryPrescriptionItems.push(i))
          return formatted
        } catch (err) {
          await client.query('ROLLBACK')
          console.warn('[PrescriptionModel] PostgreSQL transaction failed, using memory store:', err.message)
        } finally {
          client.release()
        }
      } catch (poolErr) {
        console.warn('[PrescriptionModel] Could not connect to pool, using memory store:', poolErr.message)
      }
    }

    // In-memory fallback
    const newId = memoryPrescriptions.length > 0 ? Math.max(...memoryPrescriptions.map(p => p.id || 0)) + 1 : 1
    const newRx = {
      id: newId,
      rx_number: generatedRxNumber,
      appointment_id: numAppointmentId,
      case_id: numCaseId,
      patient_id: numPatientId,
      patient_unique_code: finalPatientUniqueCode,
      doctor_id: numDoctorId,
      hospital_name: hospitalName || doctor?.hospital_name || 'District Civil Hospital',
      room_number: roomNumber || doctor?.room || 'Room 104',
      token: token || '#14',
      diagnosis: diagnosis || 'Outpatient Consultation',
      icd_code: icdCode || null,
      vitals: vitals || null,
      pharmacy_status: pharmacyStatus || 'Sent',
      status: status || 'Issued',
      patient_access: 'Available',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    memoryPrescriptions.unshift(newRx)

    let itemIdCounter = memoryPrescriptionItems.length > 0 ? Math.max(...memoryPrescriptionItems.map(i => i.id || 0)) + 1 : 1
    const createdItems = []
    for (const med of medicines) {
      const medName = med.medicineName || med.name || med.medicine || 'Medication'
      const item = {
        id: itemIdCounter++,
        prescription_id: newId,
        medicine_id: med.medicineId ? parseInt(med.medicineId, 10) : null,
        medicine_name: medName,
        category: med.category || 'Prescription Medication',
        dosage: med.dosage || '1 Tablet',
        frequency: med.frequency || 'Once Daily',
        duration: med.duration || '3 Days',
        required_qty: med.requiredQty || med.quantity || 1,
        instructions: med.instructions || 'Take after meals',
        created_at: new Date().toISOString()
      }
      memoryPrescriptionItems.push(item)
      createdItems.push(item)
    }

    scheduleSaveFallbackState()
    return formatPrescriptionRecord(newRx, createdItems)
  },

  async findById(id) {
    const numId = parseInt(id, 10)
    if (isConnected()) {
      try {
        const rxRes = await query('SELECT * FROM prescriptions WHERE id = $1', [numId])
        if (rxRes.rows.length > 0) {
          return formatPrescriptionRecord(rxRes.rows[0])
        }
      } catch (err) {
        console.warn('[PrescriptionModel] findById query failed, using memory store:', err.message)
      }
    }
    const mem = memoryPrescriptions.find(p => p.id === numId)
    return mem ? formatPrescriptionRecord(mem) : null
  },

  async findByRxNumber(rxNumber) {
    if (isConnected()) {
      try {
        const rxRes = await query('SELECT * FROM prescriptions WHERE rx_number = $1', [rxNumber])
        if (rxRes.rows.length > 0) {
          return formatPrescriptionRecord(rxRes.rows[0])
        }
      } catch (err) {
        console.warn('[PrescriptionModel] findByRxNumber query failed, using memory store:', err.message)
      }
    }
    const mem = memoryPrescriptions.find(p => (p.rx_number || '').toUpperCase() === (rxNumber || '').toUpperCase())
    return mem ? formatPrescriptionRecord(mem) : null
  },

  async findByIdOrRx(idOrRx) {
    if (!idOrRx) return null
    if (/^\d+$/.test(String(idOrRx))) {
      const byId = await this.findById(idOrRx)
      if (byId) return byId
    }
    return this.findByRxNumber(String(idOrRx))
  },

  async findByAppointmentId(appointmentId) {
    const numAppId = parseInt(appointmentId, 10)
    if (isConnected()) {
      try {
        const rxRes = await query('SELECT * FROM prescriptions WHERE appointment_id = $1 ORDER BY id DESC LIMIT 1', [numAppId])
        if (rxRes.rows.length > 0) {
          return formatPrescriptionRecord(rxRes.rows[0])
        }
      } catch (err) {
        console.warn('[PrescriptionModel] findByAppointmentId failed, using memory store:', err.message)
      }
    }
    const mem = memoryPrescriptions.find(p => p.appointment_id === numAppId)
    return mem ? formatPrescriptionRecord(mem) : null
  },

  async getByDoctorId(doctorId) {
    const numDocId = parseInt(doctorId, 10)
    if (isConnected()) {
      try {
        const res = await query(
          'SELECT * FROM prescriptions WHERE doctor_id = $1 ORDER BY id DESC',
          [numDocId]
        )
        if (res.rows.length > 0) {
          const list = []
          for (const row of res.rows) {
            list.push(await formatPrescriptionRecord(row))
          }
          return list
        }
      } catch (err) {
        console.warn('[PrescriptionModel] getByDoctorId failed, using memory store:', err.message)
      }
    }
    const mems = memoryPrescriptions.filter(p => !numDocId || p.doctor_id === numDocId)
    const list = []
    for (const m of mems) {
      list.push(await formatPrescriptionRecord(m))
    }
    return list
  },

  async getByPatientId(patientId) {
    if (!patientId) return []
    const resolved = await PatientModel.resolvePatient(patientId)
    const numPatId = resolved?.id || (parseInt(patientId, 10) || null)
    const uniqueCode = resolved?.patient_unique_code || (typeof patientId === 'string' && patientId.startsWith('AC-') ? patientId : null)
    const isNum = typeof numPatId === 'number' && !isNaN(numPatId)

    if (isConnected()) {
      try {
        let sql = `
          SELECT pr.* FROM prescriptions pr
          LEFT JOIN patients p ON pr.patient_id = p.id
          WHERE 1=0
        `
        const params = []
        if (isNum) {
          params.push(numPatId)
          sql += ` OR pr.patient_id = $${params.length}`
        }
        if (uniqueCode) {
          params.push(uniqueCode)
          sql += ` OR UPPER(pr.patient_unique_code) = UPPER($${params.length}) OR (p.patient_unique_code IS NOT NULL AND UPPER(p.patient_unique_code) = UPPER($${params.length}))`
        }
        sql += ` ORDER BY pr.id DESC`

        const res = await query(sql, params)
        if (res.rows.length > 0) {
          const list = []
          for (const row of res.rows) {
            list.push(await formatPrescriptionRecord(row))
          }
          return list
        }
      } catch (err) {
        console.warn('[PrescriptionModel] getByPatientId failed, using memory store:', err.message)
      }
    }

    const mems = memoryPrescriptions.filter(p => 
      (isNum && (p.patient_id === numPatId || String(p.patientId) === String(numPatId))) ||
      (uniqueCode && p.patient_unique_code && p.patient_unique_code.toUpperCase() === uniqueCode.toUpperCase())
    )
    const list = []
    for (const m of mems) {
      list.push(await formatPrescriptionRecord(m))
    }
    return list
  },

  async getPharmacyQueue() {
    if (isConnected()) {
      try {
        const res = await query('SELECT * FROM prescriptions ORDER BY id DESC')
        if (res.rows.length > 0) {
          const list = []
          for (const row of res.rows) {
            list.push(await formatPrescriptionRecord(row))
          }
          return list
        }
      } catch (err) {
        console.warn('[PrescriptionModel] getPharmacyQueue failed, using memory store:', err.message)
      }
    }
    const list = []
    for (const m of memoryPrescriptions) {
      list.push(await formatPrescriptionRecord(m))
    }
    return list
  },

  async updateStatus(id, status) {
    const numId = parseInt(id, 10)
    if (isConnected()) {
      try {
        const res = await query(
          `UPDATE prescriptions 
           SET status = $1, updated_at = CURRENT_TIMESTAMP 
           WHERE id = $2 RETURNING *`,
          [status, numId]
        )
        if (res.rows[0]) return formatPrescriptionRecord(res.rows[0])
      } catch (err) {
        console.warn('[PrescriptionModel] updateStatus failed, using memory store:', err.message)
      }
    }
    const idx = memoryPrescriptions.findIndex(p => p.id === numId)
    if (idx !== -1) {
      memoryPrescriptions[idx].status = status
      memoryPrescriptions[idx].updated_at = new Date().toISOString()
      return formatPrescriptionRecord(memoryPrescriptions[idx])
    }
    return null
  },

  async markDispensed(id, { dispensedBy } = {}) {
    const numId = parseInt(id, 10)
    if (isConnected()) {
      try {
        const res = await query(
          `UPDATE prescriptions 
           SET pharmacy_status = 'Dispensed', status = 'Dispensed', updated_at = CURRENT_TIMESTAMP 
           WHERE id = $1 RETURNING *`,
          [numId]
        )
        if (res.rows[0]) return formatPrescriptionRecord(res.rows[0])
      } catch (err) {
        console.warn('[PrescriptionModel] markDispensed failed, using memory store:', err.message)
      }
    }
    const idx = memoryPrescriptions.findIndex(p => p.id === numId)
    if (idx !== -1) {
      memoryPrescriptions[idx].pharmacy_status = 'Dispensed'
      memoryPrescriptions[idx].status = 'Dispensed'
      memoryPrescriptions[idx].updated_at = new Date().toISOString()
      return formatPrescriptionRecord(memoryPrescriptions[idx])
    }
    return null
  },

  async markDelivered(id, { deliveredBy } = {}) {
    const numId = parseInt(id, 10)
    if (isConnected()) {
      try {
        const rx = await query(
          `UPDATE prescriptions 
           SET pharmacy_status = 'Delivered', status = 'Completed', updated_at = CURRENT_TIMESTAMP 
           WHERE id = $1 RETURNING *`,
          [numId]
        )
        if (rx.rows[0]) {
          return formatPrescriptionRecord(rx.rows[0])
        }
      } catch (err) {
        console.warn('[PrescriptionModel] markDelivered failed, using memory store:', err.message)
      }
    }
    const idx = memoryPrescriptions.findIndex(p => p.id === numId)
    if (idx !== -1) {
      memoryPrescriptions[idx].pharmacy_status = 'Delivered'
      memoryPrescriptions[idx].status = 'Completed'
      memoryPrescriptions[idx].updated_at = new Date().toISOString()
      return formatPrescriptionRecord(memoryPrescriptions[idx])
    }
    return null
  }
}
