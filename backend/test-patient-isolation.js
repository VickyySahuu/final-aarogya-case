// Automated Regression Suite for Process 13: Real Patient Identity & Multi-Patient Isolation
import { app } from './server.js'

async function runTests() {
  console.log('=================================================================')
  console.log('  AAROGYA CASE — PROCESS 13 MULTI-PATIENT ISOLATION TESTS')
  console.log('=================================================================')

  const PORT = 5078
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
    // -----------------------------------------------------------------
    // 1. REGISTER PATIENT A (Vikas Sahu)
    // -----------------------------------------------------------------
    console.log('\n--- 1. REGISTER PATIENT A (Vikas Sahu) ---')
    const patAMobile = `9310${Math.floor(100000 + Math.random() * 900000)}`
    const patAAadhaar = `9148 ${Math.floor(1000 + Math.random() * 9000)} ${Math.floor(1000 + Math.random() * 9000)}`

    const regARes = await fetch(`${BASE}/patients/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Vikas Sahu',
        mobile: patAMobile,
        identityType: 'Aadhaar',
        identityNumber: patAAadhaar,
        dob: '2006-04-15',
        age: 20,
        gender: 'Male',
        bloodGroup: 'B+',
        address: 'Sector 62, Noida, Uttar Pradesh'
      })
    })
    const regAData = await regARes.json()
    assert(regARes.status === 201, '1.1 Patient A registered with HTTP 201')
    assert(regAData.success === true, '1.2 Registration success is true')
    assert(regAData.patient?.name === 'Vikas Sahu', '1.3 Patient A record name is Vikas Sahu (NOT Rajesh Kumar)')
    assert(!!regAData.token, '1.4 Registration issued authentic session token')
    assert(regAData.token.startsWith('PAT-SES-'), '1.5 Session token has PAT-SES- prefix')

    const tokenA = regAData.token
    const patientA = regAData.patient
    const patientAId = patientA.id || patientA.patientDatabaseId
    const patientACode = patientA.patient_unique_code || patientA.patientUniqueCode

    // -----------------------------------------------------------------
    // 2. VERIFY PATIENT A AUTHENTICATED SESSION (/api/auth/me)
    // -----------------------------------------------------------------
    console.log('\n--- 2. VERIFY PATIENT A SESSION (/api/auth/me) ---')
    const meARes = await fetch(`${BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${tokenA}` }
    })
    const meAData = await meARes.json()
    assert(meARes.status === 200, '2.1 GET /api/auth/me returns HTTP 200')
    assert(meAData.user?.name === 'Vikas Sahu' || meAData.patient?.name === 'Vikas Sahu', '2.2 GET /api/auth/me identifies Vikas Sahu')
    assert((meAData.user?.patient_unique_code || meAData.patient?.patientUniqueCode) === patientACode, '2.3 Permanent unique code matches across session')

    // -----------------------------------------------------------------
    // 3. PATIENT A CREATES CASE: "Headache and fever for 3 days"
    // -----------------------------------------------------------------
    console.log('\n--- 3. PATIENT A CREATES NEW CASE ---')
    const caseARes = await fetch(`${BASE}/patient-cases`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`
      },
      body: JSON.stringify({
        problem: 'Headache and fever for 3 days',
        duration: '3 days',
        symptoms: ['Fever', 'Headache']
      })
    })
    const caseAData = await caseARes.json()
    assert(caseARes.status === 201, '3.1 Case created with HTTP 201')
    assert(String(caseAData.case?.patient_id) === String(patientAId), '3.2 Case patient_id strictly matches Vikas Sahu ID')
    assert(caseAData.case?.problem === 'Headache and fever for 3 days', '3.3 Case problem is correctly saved')
    const caseAId = caseAData.case.id

    // -----------------------------------------------------------------
    // 4. PATIENT A BOOKS APPOINTMENT
    // -----------------------------------------------------------------
    console.log('\n--- 4. PATIENT A BOOKS APPOINTMENT ---')
    const apptARes = await fetch(`${BASE}/appointments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`
      },
      body: JSON.stringify({
        doctorId: 1,
        hospitalId: 1,
        caseId: caseAId,
        date: '2026-09-15',
        timeSlot: '10:30 AM',
        chiefComplaint: 'Headache and fever for 3 days'
      })
    })
    const apptAData = await apptARes.json()
    assert(apptARes.status === 201, '4.1 Appointment booked with HTTP 201')
    assert((apptAData.appointment?.patientName || apptAData.appointment?.patient_name) === 'Vikas Sahu', '4.2 Appointment patientName is Vikas Sahu')
    assert((apptAData.appointment?.patientUniqueCode || apptAData.appointment?.patient_unique_code) === patientACode, '4.3 Appointment carries Vikas Sahu unique code')
    assert(String(apptAData.appointment?.patientId || apptAData.appointment?.patient_id) === String(patientAId), '4.4 Appointment belongs to Vikas Sahu patientId')
    const apptAId = apptAData.appointment.id

    // -----------------------------------------------------------------
    // 5. DOCTOR RECOGNIZES PATIENT A IN QUEUE & OPD OPERATIONS
    // -----------------------------------------------------------------
    console.log('\n--- 5. DOCTOR OPD QUEUE & CLINICAL OPERATIONS FOR PATIENT A ---')
    const docLoginRes = await fetch(`${BASE}/auth/doctor/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ doctorId: 'DOC-1042' })
    })
    const docLoginData = await docLoginRes.json()
    assert(docLoginRes.status === 200, '5.1 Doctor login succeeded')
    const doctorToken = docLoginData.token

    // OPD Queue check
    const queueRes = await fetch(`${BASE}/doctor/opd-queue`, {
      headers: { Authorization: `Bearer ${doctorToken}` }
    })
    const queueData = await queueRes.json()
    assert(queueRes.status === 200, '5.2 GET /api/doctor/opd-queue returns HTTP 200')
    const queueItemA = (queueData.queue || []).find(q => q.patient_unique_code === patientACode || q.uniqueCode === patientACode || q.patientName === 'Vikas Sahu')
    assert(!!queueItemA, '5.3 Vikas Sahu appears in Doctor OPD Queue')
    assert(queueItemA?.patientName === 'Vikas Sahu', '5.4 Queue item name is Vikas Sahu (NOT Rajesh Kumar)')

    // Doctor Notes for Patient A
    const notesRes = await fetch(`${BASE}/doctor/notes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${doctorToken}`
      },
      body: JSON.stringify({
        patientId: patientAId,
        patientUniqueCode: patientACode,
        appointmentId: apptAId,
        caseId: caseAId,
        chiefComplaint: 'Headache and fever for 3 days',
        examination: 'Febrile (101 F), throat congested, chest clear',
        diagnosis: 'Acute Viral Pharyngitis',
        clinicalNotes: 'Prescribed antipyretic and oral fluids'
      })
    })
    const notesData = await notesRes.json()
    assert(notesRes.status === 200 || notesRes.status === 201, '5.5 Doctor saved clinical notes for Patient A')

    // Prescription for Patient A
    const rxRes = await fetch(`${BASE}/doctor/prescriptions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${doctorToken}`
      },
      body: JSON.stringify({
        patientId: patientAId,
        patientUniqueCode: patientACode,
        appointmentId: apptAId,
        caseId: caseAId,
        doctorId: 1,
        medicines: [
          { name: 'Paracetamol 650mg', dosage: '650mg', frequency: 'Twice daily', duration: '5 days', requiredQty: 10 }
        ]
      })
    })
    const rxData = await rxRes.json()
    assert(rxRes.status === 201, '5.6 Doctor issued e-prescription for Patient A')
    assert(rxData.prescription?.patient_name === 'Vikas Sahu' || rxData.prescription?.patientName === 'Vikas Sahu', '5.7 Prescription belongs to Vikas Sahu')

    // -----------------------------------------------------------------
    // 6. REGISTER PATIENT B (Test Patient B)
    // -----------------------------------------------------------------
    console.log('\n--- 6. REGISTER PATIENT B (Test Patient B) ---')
    const patBMobile = `9320${Math.floor(100000 + Math.random() * 900000)}`
    const patBAadhaar = `9148 ${Math.floor(1000 + Math.random() * 9000)} ${Math.floor(1000 + Math.random() * 9000)}`

    const regBRes = await fetch(`${BASE}/patients/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Patient B',
        mobile: patBMobile,
        identityType: 'Aadhaar',
        identityNumber: patBAadhaar,
        dob: '2001-08-20',
        age: 25,
        gender: 'Female',
        bloodGroup: 'O+',
        address: 'Connaught Place, New Delhi'
      })
    })
    const regBData = await regBRes.json()
    assert(regBRes.status === 201, '6.1 Patient B registered with HTTP 201')
    assert(regBData.patient?.name === 'Test Patient B', '6.2 Patient B name is Test Patient B')
    assert(regBData.token !== tokenA, '6.3 Patient B token is completely distinct from Patient A token')

    const tokenB = regBData.token
    const patientB = regBData.patient
    const patientBId = patientB.id || patientB.patientDatabaseId
    const patientBCode = patientB.patient_unique_code || patientB.patientUniqueCode

    // Verify /api/auth/me for Patient B
    const meBRes = await fetch(`${BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${tokenB}` }
    })
    const meBData = await meBRes.json()
    assert(meBData.user?.name === 'Test Patient B' || meBData.patient?.name === 'Test Patient B', '6.4 GET /api/auth/me identifies Test Patient B')
    assert(meBData.user?.name !== 'Vikas Sahu' && meBData.patient?.name !== 'Vikas Sahu', '6.5 Patient B session has zero leakage from Patient A')

    // Patient B creates a completely different Case: "Severe knee sprain"
    const caseBRes = await fetch(`${BASE}/patient-cases`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenB}`
      },
      body: JSON.stringify({
        problem: 'Severe knee sprain after football match',
        duration: '1 day',
        symptoms: ['Knee swelling', 'Difficulty walking']
      })
    })
    const caseBData = await caseBRes.json()
    assert(caseBRes.status === 201, '6.6 Patient B case created with HTTP 201')
    assert(String(caseBData.case?.patient_id) === String(patientBId), '6.7 Patient B case is linked to Patient B ID')
    assert(String(caseBData.case?.patient_id) !== String(patientAId), '6.8 Patient B case is NOT linked to Patient A ID')

    // -----------------------------------------------------------------
    // 7. MULTI-PATIENT ISOLATION & DATA PRIVACY VERIFICATION
    // -----------------------------------------------------------------
    console.log('\n--- 7. MULTI-PATIENT ISOLATION & DATA PRIVACY VERIFICATION ---')

    // Patient B retrieves their own cases
    const casesBRes = await fetch(`${BASE}/patient-cases`, {
      headers: { Authorization: `Bearer ${tokenB}` }
    })
    const casesBData = await casesBRes.json()
    const casesBList = casesBData.cases || []
    assert(casesBList.length >= 1, '7.1 Patient B has at least 1 case in their history')
    const hasOnlyPatientBCases = casesBList.every(c => String(c.patient_id) === String(patientBId))
    assert(hasOnlyPatientBCases, '7.2 All cases in Patient B list belong strictly to Patient B')
    const leakedPatientACase = casesBList.some(c => c.problem.includes('Headache and fever'))
    assert(!leakedPatientACase, '7.3 Zero leakage of Patient A case into Patient B history')

    // Patient A retrieves their own cases
    const casesARes = await fetch(`${BASE}/patient-cases`, {
      headers: { Authorization: `Bearer ${tokenA}` }
    })
    const casesAData = await casesARes.json()
    const casesAList = casesAData.cases || []
    assert(casesAList.length >= 1, '7.4 Patient A has at least 1 case in their history')
    const hasOnlyPatientACases = casesAList.every(c => String(c.patient_id) === String(patientAId))
    assert(hasOnlyPatientACases, '7.5 All cases in Patient A list belong strictly to Patient A')
    const leakedPatientBCase = casesAList.some(c => c.problem.includes('knee sprain'))
    assert(!leakedPatientBCase, '7.6 Zero leakage of Patient B case into Patient A history')

    // Patient B attempts to fetch Patient A history directly
    const crossHistRes = await fetch(`${BASE}/patients/${patientAId}/history`, {
      headers: { Authorization: `Bearer ${tokenB}` }
    })
    assert(crossHistRes.status === 403 || crossHistRes.status === 401, '7.7 Cross-patient history request strictly rejected with HTTP 403 Forbidden')

    // Patient B fetches their own history
    const ownHistRes = await fetch(`${BASE}/patients/${patientBId}/history`, {
      headers: { Authorization: `Bearer ${tokenB}` }
    })
    const ownHistData = await ownHistRes.json()
    assert(ownHistRes.status === 200, '7.8 Patient B fetches own history with HTTP 200')
    assert(ownHistData.patient?.name === 'Test Patient B', '7.9 History belongs to Test Patient B')

    console.log('\n=================================================================')
    console.log(`  PROCESS 13 MULTI-PATIENT ISOLATION: ${passed} PASSED, ${failed} FAILED`)
    console.log('=================================================================')

  } catch (err) {
    console.error('Test Suite Fatal Error:', err)
    failed++
  } finally {
    server.close()
  }

  if (failed > 0) {
    process.exit(1)
  }
}

runTests()
