// Automated Test Suite for Process 7: Doctor Prescription Lifecycle
import { app } from './server.js'

async function runTests() {
  console.log('=================================================================')
  console.log('  AAROGYA CASE — PROCESS 7 PRESCRIPTION LIFECYCLE TESTS')
  console.log('=================================================================')

  const PORT = 5066
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

    // 2. Patient 1 Login (Existing Primary Patient: Rajesh Kumar Sharma)
    const pat1LoginRes = await fetch(`${BASE}/auth/patient/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobile: '9876543210' })
    })
    const pat1LoginData = await pat1LoginRes.json()
    assert(pat1LoginRes.status === 200 && !!pat1LoginData.token, 'Setup: Primary Patient (Rajesh) session established')
    const patient1Token = pat1LoginData.token
    const patient1 = pat1LoginData.patient
    const patient1UniqueCode = patient1.patient_unique_code || patient1.patientUniqueCode

    // 3. Register & Login Patient 2 (Sunita Sharma) for privacy / boundary tests
    const pat2RegRes = await fetch(`${BASE}/patients/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Sunita Sharma',
        mobile: '9811223344',
        dob: '22/08/1982',
        age: '43',
        gender: 'Female',
        identityType: 'Aadhaar',
        identityNumber: '4455 6677 8899',
        bloodGroup: 'O+'
      })
    })
    const pat2RegData = await pat2RegRes.json()
    assert(pat2RegRes.status === 201 || pat2RegRes.status === 200, 'Setup: Second Patient registered')
    const patient2 = pat2RegData.patient

    const pat2LoginRes = await fetch(`${BASE}/auth/patient/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobile: '9811223344' })
    })
    const pat2LoginData = await pat2LoginRes.json()
    assert(pat2LoginRes.status === 200 && !!pat2LoginData.token, 'Setup: Second Patient (Sunita) session established')
    const patient2Token = pat2LoginData.token

    // 4. Create a Patient 1 Case & Appointment for verified linkage
    const caseRes = await fetch(`${BASE}/patient-cases`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${patient1Token}`
      },
      body: JSON.stringify({
        patientId: patient1.id,
        patientUniqueCode: patient1UniqueCode,
        problem: 'Acute Viral Pharyngitis with Mild Pyrexia',
        duration: '3 days',
        severity: 'Moderate',
        symptoms: ['Sore Throat', 'Low-grade fever', 'Dry cough']
      })
    })
    const caseData = await caseRes.json()
    assert(caseRes.status === 201 && !!caseData.case, 'Setup: Patient Case created')
    const patientCase = caseData.case

    const appRes = await fetch(`${BASE}/appointments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${patient1Token}`
      },
      body: JSON.stringify({
        patientId: patient1.id,
        doctorId: doctorProfile.id,
        hospitalId: 1,
        caseId: patientCase.id,
        appointmentDate: '2026-09-10',
        timeSlot: '10:30 AM',
        problem: patientCase.problem,
        severity: 'Moderate'
      })
    })
    const appData = await appRes.json()
    assert(appRes.status === 201 && !!appData.appointment, 'Setup: Appointment booked and linked to Doctor OPD Queue')
    const appointment = appData.appointment

    // -------------------------------------------------------------
    // TEST 1: Doctor Authentication requirement
    // -------------------------------------------------------------
    console.log('\n[TEST 1] Doctor authentication requirement...')
    const unauthRes = await fetch(`${BASE}/doctor/prescriptions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ patientId: patient1.id, appointmentId: appointment.id, caseId: patientCase.id })
    })
    assert(unauthRes.status === 401, '1.1 POST /api/doctor/prescriptions without token rejected with HTTP 401')

    const patTokenRes = await fetch(`${BASE}/doctor/prescriptions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${patient1Token}`
      },
      body: JSON.stringify({ patientId: patient1.id, appointmentId: appointment.id, caseId: patientCase.id })
    })
    assert(patTokenRes.status === 401, '1.2 Request with patient token rejected with HTTP 401')

    // -------------------------------------------------------------
    // TEST 2: Valid Prescription Creation
    // -------------------------------------------------------------
    console.log('\n[TEST 2] Valid prescription creation with multiple medicines...')
    const rxPayload = {
      patientId: patient1.id,
      patientUniqueCode: patient1UniqueCode,
      doctorId: doctorProfile.id,
      appointmentId: appointment.id,
      caseId: patientCase.id,
      diagnosis: 'Acute Viral Pharyngitis with Mild Pyrexia',
      icdCode: 'ICD-10: J02.9',
      vitals: 'BP 124/82 · Temp 99.4°F · Pulse 78 bpm · SpO2 98%',
      medicines: [
        {
          medicineId: 1,
          medicineName: 'Paracetamol 650mg Tablet',
          category: 'Analgesic / Antipyretic',
          dosage: '650mg',
          frequency: 'SOS (Max 3/day)',
          duration: '3 Days',
          instructions: 'Take after food for fever >100°F',
          quantity: 10
        },
        {
          medicineId: 2,
          medicineName: 'Cetirizine 10mg Tablet',
          category: 'Antihistamine',
          dosage: '10mg',
          frequency: 'Once Daily (HS)',
          duration: '5 Days',
          instructions: 'Take at bedtime. May cause mild drowsiness.',
          quantity: 5
        },
        {
          medicineId: 3,
          medicineName: 'Amoxicillin 500mg Capsule',
          category: 'Antibiotic',
          dosage: '500mg',
          frequency: 'Thrice Daily (TDS)',
          duration: '5 Days',
          instructions: 'Complete full course after meals',
          quantity: 15
        }
      ]
    }

    const rxRes = await fetch(`${BASE}/doctor/prescriptions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${doctorToken}`
      },
      body: JSON.stringify(rxPayload)
    })
    const rxData = await rxRes.json()
    assert(rxRes.status === 201, '2.1 POST /api/doctor/prescriptions returns HTTP 201 Created')
    assert(rxData.success === true, '2.2 Response contains success: true')
    assert(!!rxData.prescription, '2.3 Created prescription object returned')

    const createdRx = rxData.prescription
    assert(/^RX-202\d-\d{6}$/.test(createdRx.rxNumber || createdRx.prescriptionNumber), '2.4 Generated prescription number format RX-YYYY-XXXXXX')
    assert(createdRx.status === 'Issued', '2.5 Initial prescription status is "Issued"')
    assert(createdRx.pharmacyStatus === 'Sent' || createdRx.pharmacy_status === 'Sent', '2.6 Initial pharmacy status is "Sent"')

    // -------------------------------------------------------------
    // TEST 3: Linkages (Doctor, Patient, Case, Appointment)
    // -------------------------------------------------------------
    console.log('\n[TEST 3] Verifying correct relational linkages...')
    assert(createdRx.doctorId === doctorProfile.id || createdRx.doctor_id === doctorProfile.id, '3.1 Prescription linked to authenticated doctor ID')
    assert(createdRx.patientId === patient1.id || createdRx.patient_id === patient1.id, '3.2 Prescription linked to correct patient ID')
    assert((createdRx.patientUniqueCode || createdRx.patient_unique_code) === 'AC-7F42K9', '3.3 Patient Unique Code (AC-7F42K9) permanently preserved')
    assert(createdRx.appointmentId === appointment.id || createdRx.appointment_id === appointment.id, '3.4 Prescription linked to correct appointment ID')
    assert(createdRx.caseId === patientCase.id || createdRx.case_id === patientCase.id, '3.5 Prescription linked to correct case ID')

    // -------------------------------------------------------------
    // TEST 4: Multiple Medicine Items Structure
    // -------------------------------------------------------------
    console.log('\n[TEST 4] Verifying medicine items details...')
    const items = createdRx.items || createdRx.medicines || []
    assert(items.length === 3, '4.1 All 3 medicine items preserved in prescription')
    assert(items[0].medicineName === 'Paracetamol 650mg Tablet' && items[0].dosage === '650mg', '4.2 Medicine 1 contains correct name and dosage')
    assert(items[1].frequency === 'Once Daily (HS)' && items[1].duration === '5 Days', '4.3 Medicine 2 contains correct frequency and duration')
    assert(items[2].instructions.includes('Complete full course'), '4.4 Medicine 3 contains instructions')

    // -------------------------------------------------------------
    // TEST 5: Required-field Validation
    // -------------------------------------------------------------
    console.log('\n[TEST 5] Testing required field validation...')
    // 5.1 Missing patient
    const noPatRes = await fetch(`${BASE}/doctor/prescriptions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${doctorToken}` },
      body: JSON.stringify({ appointmentId: appointment.id, caseId: patientCase.id, medicines: rxPayload.medicines })
    })
    assert(noPatRes.status === 400, '5.1 Missing patient rejected with HTTP 400')

    // 5.2 Missing appointment
    const noAppRes = await fetch(`${BASE}/doctor/prescriptions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${doctorToken}` },
      body: JSON.stringify({ patientId: patient1.id, caseId: patientCase.id, medicines: rxPayload.medicines })
    })
    assert(noAppRes.status === 400, '5.2 Missing appointment rejected with HTTP 400')

    // 5.3 Missing case
    const noCaseRes = await fetch(`${BASE}/doctor/prescriptions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${doctorToken}` },
      body: JSON.stringify({ patientId: patient1.id, appointmentId: appointment.id, medicines: rxPayload.medicines })
    })
    assert(noCaseRes.status === 400, '5.3 Missing case rejected with HTTP 400')

    // 5.4 Empty medicines array
    const emptyMedRes = await fetch(`${BASE}/doctor/prescriptions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${doctorToken}` },
      body: JSON.stringify({ patientId: patient1.id, appointmentId: appointment.id, caseId: patientCase.id, medicines: [] })
    })
    assert(emptyMedRes.status === 400, '5.4 Empty medicines array rejected with HTTP 400')

    // 5.5 Medicine missing dosage / frequency / duration
    const badMedRes = await fetch(`${BASE}/doctor/prescriptions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${doctorToken}` },
      body: JSON.stringify({
        patientId: patient1.id,
        appointmentId: appointment.id,
        caseId: patientCase.id,
        medicines: [{ medicineName: 'Incomplete Medicine' }]
      })
    })
    assert(badMedRes.status === 400, '5.5 Medicine missing dosage/frequency/duration rejected with HTTP 400')

    // -------------------------------------------------------------
    // TEST 6: Unrelated Patient Rejection
    // -------------------------------------------------------------
    console.log('\n[TEST 6] Unrelated patient boundary validation...')
    const unrelatedRes = await fetch(`${BASE}/doctor/prescriptions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${doctorToken}` },
      body: JSON.stringify({
        patientId: patient2.id, // Patient 2 does not own Patient 1's appointment
        appointmentId: appointment.id,
        caseId: patientCase.id,
        medicines: rxPayload.medicines
      })
    })
    assert(unrelatedRes.status === 400, '6.1 Appointment belonging to different patient rejected with HTTP 400')

    // -------------------------------------------------------------
    // TEST 7: Duplicate Submission Protection
    // -------------------------------------------------------------
    console.log('\n[TEST 7] Duplicate submission protection...')
    const dupRes = await fetch(`${BASE}/doctor/prescriptions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${doctorToken}` },
      body: JSON.stringify(rxPayload)
    })
    const dupData = await dupRes.json()
    assert(dupRes.status === 200, '7.1 Duplicate prescription request returns HTTP 200 OK')
    assert(dupData.isDuplicate === true, '7.2 Response flags isDuplicate: true')
    assert((dupData.prescription.rxNumber || dupData.prescription.prescriptionNumber) === (createdRx.rxNumber || createdRx.prescriptionNumber), '7.3 Returns existing prescription number without recreating')

    // -------------------------------------------------------------
    // TEST 8: Doctor Prescription Retrieval
    // -------------------------------------------------------------
    console.log('\n[TEST 8] Doctor prescription retrieval...')
    const getByIdRes = await fetch(`${BASE}/doctor/prescriptions/${createdRx.id}`, {
      headers: { Authorization: `Bearer ${doctorToken}` }
    })
    const getByIdData = await getByIdRes.json()
    assert(getByIdRes.status === 200, '8.1 GET /api/doctor/prescriptions/:id by numeric ID returns HTTP 200')
    assert(!!getByIdData.prescription, '8.2 Prescription record returned')

    const rxNum = createdRx.rxNumber || createdRx.prescriptionNumber
    const getByNumRes = await fetch(`${BASE}/doctor/prescriptions/${rxNum}`, {
      headers: { Authorization: `Bearer ${doctorToken}` }
    })
    const getByNumData = await getByNumRes.json()
    assert(getByNumRes.status === 200, '8.3 GET /api/doctor/prescriptions/:rxNumber returns HTTP 200')
    assert((getByNumData.prescription.rxNumber || getByNumData.prescription.prescriptionNumber) === rxNum, '8.4 Retrieved correct prescription by RX Number')

    // Verify rich demographics and references
    const detailedRx = getByNumData.prescription
    assert(!!detailedRx.patient, '8.5 Prescription includes nested patient information')
    assert(detailedRx.patient.patientUniqueCode === 'AC-7F42K9', '8.6 Patient unique code present in details')
    assert(!!detailedRx.doctor, '8.7 Prescription includes doctor information')
    assert(!!detailedRx.appointment, '8.8 Prescription includes appointment information')
    assert(!!detailedRx.caseReference, '8.9 Prescription includes case reference')

    // -------------------------------------------------------------
    // TEST 9: Doctor Prescription History
    // -------------------------------------------------------------
    console.log('\n[TEST 9] Doctor prescription history...')
    const docHistoryRes = await fetch(`${BASE}/doctor/prescriptions`, {
      headers: { Authorization: `Bearer ${doctorToken}` }
    })
    const docHistoryData = await docHistoryRes.json()
    assert(docHistoryRes.status === 200, '9.1 GET /api/doctor/prescriptions returns HTTP 200')
    assert(Array.isArray(docHistoryData.prescriptions), '9.2 Doctor prescriptions returned as array')
    assert(docHistoryData.prescriptions.some(p => (p.rxNumber || p.prescriptionNumber) === rxNum), '9.3 Created prescription present in doctor history')

    // -------------------------------------------------------------
    // TEST 10: Patient Prescriptions Access
    // -------------------------------------------------------------
    console.log('\n[TEST 10] Patient portal prescription retrieval...')
    const patListRes = await fetch(`${BASE}/patient/prescriptions`, {
      headers: { Authorization: `Bearer ${patient1Token}` }
    })
    const patListData = await patListRes.json()
    assert(patListRes.status === 200, '10.1 GET /api/patient/prescriptions returns HTTP 200')
    assert(Array.isArray(patListData.prescriptions), '10.2 Patient prescriptions returned as array')
    assert(patListData.prescriptions.some(p => (p.rxNumber || p.prescriptionNumber) === rxNum), '10.3 Newly issued prescription available in Patient 1 list')

    const patDetailRes = await fetch(`${BASE}/patient/prescriptions/${createdRx.id}`, {
      headers: { Authorization: `Bearer ${patient1Token}` }
    })
    const patDetailData = await patDetailRes.json()
    assert(patDetailRes.status === 200, '10.4 GET /api/patient/prescriptions/:id returns HTTP 200')
    assert((patDetailData.prescription.rxNumber || patDetailData.prescription.prescriptionNumber) === rxNum, '10.5 Prescription details match')

    // -------------------------------------------------------------
    // TEST 11: Patient Cannot Access Another Patient's Prescription
    // -------------------------------------------------------------
    console.log('\n[TEST 11] Patient privacy boundary enforcement...')
    const crossAccessRes = await fetch(`${BASE}/patient/prescriptions/${createdRx.id}`, {
      headers: { Authorization: `Bearer ${patient2Token}` }
    })
    assert(crossAccessRes.status === 403, '11.1 Patient 2 access to Patient 1 prescription rejected with HTTP 403 Forbidden')

    // -------------------------------------------------------------
    // TEST 12: Pharmacy Integration
    // -------------------------------------------------------------
    console.log('\n[TEST 12] Pharmacy portal prescription retrieval...')
    const pharmDetailRes = await fetch(`${BASE}/pharmacy/prescriptions/${createdRx.id}`)
    const pharmDetailData = await pharmDetailRes.json()
    assert(pharmDetailRes.status === 200, '12.1 GET /api/pharmacy/prescriptions/:id returns HTTP 200')
    assert(!!pharmDetailData.prescription, '12.2 Pharmacy receives valid prescription object')
    assert((pharmDetailData.prescription.items || pharmDetailData.prescription.medicines || []).length === 3, '12.3 Pharmacy receives all prescribed medicine items')

    const pharmQueueRes = await fetch(`${BASE}/pharmacy/prescriptions`)
    const pharmQueueData = await pharmQueueRes.json()
    assert(pharmQueueRes.status === 200, '12.4 GET /api/pharmacy/prescriptions returns HTTP 200')
    assert(Array.isArray(pharmQueueData.prescriptions), '12.5 Pharmacy queue is an array')
    assert(pharmQueueData.prescriptions.some(p => (p.rxNumber || p.prescriptionNumber) === rxNum), '12.6 Prescription present in pharmacy dispensing queue')

    // -------------------------------------------------------------
    // TEST 13: Doctor Pharmacy Catalog / Medicines endpoint
    // -------------------------------------------------------------
    console.log('\n[TEST 13] Medicine catalog retrieval for doctor prescribing...')
    const medsRes = await fetch(`${BASE}/doctor/medicines`, {
      headers: { Authorization: `Bearer ${doctorToken}` }
    })
    const medsData = await medsRes.json()
    assert(medsRes.status === 200, '13.1 GET /api/doctor/medicines returns HTTP 200')
    assert(Array.isArray(medsData.medicines) && medsData.medicines.length >= 5, '13.2 Formularies returned from medicines catalog')

    // -------------------------------------------------------------
    // REGRESSION CHECKS: PROCESSES 1–6
    // -------------------------------------------------------------
    console.log('\n[REGRESSION CHECKS] Verifying Processes 1–6...')

    // P1: Registration
    const regCheckRes = await fetch(`${BASE}/patients/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Regression Citizen P7',
        mobile: '9899001122',
        dob: '01/01/1985',
        age: '40',
        gender: 'Female',
        identityType: 'Aadhaar',
        identityNumber: '8888 9999 0000',
        bloodGroup: 'A+'
      })
    })
    assert(regCheckRes.status === 201 || regCheckRes.status === 200, 'R1: Process 1 registration passes HTTP 200/201')

    // P2: Login
    const loginCheckRes = await fetch(`${BASE}/auth/patient/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobile: '9899001122' })
    })
    const loginCheckData = await loginCheckRes.json()
    assert(loginCheckRes.status === 200 && !!loginCheckData.token, 'R2: Process 2 login passes HTTP 200 & token')

    // P3: Case
    const caseCheckRes = await fetch(`${BASE}/patient-cases`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${loginCheckData.token}`
      },
      body: JSON.stringify({
        patientId: loginCheckData.patient.id,
        patientUniqueCode: loginCheckData.patient.patientUniqueCode,
        problem: 'General Health Review',
        duration: '1 day',
        severity: 'Mild'
      })
    })
    assert(caseCheckRes.status === 201, 'R3: Process 3 case creation passes HTTP 201')

    // P4: Appointment
    const appCheckRes = await fetch(`${BASE}/appointments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${loginCheckData.token}`
      },
      body: JSON.stringify({
        patientId: loginCheckData.patient.id,
        doctorId: doctorProfile.id,
        hospitalId: 1,
        appointmentDate: '2026-09-12',
        timeSlot: '11:00 AM - 11:30 AM',
        problem: 'General Health Review',
        severity: 'Mild'
      })
    })
    assert(appCheckRes.status === 201, 'R4: Process 4 appointment booking passes HTTP 201')

    // P5: Doctor OPD Queue
    const queueCheckRes = await fetch(`${BASE}/doctor/opd-queue`, {
      headers: { Authorization: `Bearer ${doctorToken}` }
    })
    assert(queueCheckRes.status === 200, 'R5: Process 5 doctor OPD queue passes HTTP 200')

    // P6: Diagnostic Requisition
    const diagCheckRes = await fetch(`${BASE}/diagnostic/requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${doctorToken}`
      },
      body: JSON.stringify({
        patientId: patient1.id,
        patientUniqueCode: patient1UniqueCode,
        doctorId: doctorProfile.id,
        testScan: 'CBC (Complete Blood Count)',
        priority: 'Routine',
        clinicalNotes: 'Pre-treatment routine baseline'
      })
    })
    assert(diagCheckRes.status === 201, 'R6: Process 6 diagnostic request passes HTTP 201')

    console.log('\n=================================================================')
    console.log(`PROCESS 7 TESTS COMPLETED: ${passed} PASSED, ${failed} FAILED`)
    console.log('=================================================================')
  } catch (err) {
    console.error('[UNEXPECTED TEST ERROR]:', err)
    failed++
  } finally {
    server.close()
    console.log('Process 7 test server closed cleanly.')
    if (failed > 0) process.exit(1)
  }
}

runTests()
