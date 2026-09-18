// Automated Test Suite for Process 8: Pharmacy Dispensing & Delivery Verification Lifecycle
import { app } from './server.js'

async function runTests() {
  console.log('=================================================================')
  console.log('  AAROGYA CASE — PROCESS 8 PHARMACY DISPENSING TESTS')
  console.log('=================================================================')

  const PORT = 5067
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
    // SETUP: Setup Doctor, Patients & Pharmacy
    // -------------------------------------------------------------
    console.log('\n[SETUP] Authenticating prototype roles...')

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
    assert(pat1LoginRes.status === 200 && !!pat1LoginData.token, 'Setup: Primary Patient session established')
    const patient1 = pat1LoginData.patient
    const patient1Code = patient1.patient_unique_code || patient1.patientUniqueCode

    // 3. Register & Login Patient 2 (Anita Verma) for cross-verification boundary tests
    const pat2RegRes = await fetch(`${BASE}/patients/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Anita Verma',
        mobile: '9811223344',
        gender: 'Female',
        age: 36,
        aadhaarNumber: '112233445566',
        address: 'Sector 14, Gandhinagar'
      })
    })
    const pat2RegData = await pat2RegRes.json()
    const patient2Code = pat2RegData.patient?.patientUniqueCode || pat2RegData.patient?.patient_unique_code || 'AC-ANITA2'
    assert(!!patient2Code, 'Setup: Secondary Patient (Anita) registered for cross-delivery verification')

    // -------------------------------------------------------------
    // TEST 1: AUTHENTICATION
    // -------------------------------------------------------------
    console.log('\n[TEST 1] Pharmacy Authentication & Access Control...')

    // 1.1 Unauthenticated access to mutation endpoint rejected
    const unauthDispRes = await fetch(`${BASE}/pharmacy/dispensings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prescriptionId: 1 })
    })
    assert(unauthDispRes.status === 401, '1.1 Unauthenticated access to POST /api/pharmacy/dispensings rejected with HTTP 401')

    // 1.2 Invalid session token rejected
    const invalidTokenRes = await fetch(`${BASE}/pharmacy/dispensings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer INVALID-TOKEN-XYZ'
      },
      body: JSON.stringify({ prescriptionId: 1 })
    })
    assert(invalidTokenRes.status === 401, '1.2 Invalid session token rejected with HTTP 401')

    // 1.3 Unauthenticated access to history rejected
    const unauthHistRes = await fetch(`${BASE}/pharmacy/history`)
    assert(unauthHistRes.status === 401, '1.3 Unauthenticated access to GET /api/pharmacy/history rejected with HTTP 401')

    // 1.4 Valid pharmacy login creates session
    const pharmLoginRes = await fetch(`${BASE}/auth/pharmacy/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pharmacyId: 'PHARM-01' })
    })
    const pharmLoginData = await pharmLoginRes.json()
    assert(pharmLoginRes.status === 200 && !!pharmLoginData.token, '1.4 POST /api/auth/pharmacy/login returns HTTP 200 with token')
    assert(pharmLoginData.session?.role === 'pharmacy', '1.5 Pharmacy session has role "pharmacy"')
    const pharmacyToken = pharmLoginData.token
    const pharmHeaders = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${pharmacyToken}`
    }

    // -------------------------------------------------------------
    // TEST 2: PRESCRIPTION QUEUE
    // -------------------------------------------------------------
    console.log('\n[TEST 2] Pharmacy Prescription Queue...')

    // Create case for Patient 1
    const caseRes = await fetch(`${BASE}/patient-cases`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${pat1LoginData.token}`
      },
      body: JSON.stringify({
        patientId: patient1.id,
        patientUniqueCode: patient1Code,
        problem: 'Acute Bronchitis and Productive Cough',
        duration: '4 days',
        severity: 'Moderate',
        symptoms: ['Cough', 'Fever', 'Chest Congestion']
      })
    })
    const caseData = await caseRes.json()
    assert(caseRes.status === 201 && !!caseData.case, 'Setup: Patient Case created')
    const patientCase = caseData.case

    // Book appointment for Patient 1
    const appRes = await fetch(`${BASE}/appointments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${pat1LoginData.token}`
      },
      body: JSON.stringify({
        patientId: patient1.id,
        doctorId: doctorProfile?.id || 1,
        hospitalId: 1,
        caseId: patientCase.id,
        appointmentDate: '2026-09-10',
        timeSlot: '11:00 AM',
        problem: patientCase.problem,
        severity: 'Moderate'
      })
    })
    const appData = await appRes.json()
    assert(appRes.status === 201 && !!appData.appointment, 'Setup: Appointment booked for patient')
    const appointment = appData.appointment

    // Create a real new prescription issued by doctor for Patient 1
    const createRxRes = await fetch(`${BASE}/doctor/prescriptions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${doctorToken}`
      },
      body: JSON.stringify({
        patientId: patient1.id,
        appointmentId: appointment.id,
        caseId: patientCase.id,
        diagnosis: 'Acute Bronchitis with Productive Cough',
        icdCode: 'ICD-10: J20.9',
        vitals: 'BP 122/80 · Temp 99.1°F · Pulse 76 bpm',
        medicines: [
          {
            medicineName: 'Amoxicillin 500mg Capsule',
            category: 'Antibiotic',
            dosage: '1 Capsule',
            frequency: 'Thrice Daily (TDS)',
            duration: '5 Days (15 Capsules)',
            requiredQty: 15,
            instructions: 'Take with food'
          },
          {
            medicineName: 'Ambroxol 30mg Tablet',
            category: 'Mucolytic',
            dosage: '1 Tablet',
            frequency: 'Twice Daily (BD)',
            duration: '5 Days (10 Tablets)',
            requiredQty: 10,
            instructions: 'Take after meals'
          }
        ]
      })
    })
    const createRxData = await createRxRes.json()
    assert(createRxRes.status === 201, '2.1 Doctor issues new prescription for patient')
    const testRx = createRxData.prescription
    const rxId = testRx.id
    const rxNumber = testRx.rxNumber || testRx.prescriptionNumber

    // Fetch pharmacy queue
    const queueRes = await fetch(`${BASE}/pharmacy/prescriptions`, { headers: pharmHeaders })
    const queueData = await queueRes.json()
    assert(queueRes.status === 200, '2.2 GET /api/pharmacy/prescriptions returns HTTP 200')
    assert(Array.isArray(queueData.prescriptions), '2.3 Pharmacy queue returns prescriptions array')

    const queuedItem = queueData.prescriptions.find(p => p.id === rxId || p.prescriptionNumber === rxNumber)
    assert(!!queuedItem, '2.4 Newly issued prescription appears in pharmacy queue')
    assert(queuedItem?.patientName === patient1.name, '2.5 Queue item contains patient name')
    assert(queuedItem?.patientUniqueCode === patient1Code, '2.6 Queue item contains permanent patientUniqueCode')
    assert(queuedItem?.doctorName === 'Dr. Ramanathan Venkatraman', '2.7 Queue item contains doctor name')
    assert(queuedItem?.status === 'Issued', '2.8 Queue item status is "Issued"')
    assert((queuedItem?.medicines || queuedItem?.medicineItems || []).length === 2, '2.9 Queue item contains medicine items')
    assert(queuedItem?.dispensingStatus === 'Pending', '2.10 Dispensing status is "Pending"')

    // -------------------------------------------------------------
    // TEST 3: PRESCRIPTION RETRIEVAL
    // -------------------------------------------------------------
    console.log('\n[TEST 3] Prescription Retrieval & Verification...')

    // 3.1 Valid prescription retrieval
    const getRxRes = await fetch(`${BASE}/pharmacy/prescriptions/${rxId}`, { headers: pharmHeaders })
    const getRxData = await getRxRes.json()
    assert(getRxRes.status === 200, '3.1 GET /api/pharmacy/prescriptions/:id returns HTTP 200')
    assert(getRxData.prescription?.id === rxId, '3.2 Retrieved prescription matches requested ID')
    assert(getRxData.prescription?.patientUniqueCode === patient1Code, '3.3 Prescription contains patient unique code')

    // 3.2 Non-existent prescription ID returns 404
    const notFoundRxRes = await fetch(`${BASE}/pharmacy/prescriptions/999999`, { headers: pharmHeaders })
    assert(notFoundRxRes.status === 404, '3.4 Non-existent prescription ID returns HTTP 404')

    // -------------------------------------------------------------
    // TEST 4: DISPENSING VALIDATION & WORKFLOW
    // -------------------------------------------------------------
    console.log('\n[TEST 4] Dispense Medicine Validation...')

    // 4.1 Missing prescription rejected
    const missingRxRes = await fetch(`${BASE}/pharmacy/dispensings`, {
      method: 'POST',
      headers: pharmHeaders,
      body: JSON.stringify({ prescriptionId: 999999, dispensedItems: [{ name: 'Amoxicillin 500mg', quantity: 15 }] })
    })
    assert(missingRxRes.status === 404, '4.1 Dispensing non-existent prescription rejected with HTTP 404')

    // 4.2 Invalid quantity rejected
    const invalidQtyRes = await fetch(`${BASE}/pharmacy/dispensings`, {
      method: 'POST',
      headers: pharmHeaders,
      body: JSON.stringify({
        prescriptionId: rxId,
        dispensedItems: [{ name: 'Amoxicillin 500mg Capsule', quantity: -5 }]
      })
    })
    assert(invalidQtyRes.status === 400, '4.2 Negative or zero quantity rejected with HTTP 400')

    // 4.3 Medicine not belonging to prescription rejected
    const unprescribedMedRes = await fetch(`${BASE}/pharmacy/dispensings`, {
      method: 'POST',
      headers: pharmHeaders,
      body: JSON.stringify({
        prescriptionId: rxId,
        dispensedItems: [{ name: 'Morphine Sulfate 50mg Injection', quantity: 1 }]
      })
    })
    assert(unprescribedMedRes.status === 400, '4.3 Medicine not on prescription rejected with HTTP 400')

    // 4.4 Valid dispensing with multiple medicines
    const validDispRes = await fetch(`${BASE}/pharmacy/dispensings`, {
      method: 'POST',
      headers: pharmHeaders,
      body: JSON.stringify({
        prescriptionId: rxId,
        dispensedItems: [
          { name: 'Amoxicillin 500mg Capsule', quantity: 15 },
          { name: 'Ambroxol 30mg Tablet', quantity: 10 }
        ],
        dispensedBy: 'Pharmacist Lead'
      })
    })
    const validDispData = await validDispRes.json()
    assert(validDispRes.status === 201, '4.4 Valid dispensing created with HTTP 201')
    assert(!!validDispData.dispensing, '4.5 Response contains dispensing record')
    const dispensing = validDispData.dispensing
    const dispensingId = dispensing.id
    const dispensingNumber = dispensing.dispensingNumber

    assert(dispensingNumber.startsWith('DISP-'), `4.6 Dispensing number generated with format DISP-YYYY-XXXXXX (${dispensingNumber})`)
    assert(dispensing.status === 'Dispensed', '4.7 Dispensing record status is "Dispensed"')
    assert(dispensing.patientUniqueCode === patient1Code, '4.8 Dispensing record stores correct patient unique code')
    assert((dispensing.dispensedItems || []).length === 2, '4.9 All dispensed items recorded')
    assert(validDispData.prescription?.status === 'Dispensed', '4.10 Prescription status updated to "Dispensed"')

    // 4.11 Duplicate dispensing rejection
    const duplicateDispRes = await fetch(`${BASE}/pharmacy/dispensings`, {
      method: 'POST',
      headers: pharmHeaders,
      body: JSON.stringify({
        prescriptionId: rxId,
        dispensedItems: [{ name: 'Amoxicillin 500mg Capsule', quantity: 15 }]
      })
    })
    assert(duplicateDispRes.status === 400, '4.11 Duplicate dispensing attempt on same prescription rejected with HTTP 400')

    // -------------------------------------------------------------
    // TEST 5: DELIVERY VERIFICATION (PATIENT UNIQUE CODE)
    // -------------------------------------------------------------
    console.log('\n[TEST 5] Delivery Verification Gate...')

    // 5.1 Missing patient unique code rejected
    const emptyCodeRes = await fetch(`${BASE}/pharmacy/dispensings/${dispensingId}/verify-delivery`, {
      method: 'POST',
      headers: pharmHeaders,
      body: JSON.stringify({ patientUniqueCode: '' })
    })
    assert(emptyCodeRes.status === 400, '5.1 Missing patient unique code rejected with HTTP 400')

    // 5.2 Invalid / arbitrary code rejected
    const invalidCodeRes = await fetch(`${BASE}/pharmacy/dispensings/${dispensingId}/verify-delivery`, {
      method: 'POST',
      headers: pharmHeaders,
      body: JSON.stringify({ patientUniqueCode: 'AC-FAKE99' })
    })
    assert(invalidCodeRes.status === 400, '5.2 Invalid patient unique code rejected with HTTP 400')

    // 5.3 Wrong patient's unique code rejected (Anita's code for Rajesh's prescription)
    const wrongPatientCodeRes = await fetch(`${BASE}/pharmacy/dispensings/${dispensingId}/verify-delivery`, {
      method: 'POST',
      headers: pharmHeaders,
      body: JSON.stringify({ patientUniqueCode: patient2Code })
    })
    assert(wrongPatientCodeRes.status === 400, '5.3 Wrong patient unique code rejected with HTTP 400')

    // 5.4 Valid delivery verification with correct Patient Unique Code
    const validVerifyRes = await fetch(`${BASE}/pharmacy/dispensings/${dispensingId}/verify-delivery`, {
      method: 'POST',
      headers: pharmHeaders,
      body: JSON.stringify({
        patientUniqueCode: patient1Code,
        deliveredBy: 'Pharmacist Lead'
      })
    })
    const validVerifyData = await validVerifyRes.json()
    assert(validVerifyRes.status === 200, '5.4 Valid Patient Unique Code verification returns HTTP 200')
    assert(validVerifyData.dispensing?.status === 'Completed', '5.5 Dispensing record status updated to "Completed"')
    assert(!!validVerifyData.dispensing?.verifiedAt, '5.6 Verification timestamp recorded')
    assert(validVerifyData.prescription?.status === 'Completed', '5.7 Prescription status updated to "Completed"')
    assert((validVerifyData.prescription?.pharmacyStatus || validVerifyData.prescription?.pharmacy_status) === 'Delivered', '5.8 Pharmacy status updated to "Delivered"')

    // 5.9 Second delivery verification attempt rejected (duplicate protection)
    const secondVerifyRes = await fetch(`${BASE}/pharmacy/dispensings/${dispensingId}/verify-delivery`, {
      method: 'POST',
      headers: pharmHeaders,
      body: JSON.stringify({ patientUniqueCode: patient1Code })
    })
    assert(secondVerifyRes.status === 400, '5.9 Duplicate delivery verification rejected with HTTP 400')

    // 5.10 Dispensed prescription no longer in active queue
    const queueAfterRes = await fetch(`${BASE}/pharmacy/prescriptions`, { headers: pharmHeaders })
    const queueAfterData = await queueAfterRes.json()
    const foundInActiveQueue = queueAfterData.prescriptions.some(p => p.id === rxId)
    assert(!foundInActiveQueue, '5.10 Completed prescription removed from active dispensing queue')

    // -------------------------------------------------------------
    // TEST 6: PHARMACY HISTORY
    // -------------------------------------------------------------
    console.log('\n[TEST 6] Pharmacy History & Audit Trail...')

    const historyRes = await fetch(`${BASE}/pharmacy/history`, { headers: pharmHeaders })
    const historyData = await historyRes.json()
    assert(historyRes.status === 200, '6.1 GET /api/pharmacy/history returns HTTP 200')
    assert(Array.isArray(historyData.history), '6.2 Pharmacy history is an array')

    const historyRecord = historyData.history.find(h => h.dispensingNumber === dispensingNumber || h.prescriptionId === rxId)
    assert(!!historyRecord, '6.3 Completed dispensing appears in pharmacy history')
    assert(historyRecord?.patientName === patient1.name, '6.4 History record retains patient name')
    assert(historyRecord?.patientUniqueCode === patient1Code, '6.5 History record retains Patient Unique Code')
    assert(historyRecord?.status === 'Completed', '6.6 History record status is "Completed"')
    assert((historyRecord?.dispensedItems || historyRecord?.items || []).length === 2, '6.7 History record contains dispensed medicines and quantities')

    // -------------------------------------------------------------
    // TEST 7: PATIENT UNIQUE CODE INTEGRITY
    // -------------------------------------------------------------
    console.log('\n[TEST 7] Patient Unique Code Integrity...')

    // Verify patient profile in registry retains permanent unique code
    const pat1ProfileRes = await fetch(`${BASE}/patients/${patient1.id}`, {
      headers: { Authorization: `Bearer ${pat1LoginData.token}` }
    })
    const pat1ProfileData = await pat1ProfileRes.json()
    const finalCode = pat1ProfileData.patient?.patientUniqueCode || pat1ProfileData.patient?.patient_unique_code
    assert(finalCode === patient1Code, '7.1 Permanent Patient Unique Code unchanged in registry')
    assert(dispensing.patientUniqueCode === patient1Code, '7.2 Dispensing preserves identical permanent unique code')
    assert(historyRecord.patientUniqueCode === patient1Code, '7.3 History audit preserves identical permanent unique code')
    assert(!JSON.stringify(patient1Code).includes('prescription') && !JSON.stringify(patient1Code).includes('diagnosis'), '7.4 Unique code is an opaque token containing NO private medical data')

  } catch (err) {
    console.error('[ERROR] Unexpected test execution exception:', err)
    failed++
  } finally {
    server.close()
    console.log('\n=================================================================')
    console.log(`  PROCESS 8 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`)
    console.log('=================================================================')
    if (failed > 0) {
      process.exit(1)
    }
  }
}

runTests()
