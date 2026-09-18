import { query, isConnected } from '../db/index.js'
import { memoryRequests, memoryReports, scheduleSaveFallbackState } from '../db/fallbackStore.js'
import { PatientModel } from './patientModel.js'
import { DoctorModel } from './doctorModel.js'

let requestCounter = 1
let reportCounter = 1

function generateRequestNumber(testName) {
  const name = (testName || '').toUpperCase()
  let prefix = 'REQ'
  if (name.includes('MRI')) prefix = 'MRI'
  else if (name.includes('X-RAY') || name.includes('XRAY')) prefix = 'XRAY'
  else if (name.includes('BLOOD') || name.includes('CBC') || name.includes('LFT') || name.includes('GLUCOSE') || name.includes('CRP') || name.includes('ESR')) prefix = 'BLD'
  else if (name.includes('ULTRASOUND') || name.includes('USG') || name.includes('SONO')) prefix = 'USG'
  else if (name.includes('CT')) prefix = 'CT'

  const year = new Date().getFullYear()
  const seq = String(requestCounter++).padStart(6, '0')
  return `${prefix}-${year}-${seq}`
}

function generateReportId() {
  const year = new Date().getFullYear()
  const seq = String(reportCounter++).padStart(6, '0')
  return `REP-${year}-${seq}`
}

function formatRequest(row, patient = null, doctor = null) {
  if (!row) return null
  const pId = row.patient_id || row.patientId || patient?.id
  const patientName = row.patient_name || patient?.name || (pId ? `Patient #${pId}` : 'Patient')
  const patientUniqueCode = row.patient_unique_code || patient?.patient_unique_code || (pId ? `AC-P${pId}` : 'AC-000000')
  const doctorName = row.doctor_name || doctor?.name || 'Dr. Ramanathan Venkatraman'
  const doctorId = row.doctor_id || doctor?.id || 1
  const doctorCode = row.doctor_code || doctor?.doctor_id || 'DOC-1042'
  const testScan = row.test_scan || row.test_name
  const notes = row.request_notes || row.clinical_notes || ''

  return {
    ...row,
    id: row.id,
    requestId: row.request_id || row.requestId,
    requestNumber: row.request_number || row.requestNumber || row.request_id,
    request_id: row.request_id || row.requestId,
    request_number: row.request_number || row.requestNumber || row.request_id,
    appointmentId: row.appointment_id || row.appointmentId,
    appointment_id: row.appointment_id || row.appointmentId,
    caseId: row.case_id || row.caseId,
    case_id: row.case_id || row.caseId,
    patientId: pId,
    patient_id: pId,
    patientUniqueCode: patientUniqueCode,
    patient_unique_code: patientUniqueCode,
    patientName: patientName,
    patient_name: patientName,
    patientAge: row.patient_age !== undefined ? row.patient_age : (patient?.age || ''),
    patient_age: row.patient_age !== undefined ? row.patient_age : (patient?.age || ''),
    patientGender: row.patient_gender || patient?.gender || '',
    patient_gender: row.patient_gender || patient?.gender || '',
    doctorId: doctorId,
    doctor_id: doctorId,
    doctorName: doctorName,
    doctor_name: doctorName,
    doctorCode: doctorCode,
    testScan: testScan,
    test_scan: testScan,
    testName: row.test_name || testScan,
    test_name: row.test_name || testScan,
    testCode: row.test_code || row.testCode,
    category: row.category || 'Radiology & Imaging',
    clinicalNotes: notes,
    clinical_notes: notes,
    requestNotes: notes,
    request_notes: notes,
    priority: row.priority || 'Urgent',
    status: row.status || 'Pending',
    createdAt: row.created_at || row.createdAt,
    created_at: row.created_at || row.createdAt,
    updatedAt: row.updated_at || row.updatedAt,
    updated_at: row.updated_at || row.updatedAt
  }
}

