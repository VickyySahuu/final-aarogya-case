/**
 * AAROGYA CASE — Test Suite: Patient Identity & Historical Data Linking (SIH26047)
 * 
 * Verifies all criteria under Section 22:
 * A. One patient record for VIKASH KUMAR (9546011026).
 * B. Historical records reference the same patient ID.
 * C. New case references the same patient ID.
 * D. New appointment references the same patient ID.
 * E. New consultation becomes part of patient history.
 * F. Second visit sees first visit as previous history.
 * G. Restart does not lose history.
 * H. Patient isolation works.
 * I. No duplicate patient is created.
 * J. Timeline contains both historical and new events.
 * K. Doctor workspace shows current + previous information.
 */

import http from 'http'
import assert from 'assert'
import app from './server.js'
import { PatientModel } from './models/patientModel.js'
import { CaseModel } from './models/caseModel.js'
import { AppointmentModel } from './models/appointmentModel.js'
import { PrescriptionModel } from './models/prescriptionModel.js'
import { DiagnosticModel } from './models/diagnosticModel.js'
import { TimelineService } from './services/timelineService.js'
import { DemoSeedService } from './services/demoSeedService.js'
import { saveFallbackState, loadFallbackState, memoryPatients } from './db/fallbackStore.js'

let server
let baseUrl
let doctorToken
let patientToken
let patientRecord

let passed = 0
let failed = 0

async function asyncTest(name, fn) {
  try {
    await fn()
    passed++
    console.log(`[PASS] ${name}`)
  } catch (err) {
    failed++
    console.error(`[FAIL] ${name}: ${err.message}`)
  }
}

async function apiRequest(endpoint, { method = 'GET', headers = {}, body = null } = {}) {
  const url = `${baseUrl}${endpoint}`
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    }
  }
  if (body) {
    options.body = typeof body === 'string' ? body : JSON.stringify(body)
  }
  const res = await fetch(url, options)
  const data = await res.json().catch(() => null)
  return { status: res.status, ok: res.ok, data }
}

