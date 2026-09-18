// Automated Test for Process 1: Patient Registration & Lookup
import { app } from './server.js'

async function runTests() {
  console.log('--- STARTING PROCESS 1 PATIENT REGISTRATION TESTS ---')

  const PORT = 5055
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
    // 1. Health check
    const healthRes = await fetch(`${BASE}/health`)
    const healthData = await healthRes.json()
    assert(healthRes.status === 200 && healthData.status === 'online', '1. Health check responds with status online')

    // 2. Register a new test patient
    const uniqueSuffix = Date.now().toString().slice(-6)
    const testPatient = {
      name: `Test Citizen ${uniqueSuffix}`,
      mobile: `9811${uniqueSuffix}`,
      dob: '22/08/1985',
      age: '40',
      gender: 'Female',
      identityType: 'Aadhaar',
      identityNumber: `9988 7766 ${uniqueSuffix}`,
      bloodGroup: 'O+',
      address: 'Test Ward 4, District Civil Hospital Zone'
    }

    console.log(`\nRegistering new patient: ${testPatient.name} (Mobile: ${testPatient.mobile})`)
    const regRes = await fetch(`${BASE}/patients/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testPatient)
    })
    const regData = await regRes.json()

    assert(regRes.status === 201, '2. Registration endpoint returns HTTP 201 Created')
    assert(regData.success === true, '3. Response success is true')
    assert(!!regData.patient, '4. Response contains patient record')
    assert(regData.patient.name === testPatient.name, '5. Patient name matches input')
    assert(regData.patient.patientId && regData.patient.patientId.startsWith('AC-'), `6. Patient ID is generated (${regData.patient?.patientId})`)
    assert(regData.patient.patientUniqueCode && regData.patient.patientUniqueCode.startsWith('AC-'), `7. Patient Unique Code is generated (${regData.patient?.patientUniqueCode})`)
    assert(regData.isExisting === false, '8. isExisting is false for new registration')

    const initialPatientId = regData.patient.patientId
    const initialUniqueCode = regData.patient.patientUniqueCode

    // 3. Test duplicate registration prevention
    console.log('\nTesting duplicate registration with same mobile & identity...')
    const dupRes = await fetch(`${BASE}/patients/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testPatient)
    })
    const dupData = await dupRes.json()

    assert(dupRes.status === 200, '9. Duplicate registration returns HTTP 200 OK')
    assert(dupData.isExisting === true, '10. isExisting flag is true on duplicate registration')
    assert(dupData.patient.patientUniqueCode === initialUniqueCode, `11. Patient Unique Code remained identical (${dupData.patient?.patientUniqueCode})`)
    assert(dupData.patient.patientId === initialPatientId, `12. Patient ID remained identical (${dupData.patient?.patientId})`)

    // 4. Test GET /api/patients/:id by unique code
    console.log(`\nTesting patient lookup by unique code: ${initialUniqueCode}`)
    const lookupRes = await fetch(`${BASE}/patients/${initialUniqueCode}`)
    const lookupData = await lookupRes.json()
    assert(lookupRes.status === 200, '13. GET /api/patients/:id with unique code returns HTTP 200')
    assert(lookupData.patient?.patientUniqueCode === initialUniqueCode, '14. Lookup returns patient with matching unique code')

    // 5. Test GET /api/patients/code/:code
    const codeRes = await fetch(`${BASE}/patients/code/${initialUniqueCode}`)
    const codeData = await codeRes.json()
    assert(codeRes.status === 200 && codeData.patient?.patientUniqueCode === initialUniqueCode, '15. GET /api/patients/code/:code returns matching patient')

    // 6. Test invalid registration payload handling
    console.log('\nTesting validation error handling for invalid registration data...')
    const invalidRes = await fetch(`${BASE}/patients/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: '', mobile: '123' })
    })
    const invalidData = await invalidRes.json()
    assert(invalidRes.status === 400, '16. Invalid registration returns HTTP 400 Bad Request')
    assert(invalidData.success === false && !!invalidData.message, '17. Error message returned for invalid data')

    console.log('\n==================================================')
    console.log(`TEST SUMMARY: ${passed} passed, ${failed} failed`)
    console.log('==================================================')
  } catch (err) {
    console.error('Test execution error:', err)
    failed++
  } finally {
    server.close(() => {
      console.log('Test server closed cleanly.')
      process.exitCode = failed > 0 ? 1 : 0
    })
  }
}

runTests()