function formatReport(row, patient = null, doctor = null) {
  if (!row) return null
  const pId = row.patient_id || row.patientId || patient?.id
  const patientName = row.patient_name || patient?.name || (pId ? `Patient #${pId}` : 'Patient')
  const patientUniqueCode = row.patient_unique_code || patient?.patient_unique_code || (pId ? `AC-P${pId}` : 'AC-000000')

  return {
    ...row,
    id: row.id,
    reportId: row.report_id || row.reportId,
    report_id: row.report_id || row.reportId,
    requestId: row.request_id || row.requestId,
    request_id: row.request_id || row.requestId,
    requestNumber: row.request_number || row.requestNumber || row.request_id,
    request_number: row.request_number || row.requestNumber || row.request_id,
    patientId: pId,
    patient_id: pId,
    patientUniqueCode: patientUniqueCode,
    patient_unique_code: patientUniqueCode,
    patientName: patientName,
    patient_name: patientName,
    doctorId: row.doctor_id || doctor?.id || 1,
    doctor_id: row.doctor_id || doctor?.id || 1,
    doctorName: row.doctor_name || doctor?.name || 'Dr. Ramanathan Venkatraman',
    doctor_name: row.doctor_name || doctor?.name || 'Dr. Ramanathan Venkatraman',
    testScan: row.test_scan || row.test_name,
    test_scan: row.test_scan || row.test_name,
    testName: row.test_name || row.test_scan,
    test_name: row.test_name || row.test_scan,
    category: row.category || 'Radiology',
    fileName: row.file_name || row.fileName || 'diagnostic_report.pdf',
    file_name: row.file_name || row.fileName || 'diagnostic_report.pdf',
    fileSize: row.file_size || row.fileSize || '3.5 MB',
    file_size: row.file_size || row.fileSize || '3.5 MB',
    fileUrl: row.file_url || row.fileUrl || '',
    file_url: row.file_url || row.fileUrl || '',
    findings: row.findings || '',
    impression: row.impression || '',
    reportData: row.report_data || row.reportData || null,
    report_data: row.report_data || row.reportData || null,
    reportFileReference: row.report_file_reference || row.reportFileReference || row.file_name || '',
    report_file_reference: row.report_file_reference || row.reportFileReference || row.file_name || '',
    verifiedBy: row.verified_by || row.verifiedBy || 'Radiographer S. Varma',
    verified_by: row.verified_by || row.verifiedBy || 'Radiographer S. Varma',
    status: row.status || 'Completed',
    createdAt: row.created_at || row.createdAt,
    created_at: row.created_at || row.createdAt,
    updatedAt: row.updated_at || row.updatedAt,
    updated_at: row.updated_at || row.updatedAt
  }
}

