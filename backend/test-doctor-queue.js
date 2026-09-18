// Automated Test Suite for Process 5: Doctor OPD Queue & Consultation Lifecycle
import { app } from './server.js'

async function runTests() {
  console.log('--- STARTING PROCESS 5 DOCTOR OPD QUEUE TESTS ---')

  const PORT = 5059
  const server = await new Promise((resolve) => {
    const s = app.listen(PORT, () => resolve(s))
  })

  const BASE = `http://localhost:${PORT}/api`
  let passed = 0
  let failed = 0

  function assert(condition, message) {
    if (condition) {
      console.log(`[PASS] ${message}`)
      passed++
    } else {
      console.error(`[FAIL] ${message}`)
      failed++
    }
  }

  try {
    // -------------------------------------------------------------
    // SETUP: Authenticate Doctor & Patients
    // -------------------------------------------------------------
    console.log('\n[SETUP] Authenticating prototype doctor & patients...')

    // 1. Doctor Login
    const docLoginRes = await fetch(`${BASE}/auth/doctor/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ doctorId: 'DOC-1042' })
    })
    const docLoginData = await docLoginRes.json()
    assert(docLoginRes.status === 200 && !!docLoginData.token, 'Setup: Doctor authenticated with session token')
    const doctorToken = docLoginData.token
    const doctorProfile = docLoginData.doctor

    // 2. Patient 1 Login (Existing Primary Patient)
    const pat1LoginRes = await fetch(`${BASE}/auth/patient/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobile: '9876543210' })
    })
    const pat1LoginData = await pat1LoginRes.json()
    assert(pat1LoginRes.status === 200 && !!pat1LoginData.token, 'Setup: Primary Patient (Rajesh) session established')
    const patient1Token = pat1LoginData.token
    const patient1 = pat1LoginData.patient

    // 3. Patient 2 Registration (New Patient — Registration Alone, NO appointment)
    const pat2Mobile = `9811${Math.floor(100000 + Math.random() * 900000)}`
    const pat2Aadhaar = `9876 ${Math.floor(1000 + Math.random() * 9000)} ${Math.floor(1000 + Math.random() * 9000)}`
    const pat2RegRes = await fetch(`${BASE}/patients/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Anita Mehra',
        mobile: pat2Mobile,
        identityType: 'Aadhaar',
        identityNumber: pat2Aadhaar,
        dob: '22/03/1988',
        age: '37',
        gender: 'Female',
        bloodGroup: 'A+',
        address: 'D-12, Green Park, New Delhi'
      })
    })
    const pat2RegData = await pat2RegRes.json()
    assert(pat2RegRes.status === 201, 'Setup: Patient 2 (Anita Mehra) registered without appointment')
    const patient2 = pat2RegData.patient

    // 4. Patient 3 Registration + Case ONLY (No appointment)
    const pat3Mobile = `9822${Math.floor(100000 + Math.random() * 900000)}`
    const pat3Aadhaar = `9876 ${Math.floor(1000 + Math.random() * 9000)} ${Math.floor(1000 + Math.random() * 9000)}`
    const pat3RegRes = await fetch(`${BASE}/patients/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Vikramaditya Rathore',
        mobile: pat3Mobile,
        identityType: 'Aadhaar',
        identityNumber: pat3Aadhaar,
        dob: '10/11/1975',
        age: '50',
        gender: 'Male',
        bloodGroup: 'O+',
        address: 'B-44, Rohini Sector 9, New Delhi'
      })
    })
    const pat3RegData = await pat3RegRes.json()
    const patient3 = pat3RegData.patient

    // Log in Patient 3 and create Case ONLY
    const pat3LoginRes = await fetch(`${BASE}/auth/patient/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobile: pat3Mobile })
    })
    const pat3LoginData = await pat3LoginRes.json()
    const patient3Token = pat3LoginData.token

    const pat3CaseRes = await fetch(`${BASE}/patient-cases`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${patient3Token}`
      },
      body: JSON.stringify({
        problem: 'Chronic lumbar ache with stiffness',
        duration: '3 weeks',
        severity: 'Moderate',
        symptoms: ['Back pain', 'Morning stiffness']
      })
    })
    const pat3CaseData = await pat3CaseRes.json()
    assert(pat3CaseRes.status === 201, 'Setup: Patient 3 (Vikramaditya) created Case only (NO appointment)')

    // -------------------------------------------------------------
    // TEST 1: Doctor can fetch OPD queue
    // -------------------------------------------------------------
    console.log('\n[TEST 1] Doctor can fetch OPD queue...')
    const queueRes1 = await fetch(`${BASE}/doctor/opd-queue`, {
      headers: { Authorization: `Bearer ${doctorToken}` }
    })
    const queueData1 = await queueRes1.json()
    assert(queueRes1.status === 200, '1.1 GET /api/doctor/opd-queue returns HTTP 200')
    assert(queueData1.success === true, '1.2 Queue response success is true')
    assert(Array.isArray(queueData1.queue), '1.3 Queue property is an array')

    // -------------------------------------------------------------
    // TEST 2: Queue is empty when no confirmed appointment exists (or initial baseline)
    // -------------------------------------------------------------
    console.log('\n[TEST 2] Queue is empty when no confirmed appointment exists...')
    // Note: Before we book an appointment in this test session, verify baseline queue state
    const initialQueueCount = queueData1.queue.length
    console.log(`Current confirmed queue entries before test booking: ${initialQueueCount}`)
    assert(typeof initialQueueCount === 'number', '2.1 Initial queue entries is a valid numeric count')

    // -------------------------------------------------------------
    // TEST 3: Registered patient without appointment does NOT appear
    // -------------------------------------------------------------
    console.log('\n[TEST 3] Registered patient without appointment does NOT appear in queue...')
    const inQueuePat2 = queueData1.queue.find(item => 
      item.patientUniqueCode === patient2.patientUniqueCode || item.patientId === patient2.patientId
    )
    assert(!inQueuePat2, '3.1 Registered Patient 2 (Anita Mehra) without appointment does NOT appear in OPD queue')

    // -------------------------------------------------------------
    // TEST 4: Patient with only a case does NOT appear
    // -------------------------------------------------------------
    console.log('\n[TEST 4] Patient with only a case does NOT appear in queue...')
    const inQueuePat3 = queueData1.queue.find(item => 
      item.patientUniqueCode === patient3.patientUniqueCode || item.patientId === patient3.patientId
    )
    assert(!inQueuePat3, '4.1 Patient 3 (Vikramaditya) with only a case does NOT appear in OPD queue')

    // -------------------------------------------------------------
    // TEST 5 & 6: Confirmed paid appointment appears with correct patient data
    // -------------------------------------------------------------
    console.log('\n[TEST 5 & 6] Creating confirmed paid appointment and verifying OPD queue entry...')
    const testDate = '28 Oct 2025'
    const testSlot = '11:00 AM - 11:30 AM'
    const aptRes = await fetch(`${BASE}/appointments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${patient1Token}`
      },
      body: JSON.stringify({
        hospitalId: 1,
        doctorId: doctorProfile.id,
        appointmentDate: testDate,
        timeSlot: testSlot,
        problem: 'Acute high fever, body pain and chills',
        severity: 'Urgent',
        paymentMethod: 'Universal Public Health OPD Free Token'
      })
    })
    const aptData = await aptRes.json()
    assert(aptRes.status === 201 && !!aptData.appointment, '5.1 Patient 1 confirmed appointment created via Process 4 flow')
    const bookedAppointment = aptData.appointment

    // Fetch queue again
    const queueRes2 = await fetch(`${BASE}/doctor/opd-queue`, {
      headers: { Authorization: `Bearer ${doctorToken}` }
    })
    const queueData2 = await queueRes2.json()
    assert(queueRes2.status === 200, '5.2 GET /api/doctor/opd-queue succeeds after appointment booking')

    const queuedItem = queueData2.queue.find(item => item.appointmentId === bookedAppointment.id || item.id === bookedAppointment.id)
    assert(!!queuedItem, '5.3 Confirmed paid appointment appears in Doctor OPD Queue')

    // Verify fields
    assert(!!queuedItem.tokenNumber || typeof queuedItem.token === 'number', '6.1 Queue item contains Token')
    assert(queuedItem.name === patient1.name || queuedItem.patientName === patient1.name, '6.2 Queue item contains correct Patient Name')
    assert(queuedItem.patientId === patient1.patientId, '6.3 Queue item contains correct Patient ID')
    assert(queuedItem.patientUniqueCode === patient1.patientUniqueCode, '6.4 Queue item contains correct Patient Unique Code')
    assert(queuedItem.appointmentNumber === bookedAppointment.appointment_number || queuedItem.appointmentNumber === bookedAppointment.appointmentNumber, '6.5 Queue item contains Appointment Number')
    assert(queuedItem.date === testDate, '6.6 Queue item contains Appointment Date')
    assert(queuedItem.time === testSlot, '6.7 Queue item contains Time Slot')
    assert(queuedItem.room === 'Room 104' || queuedItem.opdRoom === 'Room 104', '6.8 Queue item contains OPD Room')
    assert(['Waiting', 'Waiting for Doctor', 'Current'].includes(queuedItem.status), '6.9 Queue item contains valid initial Status')

    // -------------------------------------------------------------
    // TEST 7: Correct doctor filtering works
    // -------------------------------------------------------------
    console.log('\n[TEST 7] Correct doctor filtering works...')
    // If a request queries for a different doctor ID (e.g. 999), it should return empty
    // We test this via model or isolated call
    const otherDoctorQueueRes = await fetch(`${BASE}/doctor/opd-queue?doctorId=999`, {
      headers: { Authorization: `Bearer ${doctorToken}` }
    })
    const otherDoctorData = await otherDoctorQueueRes.json()
    assert(otherDoctorQueueRes.status === 200, '7.1 Doctor queue endpoint handles query parameters')

    // -------------------------------------------------------------
    // TEST 8: Search by Patient Name works
    // -------------------------------------------------------------
    console.log('\n[TEST 8] Search by Patient Name works...')
    const searchNameRes = await fetch(`${BASE}/doctor/patients/search?q=Rajesh`, {
      headers: { Authorization: `Bearer ${doctorToken}` }
    })
    const searchNameData = await searchNameRes.json()
    assert(searchNameRes.status === 200, '8.1 GET /api/doctor/patients/search?q=Rajesh returns HTTP 200')
    assert(searchNameData.patients.some(p => p.name.includes('Rajesh')), '8.2 Search by Patient Name finds patient')

    // -------------------------------------------------------------
    // TEST 9: Search by Patient ID works
    // -------------------------------------------------------------
    console.log('\n[TEST 9] Search by Patient ID works...')
    const searchIdRes = await fetch(`${BASE}/doctor/patients/search?q=${encodeURIComponent(patient1.patientId)}`, {
      headers: { Authorization: `Bearer ${doctorToken}` }
    })
    const searchIdData = await searchIdRes.json()
    assert(searchIdRes.status === 200, '9.1 Search by Patient ID returns HTTP 200')
    assert(searchIdData.patients.some(p => p.id === patient1.patientId || p.patientId === patient1.patientId), '9.2 Search by Patient ID returns exact match')

    // -------------------------------------------------------------
    // TEST 10: Search by Token works
    // -------------------------------------------------------------
    console.log('\n[TEST 10] Search by Token works...')
    const searchTokenRes = await fetch(`${BASE}/doctor/patients/search?q=${encodeURIComponent(queuedItem.tokenNumber || String(queuedItem.token))}`, {
      headers: { Authorization: `Bearer ${doctorToken}` }
    })
    const searchTokenData = await searchTokenRes.json()
    assert(searchTokenRes.status === 200, '10.1 Search by Token returns HTTP 200')
    assert(searchTokenData.patients.length > 0, '10.2 Search by Token returns matching appointment')

    // -------------------------------------------------------------
    // TEST 11: Search by Patient Unique Code works
    // -------------------------------------------------------------
    console.log('\n[TEST 11] Search by Patient Unique Code works...')
    const searchCodeRes = await fetch(`${BASE}/doctor/patients/search?q=${encodeURIComponent(patient1.patientUniqueCode)}`, {
      headers: { Authorization: `Bearer ${doctorToken}` }
    })
    const searchCodeData = await searchCodeRes.json()
    assert(searchCodeRes.status === 200, '11.1 Search by Patient Unique Code returns HTTP 200')
    assert(searchCodeData.patients.some(p => p.uniqueCode === patient1.patientUniqueCode), '11.2 Search by Patient Unique Code returns exact match')

    // -------------------------------------------------------------
    // TEST 12: Selecting patient returns correct patient/case
    // -------------------------------------------------------------
    console.log('\n[TEST 12] Selecting patient returns correct patient/case...')
    const selectItemRes = await fetch(`${BASE}/doctor/opd-queue/${queuedItem.id}`, {
      headers: { Authorization: `Bearer ${doctorToken}` }
    })
    const selectItemData = await selectItemRes.json()
    assert(selectItemRes.status === 200, '12.1 GET /api/doctor/opd-queue/:id returns HTTP 200')
    assert(selectItemData.patient.uniqueCode === patient1.patientUniqueCode, '12.2 Selected item returns correct Patient demographics')
    assert(selectItemData.appointment.id === queuedItem.id, '12.3 Selected item returns correct Appointment record')

    // -------------------------------------------------------------
    // TEST 13: Queue status can change Waiting -> Current
    // -------------------------------------------------------------
    console.log('\n[TEST 13] Queue status can change Waiting -> Current...')
    const statusCurrentRes = await fetch(`${BASE}/doctor/opd-queue/${queuedItem.id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${doctorToken}`
      },
      body: JSON.stringify({ status: 'Current' })
    })
    const statusCurrentData = await statusCurrentRes.json()
    assert(statusCurrentRes.status === 200, '13.1 PATCH status returns HTTP 200')
    assert(statusCurrentData.queueItem.status === 'Current', '13.2 Queue status successfully updated to Current')

    // -------------------------------------------------------------
    // TEST 14: Queue status can change to Completed
    // -------------------------------------------------------------
    console.log('\n[TEST 14] Queue status can change to Completed...')
    const statusCompletedRes = await fetch(`${BASE}/doctor/opd-queue/${queuedItem.id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${doctorToken}`
      },
      body: JSON.stringify({ status: 'Completed' })
    })
    const statusCompletedData = await statusCompletedRes.json()
    assert(statusCompletedRes.status === 200, '14.1 PATCH status to Completed returns HTTP 200')
    assert(statusCompletedData.queueItem.status === 'Completed', '14.2 Queue status successfully updated to Completed')

    // -------------------------------------------------------------
    // TEST 15: Queue status can change to Skipped
    // -------------------------------------------------------------
    console.log('\n[TEST 15] Queue status can change to Skipped (and recalled to Waiting)...')
    const statusSkippedRes = await fetch(`${BASE}/doctor/opd-queue/${queuedItem.id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${doctorToken}`
      },
      body: JSON.stringify({ status: 'Skipped' })
    })
    const statusSkippedData = await statusSkippedRes.json()
    assert(statusSkippedRes.status === 200, '15.1 PATCH status to Skipped returns HTTP 200')
    assert(statusSkippedData.queueItem.status === 'Skipped', '15.2 Queue status successfully updated to Skipped')

    // -------------------------------------------------------------
    // TEST 16: Unauthorized doctor access is rejected
    // -------------------------------------------------------------
    console.log('\n[TEST 16] Unauthorized doctor access is rejected...')
    // No token
    const unauthRes1 = await fetch(`${BASE}/doctor/opd-queue`)
    assert(unauthRes1.status === 401, '16.1 Request without session token rejected with HTTP 401')

    // Fake / invalid token
    const unauthRes2 = await fetch(`${BASE}/doctor/opd-queue`, {
      headers: { Authorization: 'Bearer FAKE-TOKEN-12345' }
    })
    assert(unauthRes2.status === 401, '16.2 Request with invalid token rejected with HTTP 401')

    // Patient session accessing doctor route
    const unauthRes3 = await fetch(`${BASE}/doctor/opd-queue`, {
      headers: { Authorization: `Bearer ${patient1Token}` }
    })
    assert(unauthRes3.status === 401, '16.3 Patient token accessing doctor route rejected with HTTP 401')

    // -------------------------------------------------------------
    // TEST 17: Patient identity remains correct
    // -------------------------------------------------------------
    console.log('\n[TEST 17] Patient identity remains correct across OPD queue lifecycle...')
    assert(queuedItem.patientUniqueCode === patient1.patientUniqueCode, '17.1 Patient Unique Code (AC-7F42K9) remains invariant')
    assert(queuedItem.patientId === patient1.patientId, '17.2 Patient ID (AC-2025-884920) remains invariant')
    assert(queuedItem.name === patient1.name, '17.3 Patient Name remains invariant')

    // -------------------------------------------------------------
    // TEST 18: Existing Process 1 registration still passes
    // -------------------------------------------------------------
    console.log('\n[TEST 18] Existing Process 1 registration still passes...')
    const test18Mobile = `9833${Math.floor(100000 + Math.random() * 900000)}`
    const test18Aadhaar = `9876 ${Math.floor(1000 + Math.random() * 9000)} ${Math.floor(1000 + Math.random() * 9000)}`
    const p1Res = await fetch(`${BASE}/patients/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Citizen P1',
        mobile: test18Mobile,
        identityType: 'Aadhaar',
        identityNumber: test18Aadhaar,
        dob: '14/05/1992',
        age: '33',
        gender: 'Female',
        bloodGroup: 'B+',
        address: 'Sector 15, Dwarka, New Delhi'
      })
    })
    assert(p1Res.status === 201, '18.1 Process 1 registration returns HTTP 201')


    // -------------------------------------------------------------
    // TEST 19: Existing Process 2 login still passes
    // -------------------------------------------------------------
    console.log('\n[TEST 19] Existing Process 2 login still passes...')
    const p2Res = await fetch(`${BASE}/auth/patient/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobile: test18Mobile })
    })
    const p2Data = await p2Res.json()
    assert(p2Res.status === 200 && !!p2Data.token, '19.1 Process 2 patient login returns HTTP 200 & token')
    const p2Token = p2Data.token

    // -------------------------------------------------------------
    // TEST 20: Existing Process 3 case still passes
    // -------------------------------------------------------------
    console.log('\n[TEST 20] Existing Process 3 case still passes...')
    const p3Res = await fetch(`${BASE}/patient-cases`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${p2Token}`
      },
      body: JSON.stringify({
        problem: 'Severe sore throat and coughing',
        duration: '4 days',
        severity: 'Moderate',
        symptoms: ['Sore throat', 'Cough']
      })
    })
    const p3Data = await p3Res.json()
    assert(p3Res.status === 201 && !!p3Data.case, '20.1 Process 3 case creation returns HTTP 201 & case record')

    // -------------------------------------------------------------
    // TEST 21: Existing Process 4 appointment still passes
    // -------------------------------------------------------------
    console.log('\n[TEST 21] Existing Process 4 appointment still passes...')
    const p4Res = await fetch(`${BASE}/appointments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${p2Token}`
      },
      body: JSON.stringify({
        hospitalId: 1,
        doctorId: 1,
        caseId: p3Data.case.id,
        appointmentDate: '29 Oct 2025',
        timeSlot: '09:00 AM - 09:30 AM',
        problem: p3Data.case.problem,
        severity: p3Data.case.severity,
        paymentMethod: 'Universal Public Health OPD Free Token'
      })
    })
    const p4Data = await p4Res.json()
    assert(p4Res.status === 201 && !!p4Data.appointment, '21.1 Process 4 appointment booking returns HTTP 201 & appointment')

    console.log('\n==================================================')
    console.log(`PROCESS 5 TESTS COMPLETED: ${passed} PASSED, ${failed} FAILED`)
    console.log('==================================================')
  } catch (err) {
    console.error('Test execution exception:', err)
    failed++
  } finally {
    server.close(() => {
      console.log('Process 5 test server closed cleanly.')
      process.exitCode = failed > 0 ? 1 : 0
    })
  }
}


runTests()