async function runTests() {
  console.log('===============================================================')
  console.log('  SIH26047 — PATIENT IDENTITY + HISTORICAL DATA LINKING TESTS  ')
  console.log('===============================================================')

  server = http.createServer(app)
  await new Promise((resolve) => server.listen(0, resolve))
  const port = server.address().port
  baseUrl = `http://127.0.0.1:${port}`

  // Ensure seed data is initialized
  await DemoSeedService.ensureDemoPatient()

  // 1. Doctor login
  const docLogin = await apiRequest('/api/auth/doctor/login', {
    method: 'POST',
    body: { doctorId: 'DOC-1042' }
  })
  assert.strictEqual(docLogin.status, 200, 'Doctor login must succeed')
  doctorToken = docLogin.data.token

  // -------------------------------------------------------------
  // A. ONE PATIENT RECORD FOR VIKASH KUMAR (9546011026)
  // -------------------------------------------------------------
  await asyncTest('A.1 Patient login with mobile 9546011026 resolves to canonical record', async () => {
    const res = await apiRequest('/api/auth/patient/login', {
      method: 'POST',
      body: { mobile: '9546011026' }
    })
    assert.strictEqual(res.status, 200)
    assert.strictEqual(res.data.success, true)
    assert.strictEqual(res.data.patient.name, 'VIKASH KUMAR')
    assert.strictEqual(res.data.patient.patient_unique_code, 'AC-VK2604')
    patientToken = res.data.token
    patientRecord = res.data.patient
  })

  await asyncTest('A.2 Exactly ONE patient record exists for VIKASH KUMAR / 9546011026', async () => {
    const byMobile = await PatientModel.findByMobile('9546011026')
    assert.ok(byMobile, 'Must find patient by mobile')
    assert.strictEqual(byMobile.patient_unique_code, 'AC-VK2604')

    const byCode = await PatientModel.findByUniqueCode('AC-VK2604')
    assert.ok(byCode, 'Must find patient by unique code')
    assert.strictEqual(byCode.id, byMobile.id)

    // Check count in database or memory store
    const allMatching = memoryPatients ? memoryPatients.filter(p => p.mobile === '9546011026' || (p.mobile && p.mobile.replace(/\D/g, '').slice(-10) === '9546011026')) : [byMobile]
    assert.strictEqual(allMatching.length, 1, 'Exactly one patient record must exist for 9546011026')
  })

  // -------------------------------------------------------------
  // B. HISTORICAL RECORDS REFERENCE SAME PATIENT ID
  // -------------------------------------------------------------
  let historicalCase = null
  let historicalAppt = null
  let historicalRx = null

  await asyncTest('B.1 Historical clinical records exist and reference the canonical patient ID', async () => {
    const cases = await CaseModel.getByPatientId(patientRecord.id)
    assert.ok(cases.length >= 1, 'Historical case must exist')
    historicalCase = cases.find(c => c.case_number === 'CASE-2026-0712-VK') || cases[0]
    assert.strictEqual(String(historicalCase.patient_id), String(patientRecord.id))

    const appts = await AppointmentModel.getByPatientId(patientRecord.id)
    assert.ok(appts.length >= 1, 'Historical appointment must exist')
    historicalAppt = appts[0]
    assert.strictEqual(String(historicalAppt.patient_id), String(patientRecord.id))

    const rxs = await PrescriptionModel.getByPatientId(patientRecord.id)
    assert.ok(rxs.length >= 1, 'Historical prescription must exist')
    historicalRx = rxs[0]
    assert.strictEqual(String(historicalRx.patient_id), String(patientRecord.id))

    const reports = await DiagnosticModel.getReportsByPatientId(patientRecord.id)
    assert.ok(reports.length >= 1, 'Historical diagnostic report must exist')
    assert.strictEqual(String(reports[0].patient_id), String(patientRecord.id))
  })

  await asyncTest('B.2 Resolution works seamlessly with uniqueCode string AC-VK2604', async () => {
    const cases = await CaseModel.getByPatientId('AC-VK2604')
    assert.ok(cases.length >= 1, 'Cases must be resolvable by string unique code AC-VK2604')

    const appts = await AppointmentModel.getByPatientId('AC-VK2604')
    assert.ok(appts.length >= 1, 'Appointments must be resolvable by string unique code AC-VK2604')

    const rxs = await PrescriptionModel.getByPatientId('AC-VK2604')
    assert.ok(rxs.length >= 1, 'Prescriptions must be resolvable by string unique code AC-VK2604')
  })

  // -------------------------------------------------------------
  // C. NEW CASE REFERENCES SAME PATIENT ID
  // -------------------------------------------------------------
  let newCaseVisit1 = null

  await asyncTest('C.1 Create NEW OPD case for VIKASH KUMAR via API', async () => {
    const res = await apiRequest('/api/cases', {
      method: 'POST',
      headers: { Authorization: `Bearer ${patientToken}` },
      body: {
        problem: 'Acute sore throat, dry cough, and mild fever',
        duration: '2 days',
        lifecycleStage: 'IN PROGRESS'
      }
    })
    assert.strictEqual(res.status, 201)
    assert.strictEqual(res.data.success, true)
    newCaseVisit1 = res.data.case
    assert.ok(newCaseVisit1.id, 'New case must have an ID')
    assert.notStrictEqual(newCaseVisit1.id, historicalCase.id, 'New case ID must be distinct from historical case')
    assert.strictEqual(String(newCaseVisit1.patient_id), String(patientRecord.id), 'New case must reference canonical patient ID')
  })

  await asyncTest('C.2 Historical case remains untouched after creating new case', async () => {
    const origCase = await CaseModel.findById(historicalCase.id)
    assert.ok(origCase, 'Original historical case must still exist')
    assert.strictEqual(origCase.case_number, historicalCase.case_number)
    assert.strictEqual(origCase.lifecycle_stage, 'COMPLETED')
  })

  // -------------------------------------------------------------
  // D. NEW APPOINTMENT REFERENCES SAME PATIENT ID
  // -------------------------------------------------------------
  let newApptVisit1 = null

  await asyncTest('D.1 Book appointment for new case referencing the same patient', async () => {
    const res = await apiRequest('/api/appointments', {
      method: 'POST',
      headers: { Authorization: `Bearer ${patientToken}` },
      body: {
        caseId: newCaseVisit1.id,
        hospitalId: 1,
        doctorId: 1,
        appointmentDate: '2027-03-15',
        timeSlot: `09:00 AM - 09:30 AM (V1-${Date.now()})`,
        problem: 'Acute sore throat, dry cough, and mild fever',
        chiefComplaint: 'Acute sore throat, dry cough, and mild fever',
        category: 'ROUTINE',
        severity: 'Moderate'
      }
    })
    assert.strictEqual(res.status, 201)
    assert.strictEqual(res.data.success, true)
    newApptVisit1 = res.data.appointment
    const apptPatientId = newApptVisit1.patient_id || newApptVisit1.patientId
    const apptCaseId = newApptVisit1.case_id || newApptVisit1.caseId
    assert.strictEqual(String(apptPatientId), String(patientRecord.id), 'Appointment must reference canonical patient ID')
    assert.strictEqual(String(apptCaseId), String(newCaseVisit1.id), 'Appointment must link to new case ID')
  })

  await asyncTest('D.2 Doctor queue lists new appointment with correct patient identity', async () => {
    const queueRes = await apiRequest('/api/doctor/opd-queue', {
      headers: { Authorization: `Bearer ${doctorToken}` }
    })
    assert.strictEqual(queueRes.status, 200)
    const items = queueRes.data.queue || []
    const queueItem = items.find(q =>
      (String(q.patientDbId) === String(patientRecord.id) || String(q.patientId) === String(patientRecord.id) || q.patientUniqueCode === 'AC-VK2604') &&
      (String(q.id) === String(newApptVisit1.id) || String(q.appointmentId) === String(newApptVisit1.id) || q.appointmentNumber === newApptVisit1.appointmentNumber)
    )
    assert.ok(queueItem, 'New appointment must be visible in doctor queue')
    assert.strictEqual(queueItem.patientName, 'VIKASH KUMAR')
    assert.strictEqual(queueItem.patientUniqueCode, 'AC-VK2604')
  })

  // -------------------------------------------------------------
  // E. NEW CONSULTATION BECOMES PART OF HISTORY
  // -------------------------------------------------------------
  let newRxVisit1 = null

  await asyncTest('E.1 Doctor issues prescription and diagnostic for current encounter', async () => {
    // Create prescription
    const rxRes = await apiRequest('/api/doctor/prescriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${doctorToken}` },
      body: {
        patientId: patientRecord.id,
        doctorId: 'DOC-1042',
        caseId: newCaseVisit1.id,
        appointmentId: newApptVisit1.id,
        medicines: [
          {
            name: 'Amoxicillin 500mg',
            medicine_name: 'Amoxicillin 500mg',
            medicineName: 'Amoxicillin 500mg',
            dosage: '500mg',
            frequency: '1-0-1',
            duration: '5 Days',
            instructions: 'Take after meals'
          },
          {
            name: 'Cetirizine 10mg',
            medicine_name: 'Cetirizine 10mg',
            medicineName: 'Cetirizine 10mg',
            dosage: '10mg',
            frequency: '0-0-1',
            duration: '3 Days',
            instructions: 'Take at bedtime'
          }
        ]
      }
    })
    assert.strictEqual(rxRes.status, 201)
    newRxVisit1 = rxRes.data.prescription
    assert.strictEqual(String(newRxVisit1.patient_id), String(patientRecord.id))

    // Create diagnostic order
    const diagRes = await apiRequest('/api/diagnostics/request', {
      method: 'POST',
      headers: { Authorization: `Bearer ${doctorToken}` },
      body: {
        patientId: patientRecord.id,
        caseId: newCaseVisit1.id,
        testName: 'Throat Swab Culture',
        testScan: 'Throat Swab Culture',
        testType: 'Throat Swab Culture',
        clinicalIndication: 'Acute pharyngitis evaluation',
        priority: 'ROUTINE'
      }
    })
    assert.strictEqual(diagRes.status, 201)
  })

  await asyncTest('E.2 Complete consultation in doctor workflow', async () => {
    const completeRes = await apiRequest(`/api/doctor/opd-queue/${newApptVisit1.id}/complete`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${doctorToken}` },
      body: { consultationNotes: 'Tonsillar erythema observed, prescribed Amoxicillin & Cetirizine.' }
    })
    assert.strictEqual(completeRes.status, 200)

    // Verify appointment status updated to Completed
    const apptCheck = await AppointmentModel.findById(newApptVisit1.id)
    assert.strictEqual(apptCheck.status, 'Completed')

    // Verify linked case lifecycleStage updated to COMPLETED
    const caseCheck = await CaseModel.findById(newCaseVisit1.id)
    assert.strictEqual(caseCheck.lifecycle_stage, 'COMPLETED')
  })

  await asyncTest('E.3 Completed visit automatically appears in patient clinical history', async () => {
    const historyRes = await apiRequest(`/api/patients/${patientRecord.id}/history`, {
      headers: { Authorization: `Bearer ${doctorToken}` }
    })
    assert.strictEqual(historyRes.status, 200)
    const history = historyRes.data

    // Must contain both historical appointment and newly completed appointment
    const foundNewAppt = (history.appointments || []).some(a => String(a.id) === String(newApptVisit1.id))
    const foundOldAppt = (history.appointments || []).some(a => String(a.id) === String(historicalAppt.id))
    assert.ok(foundNewAppt, 'Newly completed appointment must appear in patient history')
    assert.ok(foundOldAppt, 'Historical appointment must remain in patient history')

    // Must contain new prescription
    const foundNewRx = (history.prescriptions || []).some(r => String(r.id) === String(newRxVisit1.id))
    assert.ok(foundNewRx, 'New prescription must appear in patient history')

    // Must contain new case
    const foundNewCase = (history.cases || []).some(c => String(c.id) === String(newCaseVisit1.id))
    assert.ok(foundNewCase, 'New completed case must appear in patient history')
  })

  // -------------------------------------------------------------
  // F. SECOND VISIT SEES FIRST VISIT AS PREVIOUS HISTORY
  // -------------------------------------------------------------
  let caseVisit2 = null
  let apptVisit2 = null

  await asyncTest('F.1 Start second visit (Visit 2) for VIKASH KUMAR', async () => {
    // Create 2nd case
    const case2Res = await apiRequest('/api/cases', {
      method: 'POST',
      headers: { Authorization: `Bearer ${patientToken}` },
      body: {
        problem: 'Follow-up consultation: throat pain improved, persistent mild dry cough',
        duration: '1 week',
        lifecycleStage: 'IN PROGRESS'
      }
    })
    assert.strictEqual(case2Res.status, 201)
    caseVisit2 = case2Res.data.case
    assert.strictEqual(String(caseVisit2.patient_id), String(patientRecord.id))
    assert.notStrictEqual(caseVisit2.id, newCaseVisit1.id, 'Visit 2 case ID must be distinct from Visit 1')

    // Book 2nd appointment
    const appt2Res = await apiRequest('/api/appointments', {
      method: 'POST',
      headers: { Authorization: `Bearer ${patientToken}` },
      body: {
        caseId: caseVisit2.id,
        hospitalId: 1,
        doctorId: 1,
        appointmentDate: '2027-03-20',
        timeSlot: `11:00 AM - 11:30 AM (V2-${Date.now()})`,
        problem: 'Follow-up consultation: throat pain improved, persistent mild dry cough',
        chiefComplaint: 'Follow-up consultation: throat pain improved, persistent mild dry cough',
        category: 'ROUTINE',
        priority: 'Normal'
      }
    })
    assert.strictEqual(appt2Res.status, 201)
    apptVisit2 = appt2Res.data.appointment
    const appt2PatientId = apptVisit2.patient_id || apptVisit2.patientId
    assert.strictEqual(String(appt2PatientId), String(patientRecord.id))
  })

  await asyncTest('F.2 Doctor reviewing Visit 2 sees Visit 1 as PREVIOUS history', async () => {
    const historyRes = await apiRequest(`/api/patients/${patientRecord.id}/history`, {
      headers: { Authorization: `Bearer ${doctorToken}` }
    })
    assert.strictEqual(historyRes.status, 200)
    const history = historyRes.data

    // Visit 1 appointment is completed and in history
    const visit1InHistory = (history.appointments || []).find(a => String(a.id) === String(newApptVisit1.id))
    assert.ok(visit1InHistory, 'Visit 1 must appear in history during Visit 2')
    assert.strictEqual(visit1InHistory.status, 'Completed')

    // Historical appointment is also in history
    const oldApptInHistory = (history.appointments || []).find(a => String(a.id) === String(historicalAppt.id))
    assert.ok(oldApptInHistory, 'Synthetic historical appointment must also be in history')

    // Current Visit 2 is separate and active
    assert.ok(['Waiting for Doctor', 'Waiting', 'Requested'].includes(apptVisit2.status))
    assert.notStrictEqual(apptVisit2.id, newApptVisit1.id)
  })

  // -------------------------------------------------------------
  // G. RESTART DOES NOT LOSE HISTORY
  // -------------------------------------------------------------
  await asyncTest('G.1 Save fallback state to disk and verify reload persists all visits', async () => {
    // Save state
    saveFallbackState()

    // Reload state
    const loaded = loadFallbackState()
    assert.ok(loaded, 'Loaded fallback state must exist')
    assert.ok(loaded.patients.length > 0, 'Patients must persist')
    assert.ok(loaded.cases.length >= 3, 'All cases (historical + Visit 1 + Visit 2) must persist')
    assert.ok(loaded.appointments.length >= 3, 'All appointments must persist')
    assert.ok(loaded.prescriptions.length >= 2, 'All prescriptions must persist')

    const persistedPatient = loaded.patients.find(p => (p.mobile || '').replace(/\D/g, '').slice(-10) === '9546011026')
    assert.ok(persistedPatient, 'VIKASH KUMAR must be persisted')
    assert.strictEqual(persistedPatient.name, 'VIKASH KUMAR')
    assert.strictEqual(persistedPatient.patient_unique_code, 'AC-VK2604')

    const persistedVisit1Case = loaded.cases.find(c => String(c.id) === String(newCaseVisit1.id))
    assert.ok(persistedVisit1Case, 'Visit 1 case must persist across restart')
    assert.strictEqual(persistedVisit1Case.lifecycle_stage, 'COMPLETED')
  })

  // -------------------------------------------------------------
  // H. PATIENT ISOLATION WORKS
  // -------------------------------------------------------------
  let patientOther = null
  let patientOtherToken = null
  const otherMobileNum = '98' + Math.floor(10000000 + Math.random() * 90000000)

  await asyncTest('H.1 Create second distinct patient and obtain authentication', async () => {
    const otherRes = await apiRequest('/api/patients/register', {
      method: 'POST',
      body: {
        name: 'Sunita Devi',
        mobile: otherMobileNum,
        dob: '12/03/1986',
        age: 38,
        gender: 'Female',
        identityType: 'Aadhaar',
        identityNumber: '8833 ' + Math.floor(1000 + Math.random() * 9000) + ' ' + Math.floor(1000 + Math.random() * 9000),
        bloodGroup: 'B+'
      }
    })
    assert.ok(otherRes.status === 201 || otherRes.status === 200, 'Registration must succeed')
    patientOther = otherRes.data.patient
    assert.ok(patientOther, 'Other patient must be created')
    assert.notStrictEqual(patientOther.id, patientRecord.id)
    assert.notStrictEqual(patientOther.patient_unique_code, 'AC-VK2604')

    const loginRes = await apiRequest('/api/auth/patient/login', {
      method: 'POST',
      body: { mobile: otherMobileNum }
    })
    assert.strictEqual(loginRes.status, 200)
    patientOtherToken = loginRes.data.token
  })

  await asyncTest('H.2 Cross-patient case retrieval is strictly forbidden (HTTP 403)', async () => {
    const crossCase = await apiRequest(`/api/cases/${newCaseVisit1.id}`, {
      headers: { Authorization: `Bearer ${patientOtherToken}` }
    })
    assert.strictEqual(crossCase.status, 403, 'Other patient cannot access Vikash Kumar case')
  })

  await asyncTest('H.3 Other patient query returns ZERO of Vikash Kumar records', async () => {
    const otherCases = await CaseModel.getByPatientId(patientOther.id)
    const leaksVikashCase = otherCases.some(c => String(c.patient_id) === String(patientRecord.id))
    assert.strictEqual(leaksVikashCase, false, 'Other patient queries must never leak Vikash Kumar data')

    const otherAppts = await AppointmentModel.getByPatientId(patientOther.id)
    const leaksVikashAppt = otherAppts.some(a => String(a.patient_id) === String(patientRecord.id))
    assert.strictEqual(leaksVikashAppt, false, 'Other patient queries must never leak Vikash Kumar appointments')
  })

  // -------------------------------------------------------------
  // I. NO DUPLICATE PATIENT IS CREATED
  // -------------------------------------------------------------
  await asyncTest('I.1 Registering with existing mobile 9546011026 returns canonical patient record', async () => {
    const dupRes = await apiRequest('/api/patients/register', {
      method: 'POST',
      body: {
        name: 'VIKASH KUMAR',
        mobile: '9546011026',
        dob: '15/08/2002',
        age: 24,
        gender: 'Male',
        identityType: 'Aadhaar',
        identityNumber: '9546 2026 1102'
      }
    })
    assert.strictEqual(dupRes.status, 200, 'Duplicate registration gracefully resolves existing record')
    assert.strictEqual(dupRes.data.patient.patient_unique_code, 'AC-VK2604')
    assert.strictEqual(String(dupRes.data.patient.id), String(patientRecord.id))
  })

  await asyncTest('I.2 Patient count for 9546011026 remains exactly 1', async () => {
    const count = memoryPatients ? memoryPatients.filter(p => (p.mobile || '').replace(/\D/g, '').slice(-10) === '9546011026').length : 1
    assert.strictEqual(count, 1, 'Exactly 1 record must exist for 9546011026')
  })

  // -------------------------------------------------------------
  // J. TIMELINE CONTAINS BOTH HISTORICAL AND NEW EVENTS
  // -------------------------------------------------------------
  await asyncTest('J.1 Unified timeline contains chronological merge of old + new events', async () => {
    const timelineData = await TimelineService.getUnifiedTimeline(patientRecord.id)
    const events = timelineData?.events || []
    assert.ok(events.length >= 3, `Timeline must contain at least 3 events across historical and new visits (got ${events.length})`)

    const hasConsultation = events.some(t => t.eventType === 'CONSULTATION_CASE' || t.eventType === 'APPOINTMENT' || t.type === 'consultation' || t.category === 'consultation' || t.category === 'encounter')
    const hasPrescription = events.some(t => t.eventType === 'PRESCRIPTION' || t.type === 'prescription' || t.category === 'medication')
    const hasDiagnostic = events.some(t => t.eventType === 'LAB_REPORT' || t.eventType === 'DIAGNOSTIC_REPORT' || t.eventType === 'DIAGNOSTIC_REQUEST' || t.type === 'diagnostic')

    assert.ok(hasConsultation, 'Timeline must include consultation encounters')
    assert.ok(hasPrescription, 'Timeline must include prescriptions')
    assert.ok(hasDiagnostic, 'Timeline must include diagnostic events')

    // Verify chronological order
    const dates = events.map(e => new Date(e.eventDate || e.recordedAt || e.created_at || Date.now()).getTime()).filter(d => !isNaN(d))
    let isSortedDesc = true
    for (let i = 1; i < dates.length; i++) {
      if (dates[i] > dates[i - 1]) {
        isSortedDesc = false
        break
      }
    }
    assert.ok(isSortedDesc, 'Timeline events must be in sorted order')
  })

  // -------------------------------------------------------------
  // K. DOCTOR WORKSPACE SHOWS CURRENT + PREVIOUS INFORMATION
  // -------------------------------------------------------------
  await asyncTest('K.1 Doctor dossier distinguishes current encounter from historical encounters', async () => {
    const queueDossierRes = await apiRequest(`/api/doctor/opd-queue/${apptVisit2.id}`, {
      headers: { Authorization: `Bearer ${doctorToken}` }
    })
    assert.strictEqual(queueDossierRes.status, 200)
    const dossier = queueDossierRes.data

    // Current encounter details
    const dossierId = dossier.id || dossier.appointmentId || dossier.queueItem?.id || dossier.appointment?.id
    assert.strictEqual(String(dossierId), String(apptVisit2.id), 'Dossier id must match Visit 2 appointment')
    assert.strictEqual(dossier.patientName || dossier.name, 'VIKASH KUMAR')
    assert.strictEqual(dossier.patientUniqueCode || dossier.uniqueCode, 'AC-VK2604')

    // History query for same patient
    const historyRes = await apiRequest(`/api/patients/${patientRecord.id}/history`, {
      headers: { Authorization: `Bearer ${doctorToken}` }
    })
    assert.strictEqual(historyRes.status, 200)
    const history = historyRes.data

    // Distinguish current from previous: previous appointments has Visit 1 and historical, but Visit 2 is currently active
    const previousAppts = (history.appointments || []).filter(a => String(a.id) !== String(apptVisit2.id))
    assert.ok(previousAppts.length >= 2, 'Doctor must see at least 2 previous appointments')
    assert.ok(previousAppts.some(a => String(a.id) === String(newApptVisit1.id)), 'Visit 1 must be present in previous appointments')
    assert.ok(previousAppts.some(a => String(a.id) === String(historicalAppt.id)), 'Historical appointment must be present in previous appointments')

    // Previous prescriptions
    const previousRxs = history.prescriptions || []
    assert.ok(previousRxs.length >= 2, 'Doctor must see at least 2 previous prescriptions')
    assert.ok(previousRxs.some(r => String(r.id) === String(newRxVisit1.id)), 'Visit 1 prescription must be visible in previous prescriptions')
    assert.ok(previousRxs.some(r => String(r.id) === String(historicalRx.id)), 'Historical prescription must be visible in previous prescriptions')
  })

  console.log('===============================================================')
  console.log(`TEST SUMMARY: ${passed} passed, ${failed} failed`)
  console.log('===============================================================')

  server.close()
  if (failed > 0) {
    process.exit(1)
  }
}

runTests().catch(err => {
  console.error('Fatal error running tests:', err)
  if (server) server.close()
  process.exit(1)
})