export const DiagnosticModel = {
  async createRequest({
    requestId,
    requestNumber,
    appointmentId,
    caseId,
    patientId,
    patientUniqueCode,
    doctorId,
    testName,
    testScan,
    testCode,
    category,
    clinicalNotes,
    requestNotes,
    priority
  }) {
    const numPatientId = parseInt(patientId, 10)
    const numDoctorId = doctorId ? parseInt(doctorId, 10) : 1
    const numAppointmentId = appointmentId ? parseInt(appointmentId, 10) : null
    const numCaseId = caseId ? parseInt(caseId, 10) : null

    // Determine patient details to maintain permanent patient_unique_code
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

    const effectiveTestName = testScan || testName || 'Diagnostic Investigation'
    const generatedReqNum = requestNumber || generateRequestNumber(effectiveTestName)
    const generatedReqId = requestId || `REQ-${generatedReqNum}`
    const notes = requestNotes || clinicalNotes || ''

    if (isConnected()) {
      try {
        const res = await query(
          `INSERT INTO diagnostic_requests (
            request_id, request_number, appointment_id, case_id, patient_id,
            patient_unique_code, doctor_id, test_name, test_scan, test_code,
            category, clinical_notes, request_notes, priority, status
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 'Pending')
          RETURNING *`,
          [
            generatedReqId,
            generatedReqNum,
            numAppointmentId,
            numCaseId,
            numPatientId || patient?.id || 1,
            finalPatientUniqueCode,
            numDoctorId || doctor?.id || 1,
            effectiveTestName,
            effectiveTestName,
            testCode || null,
            category || 'Radiology & Imaging',
            notes,
            notes,
            priority || 'Routine'
          ]
        )
        if (res.rows.length > 0) {
          const row = res.rows[0]
          const formatted = formatRequest(row, patient, doctor)
          memoryRequests.unshift(formatted)
          return formatted
        }
      } catch (err) {
        console.warn('[DiagnosticModel] PostgreSQL insert request failed, using memory store:', err.message)
      }
    }

    // In-memory creation
    const newId = memoryRequests.length > 0 ? Math.max(...memoryRequests.map(r => r.id || 0)) + 1 : 1
    const newReq = {
      id: newId,
      request_id: generatedReqId,
      request_number: generatedReqNum,
      appointment_id: numAppointmentId,
      case_id: numCaseId,
      patient_id: numPatientId || patient?.id || 1,
      patient_unique_code: finalPatientUniqueCode,
      doctor_id: numDoctorId || doctor?.id || 1,
      test_name: effectiveTestName,
      test_scan: effectiveTestName,
      test_code: testCode || null,
      category: category || 'Radiology & Imaging',
      clinical_notes: notes,
      request_notes: notes,
      priority: priority || 'Routine',
      status: 'Pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    const formatted = formatRequest(newReq, patient, doctor)
    memoryRequests.unshift(formatted)
    scheduleSaveFallbackState()
    return formatted
  },

  async getAllRequests(filter = {}) {
    const { status, patientId } = filter

    if (isConnected()) {
      try {
        let sql = `
          SELECT dr.*, 
                 p.name as patient_name, p.patient_unique_code, p.age as patient_age, p.gender as patient_gender,
                 d.name as doctor_name, d.doctor_id as doctor_code, d.specialization as doctor_specialization,
                 d.room as doctor_room, d.hospital_name
          FROM diagnostic_requests dr
          LEFT JOIN patients p ON dr.patient_id = p.id
          LEFT JOIN doctors d ON dr.doctor_id = d.id
          WHERE 1=1
        `
        const params = []
        if (status) {
          params.push(status)
          sql += ` AND dr.status = $${params.length}`
        }
        if (patientId) {
          params.push(parseInt(patientId, 10))
          sql += ` AND dr.patient_id = $${params.length}`
        }
        sql += ` ORDER BY dr.id DESC`

        const res = await query(sql, params)
        if (res.rows.length > 0) {
          return res.rows.map(r => formatRequest(r))
        }
      } catch (err) {
        console.warn('[DiagnosticModel] PostgreSQL query failed, using memory fallback:', err.message)
      }
    }

    // In-memory filtering
    let list = [...memoryRequests]
    if (status) {
      list = list.filter(r => (r.status || '').toLowerCase() === status.toLowerCase())
    }
    if (patientId) {
      list = list.filter(r => String(r.patient_id) === String(patientId) || String(r.patientId) === String(patientId))
    }
    return list.map(r => formatRequest(r))
  },

  async findByRequestId(idOrNumber) {
    if (!idOrNumber) return null
    const str = String(idOrNumber).trim()

    if (isConnected()) {
      try {
        const isNum = !isNaN(str)
        const sql = `
          SELECT dr.*, 
                 p.name as patient_name, p.patient_unique_code, p.age as patient_age, p.gender as patient_gender,
                 d.name as doctor_name, d.doctor_id as doctor_code, d.specialization as doctor_specialization,
                 d.room as doctor_room, d.hospital_name
          FROM diagnostic_requests dr
          LEFT JOIN patients p ON dr.patient_id = p.id
          LEFT JOIN doctors d ON dr.doctor_id = d.id
          WHERE dr.request_number = $1 OR dr.request_id = $1 ${isNum ? 'OR dr.id = $2' : ''}
          LIMIT 1
        `
        const params = isNum ? [str, parseInt(str, 10)] : [str]
        const res = await query(sql, params)
        if (res.rows.length > 0) {
          return formatRequest(res.rows[0])
        }
      } catch (err) {
        console.warn('[DiagnosticModel] findByRequestId PostgreSQL failed, using memory fallback:', err.message)
      }
    }

    const item = memoryRequests.find(r => 
      String(r.id) === str ||
      (r.request_number && r.request_number.toUpperCase() === str.toUpperCase()) ||
      (r.requestNumber && r.requestNumber.toUpperCase() === str.toUpperCase()) ||
      (r.request_id && r.request_id.toUpperCase() === str.toUpperCase()) ||
      (r.requestId && r.requestId.toUpperCase() === str.toUpperCase())
    )
    return item ? formatRequest(item) : null
  },

  async updateRequestStatus(idOrNumber, status) {
    if (!idOrNumber) return null
    const str = String(idOrNumber).trim()
    const validStatus = status === 'In Progress' ? 'In Progress' : status === 'Completed' ? 'Completed' : 'Pending'

    if (isConnected()) {
      try {
        const isNum = !isNaN(str)
        const sql = `
          UPDATE diagnostic_requests
          SET status = $1, updated_at = CURRENT_TIMESTAMP
          WHERE request_number = $2 OR request_id = $2 ${isNum ? 'OR id = $3' : ''}
          RETURNING *
        `
        const params = isNum ? [validStatus, str, parseInt(str, 10)] : [validStatus, str]
        const res = await query(sql, params)
        if (res.rows.length > 0) {
          const formatted = formatRequest(res.rows[0])
          const idx = memoryRequests.findIndex(r => String(r.id) === String(formatted.id) || r.request_number === formatted.request_number)
          if (idx !== -1) memoryRequests[idx] = formatted
          return formatted
        }
      } catch (err) {
        console.warn('[DiagnosticModel] updateRequestStatus PostgreSQL failed, using memory fallback:', err.message)
      }
    }

    const item = memoryRequests.find(r => 
      String(r.id) === str ||
      (r.request_number && r.request_number.toUpperCase() === str.toUpperCase()) ||
      (r.requestNumber && r.requestNumber.toUpperCase() === str.toUpperCase()) ||
      (r.request_id && r.request_id.toUpperCase() === str.toUpperCase()) ||
      (r.requestId && r.requestId.toUpperCase() === str.toUpperCase())
    )
    if (item) {
      item.status = validStatus
      item.updated_at = new Date().toISOString()
      item.updatedAt = item.updated_at
      return formatRequest(item)
    }
    return null
  },

  async createReport({
    reportId,
    requestId,
    requestNumber,
    patientId,
    patientUniqueCode,
    doctorId,
    testName,
    testScan,
    category,
    fileName,
    fileSize,
    fileUrl,
    findings,
    impression,
    reportData,
    reportFileReference,
    verifiedBy
  }) {
    // 1. Look up corresponding request to link fields reliably
    const req = await this.findByRequestId(requestId || requestNumber)
    const effectiveRequestId = req?.id || 1
    const effectiveReqNumber = req?.requestNumber || req?.request_number || requestNumber || requestId
    const effectivePatientId = req?.patientId || req?.patient_id || patientId || 1
    const effectivePatientUniqueCode = req?.patientUniqueCode || req?.patient_unique_code || patientUniqueCode || 'AC-7F42K9'
    const effectiveDoctorId = req?.doctorId || req?.doctor_id || doctorId || 1
    const effectiveTestName = testScan || testName || req?.testScan || req?.test_name || 'Diagnostic Investigation'
    const effectiveCategory = category || req?.category || 'Radiology'
    const generatedReportId = reportId || generateReportId()
    const effectiveVerifiedBy = verifiedBy || 'Radiographer S. Varma'
    const effectiveFileRef = reportFileReference || fileName || 'diagnostic_report.pdf'

    let patient = await PatientModel.findById(effectivePatientId)
    let doctor = await DoctorModel.findById(effectiveDoctorId)

    if (isConnected()) {
      try {
        const reportRes = await query(
          `INSERT INTO diagnostic_reports (
            report_id, request_id, request_number, patient_id, patient_unique_code,
            doctor_id, test_name, test_scan, category, file_name, file_size, file_url,
            findings, impression, report_data, report_file_reference, verified_by, status
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, 'Completed')
          RETURNING *`,
          [
            generatedReportId,
            effectiveRequestId,
            effectiveReqNumber,
            effectivePatientId,
            effectivePatientUniqueCode,
            effectiveDoctorId,
            effectiveTestName,
            effectiveTestName,
            effectiveCategory,
            fileName || 'diagnostic_report.pdf',
            fileSize || '3.5 MB',
            fileUrl || '',
            findings || '',
            impression || findings || '',
            reportData ? JSON.stringify(reportData) : null,
            effectiveFileRef,
            effectiveVerifiedBy
          ]
        )

        // Mark corresponding request as Completed
        await query(
          "UPDATE diagnostic_requests SET status = 'Completed', updated_at = CURRENT_TIMESTAMP WHERE id = $1 OR request_id = $2 OR request_number = $2",
          [effectiveRequestId, effectiveReqNumber]
        )

        if (reportRes.rows.length > 0) {
          const formatted = formatReport(reportRes.rows[0], patient, doctor)
          memoryReports.unshift(formatted)
          const memReqIdx = memoryRequests.findIndex(r => String(r.id) === String(effectiveRequestId) || r.request_number === effectiveReqNumber || r.requestNumber === effectiveReqNumber)
          if (memReqIdx !== -1) {
            memoryRequests[memReqIdx].status = 'Completed'
            memoryRequests[memReqIdx].updated_at = new Date().toISOString()
            memoryRequests[memReqIdx].updatedAt = memoryRequests[memReqIdx].updated_at
          }
          return formatted
        }
      } catch (err) {
        console.warn('[DiagnosticModel] createReport PostgreSQL failed, using memory store:', err.message)
      }
    }

    // In-memory fallback
    const newId = memoryReports.length > 0 ? Math.max(...memoryReports.map(r => r.id || 0)) + 1 : 1
    const newRep = {
      id: newId,
      report_id: generatedReportId,
      request_id: effectiveRequestId,
      request_number: effectiveReqNumber,
      patient_id: effectivePatientId,
      patient_unique_code: effectivePatientUniqueCode,
      doctor_id: effectiveDoctorId,
      test_name: effectiveTestName,
      test_scan: effectiveTestName,
      category: effectiveCategory,
      file_name: fileName || 'diagnostic_report.pdf',
      file_size: fileSize || '3.5 MB',
      file_url: fileUrl || '',
      findings: findings || '',
      impression: impression || findings || '',
      report_data: reportData || null,
      report_file_reference: effectiveFileRef,
      verified_by: effectiveVerifiedBy,
      status: 'Completed',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const formatted = formatReport(newRep, patient, doctor)
    memoryReports.unshift(formatted)
    const memReqIdx = memoryRequests.findIndex(r => 
      String(r.id) === String(effectiveRequestId) || 
      (r.request_number && r.request_number.toUpperCase() === String(effectiveReqNumber).toUpperCase()) ||
      (r.requestNumber && r.requestNumber.toUpperCase() === String(effectiveReqNumber).toUpperCase()) ||
      (r.request_id && r.request_id.toUpperCase() === String(effectiveReqNumber).toUpperCase()) ||
      (r.requestId && r.requestId.toUpperCase() === String(effectiveReqNumber).toUpperCase())
    )
    if (memReqIdx !== -1) {
      memoryRequests[memReqIdx].status = 'Completed'
      memoryRequests[memReqIdx].updated_at = new Date().toISOString()
      memoryRequests[memReqIdx].updatedAt = memoryRequests[memReqIdx].updated_at
    }
    scheduleSaveFallbackState()
    return formatted
  },

  async getReportsByPatientId(patientId) {
    if (!patientId) return []
    const resolved = await PatientModel.resolvePatient(patientId)
    const numId = resolved?.id || (parseInt(patientId, 10) || null)
    const uniqueCode = resolved?.patient_unique_code || (typeof patientId === 'string' && patientId.startsWith('AC-') ? patientId : null)
    const patientCode = resolved?.patient_id || null
    const isNum = typeof numId === 'number' && !isNaN(numId)

    if (isConnected()) {
      try {
        let sql = `
          SELECT r.*, 
                 p.name as patient_name, p.patient_unique_code,
                 d.name as doctor_name, d.doctor_id as doctor_code, d.specialization as doctor_specialization
          FROM diagnostic_reports r
          LEFT JOIN patients p ON r.patient_id = p.id
          LEFT JOIN doctors d ON r.doctor_id = d.id
          WHERE 1=0
        `
        const params = []
        if (isNum) {
          params.push(numId)
          sql += ` OR r.patient_id = $${params.length}`
        }
        if (uniqueCode) {
          params.push(uniqueCode)
          sql += ` OR UPPER(p.patient_unique_code) = UPPER($${params.length}) OR p.patient_id = $${params.length}`
        }
        sql += ` ORDER BY r.id DESC`

        const res = await query(sql, params)
        if (res.rows.length > 0) {
          return res.rows.map(r => formatReport(r))
        }
      } catch (err) {
        console.warn('[DiagnosticModel] getReportsByPatientId PostgreSQL failed, using memory fallback:', err.message)
      }
    }

    return memoryReports
      .filter(r => 
        (isNum && (r.patient_id === numId || String(r.patientId) === String(numId))) ||
        (uniqueCode && r.patient_unique_code && r.patient_unique_code.toUpperCase() === uniqueCode.toUpperCase()) ||
        (patientCode && (r.patient_code_id === patientCode || r.patient_id === patientCode))
      )
      .map(r => formatReport(r))
  },

  async getRequestsByPatientId(patientId) {
    if (!patientId) return []
    const resolved = await PatientModel.resolvePatient(patientId)
    const numId = resolved?.id || (parseInt(patientId, 10) || null)
    const uniqueCode = resolved?.patient_unique_code || (typeof patientId === 'string' && patientId.startsWith('AC-') ? patientId : null)
    const patientCode = resolved?.patient_id || null
    const isNum = typeof numId === 'number' && !isNaN(numId)

    if (isConnected()) {
      try {
        let sql = `
          SELECT dr.*, 
                 p.name as patient_name, p.patient_unique_code,
                 d.name as doctor_name, d.doctor_id as doctor_code
          FROM diagnostic_requests dr
          LEFT JOIN patients p ON dr.patient_id = p.id
          LEFT JOIN doctors d ON dr.doctor_id = d.id
          WHERE 1=0
        `
        const params = []
        if (isNum) {
          params.push(numId)
          sql += ` OR dr.patient_id = $${params.length}`
        }
        if (uniqueCode) {
          params.push(uniqueCode)
          sql += ` OR UPPER(p.patient_unique_code) = UPPER($${params.length}) OR p.patient_id = $${params.length}`
        }
        sql += ` ORDER BY dr.id DESC`

        const res = await query(sql, params)
        if (res.rows.length > 0) {
          return res.rows.map(r => formatRequest(r))
        }
      } catch (err) {
        console.warn('[DiagnosticModel] getRequestsByPatientId PostgreSQL failed, using memory fallback:', err.message)
      }
    }

    return memoryRequests
      .filter(r => 
        (isNum && (r.patient_id === numId || String(r.patientId) === String(numId))) ||
        (uniqueCode && r.patient_unique_code && r.patient_unique_code.toUpperCase() === uniqueCode.toUpperCase()) ||
        (patientCode && (r.patient_code_id === patientCode || r.patient_id === patientCode))
      )
      .map(r => formatRequest(r))
  }
}
