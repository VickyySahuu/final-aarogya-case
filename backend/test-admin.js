// Automated Test Suite for Process 10: Admin Portal Backend Integration
import { app } from './server.js'
import { DoctorModel } from './models/doctorModel.js'
import { HospitalModel } from './models/hospitalModel.js'
import { MedicineModel } from './models/medicineModel.js'
import { DiagnosticTestModel } from './models/diagnosticTestModel.js'
import { AmbulanceModel } from './models/ambulanceModel.js'

async function runTests() {
  console.log('=================================================================')
  console.log('  AAROGYA CASE — PROCESS 10 ADMIN PORTAL TESTS')
  console.log('=================================================================')

  const PORT = 5069
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
    // SETUP: Authenticate Other Roles for Cross-Role Security Checks
    // -------------------------------------------------------------
    console.log('\n[SETUP] Authenticating Patient, Doctor, Pharmacy & Ambulance roles...')

    // 1. Patient Login
    const patLoginRes = await fetch(`${BASE}/auth/patient/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobile: '9876543210' })
    })
    const patData = await patLoginRes.json()
    assert(patLoginRes.status === 200 && !!patData.token, 'Setup: Patient token acquired')
    const patToken = patData.token

    // 2. Doctor Login
    const docLoginRes = await fetch(`${BASE}/auth/doctor/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ doctorId: 'DOC-1042', passcode: '1042' })
    })
    const docData = await docLoginRes.json()
    assert(docLoginRes.status === 200 && !!docData.token, 'Setup: Doctor token acquired')
    const docToken = docData.token

    // 3. Pharmacy Login
    const pharLoginRes = await fetch(`${BASE}/auth/pharmacy/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'pharmacy_admin', passcode: 'rx2025' })
    })
    const pharData = await pharLoginRes.json()
    assert(pharLoginRes.status === 200 && !!pharData.token, 'Setup: Pharmacy token acquired')
    const pharToken = pharData.token

    // 4. Ambulance Login
    const ambLoginRes = await fetch(`${BASE}/auth/ambulance/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vehicleNumber: 'DL-01-EQ-9041', passcode: '108' })
    })
    const ambData = await ambLoginRes.json()
    assert(ambLoginRes.status === 200 && !!ambData.token, 'Setup: Ambulance token acquired')
    const ambToken = ambData.token

    // -------------------------------------------------------------
    // 1. ADMIN AUTHENTICATION
    // -------------------------------------------------------------
    console.log('\n--- 1. ADMIN AUTHENTICATION ---')

    // 1.1 Unauthenticated request rejected
    const unauthRes = await fetch(`${BASE}/admin/dashboard`)
    assert(unauthRes.status === 401, 'Unauthenticated admin request rejected with HTTP 401')

    // 1.2 Invalid admin session rejected
    const invalidRes = await fetch(`${BASE}/admin/dashboard`, {
      headers: { Authorization: 'Bearer ADM-SES-fake-invalid-token' }
    })
    assert(invalidRes.status === 401, 'Invalid admin session rejected with HTTP 401')

    // 1.3 Patient token rejected
    const patRejectRes = await fetch(`${BASE}/admin/dashboard`, {
      headers: { Authorization: `Bearer ${patToken}` }
    })
    assert(patRejectRes.status === 401, 'Patient session token rejected from admin portal with HTTP 401')

    // 1.4 Doctor token rejected
    const docRejectRes = await fetch(`${BASE}/admin/dashboard`, {
      headers: { Authorization: `Bearer ${docToken}` }
    })
    assert(docRejectRes.status === 401, 'Doctor session token rejected from admin portal with HTTP 401')

    // 1.5 Pharmacy token rejected
    const pharRejectRes = await fetch(`${BASE}/admin/dashboard`, {
      headers: { Authorization: `Bearer ${pharToken}` }
    })
    assert(pharRejectRes.status === 401, 'Pharmacy session token rejected from admin portal with HTTP 401')

    // 1.6 Ambulance token rejected
    const ambRejectRes = await fetch(`${BASE}/admin/dashboard`, {
      headers: { Authorization: `Bearer ${ambToken}` }
    })
    assert(ambRejectRes.status === 401, 'Ambulance session token rejected from admin portal with HTTP 401')

    // 1.7 Invalid admin credentials rejected
    const badAdminRes = await fetch(`${BASE}/auth/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', passcode: 'wrongpassword' })
    })
    assert(badAdminRes.status === 401, 'Invalid admin passcode rejected with HTTP 401')

    // 1.8 Valid admin login succeeds
    const adminLoginRes = await fetch(`${BASE}/auth/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', passcode: 'admin123' })
    })
    const adminLoginData = await adminLoginRes.json()
    assert(adminLoginRes.status === 200, 'Valid admin login succeeds with HTTP 200')
    assert(!!adminLoginData.token && adminLoginData.token.startsWith('ADM-SES-'), 'Admin token has expected ADM-SES- prefix')
    assert(adminLoginData.role === 'admin', 'Admin session role is "admin"')
    const adminToken = adminLoginData.token
    const adminAuthHeader = { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' }

    // -------------------------------------------------------------
    // 2. ADMIN DASHBOARD COUNTS
    // -------------------------------------------------------------
    console.log('\n--- 2. ADMIN DASHBOARD ---')

    const dashRes = await fetch(`${BASE}/admin/dashboard`, { headers: adminAuthHeader })
    const dashData = await dashRes.json()
    assert(dashRes.status === 200, 'GET /api/admin/dashboard returns HTTP 200')
    assert(dashData.counts && typeof dashData.counts.doctors === 'number' && dashData.counts.doctors >= 1, 'Dashboard returns real count for doctors (>= 1)')
    assert(typeof dashData.counts.hospitals === 'number' && dashData.counts.hospitals >= 1, 'Dashboard returns real count for hospitals (>= 1)')
    assert(typeof dashData.counts.medicines === 'number' && dashData.counts.medicines >= 5, 'Dashboard returns real count for medicines (>= 5)')
    assert(typeof dashData.counts.diagnostics === 'number' && dashData.counts.diagnostics >= 5, 'Dashboard returns real count for diagnostics (>= 5)')
    assert(typeof dashData.counts.ambulances === 'number' && dashData.counts.ambulances >= 2, 'Dashboard returns real count for ambulances (>= 2)')
    assert(typeof dashData.counts.activeEmergencyRequests === 'number' && dashData.counts.activeEmergencyRequests >= 0, 'Dashboard returns activeEmergencyRequests count (>= 0)')

    // -------------------------------------------------------------
    // 3. MANAGE DOCTOR
    // -------------------------------------------------------------
    console.log('\n--- 3. MANAGE DOCTOR ---')

    // 3.1 List doctor
    const docListRes = await fetch(`${BASE}/admin/doctors`, { headers: adminAuthHeader })
    const docListData = await docListRes.json()
    assert(docListRes.status === 200, 'GET /api/admin/doctors returns HTTP 200')
    assert(Array.isArray(docListData.doctors) && docListData.doctors.length === 1, 'Maintains strictly ONE doctor in registry')
    assert(docListData.doctors[0].name === 'Dr. Ramanathan Venkatraman', 'Doctor is Dr. Ramanathan Venkatraman')
    assert(docListData.doctors[0].doctorId === 'DOC-1042', 'Doctor ID is DOC-1042')

    // 3.2 Get doctor by ID
    const getDocRes = await fetch(`${BASE}/admin/doctors/1`, { headers: adminAuthHeader })
    const getDocData = await getDocRes.json()
    assert(getDocRes.status === 200, 'GET /api/admin/doctors/1 returns HTTP 200')
    assert(getDocData.doctor && getDocData.doctor.doctorId === 'DOC-1042', 'Retrieved single doctor record matches DOC-1042')

    // 3.3 Update doctor
    const updateDocRes = await fetch(`${BASE}/admin/doctors/1`, {
      method: 'PATCH',
      headers: adminAuthHeader,
      body: JSON.stringify({
        room: 'Room 105',
        specialization: 'Senior General Medicine'
      })
    })
    const updateDocData = await updateDocRes.json()
    assert(updateDocRes.status === 200, 'PATCH /api/admin/doctors/1 returns HTTP 200')
    assert(updateDocData.doctor.room === 'Room 105', 'Doctor room updated to Room 105')
    assert(updateDocData.doctor.specialization === 'Senior General Medicine', 'Doctor specialization updated')

    // 3.4 Verify persistence
    const reGetDocRes = await fetch(`${BASE}/admin/doctors/1`, { headers: adminAuthHeader })
    const reGetDocData = await reGetDocRes.json()
    assert(reGetDocData.doctor.room === 'Room 105', 'Doctor update is persisted in database')

    // Restore doctor room
    await fetch(`${BASE}/admin/doctors/1`, {
      method: 'PATCH',
      headers: adminAuthHeader,
      body: JSON.stringify({ room: 'Room 104', specialization: 'General Medicine' })
    })

    // -------------------------------------------------------------
    // 4. MANAGE HOSPITAL
    // -------------------------------------------------------------
    console.log('\n--- 4. MANAGE HOSPITAL ---')

    // 4.1 List hospitals
    const hospListRes = await fetch(`${BASE}/admin/hospitals`, { headers: adminAuthHeader })
    const hospListData = await hospListRes.json()
    assert(hospListRes.status === 200, 'GET /api/admin/hospitals returns HTTP 200')
    assert(Array.isArray(hospListData.hospitals) && hospListData.hospitals.length >= 1, 'Returns active hospitals list')

    // 4.2 Get hospital
    const getHospRes = await fetch(`${BASE}/admin/hospitals/1`, { headers: adminAuthHeader })
    const getHospData = await getHospRes.json()
    assert(getHospRes.status === 200, 'GET /api/admin/hospitals/1 returns HTTP 200')
    assert(getHospData.hospital && !!getHospData.hospital.name, 'Retrieved hospital contains name and location')

    // 4.3 Update hospital
    const updateHospRes = await fetch(`${BASE}/admin/hospitals/1`, {
      method: 'PATCH',
      headers: adminAuthHeader,
      body: JSON.stringify({
        emergencyWard: 'Ground Floor, Bay 01 - 06'
      })
    })
    const updateHospData = await updateHospRes.json()
    assert(updateHospRes.status === 200, 'PATCH /api/admin/hospitals/1 returns HTTP 200')
    assert(updateHospData.hospital.emergencyWard === 'Ground Floor, Bay 01 - 06', 'Hospital emergency ward updated')

    // 4.4 Verify persistence across public hospital endpoint
    const publicHospRes = await fetch(`${BASE}/hospitals`)
    const publicHospData = await publicHospRes.json()
    const primaryHosp = (publicHospData.hospitals && publicHospData.hospitals[0]) || publicHospData[0]
    assert(primaryHosp.emergencyWard === 'Ground Floor, Bay 01 - 06', 'Hospital update persists and reflects in public appointment/hospitals API')

    // -------------------------------------------------------------
    // 5. MANAGE MEDICINES
    // -------------------------------------------------------------
    console.log('\n--- 5. MANAGE MEDICINES ---')

    // 5.1 List medicines
    const medListRes = await fetch(`${BASE}/admin/medicines`, { headers: adminAuthHeader })
    const medListData = await medListRes.json()
    assert(medListRes.status === 200, 'GET /api/admin/medicines returns HTTP 200')
    assert(Array.isArray(medListData.medicines) && medListData.medicines.length >= 10, 'Admin medicines returns full formulary catalog')

    // 5.2 Create new medicine
    const uniqueMedSuffix = Date.now().toString().slice(-5)
    const newMedName = `Cefixime ${uniqueMedSuffix}mg`
    const createMedRes = await fetch(`${BASE}/admin/medicines`, {
      method: 'POST',
      headers: adminAuthHeader,
      body: JSON.stringify({
        name: newMedName,
        category: 'Antibiotics',
        availableQty: 120,
        unit: 'Tablets',
        status: 'Available'
      })
    })
    const createMedData = await createMedRes.json()
    assert(createMedRes.status === 201, 'POST /api/admin/medicines creates medicine with HTTP 201')
    assert(createMedData.medicine && createMedData.medicine.name === newMedName, 'Created medicine name matches input')
    const createdMedId = createMedData.medicine.id

    // 5.3 Duplicate medicine validation
    const dupMedRes = await fetch(`${BASE}/admin/medicines`, {
      method: 'POST',
      headers: adminAuthHeader,
      body: JSON.stringify({
        name: newMedName,
        category: 'Antibiotics'
      })
    })
    assert(dupMedRes.status === 400, 'Duplicate medicine name rejected with HTTP 400')

    // 5.4 Update medicine
    const updateMedRes = await fetch(`${BASE}/admin/medicines/${createdMedId}`, {
      method: 'PATCH',
      headers: adminAuthHeader,
      body: JSON.stringify({
        availableQty: 85,
        status: 'Available'
      })
    })
    const updateMedData = await updateMedRes.json()
    assert(updateMedRes.status === 200, 'PATCH /api/admin/medicines/:id updates medicine with HTTP 200')
    assert(updateMedData.medicine.availableQty === 85, 'Medicine available quantity updated to 85')

    // 5.5 Cross-portal consistency: Doctor prescription catalog sees the new/updated medicine
    const docMedRes = await fetch(`${BASE}/doctor/medicines`, {
      headers: { Authorization: `Bearer ${docToken}` }
    })
    const docMedData = await docMedRes.json()
    const foundInDocCatalog = (docMedData.medicines || []).some(m => m.name === newMedName)
    assert(foundInDocCatalog, 'Doctor prescription catalog sees the newly added admin medicine (Single Source of Truth)')

    // -------------------------------------------------------------
    // 6. MANAGE DIAGNOSTICS
    // -------------------------------------------------------------
    console.log('\n--- 6. MANAGE DIAGNOSTICS ---')

    // 6.1 List diagnostics
    const diagListRes = await fetch(`${BASE}/admin/diagnostics`, { headers: adminAuthHeader })
    const diagListData = await diagListRes.json()
    assert(diagListRes.status === 200, 'GET /api/admin/diagnostics returns HTTP 200')
    assert(Array.isArray(diagListData.diagnostics) && diagListData.diagnostics.length >= 5, 'Admin diagnostics returns active modalities')

    // 6.2 Create new diagnostic test
    const uniqueDiagSuffix = Date.now().toString().slice(-5)
    const newDiagName = `Color Doppler Ultrasound ${uniqueDiagSuffix}`
    const createDiagRes = await fetch(`${BASE}/admin/diagnostics`, {
      method: 'POST',
      headers: adminAuthHeader,
      body: JSON.stringify({
        name: newDiagName,
        category: 'Sonography',
        turnaround: '20 Mins',
        status: 'Active'
      })
    })
    const createDiagData = await createDiagRes.json()
    assert(createDiagRes.status === 201, 'POST /api/admin/diagnostics creates diagnostic modality with HTTP 201')
    assert(createDiagData.diagnostic && createDiagData.diagnostic.name === newDiagName, 'Created diagnostic modality matches input')
    const createdDiagId = createDiagData.diagnostic.id

    // 6.3 Duplicate diagnostic validation
    const dupDiagRes = await fetch(`${BASE}/admin/diagnostics`, {
      method: 'POST',
      headers: adminAuthHeader,
      body: JSON.stringify({
        name: newDiagName,
        category: 'Sonography'
      })
    })
    assert(dupDiagRes.status === 400, 'Duplicate diagnostic modality rejected with HTTP 400')

    // 6.4 Update diagnostic test
    const updateDiagRes = await fetch(`${BASE}/admin/diagnostics/${createdDiagId}`, {
      method: 'PATCH',
      headers: adminAuthHeader,
      body: JSON.stringify({
        turnaround: '15 Mins'
      })
    })
    const updateDiagData = await updateDiagRes.json()
    assert(updateDiagRes.status === 200, 'PATCH /api/admin/diagnostics/:id updates turnaround with HTTP 200')
    assert(updateDiagData.diagnostic.turnaround === '15 Mins', 'Turnaround successfully updated to 15 Mins')

    // 6.5 Cross-portal consistency: Doctor diagnostic catalog sees new modality
    const docDiagRes = await fetch(`${BASE}/doctor/diagnostics`, {
      headers: { Authorization: `Bearer ${docToken}` }
    })
    const docDiagData = await docDiagRes.json()
    const foundInDoctorDiagnostics = (docDiagData.diagnostics || []).some(d => d.name === newDiagName)
    assert(foundInDoctorDiagnostics, 'Doctor diagnostic requisition catalog sees newly added test (Single Source of Truth)')

    // -------------------------------------------------------------
    // 7. MANAGE AMBULANCES
    // -------------------------------------------------------------
    console.log('\n--- 7. MANAGE AMBULANCES ---')

    // 7.1 List ambulances
    const ambListRes = await fetch(`${BASE}/admin/ambulances`, { headers: adminAuthHeader })
    const ambListData = await ambListRes.json()
    assert(ambListRes.status === 200, 'GET /api/admin/ambulances returns HTTP 200')
    assert(Array.isArray(ambListData.ambulances) && ambListData.ambulances.length >= 2, 'Admin ambulances returns active fleet')

    // 7.2 Get ambulance
    const getAmbRes = await fetch(`${BASE}/admin/ambulances/1`, { headers: adminAuthHeader })
    const getAmbData = await getAmbRes.json()
    assert(getAmbRes.status === 200, 'GET /api/admin/ambulances/1 returns HTTP 200')
    assert(getAmbData.ambulance && !!getAmbData.ambulance.vehicleNumber, 'Retrieved ambulance contains vehicle registration')

    // 7.3 Create ambulance
    const ambSuffix = Date.now().toString().slice(-4)
    const newAmbNumber = `Ambulance Unit #${ambSuffix}`
    const newVehNumber = `DL-01-EQ-${ambSuffix}`
    const createAmbRes = await fetch(`${BASE}/admin/ambulances`, {
      method: 'POST',
      headers: adminAuthHeader,
      body: JSON.stringify({
        ambulanceNumber: newAmbNumber,
        vehicleNumber: newVehNumber,
        status: 'available'
      })
    })
    const createAmbData = await createAmbRes.json()
    assert(createAmbRes.status === 201, 'POST /api/admin/ambulances creates ambulance with HTTP 201')
    assert(createAmbData.ambulance && createAmbData.ambulance.vehicleNumber === newVehNumber, 'Created ambulance vehicle registration matches')
    const createdAmbId = createAmbData.ambulance.id

    // 7.4 Duplicate ambulance validation
    const dupAmbRes = await fetch(`${BASE}/admin/ambulances`, {
      method: 'POST',
      headers: adminAuthHeader,
      body: JSON.stringify({
        ambulanceNumber: newAmbNumber,
        vehicleNumber: newVehNumber
      })
    })
    assert(dupAmbRes.status === 400, 'Duplicate ambulance number/vehicle rejected with HTTP 400')

    // 7.5 Update ambulance status
    const updateAmbRes = await fetch(`${BASE}/admin/ambulances/${createdAmbId}`, {
      method: 'PATCH',
      headers: adminAuthHeader,
      body: JSON.stringify({
        status: 'busy'
      })
    })
    const updateAmbData = await updateAmbRes.json()
    assert(updateAmbRes.status === 200, 'PATCH /api/admin/ambulances/:id updates ambulance status with HTTP 200')
    assert(updateAmbData.ambulance.status === 'busy', 'Ambulance status updated to "busy"')

    // Verify persistence
    const reGetAmbRes = await fetch(`${BASE}/admin/ambulances/${createdAmbId}`, { headers: adminAuthHeader })
    const reGetAmbData = await reGetAmbRes.json()
    assert(reGetAmbData.ambulance.status === 'busy', 'Ambulance update persisted in database')

    // -------------------------------------------------------------
    // 8. SECURITY & VALIDATION
    // -------------------------------------------------------------
    console.log('\n--- 8. SECURITY & VALIDATION ---')

    // 8.1 Mutation without admin auth rejected
    const unauthMutateRes = await fetch(`${BASE}/admin/medicines`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Hacker Medicine' })
    })
    assert(unauthMutateRes.status === 401, 'Unauthenticated mutation rejected with HTTP 401')

    // 8.2 Mutation with doctor auth rejected
    const docMutateRes = await fetch(`${BASE}/admin/medicines`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${docToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Hacker Medicine' })
    })
    assert(docMutateRes.status === 401, 'Doctor token attempting admin mutation rejected with HTTP 401')

    // 8.3 Mutation with patient auth rejected
    const patMutateRes = await fetch(`${BASE}/admin/doctors/1`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${patToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Fake Doctor' })
    })
    assert(patMutateRes.status === 401, 'Patient token attempting admin mutation rejected with HTTP 401')

    // 8.4 Malformed / non-existent ID rejected
    const notFoundMedRes = await fetch(`${BASE}/admin/medicines/999999`, {
      method: 'PATCH',
      headers: adminAuthHeader,
      body: JSON.stringify({ availableQty: 10 })
    })
    assert(notFoundMedRes.status === 404, 'Non-existent medicine ID update rejected with HTTP 404')

    const notFoundDiagRes = await fetch(`${BASE}/admin/diagnostics/999999`, {
      method: 'PATCH',
      headers: adminAuthHeader,
      body: JSON.stringify({ turnaround: '10 Mins' })
    })
    assert(notFoundDiagRes.status === 404, 'Non-existent diagnostic ID update rejected with HTTP 404')

    const notFoundAmbRes = await fetch(`${BASE}/admin/ambulances/999999`, {
      method: 'PATCH',
      headers: adminAuthHeader,
      body: JSON.stringify({ status: 'busy' })
    })
    assert(notFoundAmbRes.status === 404, 'Non-existent ambulance ID update rejected with HTTP 404')

  } catch (error) {
    console.error('[ERROR] Unexpected test execution failure:', error)
    failed++
  } finally {
    server.close()
  }

  console.log('=================================================================')
  console.log(`  PROCESS 10 ADMIN TESTS FINISHED: ${passed} PASSED, ${failed} FAILED`)
  console.log('=================================================================')

  if (failed > 0) {
    process.exit(1)
  }
}

runTests()
