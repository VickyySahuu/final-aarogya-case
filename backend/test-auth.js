// Automated Test Suite for Process 2: Patient Authentication & Session Lifecycle
import { app } from './server.js'

async function runTests() {
  console.log('--- STARTING PROCESS 2 PATIENT AUTHENTICATION & SESSION TESTS ---')

  const PORT = 5056
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
    // 1. Health Check
    const healthRes = await fetch(`${BASE}/health`)
    const healthData = await healthRes.json()
    assert(healthRes.status === 200 && healthData.status === 'online', 'Health check is online')

    // -------------------------------------------------------------
    // TEST 1: Valid patient login (Mobile & Aadhaar)
    // -------------------------------------------------------------
    console.log('\n[TEST 1] Valid patient login via Mobile and Aadhaar...')
    // Login with Mobile
    const mobileLoginRes = await fetch(`${BASE}/auth/patient/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobile: '9876543210' })
    })
    const mobileLoginData = await mobileLoginRes.json()

    assert(mobileLoginRes.status === 200, '1.1 Login with registered mobile returns HTTP 200')
    assert(mobileLoginData.success === true, '1.2 Login response success is true')
    assert(!!mobileLoginData.token && mobileLoginData.token.startsWith('PAT-SES-'), '1.3 Session token is generated')
    assert(mobileLoginData.patient?.name === 'Rajesh Kumar Sharma', '1.4 Patient Name matches default citizen')
    assert(mobileLoginData.patient?.patientId === 'AC-2025-884920', '1.5 Patient ID matches system identifier')
    assert(mobileLoginData.patient?.patientUniqueCode === 'AC-7F42K9', '1.6 Patient Unique Code matches permanent identifier')
    assert(!mobileLoginData.patient?.password && !mobileLoginData.patient?.password_hash, '1.7 Security: Passwords not exposed in response')

    // Login with Aadhaar
    const idLoginRes = await fetch(`${BASE}/auth/patient/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identityNumber: '9148 2911 0248' })
    })
    const idLoginData = await idLoginRes.json()
    assert(idLoginRes.status === 200, '1.8 Login with registered Aadhaar returns HTTP 200')
    assert(idLoginData.patient?.patientUniqueCode === 'AC-7F42K9', '1.9 Aadhaar login resolves to identical patient')

    // -------------------------------------------------------------
    // TEST 2: Invalid login scenarios & validation
    // -------------------------------------------------------------
    console.log('\n[TEST 2] Invalid login scenarios & error handling...')
    // Missing credentials
    const emptyRes = await fetch(`${BASE}/auth/patient/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    })
    assert(emptyRes.status === 400, '2.1 Missing credentials returns HTTP 400 Bad Request')

    // Malformed mobile (less than 10 digits)
    const malformedMobileRes = await fetch(`${BASE}/auth/patient/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobile: '98765' })
    })
    assert(malformedMobileRes.status === 400, '2.2 Malformed mobile returns HTTP 400 Bad Request')

    // Non-existent mobile number
    const notFoundMobileRes = await fetch(`${BASE}/auth/patient/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobile: '9999900000' })
    })
    const notFoundMobileData = await notFoundMobileRes.json()
    assert(notFoundMobileRes.status === 404, '2.3 Non-existent mobile returns HTTP 404 Not Found')
    assert(notFoundMobileData.success === false && !!notFoundMobileData.message, '2.4 Error message returned for non-existent citizen')

    // Non-existent Aadhaar / ABHA
    const notFoundIdRes = await fetch(`${BASE}/auth/patient/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identityNumber: '0000 0000 0000' })
    })
    assert(notFoundIdRes.status === 404, '2.5 Non-existent identity returns HTTP 404 Not Found')

    // -------------------------------------------------------------
    // TEST 3: Existing registered patient login (Cross-process integration)
    // -------------------------------------------------------------
    console.log('\n[TEST 3] Logging in a newly registered patient (Process 1 -> Process 2)...')
    const uniqueSuffix = Date.now().toString().slice(-6)
    const newCitizen = {
      name: `Aarogya Citizen ${uniqueSuffix}`,
      mobile: `9844${uniqueSuffix}`,
      dob: '12/10/1992',
      age: '33',
      gender: 'Female',
      identityType: 'Aadhaar',
      identityNumber: `8877 6655 ${uniqueSuffix}`,
      bloodGroup: 'A+',
      address: 'Central Civic Colony, Sector 9'
    }

    // Register via Process 1 endpoint
    const regRes = await fetch(`${BASE}/patients/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newCitizen)
    })
    const regData = await regRes.json()
    assert(regRes.status === 201, '3.1 Citizen registered successfully via Process 1')
    const registeredPatientId = regData.patient.patientId
    const registeredUniqueCode = regData.patient.patientUniqueCode

    // Now log in as that citizen via Process 2
    const citizenLoginRes = await fetch(`${BASE}/auth/patient/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobile: newCitizen.mobile })
    })
    const citizenLoginData = await citizenLoginRes.json()
    assert(citizenLoginRes.status === 200, '3.2 Registered citizen logs in successfully')
    assert(citizenLoginData.patient.patientId === registeredPatientId, '3.3 Login resolves to same Patient ID')
    assert(citizenLoginData.patient.patientUniqueCode === registeredUniqueCode, '3.4 Login resolves to same Patient Unique Code')
    assert(citizenLoginData.patient.name === newCitizen.name, '3.5 Login resolves to same citizen name')

    const citizenToken = citizenLoginData.token

    // -------------------------------------------------------------
    // TEST 4: Session /me lookup
    // -------------------------------------------------------------
    console.log('\n[TEST 4] Session verification via GET /api/auth/me...')
    const meRes = await fetch(`${BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${citizenToken}` }
    })
    const meData = await meRes.json()
    assert(meRes.status === 200, '4.1 GET /api/auth/me with Bearer token returns HTTP 200')
    assert(meData.success === true, '4.2 Session me lookup success is true')
    assert(meData.patient?.patientId === registeredPatientId, '4.3 /me returns correct Patient ID from session')
    assert(meData.patient?.patientUniqueCode === registeredUniqueCode, '4.4 /me returns correct Patient Unique Code')
    assert(meData.session?.patientName === newCitizen.name, '4.5 Session contains citizen name')

    // Unauthorized without token
    const unauthRes = await fetch(`${BASE}/auth/me`)
    assert(unauthRes.status === 401, '4.6 GET /api/auth/me without token returns HTTP 401 Unauthorized')

    // -------------------------------------------------------------
    // TEST 5: Logout & session invalidation
    // -------------------------------------------------------------
    console.log('\n[TEST 5] Logout & session invalidation...')
    const logoutRes = await fetch(`${BASE}/auth/logout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${citizenToken}` }
    })
    const logoutData = await logoutRes.json()
    assert(logoutRes.status === 200, '5.1 POST /api/auth/logout returns HTTP 200')
    assert(logoutData.success === true, '5.2 Logout success is true')

    // Try /me again with invalidated token
    const postLogoutMeRes = await fetch(`${BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${citizenToken}` }
    })
    assert(postLogoutMeRes.status === 401, '5.3 Terminated session token returns HTTP 401 on subsequent /me request')

    // -------------------------------------------------------------
    // TEST 6: Patient identity matches PostgreSQL database record
    // -------------------------------------------------------------
    console.log('\n[TEST 6] Verifying identity consistency against database lookup...')
    const dbLookupRes = await fetch(`${BASE}/patients/${registeredUniqueCode}`)
    const dbLookupData = await dbLookupRes.json()
    assert(dbLookupRes.status === 200, '6.1 Direct database query returns patient record')
    assert(dbLookupData.patient?.patientUniqueCode === registeredUniqueCode, '6.2 DB unique code matches session identity')
    assert(dbLookupData.patient?.patientId === registeredPatientId, '6.3 DB patient ID matches session identity')
    assert(dbLookupData.patient?.name === newCitizen.name, '6.4 DB name matches session identity')
    assert(dbLookupData.patient?.mobile === `+91 ${newCitizen.mobile.slice(-10)}`, '6.5 DB mobile matches session identity')

    console.log('\n==================================================')
    console.log(`PROCESS 2 TEST SUMMARY: ${passed} passed, ${failed} failed`)
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
