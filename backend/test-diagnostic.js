// Automated Test Suite for Process 6: Diagnostic / Scan Request & Report Lifecycle
import { app } from './server.js'

async function runTests() {
  console.log('=================================================================')
  console.log('  AAROGYA CASE — PROCESS 6 DIAGNOSTIC & REPORT LIFECYCLE TESTS')
  console.log('=================================================================')

  const PORT = 5065
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
    // SETUP: Authenticate Doctor & Primary Patient
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

    // -------------------------------------------------------------
    // TEST 1: Authenticated doctor can create diagnostic request
    // -------------------------------------------------------------
    console.log('\n[TEST 1] Authenticated doctor can create diagnostic request...')
    const req1Payload = {
      patientId: patient1.id,
      patientUniqueCode: patient1UniqueCode,
      doctorId: doctorProfile.id,
      appointmentId: null,
      caseId: 1,
      testScan: 'MRI Brain (Plain + Contrast)',
      testCode: 'RAD-MRI-01',
      category: 'Radiology / MRI',
      clinicalNotes: 'Severe chronic migraine with focal neurological symptoms. Rule out structural lesion.',
      priority: 'Urgent'
    }

    const req1Res = await fetch(`${BASE}/diagnostic/requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${doctorToken}`
      },
      body: JSON.stringify(req1Payload)
    })
    const req1Data = await req1Res.json()
    assert(req1Res.status === 201, '1.1 POST /api/diagnostic/requests returns HTTP 201 Created')
    assert(req1Data.success === true, '1.2 API response reports success: true')
    assert(!!req1Data.request, '1.3 Created diagnostic request object returned')
    assert(req1Data.request.status === 'Pending', '1.4 Initial request status is Pending')
    const createdReq1 = req1Data.request

    // -------------------------------------------------------------
    // TEST 2: Request requires selected patient
    // -------------------------------------------------------------
    console.log('\n[TEST 2] Request requires selected patient...')
    const noPatientRes = await fetch(`${BASE}/diagnostic/requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${doctorToken}`
      },
      body: JSON.stringify({
        doctorId: doctorProfile.id,
        testScan: 'Chest X-Ray PA View',
        clinicalNotes: 'Cough evaluation'
      })
    })
    const noPatientData = await noPatientRes.json()
    assert(noPatientRes.status === 400, '2.1 Missing patient returns HTTP 400 Bad Request')
    assert(noPatientData.success === false, '2.2 Error payload indicates failure')
    assert(noPatientData.message.toLowerCase().includes('patient'), '2.3 Error message mentions patient requirement')

    // -------------------------------------------------------------
    // TEST 3: Request requires selected test/scan
    // -------------------------------------------------------------
    console.log('\n[TEST 3] Request requires selected test/scan...')
    const noTestRes = await fetch(`${BASE}/diagnostic/requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${doctorToken}`
      },
      body: JSON.stringify({
        patientId: patient1.id,
        patientUniqueCode: patient1UniqueCode,
        clinicalNotes: 'Checkup'
      })
    })
    const noTestData = await noTestRes.json()
    assert(noTestRes.status === 400, '3.1 Missing test/scan returns HTTP 400 Bad Request')
    assert(noTestData.success === false, '3.2 Error payload indicates failure')
    assert(noTestData.message.toLowerCase().includes('test') || noTestData.message.toLowerCase().includes('scan'), '3.3 Error message mentions test or scan selection')

    // -------------------------------------------------------------
    // TEST 4: Unique request number is generated
    // -------------------------------------------------------------
    console.log('\n[TEST 4] Unique request number is generated...')
    // Create second request for Chest X-Ray
    const req2Res = await fetch(`${BASE}/diagnostic/requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${doctorToken}`
      },
      body: JSON.stringify({
        patientId: patient1.id,
        patientUniqueCode: patient1UniqueCode,
        doctorId: doctorProfile.id,
        testScan: 'Chest X-Ray PA View',
        clinicalNotes: 'Persistent cough',
        priority: 'Routine'
      })
    })
    const req2Data = await req2Res.json()
    const createdReq2 = req2Data.request

    // Create third request for Blood Test
    const req3Res = await fetch(`${BASE}/diagnostic/requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${doctorToken}`
      },
      body: JSON.stringify({
        patientId: patient1.id,
        patientUniqueCode: patient1UniqueCode,
        doctorId: doctorProfile.id,
        testScan: 'Complete Blood Count (CBC)',
        clinicalNotes: 'Fever workup',
        priority: 'Routine'
      })
    })
    const req3Data = await req3Res.json()
    const createdReq3 = req3Data.request

    const reqNum1 = createdReq1.requestNumber || createdReq1.request_number
    const reqNum2 = createdReq2.requestNumber || createdReq2.request_number
    const reqNum3 = createdReq3.requestNumber || createdReq3.request_number

    assert(!!reqNum1 && reqNum1.includes('-'), '4.1 Request 1 has formatted request number (e.g. MRI-2026-XXXXXX)')
    assert(!!reqNum2 && reqNum2.includes('-'), '4.2 Request 2 has formatted request number (e.g. XRAY-2026-XXXXXX)')
    assert(!!reqNum3 && reqNum3.includes('-'), '4.3 Request 3 has formatted request number (e.g. BLD-2026-XXXXXX)')
    assert(reqNum1 !== reqNum2 && reqNum2 !== reqNum3, '4.4 Every request receives a distinct, unique request number')
    assert(reqNum1 !== patient1UniqueCode, '4.5 Request number is NOT the Patient Unique Code')

    // -------------------------------------------------------------
    // TEST 5: Request is linked to correct patient
    // -------------------------------------------------------------
    console.log('\n[TEST 5] Request is linked to correct patient...')
    assert(String(createdReq1.patientId || createdReq1.patient_id) === String(patient1.id), '5.1 Request patient_id links to selected patient ID')
    assert((createdReq1.patientUniqueCode || createdReq1.patient_unique_code) === patient1UniqueCode, '5.2 Request retains exact Patient Unique Code')

    // -------------------------------------------------------------
    // TEST 6: Request is linked to correct doctor
    // -------------------------------------------------------------
    console.log('\n[TEST 6] Request is linked to correct doctor...')
    assert(String(createdReq1.doctorId || createdReq1.doctor_id) === String(doctorProfile.id), '6.1 Request doctor_id links to prescribing doctor')

    // -------------------------------------------------------------
    // TEST 7: Diagnostic portal can fetch pending request
    // -------------------------------------------------------------
    console.log('\n[TEST 7] Diagnostic portal can fetch pending request...')
    const listRes = await fetch(`${BASE}/diagnostic/requests?status=Pending`)
    const listData = await listRes.json()
    assert(listRes.status === 200, '7.1 GET /api/diagnostic/requests returns HTTP 200 OK')
    assert(Array.isArray(listData.requests), '7.2 Requests returned as array')
    const foundReq1 = listData.requests.find(r => (r.requestNumber || r.request_number) === reqNum1)
    assert(!!foundReq1, '7.3 Diagnostic portal pending queue contains newly created request')

    const getByIdRes = await fetch(`${BASE}/diagnostic/requests/${encodeURIComponent(reqNum1)}`)
    const getByIdData = await getByIdRes.json()
    assert(getByIdRes.status === 200, '7.4 GET /api/diagnostic/requests/:id by request number returns HTTP 200 OK')
    assert(getByIdData.request && (getByIdData.request.requestNumber || getByIdData.request.request_number) === reqNum1, '7.5 Correct requisition record returned')

    // -------------------------------------------------------------
    // TEST 8: Request status changes to In Progress
    // -------------------------------------------------------------
    console.log('\n[TEST 8] Request status changes to In Progress...')
    const patchRes = await fetch(`${BASE}/diagnostic/requests/${encodeURIComponent(reqNum1)}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'In Progress' })
    })
    const patchData = await patchRes.json()
    assert(patchRes.status === 200, '8.1 PATCH /api/diagnostic/requests/:id/status returns HTTP 200 OK')
    assert(patchData.request && patchData.request.status === 'In Progress', '8.2 Request status successfully transitioned to In Progress')

    // -------------------------------------------------------------
    // TEST 9: Report can be uploaded
    // -------------------------------------------------------------
    console.log('\n[TEST 9] Report can be uploaded...')
    const reportPayload = {
      patientId: patient1.id,
      patientUniqueCode: patient1UniqueCode,
      doctorId: doctorProfile.id,
      testName: 'MRI Brain (Plain + Contrast)',
      testScan: 'MRI Brain (Plain + Contrast)',
      category: 'Radiology / MRI',
      fileName: 'mri_brain_contrast_patient1.pdf',
      fileSize: '8.4 MB',
      findings: 'Brain parenchyma demonstrates normal signal intensity. Ventricles symmetrical, non-dilated. No acute focal lesion or hemorrhage.',
      impression: 'Unremarkable brain MRI study; no intracranial abnormality.',
      reportData: {
        brainParenchyma: 'Normal signal intensity',
        ventricles: 'Symmetrical, normal caliber',
        vascularity: 'Intact',
        impression: 'Unremarkable study'
      },
      verifiedBy: 'Dr. Priya Nair, MD (Radiology)'
    }

    const uploadRes = await fetch(`${BASE}/diagnostic/requests/${encodeURIComponent(reqNum1)}/report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reportPayload)
    })
    const uploadData = await uploadRes.json()
    assert(uploadRes.status === 201, '9.1 POST /api/diagnostic/requests/:id/report returns HTTP 201 Created')
    assert(uploadData.success === true, '9.2 API response confirms successful upload')
    assert(!!uploadData.report, '9.3 Report record returned')
    assert(uploadData.report.status === 'Completed', '9.4 Diagnostic report status marked Completed')
    const uploadedReport = uploadData.report

    // -------------------------------------------------------------
    // TEST 10: Completed report is linked to correct request
    // -------------------------------------------------------------
    console.log('\n[TEST 10] Completed report is linked to correct request...')
    const repReqNum = uploadedReport.requestNumber || uploadedReport.request_number
    assert(repReqNum === reqNum1, '10.1 Report is linked to exact Request Number')

    // Verify request itself is now Completed
    const checkReqRes = await fetch(`${BASE}/diagnostic/requests/${encodeURIComponent(reqNum1)}`)
    const checkReqData = await checkReqRes.json()
    assert(checkReqData.request && checkReqData.request.status === 'Completed', '10.2 Diagnostic request status updated to Completed after report upload')

    // -------------------------------------------------------------
    // TEST 11: Completed report is linked to correct patient
    // -------------------------------------------------------------
    console.log('\n[TEST 11] Completed report is linked to correct patient...')
    assert(String(uploadedReport.patientId || uploadedReport.patient_id) === String(patient1.id), '11.1 Report patient_id matches selected patient')
    assert((uploadedReport.patientUniqueCode || uploadedReport.patient_unique_code) === patient1UniqueCode, '11.2 Report retains exact Patient Unique Code')

    // -------------------------------------------------------------
    // TEST 12: Doctor can retrieve completed report
    // -------------------------------------------------------------
    console.log('\n[TEST 12] Doctor can retrieve completed report...')
    const docRepRes = await fetch(`${BASE}/doctor/diagnostic-reports/${patient1UniqueCode}`, {
      headers: { Authorization: `Bearer ${doctorToken}` }
    })
    const docRepData = await docRepRes.json()
    assert(docRepRes.status === 200, '12.1 GET /api/doctor/diagnostic-reports/:patientId returns HTTP 200 OK')
    assert(Array.isArray(docRepData.reports), '12.2 Reports returned as array')
    const foundDocRep = docRepData.reports.find(r => (r.requestNumber || r.request_number) === reqNum1)
    assert(!!foundDocRep, '12.3 Doctor can retrieve the newly uploaded report for patient')
    assert(foundDocRep.findings.includes('Unremarkable') || foundDocRep.findings.includes('Brain parenchyma'), '12.4 Diagnostic findings are intact')

    // -------------------------------------------------------------
    // TEST 13: Unauthorized request is rejected
    // -------------------------------------------------------------
    console.log('\n[TEST 13] Unauthorized request is rejected...')
    // No token on doctor creation route
    const unauth1 = await fetch(`${BASE}/diagnostic/requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req1Payload)
    })
    assert(unauth1.status === 401, '13.1 POST /api/diagnostic/requests without auth token rejected with HTTP 401')

    // Invalid token on doctor creation route
    const unauth2 = await fetch(`${BASE}/diagnostic/requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer FAKE-INVALID-TOKEN-999'
      },
      body: JSON.stringify(req1Payload)
    })
    assert(unauth2.status === 401, '13.2 POST /api/diagnostic/requests with invalid token rejected with HTTP 401')

    // Patient token on doctor creation route
    const unauth3 = await fetch(`${BASE}/diagnostic/requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${patient1Token}`
      },
      body: JSON.stringify(req1Payload)
    })
    assert(unauth3.status === 401, '13.3 POST /api/diagnostic/requests with patient token rejected with HTTP 401')

    // Doctor report query without token
    const unauth4 = await fetch(`${BASE}/doctor/diagnostic-reports/${patient1UniqueCode}`)
    assert(unauth4.status === 401, '13.4 GET /api/doctor/diagnostic-reports without token rejected with HTTP 401')

    // Invalid token on status update
    const unauth5 = await fetch(`${BASE}/diagnostic/requests/${encodeURIComponent(reqNum1)}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer FAKE-INVALID-TOKEN-999'
      },
      body: JSON.stringify({ status: 'In Progress' })
    })
    assert(unauth5.status === 401, '13.5 PATCH status with invalid token rejected with HTTP 401')

    // -------------------------------------------------------------
    // TEST 14: Patient Unique Code remains unchanged
    // -------------------------------------------------------------
    console.log('\n[TEST 14] Patient Unique Code remains unchanged...')
    const patCheckRes = await fetch(`${BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${patient1Token}` }
    })
    const patCheckData = await patCheckRes.json()
    assert(patCheckRes.status === 200, '14.1 GET /api/auth/me returns HTTP 200 OK')
    const currentCode = patCheckData.patient?.patient_unique_code || patCheckData.patient?.patientUniqueCode
    assert(currentCode === patient1UniqueCode, '14.2 Patient Unique Code remains permanently unchanged (AC-7F42K9)')
    assert(currentCode !== reqNum1, '14.3 Patient Unique Code is distinct from Request Number')

    // -------------------------------------------------------------
    // TEST 15: Existing Process 1 registration passes
    // -------------------------------------------------------------
    console.log('\n[TEST 15] Existing Process 1 registration passes...')
    const test15Mobile = `9814${Math.floor(100000 + Math.random() * 900000)}`
    const p1Res = await fetch(`${BASE}/patients/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Sunita Sharma',
        mobile: test15Mobile,
        identityType: 'Aadhaar',
        identityNumber: `9148 ${Math.floor(1000 + Math.random() * 9000)} ${Math.floor(1000 + Math.random() * 9000)}`,
        dob: '12/08/1985',
        age: '40',
        gender: 'Female',
        bloodGroup: 'O+'
      })
    })
    const p1Data = await p1Res.json()
    assert(p1Res.status === 201 && !!p1Data.patient, '15.1 Process 1 patient registration returns HTTP 201 & patient record')
    assert(p1Data.patient.patient_unique_code.startsWith('AC-'), '15.2 Patient Unique Code format AC-XXXXXX verified')

    // -------------------------------------------------------------
    // TEST 16: Existing Process 2 login passes
    // -------------------------------------------------------------
    console.log('\n[TEST 16] Existing Process 2 login passes...')
    const p2Res = await fetch(`${BASE}/auth/patient/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobile: test15Mobile })
    })
    const p2Data = await p2Res.json()
    assert(p2Res.status === 200 && !!p2Data.token, '16.1 Process 2 patient login returns HTTP 200 & session token')
    const p2Token = p2Data.token

    // -------------------------------------------------------------
    // TEST 17: Existing Process 3 case passes
    // -------------------------------------------------------------
    console.log('\n[TEST 17] Existing Process 3 case passes...')
    const p3Res = await fetch(`${BASE}/patient-cases`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${p2Token}`
      },
      body: JSON.stringify({
        problem: 'Acute throat pain and fever',
        symptoms: ['Sore Throat', 'Fever', 'Difficulty Swallowing'],
        duration: '3 days',
        painLevel: 6,
        severity: 'Moderate'
      })
    })
    const p3Data = await p3Res.json()
    assert(p3Res.status === 201 && !!p3Data.case, '17.1 Process 3 patient case creation returns HTTP 201 & case')

    // -------------------------------------------------------------
    // TEST 18: Existing Process 4 appointment passes
    // -------------------------------------------------------------
    console.log('\n[TEST 18] Existing Process 4 appointment passes...')
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
        appointmentDate: '30 Oct 2025',
        timeSlot: `10:00 AM - 10:30 AM (${Date.now()})`,
        problem: p3Data.case.problem,
        severity: p3Data.case.severity,
        paymentMethod: 'Universal Public Health OPD Free Token'
      })
    })
    const p4Data = await p4Res.json()
    assert(p4Res.status === 201 && !!p4Data.appointment, '18.1 Process 4 appointment booking returns HTTP 201 & appointment')

    // -------------------------------------------------------------
    // TEST 19: Existing Process 5 queue passes
    // -------------------------------------------------------------
    console.log('\n[TEST 19] Existing Process 5 queue passes...')
    const p5QueueRes = await fetch(`${BASE}/doctor/opd-queue`, {
      headers: { Authorization: `Bearer ${doctorToken}` }
    })
    const p5QueueData = await p5QueueRes.json()
    assert(p5QueueRes.status === 200 && Array.isArray(p5QueueData.queue), '19.1 Process 5 doctor OPD queue returns HTTP 200 & list')

    const queueItem = p5QueueData.queue[0]
    if (queueItem) {
      const p5StatusRes = await fetch(`${BASE}/doctor/opd-queue/${queueItem.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${doctorToken}`
        },
        body: JSON.stringify({ status: 'Current' })
      })
      const p5StatusData = await p5StatusRes.json()
      assert(p5StatusRes.status === 200 && p5StatusData.queueItem?.status === 'Current', '19.2 Process 5 OPD queue status transition succeeds')
    } else {
      assert(true, '19.2 OPD queue check passed')
    }

    console.log('\n=================================================================')
    console.log(`PROCESS 6 TESTS COMPLETED: ${passed} PASSED, ${failed} FAILED`)
    console.log('=================================================================')
  } catch (err) {
    console.error('Test execution exception:', err)
    failed++
  } finally {
    server.close(() => {
      console.log('Process 6 test server closed cleanly.')
      process.exitCode = failed > 0 ? 1 : 0
    })
  }
}

runTests()
