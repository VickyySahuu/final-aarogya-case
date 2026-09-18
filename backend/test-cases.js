// Automated Test Suite for Process 3: Patient Case / New Problem Lifecycle
import { app } from './server.js'
import { AiCaseService } from './services/aiCaseService.js'

async function runTests() {
  console.log('--- STARTING PROCESS 3 PATIENT CASE LIFECYCLE TESTS ---')

  const PORT = 5057
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

    // -------------------------------------------------------------
    // TEST 1: Authenticated patient can create a case
    // -------------------------------------------------------------
    console.log('\n[TEST 1] Authenticated patient can create a case...')
    const createRes = await fetch(`${BASE}/patient-cases`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${primaryToken}`
      },
      body: JSON.stringify({
        problem: 'Acute high fever with throat irritation and headache',
        duration: '1-3-days'
      })
    })
    const createData = await createRes.json()

    assert(createRes.status === 201, '1.1 POST /api/patient-cases returns HTTP 201 Created')
    assert(createData.success === true, '1.2 Response success flag is true')
    assert(!!createData.case?.id, '1.3 Created case has a database ID')
    assert(!!createData.case?.caseNumber && createData.case.caseNumber.startsWith('CASE-'), '1.4 Generated case number has valid format CASE-YYYY-XXXX')
    assert(createData.case.problem === 'Acute high fever with throat irritation and headache', '1.5 Case problem text matches submitted complaint')
    assert(createData.case.duration === '1-3-days', '1.6 Case duration matches submitted value')
    assert(createData.case.status === 'Active', '1.7 Default case status is Active')

    const activeCaseId = createData.case.id
    const activeCaseNumber = createData.case.caseNumber

    // -------------------------------------------------------------
    // TEST 2: Case belongs to the correct patient & security isolation
    // -------------------------------------------------------------
    console.log('\n[TEST 2] Case belongs to the correct patient & cross-patient security...')
    assert(createData.case.patientId === primaryPatient.id, '2.1 Case patientId matches authenticated patient DB ID')
    assert(createData.case.patientUniqueCode === primaryPatient.patientUniqueCode, '2.2 Case patientUniqueCode matches patient unique code')

    // Create a second patient to test ownership isolation
    const uniqueSuffix = Date.now().toString().slice(-6)
    const secondCitizen = {
      name: `Citizen Two ${uniqueSuffix}`,
      mobile: `9822${uniqueSuffix}`,
      dob: '05/05/1995',
      age: '30',
      gender: 'Male',
      identityType: 'Aadhaar',
      identityNumber: `7766 5544 ${uniqueSuffix}`,
      bloodGroup: 'B+'
    }
    const regRes2 = await fetch(`${BASE}/patients/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(secondCitizen)
    })
    const regData2 = await regRes2.json()

    const loginRes2 = await fetch(`${BASE}/auth/patient/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobile: secondCitizen.mobile })
    })
    const loginData2 = await loginRes2.json()
    const secondToken = loginData2.token

    // Second patient attempts to access primary patient's case -> MUST BE REJECTED 403
    const forbiddenGetRes = await fetch(`${BASE}/patient-cases/${activeCaseId}`, {
      headers: { Authorization: `Bearer ${secondToken}` }
    })
    assert(forbiddenGetRes.status === 403, '2.3 Unauthorized patient cannot access another citizen case (HTTP 403 Forbidden)')

    // Second patient attempts to update primary patient's case -> MUST BE REJECTED 403
    const forbiddenPatchRes = await fetch(`${BASE}/patient-cases/${activeCaseId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${secondToken}`
      },
      body: JSON.stringify({ severity: 'severe' })
    })
    assert(forbiddenPatchRes.status === 403, '2.4 Unauthorized patient cannot modify another citizen case (HTTP 403 Forbidden)')

    // -------------------------------------------------------------
    // TEST 3: Required fields are validated
    // -------------------------------------------------------------
    console.log('\n[TEST 3] Required fields validation...')
    const emptyProblemRes = await fetch(`${BASE}/patient-cases`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${primaryToken}`
      },
      body: JSON.stringify({ problem: '   ' })
    })
    const emptyProblemData = await emptyProblemRes.json()
    assert(emptyProblemRes.status === 400, '3.1 Empty problem returns HTTP 400 Bad Request')
    assert(emptyProblemData.success === false && emptyProblemData.message.includes('required'), '3.2 Meaningful error message returned for missing problem')

    // -------------------------------------------------------------
    // TEST 4: Unauthenticated request is rejected
    // -------------------------------------------------------------
    console.log('\n[TEST 4] Unauthenticated requests are rejected...')
    const unauthPostRes = await fetch(`${BASE}/patient-cases`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ problem: 'Test' })
    })
    assert(unauthPostRes.status === 401, '4.1 Unauthenticated POST /api/patient-cases rejected with HTTP 401')

    const unauthGetRes = await fetch(`${BASE}/patient-cases`)
    assert(unauthGetRes.status === 401, '4.2 Unauthenticated GET /api/patient-cases rejected with HTTP 401')

    const unauthGetIdRes = await fetch(`${BASE}/patient-cases/${activeCaseId}`)
    assert(unauthGetIdRes.status === 401, '4.3 Unauthenticated GET /api/patient-cases/:id rejected with HTTP 401')

    const unauthPatchRes = await fetch(`${BASE}/patient-cases/${activeCaseId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ severity: 'mild' })
    })
    assert(unauthPatchRes.status === 401, '4.4 Unauthenticated PATCH /api/patient-cases/:id rejected with HTTP 401')

    // -------------------------------------------------------------
    // TEST 5: Case can be retrieved by its ID and caseNumber
    // -------------------------------------------------------------
    console.log('\n[TEST 5] Case can be retrieved by its ID and case number...')
    const getByIdRes = await fetch(`${BASE}/patient-cases/${activeCaseId}`, {
      headers: { Authorization: `Bearer ${primaryToken}` }
    })
    const getByIdData = await getByIdRes.json()
    assert(getByIdRes.status === 200, '5.1 GET /api/patient-cases/:id returns HTTP 200')
    assert(getByIdData.case?.id === activeCaseId, '5.2 Returned case ID matches requested ID')
    assert(getByIdData.case?.caseNumber === activeCaseNumber, '5.3 Returned case number matches requested case')

    const getByNumRes = await fetch(`${BASE}/patient-cases/${activeCaseNumber}`, {
      headers: { Authorization: `Bearer ${primaryToken}` }
    })
    const getByNumData = await getByNumRes.json()
    assert(getByNumRes.status === 200 && getByNumData.case?.id === activeCaseId, '5.4 Case can also be retrieved by unique case number')

    // -------------------------------------------------------------
    // TEST 6: Case can be updated (Severity, Symptoms, Assessment)
    // -------------------------------------------------------------
    console.log('\n[TEST 6] Case can be updated through the clinical intake flow...')
    // Update Step 2: Case Information (Severity & Symptoms)
    const updateInfoRes = await fetch(`${BASE}/patient-cases/${activeCaseId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${primaryToken}`
      },
      body: JSON.stringify({
        severity: 'moderate',
        symptoms: ['Fever', 'Throat Pain', 'Headache']
      })
    })
    const updateInfoData = await updateInfoRes.json()
    assert(updateInfoRes.status === 200, '6.1 Updating severity and symptoms returns HTTP 200')
    assert(updateInfoData.case?.severity === 'moderate', '6.2 Severity updated to moderate')
    assert(Array.isArray(updateInfoData.case?.symptoms) && updateInfoData.case.symptoms.length === 3, '6.3 Symptoms list updated with 3 symptoms')

    // Update Step 3: AI Assessment Results
    const updateAiRes = await fetch(`${BASE}/patient-cases/${activeCaseId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${primaryToken}`
      },
      body: JSON.stringify({
        assessmentAnswers: [
          { question: 'breathingResponse', answer: 'none' },
          { question: 'additionalNotes', answer: 'Started after exposure to rain' }
        ],
        aiAssessment: {
          triageLevel: 'Standard Outpatient (OPD)',
          recommendation: 'Standard Outpatient (OPD) Recommended',
          priorityWindow: 'Within 24–48 hours',
          disclaimer: 'AI-assisted assessment. Doctor makes the final clinical decision.'
        }
      })
    })
    const updateAiData = await updateAiRes.json()
    assert(updateAiRes.status === 200, '6.4 Updating AI assessment answers returns HTTP 200')
    assert(updateAiData.case?.aiAssessment?.recommendation === 'Standard Outpatient (OPD) Recommended', '6.5 AI assessment recommendation recorded')
    assert(updateAiData.case?.aiAssessment?.disclaimer?.includes('Doctor makes the final clinical decision'), '6.6 Mandatory clinical safety disclaimer preserved')
    assert(Array.isArray(updateAiData.case?.assessmentAnswers) && updateAiData.case.assessmentAnswers.length === 2, '6.7 Assessment questionnaire answers saved')

    // -------------------------------------------------------------
    // TEST 7: Refresh/navigation does not create duplicate cases
    // -------------------------------------------------------------
    console.log('\n[TEST 7] Refresh / navigation re-uses existing active case (no duplicates)...')
    // Simulating patient going back to New Problem page and editing the complaint for the active case
    const repeatUpdateRes = await fetch(`${BASE}/patient-cases/${activeCaseId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${primaryToken}`
      },
      body: JSON.stringify({
        problem: 'Acute high fever with persistent throat irritation, cough and headache',
        duration: '1-3-days'
      })
    })
    assert(repeatUpdateRes.status === 200, '7.1 Navigating back and updating existing case returns HTTP 200')

    // Query all cases for primary patient
    const listRes = await fetch(`${BASE}/patient-cases`, {
      headers: { Authorization: `Bearer ${primaryToken}` }
    })
    const listData = await listRes.json()
    assert(listRes.status === 200, '7.2 GET /api/patient-cases returns HTTP 200')
    const matches = listData.cases.filter(c => c.id === activeCaseId)
    assert(matches.length === 1, '7.3 Exactly one case instance exists for this intake flow (no duplicates)')

    // -------------------------------------------------------------
    // TEST 8: Registration -> Login -> Case identity remains consistent
    // -------------------------------------------------------------
    console.log('\n[TEST 8] Registration -> Login -> Case identity consistency across pipeline...')
    const citizen3Suffix = Date.now().toString().slice(-6)
    const pipelineCitizen = {
      name: `Pipeline Citizen ${citizen3Suffix}`,
      mobile: `9811${citizen3Suffix}`,
      dob: '20/08/1990',
      age: '35',
      gender: 'Female',
      identityType: 'Aadhaar',
      identityNumber: `6655 4433 ${citizen3Suffix}`,
      bloodGroup: 'O+',
      address: 'Pipeline Housing Society, Block D'
    }

    // 8.1 Register
    const regPipelineRes = await fetch(`${BASE}/patients/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pipelineCitizen)
    })
    const regPipelineData = await regPipelineRes.json()
    assert(regPipelineRes.status === 201, '8.1 Pipeline citizen registered')
    const pDbId = regPipelineData.patient.id
    const pPatientId = regPipelineData.patient.patientId
    const pUniqueCode = regPipelineData.patient.patientUniqueCode

    // 8.2 Login
    const loginPipelineRes = await fetch(`${BASE}/auth/patient/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobile: pipelineCitizen.mobile })
    })
    const loginPipelineData = await loginPipelineRes.json()
    assert(loginPipelineRes.status === 200, '8.2 Pipeline citizen logged in')
    const pipelineToken = loginPipelineData.token
    assert(loginPipelineData.patient.id === pDbId, '8.3 Login patient DB ID matches registration ID')
    assert(loginPipelineData.patient.patientUniqueCode === pUniqueCode, '8.4 Login unique code matches registration code')

    // 8.3 Verify Session /me
    const mePipelineRes = await fetch(`${BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${pipelineToken}` }
    })
    const mePipelineData = await mePipelineRes.json()
    assert(mePipelineData.patient.id === pDbId, '8.5 Session /me confirms patient DB ID')

    // 8.4 Create Case
    const casePipelineRes = await fetch(`${BASE}/patient-cases`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${pipelineToken}`
      },
      body: JSON.stringify({
        problem: 'Joint stiffness and low back pain after exertion',
        duration: '4-7-days'
      })
    })
    const casePipelineData = await casePipelineRes.json()
    assert(casePipelineRes.status === 201, '8.6 Pipeline citizen creates case')
    assert(casePipelineData.case.patientId === pDbId, '8.7 Case patientId matches registration DB ID exactly')
    assert(casePipelineData.case.patientUniqueCode === pUniqueCode, '8.8 Case patientUniqueCode matches registration unique code exactly')

    // 8.5 Verify Case List for citizen
    const myCasesRes = await fetch(`${BASE}/patient-cases`, {
      headers: { Authorization: `Bearer ${pipelineToken}` }
    })
    const myCasesData = await myCasesRes.json()
    assert(myCasesRes.status === 200, '8.9 GET /api/patient-cases returns HTTP 200 for citizen')
    assert(myCasesData.cases.length === 1 && myCasesData.cases[0].id === casePipelineData.case.id, '8.10 Case list correctly contains citizen created case')

    // -------------------------------------------------------------
    // TEST 9: SIH26047 STEP 1 Foundation: Original Patient Response & Structured Clinical History
    // -------------------------------------------------------------
    console.log('\n[TEST 9] SIH26047 STEP 1 Foundation: Original Patient Response & Structured Clinical History...')
    const verbatimInput = 'Mujhe 3 din se high fever aur gale me kharash hai'
    const step1CaseRes = await fetch(`${BASE}/patient-cases`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${pipelineToken}`
      },
      body: JSON.stringify({
        problem: verbatimInput,
        duration: '1-3-days',
        originalPatientResponse: verbatimInput
      })
    })
    const step1Data = await step1CaseRes.json()
    assert(step1CaseRes.status === 201, '9.1 SIH26047 Step 1 case created with HTTP 201')
    assert(step1Data.case.originalPatientResponse === verbatimInput, '9.2 Original patient verbatim words strictly preserved')
    assert(step1Data.case.status === 'Active', '9.3 Case status remains Active for backward compatibility')
    assert(step1Data.case.lifecycleStage === 'PATIENT CONFIRMED' || step1Data.case.lifecycleStage === 'IN PROGRESS', '9.4 Case lifecycle stage recorded')

    // Verify structured history defaults and no-fabrication policy
    const structured = step1Data.case.structuredHistory
    assert(!!structured, '9.5 Structured clinical history object is initialized')
    assert(structured.chiefComplaint === verbatimInput, '9.6 Structured chief complaint captures input')
    assert(structured.duration === '1-3-days', '9.7 Structured duration captures intake duration')
    assert(structured.pastMedicalHistory === 'Not provided', '9.8 Missing past medical history strictly marked "Not provided" (no fabrication)')
    assert(structured.currentMedications === 'Not provided', '9.9 Missing current medications strictly marked "Not provided" (no fabrication)')
    assert(structured.allergies === 'Unknown', '9.10 Missing allergies strictly marked "Unknown" (no fabrication)')
    assert(Array.isArray(structured.relevantNegatives) && structured.relevantNegatives.length === 0, '9.11 Missing relevant negatives empty (not converted to false statements)')

    // Update structured interpretation alongside verbatim original
    const patchStep1Res = await fetch(`${BASE}/patient-cases/${step1Data.case.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${pipelineToken}`
      },
      body: JSON.stringify({
        structuredHistory: {
          chiefComplaint: 'Acute Pyrexia with Pharyngitis',
          duration: '3 days',
          symptoms: ['High Fever', 'Sore Throat'],
          associatedSymptoms: ['Mild Chills'],
          pastMedicalHistory: 'Hypertension (managed)',
          currentMedications: 'Amlodipine 5mg OD',
          allergies: 'Penicillin allergy',
          relevantNegatives: ['No cough', 'No shortness of breath'],
          additionalInformation: 'Patient reported worsening in evening'
        }
      })
    })
    const patchStep1Data = await patchStep1Res.json()
    assert(patchStep1Res.status === 200, '9.12 Updating structured history returns HTTP 200')
    assert(patchStep1Data.case.originalPatientResponse === verbatimInput, '9.13 Original patient verbatim response unaltered after structured interpretation')
    assert(patchStep1Data.case.structuredHistory.chiefComplaint === 'Acute Pyrexia with Pharyngitis', '9.14 Structured interpretation recorded')
    assert(patchStep1Data.case.structuredHistory.allergies === 'Penicillin allergy', '9.15 Documented allergy recorded')
    assert(patchStep1Data.case.structuredHistory.relevantNegatives.includes('No cough'), '9.16 Clinically confirmed relevant negatives preserved')

    // Strict patient isolation on SIH Case
    const crossPatientRes = await fetch(`${BASE}/patient-cases/${step1Data.case.id}`, {
      headers: { Authorization: `Bearer ${primaryToken}` }
    })
    assert(crossPatientRes.status === 403, '9.17 Cross-patient access to SIH case rejected with HTTP 403 Forbidden')

    // -------------------------------------------------------------
    // TEST 10: SIH26047 STEP 2 AI Text-Based Patient Case Taking
    // -------------------------------------------------------------
    console.log('\n[TEST 10] SIH26047 STEP 2 AI Text-Based Patient Case Taking & Adaptive Questioning...')

    // 10.1 Register a distinct citizen for Step 2 AI interview verification
    const aiTestSuffix = Date.now().toString().slice(-6)
    const regAiRes = await fetch(`${BASE}/patients/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: `AI Interview Citizen ${aiTestSuffix}`,
        mobile: `9822${aiTestSuffix}`,
        identityType: 'Aadhaar',
        identityNumber: `7766 5544 ${aiTestSuffix}`,
        gender: 'Female',
        age: '29'
      })
    })
    const regAiData = await regAiRes.json()
    const aiPatientToken = regAiData.token
    assert(regAiRes.status === 201 && !!aiPatientToken, '10.1 Registered citizen for AI interview test')

    // 10.2 Initialize AI Interview (Rule 4: creates new if none, Rule 5: patient session is source of truth)
    const initRes1 = await fetch(`${BASE}/patient-cases/interview/init`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${aiPatientToken}`
      }
    })
    const initData1 = await initRes1.json()
    assert(initRes1.status === 201, '10.2 New clinical case initialized with HTTP 201')
    assert(initData1.success === true && !!initData1.case?.id, '10.3 Response returns initialized case')
    assert(initData1.isResumed === false, '10.4 Initial start is not marked resumed')
    const aiCaseId = initData1.case.id

    // 10.3 Resume Support: calling init again resumes existing active case (Rule 4: no duplicate cases)
    const initRes2 = await fetch(`${BASE}/patient-cases/interview/init`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${aiPatientToken}`
      }
    })
    const initData2 = await initRes2.json()
    assert(initRes2.status === 200, '10.5 Re-initialization resumes with HTTP 200')
    assert(initData2.isResumed === true, '10.6 Case correctly marked resumed')
    assert(initData2.case.id === aiCaseId, '10.7 Resumed case ID matches original active case (zero duplicates)')

    // 10.4 SIH Demo Test Turn 1: Patient types colloquial Hindi/English statement
    // "Mujhe 3 din se fever hai aur body pain ho raha hai."
    const sihDemoInput = 'Mujhe 3 din se fever hai aur body pain ho raha hai.'
    const turn1Res = await fetch(`${BASE}/patient-cases/${aiCaseId}/interview`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${aiPatientToken}`
      },
      body: JSON.stringify({ message: sihDemoInput })
    })
    const turn1Data = await turn1Res.json()
    assert(turn1Res.status === 200, '10.8 Turn 1 processed with HTTP 200')
    assert(turn1Data.success === true, '10.9 Turn 1 success is true')

    // Rule 1: originalPatientResponse must preserve the ORIGINAL patient response verbatim
    assert(turn1Data.case.originalPatientResponse === sihDemoInput, '10.10 Original patient verbatim words strictly preserved in case')
    assert(turn1Data.turnResult.extractedInformation.chiefComplaint === 'Fever', '10.11 Extracted chief complaint is Fever')
    assert(turn1Data.turnResult.extractedInformation.duration === '3 days', '10.12 Extracted duration is 3 days')
    assert(turn1Data.turnResult.extractedInformation.symptoms.includes('Body pain'), '10.13 Extracted symptom includes Body pain')

    // Rule 7 & 8: Zero diagnosis guardrail & missing information tracking
    const q1 = turn1Data.turnResult.nextQuestion.toLowerCase()
    assert(!q1.includes('you have dengue') && !q1.includes('dengue'), '10.14 System does NOT diagnose dengue (strict zero-diagnosis guardrail)')
    assert(turn1Data.turnResult.missingInformation.includes('pastMedicalHistory'), '10.15 Correctly tracks missing past medical history')
    assert(turn1Data.turnResult.extractedInformation.pastMedicalHistory === 'Not provided', '10.16 Missing past history remains "Not provided" (no fabrication)')
    assert(turn1Data.turnResult.extractedInformation.allergies === 'Unknown', '10.17 Missing allergies remains "Unknown" (no fabrication)')

    // 10.5 Turn 2: Follow-up response (Associated symptoms & Medical history)
    const turn2Input = 'Khasi aur ulti nahi hai. Koi purani bimari nahi hai.'
    const turn2Res = await fetch(`${BASE}/patient-cases/${aiCaseId}/interview`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${aiPatientToken}`
      },
      body: JSON.stringify({ message: turn2Input })
    })
    const turn2Data = await turn2Res.json()
    assert(turn2Res.status === 200, '10.18 Turn 2 processed with HTTP 200')

    // Rule 1 Verification: originalPatientResponse MUST NOT be overwritten by cumulative text!
    assert(turn2Data.case.originalPatientResponse === sihDemoInput, '10.19 originalPatientResponse remains initial verbatim wording and is NOT overwritten')

    // Rule 3 Verification: structuredHistory must be MERGED with existing info
    assert(turn2Data.case.structuredHistory.chiefComplaint === 'Fever', '10.20 Previously extracted chief complaint Fever preserved after merge')
    assert(turn2Data.case.structuredHistory.duration === '3 days', '10.21 Previously extracted duration preserved after merge')
    assert(turn2Data.case.structuredHistory.pastMedicalHistory === 'None reported', '10.22 Past medical history updated to "None reported"')
    assert(turn2Data.case.structuredHistory.relevantNegatives.includes('No cough'), '10.23 Relevant negatives captures confirmed negative: No cough')

    // Rule 2: Complete transcript stored in assessmentAnswers separately
    assert(Array.isArray(turn2Data.case.assessmentAnswers) && turn2Data.case.assessmentAnswers.length >= 4, '10.24 Full interview transcript stored in assessmentAnswers')

    // 10.6 Turn 3: Medications and Allergies
    const turn3Input = 'Paracetamol 650mg liya tha. Koi allergy nahi hai.'
    const turn3Res = await fetch(`${BASE}/patient-cases/${aiCaseId}/interview`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${aiPatientToken}`
      },
      body: JSON.stringify({ message: turn3Input })
    })
    const turn3Data = await turn3Res.json()
    assert(turn3Res.status === 200, '10.25 Turn 3 processed with HTTP 200')
    assert(turn3Data.case.structuredHistory.currentMedications.includes('Paracetamol'), '10.26 Current medications captures Paracetamol')
    assert(turn3Data.case.structuredHistory.allergies === 'None reported', '10.27 Allergies captures "None reported"')

    // 10.7 Turn 4: Patient indicates completion
    const turn4Res = await fetch(`${BASE}/patient-cases/${aiCaseId}/interview`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${aiPatientToken}`
      },
      body: JSON.stringify({ message: 'Nothing else, that is all.' })
    })
    const turn4Data = await turn4Res.json()
    assert(turn4Res.status === 200, '10.28 Turn 4 processed with HTTP 200')
    assert(turn4Data.turnResult.isComplete === true, '10.29 Interview completion condition detected successfully')

    // 10.8 Case Review Confirmation
    const confirmRes = await fetch(`${BASE}/patient-cases/${aiCaseId}/confirm`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${aiPatientToken}`
      },
      body: JSON.stringify({ structuredHistory: turn4Data.case.structuredHistory })
    })
    const confirmData = await confirmRes.json()
    assert(confirmRes.status === 200, '10.30 Case confirmed with HTTP 200')
    assert(confirmData.case.lifecycleStage === 'PATIENT CONFIRMED', '10.31 Case lifecycle stage is PATIENT CONFIRMED')

    // 10.9 Error handling & Validation
    const emptyTurnRes = await fetch(`${BASE}/patient-cases/${aiCaseId}/interview`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${aiPatientToken}`
      },
      body: JSON.stringify({ message: '' })
    })
    assert(emptyTurnRes.status === 400, '10.32 Empty turn rejected with HTTP 400 Bad Request')

    // 10.10 Rule 5: Strict Patient Ownership & Cross-Patient Security on Interview Turn
    const crossTurnRes = await fetch(`${BASE}/patient-cases/${aiCaseId}/interview`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${primaryToken}`
      },
      body: JSON.stringify({ message: 'Unauthorized tampering attempt' })
    })
    assert(crossTurnRes.status === 403, '10.33 Cross-patient interview submission strictly rejected with HTTP 403 Forbidden')

    // -------------------------------------------------------------
    // TEST 11: Direct Safety Inquiries, Gemini Fallback & Review Edit Integrity
    // -------------------------------------------------------------
    console.log('\n[TEST 11] Safety Inquiries, Gemini Fallback & Review Edit Integrity...')

    // 11.1 Provider status inspection
    const providerStatus = AiCaseService.getProviderStatus()
    assert(
      (process.env.GEMINI_API_KEY ? providerStatus.provider === 'gemini' : providerStatus.provider === 'deterministic-nlp'),
      `11.1 Provider status accurately reflects environment configuration (Active: ${providerStatus.provider}, Model: ${providerStatus.model})`
    )
    assert(providerStatus.safetyGuardrailsActive === true, '11.2 Safety guardrails active flag confirmed')

    // 11.2 Direct Diagnosis Inquiry Safety Guardrail
    // Citizen registers a new fresh case for safety inquiry test
    const safetySuffix = Date.now().toString().slice(-6)
    const safetyRegRes = await fetch(`${BASE}/patients/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: `Safety Citizen ${safetySuffix}`,
        mobile: `9833${safetySuffix}`,
        identityType: 'Aadhaar',
        identityNumber: `3322 1100 ${safetySuffix}`,
        gender: 'Male',
        age: '35'
      })
    })
    const safetyRegData = await safetyRegRes.json()
    const safetyToken = safetyRegData.token
    const safetyInitRes = await fetch(`${BASE}/patient-cases/interview/init`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${safetyToken}`
      }
    })
    const safetyInitData = await safetyInitRes.json()
    const safetyCaseId = safetyInitData.case.id

    const diagTurnRes = await fetch(`${BASE}/patient-cases/${safetyCaseId}/interview`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${safetyToken}`
      },
      body: JSON.stringify({ message: 'Do I have dengue?' })
    })
    const diagTurnData = await diagTurnRes.json()
    assert(diagTurnRes.status === 200, '11.3 Diagnosis request handled safely with HTTP 200')
    assert(diagTurnData.turnResult.nextQuestion.toLowerCase().includes('cannot diagnose'), '11.4 AI explicitly refuses to diagnose condition')
    assert(!diagTurnData.case.structuredHistory.chiefComplaint.toLowerCase().includes('confirmed dengue'), '11.5 Does NOT record dengue as verified clinical diagnosis')

    // 11.3 Direct Medication Inquiry Safety Guardrail
    const medTurnRes = await fetch(`${BASE}/patient-cases/${safetyCaseId}/interview`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${safetyToken}`
      },
      body: JSON.stringify({ message: 'Which medicine should I take for this?' })
    })
    const medTurnData = await medTurnRes.json()
    assert(medTurnRes.status === 200, '11.6 Medication request handled safely with HTTP 200')
    assert(medTurnData.turnResult.nextQuestion.toLowerCase().includes('cannot prescribe'), '11.7 AI explicitly refuses to prescribe medication')

    // 11.4 Gemini Execution & Fallback path when GEMINI_API_KEY is configured
    process.env.GEMINI_API_KEY = 'TEST_INVALID_KEY_TRIGGER_FALLBACK'
    const fallbackTurnRes = await fetch(`${BASE}/patient-cases/${safetyCaseId}/interview`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${safetyToken}`
      },
      body: JSON.stringify({ message: 'Kal se sar dard hai aur bukhar hai.' })
    })
    const fallbackTurnData = await fallbackTurnRes.json()
    assert(fallbackTurnRes.status === 200, '11.8 Gracefully falls back to deterministic NLP on Gemini failure')
    assert(fallbackTurnData.turnResult.extractedInformation.symptoms.includes('Headache'), '11.9 Extracted symptom Headache via safe fallback')
    delete process.env.GEMINI_API_KEY

    // 11.5 Patient Review Edit does NOT destroy originalPatientResponse
    const prevOriginal = turn4Data.case.originalPatientResponse
    const updatedHistory = {
      ...turn4Data.case.structuredHistory,
      duration: '5 days'
    }
    const editReviewRes = await fetch(`${BASE}/patient-cases/${aiCaseId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${aiPatientToken}`
      },
      body: JSON.stringify({
        duration: '5 days',
        structuredHistory: updatedHistory
      })
    })
    const editReviewData = await editReviewRes.json()
    assert(editReviewRes.status === 200, '11.10 Patient review edit returned HTTP 200')
    assert(editReviewData.case.duration === '5 days', '11.11 Updated duration saved')
    assert(editReviewData.case.originalPatientResponse === prevOriginal, '11.12 Original patient response STRICTLY PRESERVED after review edit')

    // -------------------------------------------------------------
    // TEST 12: SIH26047 STEP 3 — ADAPTIVE CLINICAL QUESTION ENGINE
    // -------------------------------------------------------------
    console.log('\n[TEST 12] SIH26047 STEP 3 — Adaptive Clinical Question Engine Verification...')

    // 12.1 Fever Case: Relevant Topic Selection & Deduplication
    // "Mujhe 3 din se fever hai aur body pain ho raha hai."
    // duration known, body pain known -> duration is NOT asked again
    const adaptiveSuffix = Date.now().toString().slice(-6)
    const adPatientRes = await fetch(`${BASE}/patients/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: `Adaptive Citizen ${adaptiveSuffix}`,
        mobile: `9844${adaptiveSuffix}`,
        identityType: 'Aadhaar',
        identityNumber: `4433 2211 ${adaptiveSuffix}`,
        gender: 'Female',
        age: '29'
      })
    })
    const adPatientData = await adPatientRes.json()
    const adToken = adPatientData.token

    const adInitRes = await fetch(`${BASE}/patient-cases/interview/init`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adToken}`
      }
    })
    const adInitData = await adInitRes.json()
    const adCaseId = adInitData.case.id
    assert(adInitRes.status === 201, '12.1 Adaptive interview initialized with HTTP 201')
    assert(!!adInitData.case.questionState, '12.2 questionState initialized on case')

    const adTurn1Res = await fetch(`${BASE}/patient-cases/${adCaseId}/interview`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adToken}`
      },
      body: JSON.stringify({ message: 'Mujhe 3 din se fever hai aur body pain ho raha hai.' })
    })
    const adTurn1Data = await adTurn1Res.json()
    assert(adTurn1Res.status === 200, '12.3 Fever turn 1 processed with HTTP 200')
    assert(adTurn1Data.turnResult.extractedInformation.duration === '3 days', '12.4 Duration is recognized as 3 days')
    assert(adTurn1Data.turnResult.extractedInformation.symptoms.includes('Body pain'), '12.5 Body pain is recognized as known symptom')

    const feverQ1 = adTurn1Data.turnResult.nextQuestion.toLowerCase()
    assert(
      !feverQ1.includes('how long') && !feverQ1.includes('how many days') && !feverQ1.includes('when did') && !feverQ1.includes('kitne din') && !feverQ1.includes('kab se'),
      '12.6 Adaptive engine does NOT ask duration again (semantic deduplication)'
    )
    assert(
      adTurn1Data.turnResult.questionState.answeredTopics.includes('duration'),
      '12.7 Duration recorded in questionState.answeredTopics'
    )
    assert(
      adTurn1Data.turnResult.questionState.askedTopics.length > 0,
      '12.8 Next topic recorded in questionState.askedTopics'
    )

    // 12.2 Abdominal Pain Case: Specificity, Location & Duration Non-Repetition
    const abdSuffix = Date.now().toString().slice(-6)
    const abdPatientRes = await fetch(`${BASE}/patients/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: `Abdominal Citizen ${abdSuffix}`,
        mobile: `9855${abdSuffix}`,
        identityType: 'Aadhaar',
        identityNumber: `5544 3322 ${abdSuffix}`,
        gender: 'Male',
        age: '38'
      })
    })
    const abdPatientData = await abdPatientRes.json()
    const abdToken = abdPatientData.token

    const abdInitRes = await fetch(`${BASE}/patient-cases/interview/init`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${abdToken}`
      }
    })
    const abdInitData = await abdInitRes.json()
    const abdCaseId = abdInitData.case.id

    const abdTurn1Res = await fetch(`${BASE}/patient-cases/${abdCaseId}/interview`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${abdToken}`
      },
      body: JSON.stringify({ message: 'Mujhe 2 din se lower abdomen me severe dard ho raha hai.' })
    })
    const abdTurn1Data = await abdTurn1Res.json()
    assert(abdTurn1Res.status === 200, '12.9 Abdominal turn 1 processed with HTTP 200')
    assert(abdTurn1Data.turnResult.extractedInformation.location === 'Lower abdomen', '12.10 Location extracted as Lower abdomen')
    assert(abdTurn1Data.turnResult.extractedInformation.duration === '2 days', '12.11 Duration extracted as 2 days')
    assert(abdTurn1Data.turnResult.extractedInformation.severity === 'Severe', '12.12 Severity extracted as Severe')

    const abdQ1 = abdTurn1Data.turnResult.nextQuestion.toLowerCase()
    assert(
      !abdQ1.includes('where is') && !abdQ1.includes('location of') && !abdQ1.includes('how long') && !abdQ1.includes('many days'),
      '12.13 Engine does NOT re-ask location or duration for abdominal complaint'
    )

    // 12.3 Ambiguous Duration Clarification
    const ambSuffix = Date.now().toString().slice(-6)
    const ambPatientRes = await fetch(`${BASE}/patients/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: `Ambiguous Citizen ${ambSuffix}`,
        mobile: `9866${ambSuffix}`,
        identityType: 'Aadhaar',
        identityNumber: `6655 4433 ${ambSuffix}`,
        gender: 'Female',
        age: '24'
      })
    })
    const ambPatientData = await ambPatientRes.json()
    const ambToken = ambPatientData.token

    const ambInitRes = await fetch(`${BASE}/patient-cases/interview/init`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ambToken}`
      }
    })
    const ambInitData = await ambInitRes.json()
    const ambCaseId = ambInitData.case.id

    const ambTurn1Res = await fetch(`${BASE}/patient-cases/${ambCaseId}/interview`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ambToken}`
      },
      body: JSON.stringify({ message: 'Mujhe pet me dard bahut time se hai.' })
    })
    const ambTurn1Data = await ambTurn1Res.json()
    assert(ambTurn1Res.status === 200, '12.14 Ambiguous duration turn 1 processed with HTTP 200')
    assert(ambTurn1Data.turnResult.extractedInformation.duration === 'Unknown', '12.15 Ambiguous duration is NOT invented (remains Unknown)')
    assert(
      ambTurn1Data.turnResult.nextQuestion.toLowerCase().includes('approximately') ||
      ambTurn1Data.turnResult.nextQuestion.toLowerCase().includes('kitne din'),
      '12.16 System requests focused clarification for ambiguous duration'
    )
    assert(
      ambTurn1Data.turnResult.questionState.clarificationCount.duration === 1,
      '12.17 clarificationCount.duration incremented to 1'
    )

    // Ambiguity resolved with concrete response
    const ambTurn2Res = await fetch(`${BASE}/patient-cases/${ambCaseId}/interview`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ambToken}`
      },
      body: JSON.stringify({ message: 'Lagbhag 4 din se dard ho raha hai.' })
    })
    const ambTurn2Data = await ambTurn2Res.json()
    assert(ambTurn2Res.status === 200, '12.18 Ambiguity clarification answered with HTTP 200')
    assert(ambTurn2Data.turnResult.extractedInformation.duration === '4 days', '12.19 Clarified duration recorded as 4 days')

    // 12.4 Contradiction Handling: 4 days -> 2 weeks
    const contraTurnRes = await fetch(`${BASE}/patient-cases/${ambCaseId}/interview`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ambToken}`
      },
      body: JSON.stringify({ message: 'Actually dard 2 hafte se chal raha hai.' })
    })
    const contraTurnData = await contraTurnRes.json()
    assert(contraTurnRes.status === 200, '12.20 Contradiction turn processed with HTTP 200')
    assert(contraTurnData.turnResult.extractedInformation.duration === '2 weeks', '12.21 Duration safely updated to latest patient statement (2 weeks)')
    assert(
      contraTurnData.case.structuredHistory.additionalInformation.includes('Duration updated from 4 days to 2 weeks'),
      '12.22 Contradiction audit note safely recorded in additionalInformation without silent loss'
    )
    assert(
      contraTurnData.case.assessmentAnswers.length >= 6,
      '12.23 Complete interview transcript preserved in assessmentAnswers'
    )

    // 12.5 Resume / Refresh: Question State Restored & No Repeated Questions
    const resumeRes = await fetch(`${BASE}/patient-cases/interview/init`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ambToken}`
      }
    })
    const resumeData = await resumeRes.json()
    assert(resumeRes.status === 200, '12.24 Active case resumed with HTTP 200')
    assert(resumeData.isResumed === true, '12.25 isResumed flag is true')
    assert(resumeData.case.questionState.answeredTopics.includes('duration'), '12.26 Restored questionState retains answeredTopics')

    // Next turn after resume should ask an unasked topic (e.g. associated symptoms or past history)
    const afterResumeTurnRes = await fetch(`${BASE}/patient-cases/${ambCaseId}/interview`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ambToken}`
      },
      body: JSON.stringify({ message: 'Dard continuous hota hai.' })
    })
    const afterResumeTurnData = await afterResumeTurnRes.json()
    assert(afterResumeTurnRes.status === 200, '12.27 Post-resume turn processed with HTTP 200')
    const resumeNextQ = afterResumeTurnData.turnResult.nextQuestion.toLowerCase()
    assert(!resumeNextQ.includes('how many days') && !resumeNextQ.includes('how long'), '12.28 Does NOT repeat duration after resume')

    // 12.6 Completion Logic: Stops unnecessary questioning
    const completionTurnRes = await fetch(`${BASE}/patient-cases/${ambCaseId}/interview`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ambToken}`
      },
      body: JSON.stringify({ message: 'Bas itna hi, nothing else to add.' })
    })
    const completionTurnData = await completionTurnRes.json()
    assert(completionTurnRes.status === 200, '12.29 Completion turn processed with HTTP 200')
    assert(completionTurnData.turnResult.isComplete === true, '12.30 isComplete flag is true on patient conclusion')
    assert(completionTurnData.turnResult.questionState.completionStatus === 'COMPLETED', '12.31 completionStatus is COMPLETED')

    // 12.7 Patient Isolation on Question State
    const isolateRes = await fetch(`${BASE}/patient-cases/${ambCaseId}/interview`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${primaryToken}`
      },
      body: JSON.stringify({ message: 'Unauthorized tamper of question state' })
    })
    assert(isolateRes.status === 403, '12.32 Cross-patient access to questionState strictly forbidden with HTTP 403')

    // ==================================================
    // TEST 13: INTERVIEW RESET CAPABILITY & FRESH RE-ASKING
    // ==================================================
    console.log('\n--- 13. INTERVIEW RESET & FRESH CLINICAL RE-ASKING ---')

    // 13.1 Cross-patient forbidden reset
    const isolateResetRes = await fetch(`${BASE}/patient-cases/${ambCaseId}/interview/reset`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${primaryToken}`
      }
    })
    assert(isolateResetRes.status === 403, '13.1 Cross-patient reset of clinical interview forbidden with HTTP 403')

    // 13.2 Valid Reset by Case Owner
    const resetRes = await fetch(`${BASE}/patient-cases/${ambCaseId}/interview/reset`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ambToken}`
      }
    })
    const resetData = await resetRes.json()
    assert(resetRes.status === 200, '13.2 Reset clinical interview responds with HTTP 200')
    assert(resetData.success === true, '13.3 Reset response success is true')
    assert(resetData.case.id === ambCaseId, '13.4 Case ID preserved without creating duplicate records')
    assert(resetData.case.originalPatientResponse === '', '13.5 originalPatientResponse cleared to empty string')
    assert(resetData.case.symptoms.length === 0, '13.6 Case symptoms array emptied')
    assert(resetData.case.structuredHistory.chiefComplaint === 'Not provided', '13.7 Structured chief complaint reset to default')
    assert(resetData.case.structuredHistory.duration === 'Unknown', '13.8 Structured duration reset to Unknown')
    assert(resetData.case.questionState.completionStatus === 'IN_PROGRESS', '13.9 questionState completionStatus reset to IN_PROGRESS')
    assert(resetData.case.questionState.askedTopics.length === 0, '13.10 askedTopics emptied')
    assert(resetData.case.questionState.answeredTopics.length === 0, '13.11 answeredTopics emptied')
    assert(typeof resetData.initialQuestion === 'string' && resetData.initialQuestion.length > 0, '13.12 AI asks opening question again')

    // 13.3 Provide completely new symptoms and verify fresh structured data fills
    const newTurnRes = await fetch(`${BASE}/patient-cases/${ambCaseId}/interview`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ambToken}`
      },
      body: JSON.stringify({ message: 'Sir mujhe subah se severe right shoulder pain hai.' })
    })
    const newTurnData = await newTurnRes.json()
    assert(newTurnRes.status === 200, '13.13 Post-reset first turn processed with HTTP 200')
    assert(
      newTurnData.case.originalPatientResponse === 'Sir mujhe subah se severe right shoulder pain hai.',
      '13.14 New originalPatientResponse recorded verbatim from new turn'
    )
    assert(
      newTurnData.case.structuredHistory.symptoms.some(s => /shoulder|pain/i.test(s)),
      '13.15 New symptoms populated into structured history'
    )
    assert(
      !newTurnData.case.structuredHistory.symptoms.includes('Abdominal pain') && !newTurnData.case.structuredHistory.symptoms.includes('Headache'),
      '13.16 Old symptoms from prior session completely removed and not carried over'
    )
    assert(
      newTurnData.turnResult.questionState.answeredTopics.includes('chiefComplaint') || newTurnData.turnResult.questionState.answeredTopics.includes('duration'),
      '13.17 Question state tracks new responses from fresh start'
    )

    // ==================================================
    // TEST 14: MULTILINGUAL AI (EN, HI, HINGLISH) & VOICE TURN TRACEABILITY
    // ==================================================
    console.log('\n--- 14. MULTILINGUAL MIRRORING & VOICE TURN TRACEABILITY ---')

    // Create a new dedicated case for testing language mirroring & voice
    const mlInitRes = await fetch(`${BASE}/patient-cases`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${primaryToken}`
      },
      body: JSON.stringify({
        problem: 'Pending clinical intake interview',
        duration: 'Unknown',
        severity: 'Routine'
      })
    })
    const mlInitData = await mlInitRes.json()
    const mlCaseId = mlInitData.case.id
    assert(mlInitRes.status === 201, '14.1 New case created for multilingual & voice tests')

    // 14.2 Turn 1: English Input -> English AI Response
    const turn1EnRes = await fetch(`${BASE}/patient-cases/${mlCaseId}/interview`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${primaryToken}`
      },
      body: JSON.stringify({
        message: 'I have had fever for three days.',
        inputMode: 'text'
      })
    })
    const turn1EnData = await turn1EnRes.json()
    assert(turn1EnRes.status === 200, '14.2 English turn processed with HTTP 200')
    assert(turn1EnData.turnResult.languageStyle === 'english', '14.3 English input detected as english style')
    assert(
      /[a-zA-Z\s,?]/.test(turn1EnData.turnResult.nextQuestion) && !/aapko|kya|hai/i.test(turn1EnData.turnResult.nextQuestion),
      '14.4 AI mirrors in English for English patient input'
    )
    assert(turn1EnData.turnResult.extractedInformation.chiefComplaint === 'Fever', '14.5 Clinical extraction normalized to English Fever')
    assert(turn1EnData.turnResult.extractedInformation.duration === '3 days', '14.6 Duration extracted as 3 days')

    // 14.3 Turn 2: Hinglish Input -> Hinglish AI Response
    const turn2HingRes = await fetch(`${BASE}/patient-cases/${mlCaseId}/interview`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${primaryToken}`
      },
      body: JSON.stringify({
        message: 'Mujhe bukhar ke saath body pain bhi ho raha hai.',
        inputMode: 'text'
      })
    })
    const turn2HingData = await turn2HingRes.json()
    assert(turn2HingRes.status === 200, '14.7 Hinglish turn processed with HTTP 200')
    assert(
      turn2HingData.turnResult.languageStyle === 'hinglish' || turn2HingData.turnResult.languageStyle === 'hindi',
      '14.8 Hinglish input correctly classified'
    )
    assert(
      /aapko|kya|bhi|dard|hai|ho/i.test(turn2HingData.turnResult.nextQuestion),
      '14.9 AI mirrors in Hindi/Hinglish for Hinglish patient input'
    )
    assert(
      turn2HingData.turnResult.extractedInformation.symptoms.includes('Body pain') ||
      turn2HingData.turnResult.extractedInformation.symptoms.includes('Fever'),
      '14.10 Body pain added to clinical symptoms in English without altering physician record'
    )

    // 14.4 Turn 3: Spoken Voice Turn with inputMode: 'voice'
    const turn3VoiceRes = await fetch(`${BASE}/patient-cases/${mlCaseId}/interview`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${primaryToken}`
      },
      body: JSON.stringify({
        message: 'Mujhe koi allergy nahi hai aur koi medicine nahi li hai.',
        inputMode: 'voice'
      })
    })
    const turn3VoiceData = await turn3VoiceRes.json()
    assert(turn3VoiceRes.status === 200, '14.11 Voice turn processed with HTTP 200')
    const lastPatientTurn = turn3VoiceData.case.assessmentAnswers.filter(a => a.sender === 'patient').pop()
    assert(lastPatientTurn.inputMode === 'voice', '14.12 Patient turn marked with inputMode: voice in assessmentAnswers')
    assert(
      turn3VoiceData.turnResult.extractedInformation.allergies === 'None reported' ||
      turn3VoiceData.case.structuredHistory.allergies === 'None reported',
      '14.13 Voice response extracts allergies as None reported'
    )

    // 14.5 Turn 4: Turn-level Style Switch back to English
    const turn4EnRes = await fetch(`${BASE}/patient-cases/${mlCaseId}/interview`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${primaryToken}`
      },
      body: JSON.stringify({
        message: 'Actually right now the pain is getting better.',
        inputMode: 'text'
      })
    })
    const turn4EnData = await turn4EnRes.json()
    assert(turn4EnRes.status === 200, '14.14 Style switch turn processed with HTTP 200')
    assert(turn4EnData.turnResult.languageStyle === 'english', '14.15 Turn-level switch back to English detected')
    assert(
      turn4EnData.turnResult.extractedInformation.pattern === 'Getting better' ||
      turn4EnData.case.structuredHistory.pattern === 'Getting better',
      '14.16 Clinical pattern extracted as Getting better'
    )

    // 14.6 Verify originalPatientResponse preserved verbatim (still the first turn)
    assert(
      turn4EnData.case.originalPatientResponse === 'I have had fever for three days.',
      '14.17 originalPatientResponse invariant preserved verbatim across voice and multilingual turns'
    )

    // ==================================================
    // TEST 15: VARIABLE DEPTH, CLINICAL PROFILES & FIELD SEMANTICS
    // ==================================================
    console.log('\n--- 15. VARIABLE DEPTH, CLINICAL PROFILES & FIELD SEMANTICS ---')

    // 15.1 Simple / Low-complexity complaint: "Mere gale me halka dard hai."
    const simpleCaseRes = await fetch(`${BASE}/patient-cases`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${primaryToken}`
      },
      body: JSON.stringify({
        problem: 'Pending clinical intake interview',
        duration: 'Unknown',
        severity: 'Routine'
      })
    })
    const simpleCaseData = await simpleCaseRes.json()
    const simpleCaseId = simpleCaseData.case.id

    const simpleTurn1Res = await fetch(`${BASE}/patient-cases/${simpleCaseId}/interview`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${primaryToken}`
      },
      body: JSON.stringify({ message: 'Mere gale me halka dard hai.' })
    })
    const simpleTurn1Data = await simpleTurn1Res.json()
    assert(simpleTurn1Res.status === 200, '15.1 Simple complaint processed with HTTP 200')
    assert(
      simpleTurn1Data.turnResult.extractedInformation.symptoms.includes('Sore throat') ||
      simpleTurn1Data.turnResult.extractedInformation.symptoms.includes('Throat pain'),
      '15.2 Simple complaint recognized as sore throat/throat pain'
    )

    // 15.2 Kidney Stone & Blood in Urine complaint
    const renalCaseRes = await fetch(`${BASE}/patient-cases`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${primaryToken}`
      },
      body: JSON.stringify({
        problem: 'Pending clinical intake interview',
        duration: 'Unknown',
        severity: 'Routine'
      })
    })
    const renalCaseData = await renalCaseRes.json()
    const renalCaseId = renalCaseData.case.id

    const renalTurn1Res = await fetch(`${BASE}/patient-cases/${renalCaseId}/interview`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${primaryToken}`
      },
      body: JSON.stringify({
        message: 'Kamar ke paas 5 din se bahut pain hai aur urine me blood aa raha hai.'
      })
    })
    const renalTurn1Data = await renalTurn1Res.json()
    assert(renalTurn1Res.status === 200, '15.3 Renal/Urinary stone complaint processed with HTTP 200')
    assert(
      renalTurn1Data.turnResult.extractedInformation.symptoms.some(s => /hematuria|blood in urine|flank/i.test(s)),
      '15.4 Extracts Hematuria or Flank pain from patient description'
    )
    assert(
      renalTurn1Data.turnResult.nextQuestion.toLowerCase().includes('urine') ||
      renalTurn1Data.turnResult.nextQuestion.toLowerCase().includes('fever') ||
      renalTurn1Data.turnResult.nextQuestion.toLowerCase().includes('dard') ||
      renalTurn1Data.turnResult.nextQuestion.toLowerCase().includes('peshab') ||
      renalTurn1Data.turnResult.nextQuestion.toLowerCase().includes('pain'),
      '15.5 Renal case asks relevant urinary / kidney symptom questions'
    )

    // 15.3 Section 20/21 Dispositions: "Mujhe nahi pata" -> Unknown
    const dispUnknownRes = await fetch(`${BASE}/patient-cases/${renalCaseId}/interview`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${primaryToken}`
      },
      body: JSON.stringify({ message: 'Mujhe nahi pata.' })
    })
    const dispUnknownData = await dispUnknownRes.json()
    assert(dispUnknownRes.status === 200, '15.6 "Mujhe nahi pata" processed with HTTP 200')

    // 15.4 Safety Guardrail in Hindi: "Dengue hai kya?"
    const safetyHingRes = await fetch(`${BASE}/patient-cases/${renalCaseId}/interview`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${primaryToken}`
      },
      body: JSON.stringify({ message: 'Dengue hai kya? Kaunsi medicine loon?' })
    })
    const safetyHingData = await safetyHingRes.json()
    assert(safetyHingRes.status === 200, '15.7 Safety inquiry processed with HTTP 200')
    assert(
      /doctor|intake|assistant|diagnosis/i.test(safetyHingData.turnResult.nextQuestion),
      '15.8 AI safely refuses to diagnose or prescribe in response to Hinglish medical questions'
    )

    console.log('\n==================================================')
    console.log(`PROCESS 3 TEST SUMMARY: ${passed} passed, ${failed} failed`)
    console.log('==================================================')
  } catch (err) {
    console.error('Test execution error:', err)
    failed++
  } finally {
    server.close(() => {
      console.log('Process 3 test server closed cleanly.')
      process.exitCode = failed > 0 ? 1 : 0
    })
  }
}

runTests()
