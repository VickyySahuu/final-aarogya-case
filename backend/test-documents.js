// Comprehensive Automated Test Suite for SIH26047 Multimodal AI Case Interview
// PDF / Image Understanding + Clinical Case Integration
import { app } from './server.js'
import { DocumentService } from './services/documentService.js'
import { CaseModel } from './models/caseModel.js'

async function runTests() {
  console.log('--- STARTING MULTIMODAL AI DOCUMENT UNDERSTANDING & CASE INTEGRATION TESTS ---')

  const PORT = 5058
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
    // SETUP: Log in primary patient
    // -------------------------------------------------------------
    console.log('\n[SETUP] Logging in primary patient...')
    const loginRes = await fetch(`${BASE}/auth/patient/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobile: '9876543210' })
    })
    const loginData = await loginRes.json()
    assert(loginRes.status === 200 && !!loginData.token, 'Setup: Primary patient logged in successfully')
    const primaryToken = loginData.token
    const primaryPatient = loginData.patient

    // Initialize or Resume interview
    const initRes = await fetch(`${BASE}/patient-cases/interview/init`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${primaryToken}`
      },
      body: JSON.stringify({})
    })
    const initData = await initRes.json()
    assert(initRes.status === 200 || initRes.status === 201, 'Setup: Case initialized or resumed')
    let activeCase = initData.case
    assert(!!activeCase?.id, 'Setup: Active case has valid ID')

    // Reset interview to ensure clean case state without artifacts from earlier test runs
    const resetRes = await fetch(`${BASE}/patient-cases/${activeCase.id}/interview/reset`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${primaryToken}`
      }
    })
    if (resetRes.ok) {
      const resetData = await resetRes.json()
      if (resetData.case) activeCase = resetData.case
    }

    // Patient sends first complaint to set originalPatientResponse
    const turn1Res = await fetch(`${BASE}/patient-cases/${activeCase.id}/interview`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${primaryToken}`
      },
      body: JSON.stringify({
        message: 'Mujhe pichle 5 din se high fever aur weakness ho rahi hai.',
        inputMode: 'text'
      })
    })
    const turn1Data = await turn1Res.json()
    assert(turn1Res.status === 200, 'Setup: Turn 1 processed')
    const originalVerbatimBeforeDoc = turn1Data.case.originalPatientResponse
    assert(originalVerbatimBeforeDoc === 'Mujhe pichle 5 din se high fever aur weakness ho rahi hai.', 'Setup: originalPatientResponse established')

    // -------------------------------------------------------------
    // TEST 1: File Validation (Unsupported types, empty files, size)
    // -------------------------------------------------------------
    console.log('\n[TEST 1] File validation guardrails...')
    
    // 1.1 Empty file rejection
    const emptyRes = await fetch(`${BASE}/patient-cases/${activeCase.id}/documents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${primaryToken}`
      },
      body: JSON.stringify({
        fileName: 'empty.pdf',
        fileType: 'application/pdf',
        fileData: ''
      })
    })
    const emptyData = await emptyRes.json()
    assert(emptyRes.status === 400, '1.1 Empty document rejected with HTTP 400')
    assert(emptyData.success === false, '1.2 Empty document has success: false')

    // 1.3 Executable / script rejection
    const exeBuffer = Buffer.from('MZ_FAKE_EXECUTABLE_CONTENT')
    const exeRes = await fetch(`${BASE}/patient-cases/${activeCase.id}/documents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${primaryToken}`
      },
      body: JSON.stringify({
        fileName: 'malicious.exe',
        fileType: 'application/x-msdownload',
        fileData: exeBuffer.toString('base64')
      })
    })
    assert(exeRes.status === 400, '1.3 Executable .exe file rejected with HTTP 400')

    // -------------------------------------------------------------
    // TEST 2: Valid PDF Upload & Multimodal Extraction (CBC Lab Report)
    // -------------------------------------------------------------
    console.log('\n[TEST 2] Valid PDF CBC Report upload and structured extraction...')
    const samplePdfContent = `
    %PDF-1.4
    CIVIL HOSPITAL CLINICAL LABORATORY REPORT
    Patient: Rajesh Kumar | Date: 2026-09-10
    Investigation: Complete Blood Count (CBC)
    Hemoglobin: 10.2 g/dL (Reference Range: 12.0 - 15.5 g/dL) [LOW]
    Total WBC Count: 8,400 cells/mcL (Reference: 4,000 - 11,000) [NORMAL]
    Platelet Count: 210,000 /mcL (Reference: 150,000 - 450,000) [NORMAL]
    Comments: Mild normocytic anemia. Review with physician.
    %%EOF
    `
    const pdfBuffer = Buffer.from(samplePdfContent, 'utf-8')

    const pdfUploadRes = await fetch(`${BASE}/patient-cases/${activeCase.id}/documents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${primaryToken}`
      },
      body: JSON.stringify({
        fileName: 'CBC_Blood_Test_Report.pdf',
        fileType: 'application/pdf',
        fileData: pdfBuffer.toString('base64'),
        languageStyle: 'hinglish'
      })
    })
    const pdfUploadData = await pdfUploadRes.json()

    assert(pdfUploadRes.status === 200, '2.1 PDF document upload returns HTTP 200')
    assert(pdfUploadData.success === true, '2.2 Response has success: true')
    assert(!!pdfUploadData.document?.id, '2.3 Returned document has generated docId')
    assert(pdfUploadData.document.originalName === 'CBC_Blood_Test_Report.pdf', '2.4 Original document name preserved')
    assert(pdfUploadData.findings?.documentType === 'lab_report', '2.5 Correct documentType detected (lab_report)')
    assert(Array.isArray(pdfUploadData.findings?.labResults), '2.6 labResults array is present')
    
    // Check Hemoglobin extraction & source traceability
    const hbResult = pdfUploadData.findings.labResults.find(l => l.testName.toLowerCase().includes('hemoglobin'))
    assert(!!hbResult, '2.7 Hemoglobin extracted from CBC PDF')
    assert(hbResult?.value === '10.2', '2.8 Hemoglobin value accurately extracted (10.2)')
    assert(hbResult?.source.includes('CBC_Blood_Test_Report.pdf'), '2.9 Finding is strictly source-linked to the uploaded document')

    // Invariant: originalPatientResponse must NOT be changed by document upload
    assert(
      pdfUploadData.case.originalPatientResponse === originalVerbatimBeforeDoc,
      '2.10 CRITICAL INVARIANT: originalPatientResponse was NOT overwritten by document upload'
    )

    // Check that document attached to SAME case
    assert(pdfUploadData.case.id === activeCase.id, '2.11 Document attached to the SAME clinical case ID')
    assert(pdfUploadData.case.documents.length > 0, '2.12 Structured history contains the attached document')

    const doc1Id = pdfUploadData.document.id

    // -------------------------------------------------------------
    // TEST 3: Adaptive Follow-up Question in Patient Language
    // -------------------------------------------------------------
    console.log('\n[TEST 3] Document-aware adaptive questioning & language mirroring...')
    assert(!!pdfUploadData.turnResult?.nextQuestion, '3.1 AI generated a document-aware follow-up question')
    console.log('AI Follow-up Question:', pdfUploadData.turnResult.nextQuestion)
    assert(
      pdfUploadData.turnResult.languageStyle === 'hinglish',
      '3.2 Follow-up mirrors patient Hinglish conversational style'
    )
    assert(
      Array.isArray(pdfUploadData.turnResult.touchOptions) && pdfUploadData.turnResult.touchOptions.length > 0,
      '3.3 Contextual quick touch options provided for document follow-up'
    )

    // -------------------------------------------------------------
    // TEST 4: Valid Medical Image Upload (Prescription with Medications)
    // -------------------------------------------------------------
    console.log('\n[TEST 4] Medical Image upload (Prescription with medications)...')
    const sampleImgContent = `
    Rx PRESCRIPTION SLIP
    Dr. Sharma Clinic
    Patient: Rajesh Kumar | Date: 2026-09-10
    Rx:
    1. Tab Paracetamol 500 mg TDS x 3 days (after meals)
    2. Tab Amoxicillin 625 mg BD x 5 days
    Doctor Signature
    `
    const imgBuffer = Buffer.from(sampleImgContent, 'utf-8')

    const imgUploadRes = await fetch(`${BASE}/patient-cases/${activeCase.id}/documents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${primaryToken}`
      },
      body: JSON.stringify({
        fileName: 'Previous_Prescription.png',
        fileType: 'image/png',
        fileData: imgBuffer.toString('base64'),
        languageStyle: 'hinglish'
      })
    })
    const imgUploadData = await imgUploadRes.json()

    assert(imgUploadRes.status === 200, '4.1 Image upload returns HTTP 200')
    assert(imgUploadData.findings?.documentType === 'prescription', '4.2 Image documentType detected as prescription')
    assert(Array.isArray(imgUploadData.findings?.medications), '4.3 Medications array extracted from image')
    
    const paracetamol = imgUploadData.findings.medications.find(m => m.name.toLowerCase().includes('paracetamol'))
    assert(!!paracetamol, '4.4 Paracetamol extracted from image')
    assert(paracetamol?.dosage === '500 mg', '4.5 Dosage 500 mg extracted')
    assert(paracetamol?.source.includes('Previous_Prescription.png'), '4.6 Medication is source-linked to image')

    // Check that BOTH documents now exist on the SAME case
    assert(imgUploadData.case.documents.length === 2, '4.7 Both documents now attached to the SAME clinical case')

    // -------------------------------------------------------------
    // TEST 5: Document Conflict Preservation
    // -------------------------------------------------------------
    console.log('\n[TEST 5] Conflict preservation between document and patient statement...')
    // Patient says: "Main ab ye medicine nahi leta"
    const conflictTurnRes = await fetch(`${BASE}/patient-cases/${activeCase.id}/interview`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${primaryToken}`
      },
      body: JSON.stringify({
        message: 'Main ab ye Paracetamol nahi leta hoon, band kar di thi.',
        inputMode: 'text'
      })
    })
    const conflictTurnData = await conflictTurnRes.json()
    assert(conflictTurnRes.status === 200, '5.1 Patient statement turn processed')
    
    // Check that structured history does NOT silently erase either source
    const medsField = conflictTurnData.case.structuredHistory.currentMedications
    assert(
      medsField.includes('Paracetamol') || medsField.includes('Document reports'),
      '5.2 Historical document prescription is preserved'
    )

    // -------------------------------------------------------------
    // TEST 6: Unreadable Handwriting / Low-Quality Document Handling
    // -------------------------------------------------------------
    console.log('\n[TEST 6] Unreadable handwriting / uncertain items handling...')
    const handwrittenContent = `
    DOCTOR NOTE
    Rx: [unreadable scribble 500mg blurry handwriting]
    `
    const handwrittenBuffer = Buffer.from(handwrittenContent, 'utf-8')
    const unreadableRes = await fetch(`${BASE}/patient-cases/${activeCase.id}/documents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${primaryToken}`
      },
      body: JSON.stringify({
        fileName: 'handwritten_doctor_note.jpg',
        fileType: 'image/jpeg',
        fileData: handwrittenBuffer.toString('base64'),
        languageStyle: 'english'
      })
    })
    const unreadableData = await unreadableRes.json()
    assert(unreadableRes.status === 200, '6.1 Handwritten note uploaded')
    assert(Array.isArray(unreadableData.findings?.uncertainItems), '6.2 uncertainItems array present')
    assert(unreadableData.findings.uncertainItems.length > 0, '6.3 Unclear handwriting marked as UNCERTAIN rather than hallucinated')

    // -------------------------------------------------------------
    // TEST 7: Security & Patient Isolation (Patient B cannot access Patient A's document)
    // -------------------------------------------------------------
    console.log('\n[TEST 7] Security & Patient Isolation...')
    const uniqueSuffix = Date.now().toString().slice(-6)
    const patient2 = {
      name: `Patient Two ${uniqueSuffix}`,
      mobile: `9871${uniqueSuffix}`,
      dob: '01/01/1990',
      age: '36',
      gender: 'Female',
      identityType: 'Aadhaar',
      identityNumber: `9988 7766 ${uniqueSuffix}`,
      bloodGroup: 'O+'
    }
    await fetch(`${BASE}/patients/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patient2)
    })
    const login2Res = await fetch(`${BASE}/auth/patient/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobile: patient2.mobile })
    })
    const login2Data = await login2Res.json()
    const token2 = login2Data.token

    // Patient 2 tries to upload document to Patient 1's case -> 403
    const crossUploadRes = await fetch(`${BASE}/patient-cases/${activeCase.id}/documents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token2}`
      },
      body: JSON.stringify({
        fileName: 'unauthorized.pdf',
        fileType: 'application/pdf',
        fileData: pdfBuffer.toString('base64')
      })
    })
    assert(crossUploadRes.status === 403, '7.1 Patient B cannot upload document to Patient A case (HTTP 403 Forbidden)')

    // Patient 2 tries to delete Patient 1's document -> 403
    const crossDeleteRes = await fetch(`${BASE}/patient-cases/${activeCase.id}/documents/${doc1Id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token2}`
      }
    })
    assert(crossDeleteRes.status === 403, '7.2 Patient B cannot delete Patient A document (HTTP 403 Forbidden)')

    // Patient 2 tries to download/view Patient 1's file -> 403
    const crossGetFileRes = await fetch(`${BASE}/patient-cases/${activeCase.id}/documents/${doc1Id}/file`, {
      headers: {
        Authorization: `Bearer ${token2}`
      }
    })
    assert(crossGetFileRes.status === 403, '7.3 Patient B cannot access Patient A document file (HTTP 403 Forbidden)')

    // -------------------------------------------------------------
    // TEST 8: Document Deletion / Discard by Owner
    // -------------------------------------------------------------
    console.log('\n[TEST 8] Document deletion by authorized owner...')
    const deleteRes = await fetch(`${BASE}/patient-cases/${activeCase.id}/documents/${doc1Id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${primaryToken}`
      }
    })
    const deleteData = await deleteRes.json()
    assert(deleteRes.status === 200, '8.1 Authorized owner can discard/delete document (HTTP 200)')
    assert(
      !deleteData.case.documents.some(d => d.id === doc1Id),
      '8.2 Document removed from active case list'
    )

    // -------------------------------------------------------------
    // TEST 9: Voice + Document Continuity & Safety
    // -------------------------------------------------------------
    console.log('\n[TEST 9] Voice + Document continuity on SAME case...')
    const voiceTurnRes = await fetch(`${BASE}/patient-cases/${activeCase.id}/interview`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${primaryToken}`
      },
      body: JSON.stringify({
        message: 'Aapne jo poocha uska answer: meri tabiyat ab thodi theek hai.',
        inputMode: 'voice'
      })
    })
    const voiceTurnData = await voiceTurnRes.json()
    assert(voiceTurnRes.status === 200, '9.1 Voice turn continues through SAME case')
    assert(voiceTurnData.case.id === activeCase.id, '9.2 Same case preserved after voice turn')

    // Verify transcript in assessment_answers preserves turns
    const transcript = voiceTurnData.case.assessmentAnswers
    assert(transcript.some(t => t.inputMode === 'document'), '9.3 Document upload recorded in interview transcript')
    assert(transcript.some(t => t.inputMode === 'voice'), '9.4 Voice turn recorded in interview transcript')

    // -------------------------------------------------------------
    // TEST 10: Case Confirmation with Documents Attached
    // -------------------------------------------------------------
    console.log('\n[TEST 10] Case confirmation with attached documents...')
    const confirmRes = await fetch(`${BASE}/patient-cases/${activeCase.id}/confirm`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${primaryToken}`
      },
      body: JSON.stringify({
        structuredHistory: voiceTurnData.case.structuredHistory
      })
    })
    const confirmData = await confirmRes.json()
    assert(confirmRes.status === 200, '10.1 Case confirmed with attached documents')
    assert(confirmData.case.lifecycleStage === 'PATIENT CONFIRMED', '10.2 Lifecycle stage updated to PATIENT CONFIRMED')
    assert(confirmData.case.documents.length > 0, '10.3 Documents preserved in confirmed case')

  } catch (err) {
    console.error('Fatal test exception:', err)
    failed++
  } finally {
    server.close()
  }

  console.log(`\n-----------------------------------------------------`)
  console.log(`MULTIMODAL DOCUMENT TESTS SUMMARY: ${passed} PASSED, ${failed} FAILED`)
  console.log(`-----------------------------------------------------`)

  if (failed > 0) {
    process.exit(1)
  }
}

runTests().catch((err) => {
  console.error('Test runner error:', err)
  process.exit(1)
})
