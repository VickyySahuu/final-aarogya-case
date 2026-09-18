// Automated Test Suite for AAROGYA CASE Unified Medical Timeline
import { app } from './server.js'
import { timelineService } from './services/timelineService.js'

async function runTests() {
  console.log('--- STARTING UNIFIED MEDICAL TIMELINE TESTS ---')

  const PORT = 5068
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
    // SETUP: Log in Primary Patient (Rajesh Kumar Sharma)
    // -------------------------------------------------------------
    console.log('\n[SETUP] Logging in primary patient...')
    const loginRes = await fetch(`${BASE}/auth/patient/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobile: '9876543210' })
    })
    const loginData = await loginRes.json()
    assert(loginRes.status === 200 && !!loginData.token, 'Setup 1: Primary patient logged in successfully')
    const primaryToken = loginData.token
    const primaryPatient = loginData.patient

    // -------------------------------------------------------------
    // SETUP: Register Secondary Patient (for isolation)
    // -------------------------------------------------------------
    console.log('\n[SETUP] Registering secondary patient for isolation test...')
    const secMobile = `9123${Math.floor(100000 + Math.random() * 900000)}`
    const regRes = await fetch(`${BASE}/patients/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Priya Verma',
        mobile: secMobile,
        identityType: 'Aadhaar',
        identityNumber: `9876 ${Math.floor(1000 + Math.random() * 9000)} ${Math.floor(1000 + Math.random() * 9000)}`,
        dob: '1998-05-20',
        age: 28,
        gender: 'Female',
        bloodGroup: 'B+',
        address: '42 MG Road, Bengaluru'
      })
    })
    const regData = await regRes.json()
    assert(regRes.status === 201 && !!regData.token, 'Setup 2: Secondary patient registered successfully')
    const secToken = regData.token
    const secPatient = regData.patient

    // -------------------------------------------------------------
    // SETUP: Doctor Prototype Login
    // -------------------------------------------------------------
    console.log('\n[SETUP] Doctor login...')
    const docLoginRes = await fetch(`${BASE}/auth/doctor/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ doctorId: 'DOC-1042' })
    })
    const docLoginData = await docLoginRes.json()
    assert(docLoginRes.status === 200 && !!docLoginData.token, 'Setup 3: Doctor logged in successfully')
    const doctorToken = docLoginData.token

    // -------------------------------------------------------------
    // TEST A: Timeline endpoint exists and enforces authentication
    // -------------------------------------------------------------
    console.log('\n[TEST A] Patient timeline access & authorization...')
    const unauthRes = await fetch(`${BASE}/patients/${primaryPatient.id}/timeline`)
    assert(unauthRes.status === 401, 'A.1 Unauthenticated timeline request returns HTTP 401')

    const authRes = await fetch(`${BASE}/patients/${primaryPatient.id}/timeline`, {
      headers: { Authorization: `Bearer ${primaryToken}` }
    })
    const authData = await authRes.json()
    assert(authRes.status === 200, 'A.2 Primary patient accessing own timeline returns HTTP 200')
    assert(authData.success === true && Array.isArray(authData.events), 'A.3 Returns events array')

    const meRes = await fetch(`${BASE}/patients/timeline/me`, {
      headers: { Authorization: `Bearer ${primaryToken}` }
    })
    const meData = await meRes.json()
    assert(meRes.status === 200 && Array.isArray(meData.events), 'A.4 GET /patients/timeline/me returns HTTP 200 with events')

    // -------------------------------------------------------------
    // TEST B: Patient Isolation (Cross-patient access rejection)
    // -------------------------------------------------------------
    console.log('\n[TEST B] Patient isolation verification...')
    const crossRes = await fetch(`${BASE}/patients/${primaryPatient.id}/timeline`, {
      headers: { Authorization: `Bearer ${secToken}` }
    })
    assert(crossRes.status === 403, 'B.1 Patient B accessing Patient A timeline is strictly rejected with HTTP 403 Forbidden')

    // Doctor access to Patient A timeline works
    const docAccessRes = await fetch(`${BASE}/patients/${primaryPatient.id}/timeline`, {
      headers: { Authorization: `Bearer ${doctorToken}` }
    })
    const docAccessData = await docAccessRes.json()
    assert(docAccessRes.status === 200 && docAccessData.success === true, 'B.2 Doctor can access Patient A timeline with HTTP 200')

    // -------------------------------------------------------------
    // TEST C: Create clinical records and verify they appear in timeline
    // -------------------------------------------------------------
    console.log('\n[TEST C] Case creation & patient symptoms...')
    const caseRes = await fetch(`${BASE}/patient-cases`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${primaryToken}`
      },
      body: JSON.stringify({
        problem: 'Intermittent wheezing and shortness of breath after morning jogging',
        duration: '3-7-days'
      })
    })
    const caseData = await caseRes.json()
    assert(caseRes.status === 201 && caseData.success, 'C.1 Clinical case created successfully')
    const caseId = caseData.case.id

    // Check timeline includes the case
    const tAfterCase = await timelineService.getPatientTimeline(primaryPatient.id)
    const caseEvent = tAfterCase.events.find(e => String(e.sourceId) === String(caseId) || String(e.caseId) === String(caseId))
    assert(!!caseEvent, 'C.2 Newly created case appears in unified timeline')
    assert(caseEvent?.sourceType === 'PATIENT' || caseEvent?.sourceType === 'CONSULTATION_CASE', 'C.3 Case event has correct source attribution')
    assert(caseEvent?.details?.originalPatientResponse?.includes('wheezing') || caseEvent?.summary?.includes('wheezing'), 'C.4 Verbatim patient words are preserved in details')

    // -------------------------------------------------------------
    // TEST D: Document event handling & date precision
    // -------------------------------------------------------------
    console.log('\n[TEST D] Document event attached to case...')
    // Attach document finding to the case
    const docObj = {
      id: `DOC-TEST-${Date.now()}`,
      originalName: 'Chest_XRay_Report_Aug2026.pdf',
      fileName: 'Chest_XRay_Report_Aug2026.pdf',
      fileType: 'application/pdf',
      documentType: 'lab_report',
      documentDate: '2026-08-14',
      provider: 'Metro Radiology Center',
      patientName: primaryPatient.fullName || primaryPatient.name || 'Rajesh Kumar',
      uploadedAt: '2026-09-18T10:00:00.000Z',
      findings: {
        documentType: 'lab_report',
        documentDate: '2026-08-14',
        testName: 'Chest Radiography PA View',
        summary: 'Mild bronchial thickening, no active consolidation or pleural effusion.',
        labResults: [{ testName: 'Cardiothoracic Ratio', value: '0.46', unit: '', referenceRange: '< 0.50', status: 'Normal' }],
        importantFindings: ['Mild bronchial thickening noted']
      }
    }

    // Attach to case directly through CaseModel
    const { CaseModel } = await import('./models/caseModel.js')
    const existingCase = await CaseModel.findById(caseId)
    const prevStructured = existingCase.structured_history || existingCase.structuredHistory || {}
    const prevDocs = Array.isArray(prevStructured.documents) ? prevStructured.documents : []
    const updatedDocs = [...prevDocs, docObj]
    await CaseModel.update(caseId, {
      structuredHistory: {
        ...prevStructured,
        documents: updatedDocs
      },
      documents: updatedDocs
    })

    const tAfterDoc = await timelineService.getPatientTimeline(primaryPatient.id)
    const docEvent = tAfterDoc.events.find(e => String(e.sourceId) === String(docObj.id) || e.title?.includes('Chest_XRay_Report'))
    assert(!!docEvent, 'D.1 Document appears as an explicit timeline event')
    assert(docEvent?.eventDate === '2026-08-14', 'D.2 Document event preserves actual clinical document date (2026-08-14)')
    assert(docEvent?.hasExplicitDate === true, 'D.3 Document event marked as having explicit clinical date')
    assert(docEvent?.sourceType === 'DOCUMENT', 'D.4 Document event source type is DOCUMENT')
    assert(docEvent?.summary?.includes('Mild bronchial thickening'), 'D.5 Document findings are visible in event summary')

    // -------------------------------------------------------------
    // TEST E: Missing Date Safety (Never invent dates)
    // -------------------------------------------------------------
    console.log('\n[TEST E] Missing date safety...')
    const undatedDoc = {
      id: `DOC-UNDATED-${Date.now()}`,
      originalName: 'Old_Prescription_Slip.jpg',
      fileName: 'Old_Prescription_Slip.jpg',
      fileType: 'image/jpeg',
      documentType: 'prescription',
      documentDate: null, // No document date
      provider: 'City Clinic',
      uploadedAt: '2026-09-18T12:00:00.000Z',
      findings: {
        documentType: 'prescription',
        documentDate: null,
        summary: 'Salbutamol Inhaler 100mcg as needed.'
      }
    }
    const withUndated = [...updatedDocs, undatedDoc]
    await CaseModel.update(caseId, {
      structuredHistory: {
        ...prevStructured,
        documents: withUndated
      },
      documents: withUndated
    })

    const tAfterUndated = await timelineService.getPatientTimeline(primaryPatient.id)
    const undatedEvent = tAfterUndated.events.find(e => String(e.sourceId) === String(undatedDoc.id))
    assert(!!undatedEvent, 'E.1 Undated document appears in timeline')
    assert(undatedEvent?.eventDate === null, 'E.2 Undated document eventDate is strictly null (NEVER fabricated)')
    assert(undatedEvent?.hasExplicitDate === false, 'E.3 hasExplicitDate flag is false')

    // -------------------------------------------------------------
    // TEST F: Diagnostic events appear
    // -------------------------------------------------------------
    console.log('\n[TEST F] Diagnostic requests & completed reports...')
    const { DiagnosticModel } = await import('./models/diagnosticModel.js')
    const diagReq = await DiagnosticModel.createRequest({
      patientId: primaryPatient.id,
      patientName: primaryPatient.fullName || primaryPatient.name || 'Rajesh Kumar',
      doctorName: 'Dr. A. Sharma',
      testName: 'Spirometry Pulmonary Function',
      testScan: 'Spirometry Pulmonary Function',
      priority: 'Routine',
      status: 'In Progress',
      clinicalNotes: 'Evaluate reversible airway obstruction'
    })
    assert(!!diagReq && !!diagReq.id, 'F.1 Diagnostic request created')

    const tAfterDiag = await timelineService.getPatientTimeline(primaryPatient.id)
    const diagEvent = tAfterDiag.events.find(e => String(e.sourceId) === String(diagReq.id) || e.title?.includes('Spirometry'))
    assert(!!diagEvent, 'F.2 Diagnostic request appears as a timeline event')
    assert(diagEvent?.sourceType === 'DIAGNOSTIC', 'F.3 Diagnostic event source type is DIAGNOSTIC')

    // -------------------------------------------------------------
    // TEST G: Prescription & Pharmacy dispensing appear
    // -------------------------------------------------------------
    console.log('\n[TEST G] Prescription & Pharmacy dispensing...')
    const { PrescriptionModel } = await import('./models/prescriptionModel.js')
    const rx = await PrescriptionModel.create({
      patientId: primaryPatient.id,
      doctorName: 'Dr. A. Sharma',
      date: '2026-08-20',
      medicines: [
        { name: 'Budecort Inhaler 200mcg', dosage: '1 puff BD', days: 30, quantity: 1 }
      ],
      diagnosis: 'Mild persistent asthma',
      notes: 'Rinse mouth after use'
    })
    assert(!!rx && !!rx.id, 'G.1 Prescription created')

    const { DispensingModel } = await import('./models/dispensingModel.js')
    const disp = await DispensingModel.create({
      patientId: primaryPatient.id,
      prescriptionId: rx.id,
      patientName: primaryPatient.fullName || primaryPatient.name || 'Rajesh Kumar',
      items: [
        { name: 'Budecort Inhaler 200mcg', dispensedQty: 1, batchNumber: 'BAT-2026-88', status: 'Dispensed' }
      ],
      status: 'Completed',
      dispensedAt: '2026-08-20T14:30:00.000Z'
    })
    assert(!!disp && !!disp.id, 'G.2 Pharmacy dispensing recorded')

    const tAfterRx = await timelineService.getPatientTimeline(primaryPatient.id)
    const rxEvent = tAfterRx.events.find(e => String(e.sourceId) === String(rx.id) || e.summary?.includes('Budecort'))
    const dispEvent = tAfterRx.events.find(e => String(e.sourceId) === String(disp.id))
    assert(!!rxEvent, 'G.3 Prescription appears as timeline event')
    assert(rxEvent?.sourceType === 'PRESCRIPTION', 'G.4 Prescription source type is PRESCRIPTION')
    assert(!!dispEvent, 'G.5 Pharmacy dispensing appears as timeline event')
    assert(dispEvent?.sourceType === 'PHARMACY', 'G.6 Dispensing source type is PHARMACY')

    // -------------------------------------------------------------
    // TEST H: Chronological Ordering Verification
    // -------------------------------------------------------------
    console.log('\n[TEST H] Chronological ordering validation...')
    const eventsWithDates = tAfterRx.events.filter(e => e.hasExplicitDate && e.eventDate)
    let isChronological = true
    for (let i = 0; i < eventsWithDates.length - 1; i++) {
      const d1 = new Date(eventsWithDates[i].eventDate).getTime()
      const d2 = new Date(eventsWithDates[i + 1].eventDate).getTime()
      if (d1 < d2) {
        isChronological = false
        console.error(`Chronology breach: index ${i} (${eventsWithDates[i].eventDate}) < index ${i+1} (${eventsWithDates[i+1].eventDate})`)
        break
      }
    }
    assert(isChronological, 'H.1 Events with explicit clinical dates are strictly descending (latest first)')

    // -------------------------------------------------------------
    // TEST I: No Unnecessary Duplicate IDs
    // -------------------------------------------------------------
    console.log('\n[TEST I] Deduplication check...')
    const eventIds = tAfterRx.events.map(e => e.eventId)
    const uniqueIds = new Set(eventIds)
    assert(eventIds.length === uniqueIds.size, 'I.1 All normalized timeline event IDs are unique with zero collision')

    // -------------------------------------------------------------
    // TEST J: Existing systems remain fully intact (Non-regression)
    // -------------------------------------------------------------
    console.log('\n[TEST J] Integrity of existing subsystems...')
    const aptRes = await fetch(`${BASE}/appointments/slots`)
    assert(aptRes.status === 200, 'J.1 Existing appointments API operational')

    const diagListRes = await fetch(`${BASE}/diagnostic/requests`)
    assert(diagListRes.status === 200, 'J.2 Existing diagnostics API operational')

    const rxListRes = await fetch(`${BASE}/patients/prescriptions`, {
      headers: { Authorization: `Bearer ${primaryToken}` }
    })
    assert(rxListRes.status === 200, 'J.3 Existing prescriptions API operational')

  } catch (err) {
    console.error('Unhandled exception during timeline tests:', err)
    failed++
  } finally {
    server.close()
    console.log(`\n====================================================`)
    console.log(`TIMELINE TEST RESULTS: ${passed} PASSED, ${failed} FAILED`)
    console.log(`====================================================`)
    process.exit(failed > 0 ? 1 : 0)
  }
}

runTests()
