import { query, isConnected } from '../db/index.js'
import { memoryAppointments, scheduleSaveFallbackState } from '../db/fallbackStore.js'
import { PatientModel } from './patientModel.js'
import { DoctorModel } from './doctorModel.js'
import { HospitalModel } from './hospitalModel.js'
import { CaseModel } from './caseModel.js'

export const AppointmentModel = {
  async create({
    appointmentNumber,
    patientId,
    doctorId,
    hospitalId,
    caseId,
    tokenNumber,
    appointmentDate,
    timeSlot,
    opdRoom,
    problem,
    severity,
    paymentMethod,
    paymentStatus,
    status
  }) {
    let numPatientId = parseInt(patientId, 10)
    let patientRec = null
    if (isNaN(numPatientId)) {
      patientRec = PatientModel.getByIdSync?.(patientId)
      if (patientRec) numPatientId = patientRec.id
    } else {
      patientRec = PatientModel.getByIdSync?.(numPatientId)
    }

    const numDoctorId = parseInt(doctorId, 10)
    const numHospitalId = hospitalId ? parseInt(hospitalId, 10) : null
    const numCaseId = caseId ? parseInt(caseId, 10) : null

    if (isConnected()) {
      try {
        const res = await query(
          `INSERT INTO appointments (
            appointment_number, patient_id, doctor_id, hospital_id, case_id,
            token_number, appointment_date, time_slot, opd_room, problem,
            severity, payment_method, payment_status, status
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
          RETURNING *`,
          [
            appointmentNumber,
            numPatientId,
            numDoctorId,
            numHospitalId,
            numCaseId,
            tokenNumber,
            appointmentDate,
            timeSlot,
            opdRoom || 'Room 104',
            problem || null,
            severity || 'Moderate',
            paymentMethod || 'Universal Public Health Free OPD Token',
            paymentStatus || 'Completed',
            status || 'Waiting for Doctor'
          ]
        )
        if (res.rows.length > 0) {
          const row = {
            ...res.rows[0],
            patient_name: patientRec?.name,
            patient_code_id: patientRec?.patient_id,
            patient_unique_code: patientRec?.patient_unique_code,
            patient_age: patientRec?.age,
            patient_gender: patientRec?.gender,
            patient_mobile: patientRec?.mobile
          }
          memoryAppointments.unshift(row)
          scheduleSaveFallbackState()
          return this.getQueueItemById(res.rows[0].id) || this._formatOpdQueueItem(row)
        }
      } catch (err) {
        console.warn('[AppointmentModel] DB insert error, using memory fallback:', err.message)
      }
    }

    const newId = memoryAppointments.length > 0 ? Math.max(...memoryAppointments.map(a => a.id || 0)) + 1 : 1
    const newAppointment = {
      id: newId,
      appointment_number: appointmentNumber,
      patient_id: numPatientId,
      doctor_id: numDoctorId,
      hospital_id: numHospitalId,
      case_id: numCaseId,
      token_number: tokenNumber,
      appointment_date: appointmentDate,
      time_slot: timeSlot,
      opd_room: opdRoom || 'Room 104',
      problem: problem || null,
      severity: severity || 'Moderate',
      payment_method: paymentMethod || 'Universal Public Health Free OPD Token',
      payment_status: paymentStatus || 'Completed',
      status: status || 'Waiting for Doctor',
      patient_name: patientRec?.name,
      patient_code_id: patientRec?.patient_id,
      patient_unique_code: patientRec?.patient_unique_code,
      patient_age: patientRec?.age,
      patient_gender: patientRec?.gender,
      patient_mobile: patientRec?.mobile,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    memoryAppointments.unshift(newAppointment)
    scheduleSaveFallbackState()
    return this.getQueueItemById(newAppointment.id) || this._formatOpdQueueItem(this._populateInMemory(newAppointment))
  },

  async findById(id) {
    const numId = parseInt(id, 10)
    if (isConnected()) {
      try {
        const res = await query(
          `SELECT a.*, 
                  p.name as patient_name, p.patient_id as patient_code_id, p.patient_unique_code, p.age as patient_age, p.gender as patient_gender, p.mobile as patient_mobile,
                  d.name as doctor_name, d.specialization as doctor_specialization, d.room as doctor_room, d.doctor_id as doctor_code_id,
                  h.name as hospital_name, h.address as hospital_address, h.facility_type as hospital_facility_type
           FROM appointments a
           JOIN patients p ON a.patient_id = p.id
           JOIN doctors d ON a.doctor_id = d.id
           LEFT JOIN hospitals h ON a.hospital_id = h.id
           WHERE a.id = $1 LIMIT 1`,
          [numId]
        )
        if (res.rows.length > 0) return res.rows[0]
      } catch (err) {
        console.warn('[AppointmentModel] DB query error, using memory fallback:', err.message)
      }
    }

    const row = memoryAppointments.find(a => a.id === numId)
    if (!row) return null
    return this._populateInMemory(row)
  },

  async findByAppointmentNumber(num) {
    if (isConnected()) {
      try {
        const res = await query(
          `SELECT a.*, 
                  p.name as patient_name, p.patient_id as patient_code_id, p.patient_unique_code, p.age as patient_age, p.gender as patient_gender, p.mobile as patient_mobile,
                  d.name as doctor_name, d.specialization as doctor_specialization, d.room as doctor_room, d.doctor_id as doctor_code_id,
                  h.name as hospital_name, h.address as hospital_address, h.facility_type as hospital_facility_type
           FROM appointments a
           JOIN patients p ON a.patient_id = p.id
           JOIN doctors d ON a.doctor_id = d.id
           LEFT JOIN hospitals h ON a.hospital_id = h.id
           WHERE a.appointment_number = $1 LIMIT 1`,
          [num]
        )
        if (res.rows.length > 0) return res.rows[0]
      } catch (err) {
        console.warn('[AppointmentModel] DB query error, using memory fallback:', err.message)
      }
    }

    const row = memoryAppointments.find(a => a.appointment_number === num)
    if (!row) return null
    return this._populateInMemory(row)
  },

  async getByPatientId(patientId) {
    if (!patientId) return []
    const resolved = await PatientModel.resolvePatient(patientId)
    const numId = resolved?.id || (parseInt(patientId, 10) || null)
    const uniqueCode = resolved?.patient_unique_code || (typeof patientId === 'string' && patientId.startsWith('AC-') ? patientId : null)
    const patientCode = resolved?.patient_id || null
    const isNum = typeof numId === 'number' && !isNaN(numId)

    if (isConnected()) {
      try {
        let sql = `
          SELECT a.*, 
                 p.name as patient_name, p.patient_unique_code, p.patient_id as patient_code_id,
                 d.name as doctor_name, d.specialization as doctor_specialization, d.room as doctor_room, d.doctor_id as doctor_code_id,
                 h.name as hospital_name, h.address as hospital_address
          FROM appointments a
          JOIN patients p ON a.patient_id = p.id
          JOIN doctors d ON a.doctor_id = d.id
          LEFT JOIN hospitals h ON a.hospital_id = h.id
          WHERE 1=0
        `
        const params = []
        if (isNum) {
          params.push(numId)
          sql += ` OR a.patient_id = $${params.length}`
        }
        if (uniqueCode) {
          params.push(uniqueCode)
          sql += ` OR UPPER(p.patient_unique_code) = UPPER($${params.length}) OR p.patient_id = $${params.length}`
        }
        sql += ` ORDER BY a.id DESC`

        const res = await query(sql, params)
        return res.rows
      } catch (err) {
        console.warn('[AppointmentModel] DB query error, using memory fallback:', err.message)
      }
    }

    return memoryAppointments
      .filter(a => 
        (isNum && (a.patient_id === numId || String(a.patientId) === String(numId))) ||
        (uniqueCode && a.patient_unique_code && a.patient_unique_code.toUpperCase() === uniqueCode.toUpperCase()) ||
        (patientCode && a.patient_code_id === patientCode)
      )
      .map(row => this._populateInMemory(row))
      .sort((a, b) => b.id - a.id)
  },

  async getByDoctorId(doctorId) {
    const numId = parseInt(doctorId, 10)
    if (isConnected()) {
      try {
        const res = await query(
          `SELECT a.*, p.name as patient_name, p.patient_unique_code, p.age as patient_age, p.gender as patient_gender
           FROM appointments a
           JOIN patients p ON a.patient_id = p.id
           WHERE a.doctor_id = $1
           ORDER BY a.id ASC`,
          [numId]
        )
        return res.rows
      } catch (err) {
        console.warn('[AppointmentModel] DB query error, using memory fallback:', err.message)
      }
    }

    return memoryAppointments
      .filter(a => a.doctor_id === numId)
      .map(row => this._populateInMemory(row))
      .sort((a, b) => a.id - b.id)
  },

  async isSlotBooked(doctorId, appointmentDate, timeSlot) {
    const numDocId = parseInt(doctorId, 10)
    if (isConnected()) {
      try {
        const res = await query(
          `SELECT id FROM appointments 
           WHERE doctor_id = $1 AND appointment_date = $2 AND time_slot = $3 AND status != 'Cancelled'
           LIMIT 1`,
          [numDocId, appointmentDate, timeSlot]
        )
        return res.rows.length > 0
      } catch (err) {
        console.warn('[AppointmentModel] DB slot check error:', err.message)
      }
    }

    return memoryAppointments.some(
      a => a.doctor_id === numDocId && a.appointment_date === appointmentDate && a.time_slot === timeSlot && a.status !== 'Cancelled'
    )
  },

  async getBookedSlotsForDate(doctorId, appointmentDate) {
    const numDocId = parseInt(doctorId, 10)
    if (isConnected()) {
      try {
        const res = await query(
          `SELECT time_slot FROM appointments 
           WHERE doctor_id = $1 AND appointment_date = $2 AND status != 'Cancelled'`,
          [numDocId, appointmentDate]
        )
        return res.rows.map(r => r.time_slot)
      } catch (err) {
        console.warn('[AppointmentModel] DB getBookedSlots error:', err.message)
      }
    }

    return memoryAppointments
      .filter(a => a.doctor_id === numDocId && a.appointment_date === appointmentDate && a.status !== 'Cancelled')
      .map(a => a.time_slot)
  },

  async updateStatus(id, { status, paymentStatus }) {
    const numId = parseInt(id, 10)
    if (isConnected()) {
      try {
        const res = await query(
          `UPDATE appointments SET 
            status = COALESCE($1, status),
            payment_status = COALESCE($2, payment_status),
            updated_at = CURRENT_TIMESTAMP 
           WHERE id = $3 RETURNING *`,
          [status, paymentStatus, numId]
        )
        if (res.rows.length > 0) return res.rows[0]
      } catch (err) {
        console.warn('[AppointmentModel] DB updateStatus error:', err.message)
      }
    }

    const item = memoryAppointments.find(a => a.id === numId)
    if (item) {
      if (status) item.status = status
      if (paymentStatus) item.payment_status = paymentStatus
      item.updated_at = new Date().toISOString()
      return item
    }
    return null
  },

  async getOpdQueueForDoctor(doctorId, categoryFilter = 'ALL') {
    const numDocId = parseInt(doctorId, 10)
    let rows = []

    if (isConnected()) {
      try {
        const res = await query(
          `SELECT a.*,
                  p.id as patient_db_id,
                  p.name as patient_name,
                  p.patient_id as patient_code_id,
                  p.patient_unique_code,
                  p.age as patient_age,
                  p.gender as patient_gender,
                  p.mobile as patient_mobile,
                  d.name as doctor_name,
                  d.room as doctor_room,
                  c.id as case_db_id,
                  c.case_number,
                  c.problem as case_problem,
                  c.duration as case_duration,
                  c.severity as case_severity,
                  c.symptoms as case_symptoms,
                  c.ai_assessment as case_ai_assessment,
                  c.original_patient_response as case_original_patient_response,
                  c.structured_history as case_structured_history,
                  c.lifecycle_stage as case_lifecycle_stage,
                  c.status as case_status
           FROM appointments a
           JOIN patients p ON a.patient_id = p.id
           JOIN doctors d ON a.doctor_id = d.id
           LEFT JOIN patient_cases c ON a.case_id = c.id
           WHERE a.doctor_id = $1
             AND a.payment_status = 'Completed'
             AND a.status IN ('Waiting for Doctor', 'Waiting', 'Current', 'In Consultation', 'Completed', 'Skipped')
           ORDER BY 
             CASE 
               WHEN a.status IN ('Current', 'In Consultation') THEN 1
               WHEN a.status IN ('Waiting for Doctor', 'Waiting') THEN 2
               WHEN a.status = 'Skipped' THEN 3
               WHEN a.status = 'Completed' THEN 4
               ELSE 5
             END,
             a.id ASC`,
          [numDocId]
        )
        rows = res.rows
      } catch (err) {
        console.warn('[AppointmentModel] DB getOpdQueue error, using memory fallback:', err.message)
      }
    }

    if (rows.length === 0 && !isConnected()) {
      rows = memoryAppointments
        .filter(a => a.doctor_id === numDocId && a.payment_status === 'Completed' && ['Waiting for Doctor', 'Waiting', 'Current', 'In Consultation', 'Completed', 'Skipped'].includes(a.status))
        .map(a => {
          const populated = this._populateInMemory(a)
          const caseRecord = a.case_id ? CaseModel.findByIdSync?.(a.case_id) : null
          return {
            ...populated,
            case_number: caseRecord?.case_number,
            case_problem: caseRecord?.problem,
            case_duration: caseRecord?.duration,
            case_severity: caseRecord?.severity,
            case_symptoms: caseRecord?.symptoms,
            case_ai_assessment: caseRecord?.ai_assessment,
            case_original_patient_response: caseRecord?.original_patient_response,
            case_structured_history: caseRecord?.structured_history,
            case_lifecycle_stage: caseRecord?.lifecycle_stage,
            case_status: caseRecord?.status
          }
        })
        .sort((a, b) => {
          const rank = s => (s === 'Current' || s === 'In Consultation' ? 1 : s === 'Waiting for Doctor' || s === 'Waiting' ? 2 : s === 'Skipped' ? 3 : s === 'Completed' ? 4 : 5)
          return rank(a.status) - rank(b.status) || a.id - b.id
        })
    }

    const formatted = rows.map(r => this._formatOpdQueueItem(r))

    if (categoryFilter && categoryFilter !== 'ALL') {
      const target = categoryFilter.toUpperCase()
      return formatted.filter(item => item.category === target)
    }

    return formatted
  },

  async getQueueItemById(id) {
    const numId = parseInt(id, 10)
    if (isConnected()) {
      try {
        const res = await query(
          `SELECT a.*,
                  p.id as patient_db_id,
                  p.name as patient_name,
                  p.patient_id as patient_code_id,
                  p.patient_unique_code,
                  p.age as patient_age,
                  p.gender as patient_gender,
                  p.mobile as patient_mobile,
                  p.blood_group as patient_blood_group,
                  p.address as patient_address,
                  d.name as doctor_name,
                  d.specialization as doctor_specialization,
                  d.room as doctor_room,
                  d.doctor_id as doctor_code_id,
                  c.id as case_db_id,
                  c.case_number,
                  c.problem as case_problem,
                  c.duration as case_duration,
                  c.severity as case_severity,
                  c.symptoms as case_symptoms,
                  c.assessment_answers as case_assessment_answers,
                  c.ai_assessment as case_ai_assessment,
                  c.original_patient_response as case_original_patient_response,
                  c.structured_history as case_structured_history,
                  c.lifecycle_stage as case_lifecycle_stage,
                  c.status as case_status
           FROM appointments a
           JOIN patients p ON a.patient_id = p.id
           JOIN doctors d ON a.doctor_id = d.id
           LEFT JOIN patient_cases c ON a.case_id = c.id
           WHERE a.id = $1 LIMIT 1`,
          [numId]
        )
        if (res.rows.length > 0) {
          return this._formatOpdQueueItem(res.rows[0])
        }
      } catch (err) {
        console.warn('[AppointmentModel] DB getQueueItemById error:', err.message)
      }
    }

    const row = memoryAppointments.find(a => a.id === numId)
    if (!row) return null
    const populated = this._populateInMemory(row)
    const caseRecord = row.case_id ? CaseModel.findByIdSync?.(row.case_id) : null
    return this._formatOpdQueueItem({
      ...populated,
      case_number: caseRecord?.case_number,
      case_problem: caseRecord?.problem,
      case_duration: caseRecord?.duration,
      case_severity: caseRecord?.severity,
      case_symptoms: caseRecord?.symptoms,
      case_assessment_answers: caseRecord?.assessment_answers,
      case_ai_assessment: caseRecord?.ai_assessment,
      case_original_patient_response: caseRecord?.original_patient_response,
      case_structured_history: caseRecord?.structured_history,
      case_lifecycle_stage: caseRecord?.lifecycle_stage,
      case_status: caseRecord?.status
    })
  },

  async updateQueueStatus(id, newStatus) {
    const numId = parseInt(id, 10)
    const validStatuses = ['Waiting', 'Current', 'Completed', 'Skipped', 'Waiting for Doctor', 'In Consultation']
    if (!validStatuses.includes(newStatus)) {
      throw new Error(`Invalid status: ${newStatus}`)
    }

    if (isConnected()) {
      try {
        const res = await query(
          `UPDATE appointments SET 
            status = $1,
            updated_at = CURRENT_TIMESTAMP 
           WHERE id = $2 RETURNING *`,
          [newStatus, numId]
        )
        if (newStatus === 'Completed' && res.rows.length > 0) {
          const appt = res.rows[0]
          if (appt.case_id) {
            await query(
              `UPDATE patient_cases 
               SET status = 'Completed', lifecycle_stage = 'COMPLETED', updated_at = CURRENT_TIMESTAMP 
               WHERE id = $1`,
              [appt.case_id]
            )
          }
          await query(
            `UPDATE prescriptions SET status = 'Issued', updated_at = CURRENT_TIMESTAMP WHERE appointment_id = $1`,
            [numId]
          )
        }
        if (res.rows.length > 0) {
          return this.getQueueItemById(numId)
        }
      } catch (err) {
        console.warn('[AppointmentModel] DB updateQueueStatus error:', err.message)
      }
    }

    const item = memoryAppointments.find(a => a.id === numId)
    if (item) {
      item.status = newStatus
      item.updated_at = new Date().toISOString()
      if (newStatus === 'Completed') {
        if (item.case_id) {
          await CaseModel.update(item.case_id, { status: 'Completed', lifecycle_stage: 'COMPLETED' })
        }
      }
      scheduleSaveFallbackState()
      return this.getQueueItemById(numId)
    }
    return null
  },

  async searchDoctorPatients(queryTerm = '', doctorId = 1) {
    const q = (queryTerm || '').trim()
    const likePattern = `%${q}%`

    if (isConnected()) {
      try {
        let sql = `
          SELECT 
            p.id as patient_db_id,
            p.patient_id as patient_code_id,
            p.patient_unique_code,
            p.name as patient_name,
            p.mobile as patient_mobile,
            p.age as patient_age,
            p.gender as patient_gender,
            a.id as appointment_id,
            a.appointment_number,
            a.token_number,
            a.appointment_date,
            a.time_slot,
            a.opd_room,
            a.problem as appointment_problem,
            a.severity as appointment_severity,
            a.status as appointment_status,
            a.payment_status,
            c.id as case_id,
            c.case_number,
            c.problem as case_problem
          FROM patients p
          LEFT JOIN appointments a ON a.patient_id = p.id AND a.payment_status = 'Completed'
          LEFT JOIN patient_cases c ON a.case_id = c.id OR c.patient_id = p.id
        `
        const params = []
        if (q) {
          sql += `
            WHERE p.name ILIKE $1 
               OR p.patient_id ILIKE $1 
               OR UPPER(p.patient_unique_code) = UPPER($2)
               OR p.patient_unique_code ILIKE $1
               OR a.token_number ILIKE $1
               OR a.appointment_number ILIKE $1
          `
          params.push(likePattern, q)
        }
        sql += ` ORDER BY a.id DESC NULLS LAST, p.id DESC`

        const res = await query(sql, params)
        return res.rows.map(r => this._formatSearchResult(r))
      } catch (err) {
        console.warn('[AppointmentModel] DB searchDoctorPatients error:', err.message)
      }
    }

    const patients = PatientModel.getAllSync ? PatientModel.getAllSync() : []
    const matching = []
    for (const p of patients) {
      const apt = memoryAppointments.find(a => a.patient_id === p.id && a.payment_status === 'Completed')
      const caseRecord = memoryAppointments.find(a => a.patient_id === p.id)?.case_id
        ? CaseModel.findByIdSync?.(memoryAppointments.find(a => a.patient_id === p.id).case_id)
        : null

      const matches = !q || 
        (p.name && p.name.toLowerCase().includes(q.toLowerCase())) ||
        (p.patient_id && p.patient_id.toLowerCase().includes(q.toLowerCase())) ||
        (p.patient_unique_code && p.patient_unique_code.toUpperCase() === q.toUpperCase()) ||
        (apt && apt.token_number && apt.token_number.toLowerCase().includes(q.toLowerCase())) ||
        (apt && apt.appointment_number && apt.appointment_number.toLowerCase().includes(q.toLowerCase()))

      if (matches) {
        matching.push(this._formatSearchResult({
          patient_db_id: p.id,
          patient_code_id: p.patient_id,
          patient_unique_code: p.patient_unique_code,
          patient_name: p.name,
          patient_mobile: p.mobile,
          patient_age: p.age,
          patient_gender: p.gender,
          appointment_id: apt?.id,
          appointment_number: apt?.appointment_number,
          token_number: apt?.token_number,
          appointment_date: apt?.appointment_date,
          time_slot: apt?.time_slot,
          opd_room: apt?.opd_room,
          appointment_problem: apt?.problem,
          appointment_severity: apt?.severity,
          appointment_status: apt?.status,
          payment_status: apt?.payment_status,
          case_id: caseRecord?.id,
          case_number: caseRecord?.case_number,
          case_problem: caseRecord?.problem
        }))
      }
    }
    return matching
  },

  _formatOpdQueueItem(r) {
    const rawStatus = r.status || 'Waiting'
    let status = 'Waiting'
    if (rawStatus === 'Current' || rawStatus === 'In Consultation') status = 'Current'
    else if (rawStatus === 'Completed') status = 'Completed'
    else if (rawStatus === 'Skipped') status = 'Skipped'
    else if (rawStatus === 'Waiting for Doctor' || rawStatus === 'Waiting') status = 'Waiting'

    const sev = (r.severity || r.case_severity || '').toUpperCase()
    let category = 'ROUTINE'
    if (sev === 'URGENT' || sev === 'SEVERE' || sev === 'CRITICAL' || sev === 'EMERGENCY') {
      category = 'URGENT'
    } else if (sev === 'PRIORITY' || sev === 'MODERATE') {
      category = 'PRIORITY'
    }

    const tokenNum = parseInt(String(r.token_number || '').replace(/\D/g, ''), 10) || r.id

    return {
      id: r.id,
      appointmentId: r.id,
      appointmentNumber: r.appointment_number,
      token: tokenNum,
      tokenNumber: r.token_number || `#${tokenNum}`,
      name: r.patient_name,
      patientName: r.patient_name,
      patientDbId: r.patient_db_id || r.patient_id,
      patientId: r.patient_code_id || r.patient_id,
      patientUniqueCode: r.patient_unique_code,
      uniqueCode: r.patient_unique_code,
      age: r.patient_age ? `${r.patient_age}y / ${r.patient_gender || 'Male'}` : (r.patient_gender ? `${r.patient_gender}` : '—'),
      patientAge: r.patient_age,
      patientGender: r.patient_gender,
      patientMobile: r.patient_mobile,
      patientBloodGroup: r.patient_blood_group,
      patientAddress: r.patient_address,
      doctorName: r.doctor_name,
      doctorSpecialization: r.doctor_specialization,
      doctorRoom: r.doctor_room,
      date: r.appointment_date,
      time: r.time_slot,
      timeSlot: r.time_slot,
      room: r.opd_room || r.doctor_room || 'Room 104',
      opdRoom: r.opd_room || r.doctor_room || 'Room 104',
      extra: `${r.opd_room || r.doctor_room || 'Room 104'} • ${r.appointment_date}`,
      problem: r.problem || r.case_problem || 'Consultation review for reported symptoms.',
      chiefComplaint: r.problem || r.case_problem || 'Consultation review for reported symptoms.',
      severity: r.severity || r.case_severity || 'Moderate',
      category,
      status,
      paymentStatus: r.payment_status,
      caseId: r.case_id || r.case_db_id,
      caseNumber: r.case_number,
      caseDetails: (r.case_problem || r.case_number) ? {
        id: r.case_id || r.case_db_id,
        caseNumber: r.case_number,
        problem: r.case_problem,
        duration: r.case_duration,
        severity: r.case_severity,
        symptoms: typeof r.case_symptoms === 'string' ? JSON.parse(r.case_symptoms || '[]') : (r.case_symptoms || []),
        assessmentAnswers: typeof r.case_assessment_answers === 'string' ? JSON.parse(r.case_assessment_answers || '[]') : (r.case_assessment_answers || []),
        aiAssessment: typeof r.case_ai_assessment === 'string' ? JSON.parse(r.case_ai_assessment || '{}') : (r.case_ai_assessment || {}),
        originalPatientResponse: r.case_original_patient_response || r.case_problem || null,
        structuredHistory: typeof r.case_structured_history === 'string'
          ? JSON.parse(r.case_structured_history || '{}')
          : (r.case_structured_history || {
              chiefComplaint: r.case_problem || 'Not provided',
              duration: r.case_duration || 'Unknown',
              symptoms: typeof r.case_symptoms === 'string' ? JSON.parse(r.case_symptoms || '[]') : (r.case_symptoms || []),
              associatedSymptoms: [],
              pastMedicalHistory: 'Not provided',
              currentMedications: 'Not provided',
              allergies: 'Unknown',
              relevantNegatives: [],
              additionalInformation: 'Not provided'
            }),
        lifecycleStage: r.case_lifecycle_stage || 'PATIENT CONFIRMED',
        status: r.case_status || 'Active'
      } : null
    }
  },

  _formatSearchResult(r) {
    const hasAppointment = !!r.appointment_id
    const tokenNum = r.token_number ? parseInt(String(r.token_number).replace(/\D/g, ''), 10) : null
    const currentYear = new Date().getFullYear()
    return {
      id: r.patient_code_id || (r.patient_db_id ? `AC-${currentYear}-${r.patient_db_id}` : `AC-${currentYear}-000000`),
      patientDbId: r.patient_db_id,
      patientId: r.patient_code_id,
      patientUniqueCode: r.patient_unique_code,
      uniqueCode: r.patient_unique_code,
      name: r.patient_name,
      patientName: r.patient_name,
      token: r.token_number || (tokenNum ? `#${tokenNum}` : 'Not Booked'),
      tokenNum: tokenNum,
      room: r.opd_room || 'Room 104',
      date: r.appointment_date || 'Registered Citizen',
      time: r.time_slot || '—',
      age: r.patient_age ? `${r.patient_age}y / ${r.patient_gender || 'Male'}` : (r.patient_gender ? `${r.patient_gender}` : '—'),
      chiefComplaint: r.appointment_problem || r.case_problem || 'Outpatient Consultation',
      hasAppointment,
      appointmentId: r.appointment_id,
      appointmentNumber: r.appointment_number,
      status: r.appointment_status || 'Registered',
      caseId: r.case_id,
      caseNumber: r.case_number,
      fullAppointment: hasAppointment ? {
        id: r.appointment_id,
        appointmentNumber: r.appointment_number,
        token: r.token_number,
        date: r.appointment_date,
        time: r.time_slot,
        room: r.opd_room,
        chiefComplaint: r.appointment_problem
      } : null
    }
  },

  _populateInMemory(row) {
    const currentYear = new Date().getFullYear()
    const patient = (row.patient_id ? PatientModel.getByIdSync?.(row.patient_id) : null) ||
      (row.patient_unique_code ? PatientModel.findByUniqueCodeSync?.(row.patient_unique_code) : null) || {
      name: row.patient_name || (row.patient_id ? `Patient #${row.patient_id}` : 'Patient'),
      patient_id: row.patient_code_id || (row.patient_id ? `AC-${currentYear}-${row.patient_id}` : `AC-${currentYear}-000000`),
      patient_unique_code: row.patient_unique_code || 'AC-000000',
      age: row.patient_age || '',
      gender: row.patient_gender || '',
      mobile: row.patient_mobile || ''
    }
    return {
      ...row,
      patient_name: patient.name || row.patient_name || 'Patient',
      patient_code_id: patient.patient_id || row.patient_code_id || (patient.id ? `AC-${currentYear}-${patient.id}` : `AC-${currentYear}-000000`),
      patient_unique_code: patient.patient_unique_code || row.patient_unique_code || 'AC-000000',
      patient_age: patient.age !== undefined ? patient.age : row.patient_age,
      patient_gender: patient.gender || row.patient_gender,
      patient_mobile: patient.mobile || row.patient_mobile,
      doctor_name: 'Dr. Ramanathan Venkatraman',
      doctor_specialization: 'General Medicine',
      doctor_room: 'Room 104',
      doctor_code_id: 'DOC-1042',
      hospital_name: 'District Civil Hospital',
      hospital_address: 'Sector 4, Civil Lines, New Delhi — 110054'
    }
  }
}

