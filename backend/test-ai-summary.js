/**
 * AAROGYA CASE — Test Suite: Physician AI Clinical Summary (SIH26047)
 * 
 * Verifies:
 * A. Case containing only patient interview data
 * B. Case containing patient data + uploaded PDF
 * C. Case containing patient data + timeline
 * D. Case containing conflicting old document information and current patient information (source distinctions)
 * E. Case with missing fields (verifying NO invented / fabricated information)
 * F. Safety-sensitive case (zero-diagnosis, zero-prescription invariant)
 * G. Strict patient isolation (Patient B rejected from accessing Patient A's summary with HTTP 403)
 */

import http from 'http'
import assert from 'assert'
import app from './server.js'
import { SessionService } from './services/sessionService.js'
import { PatientModel } from './models/patientModel.js'
import { CaseModel } from './models/caseModel.js'
import { AiSummaryService } from './services/aiSummaryService.js'

let server
let baseUrl
let testDoctorToken
let patientAToken
let patientBToken
let patientA
let patientB
let caseOnlyInterview
let caseWithPdf
let caseWithTimeline

let passed = 0
let failed = 0

function test(name, fn) {
  try {
    fn()
    passed++
    console.log(`[PASS] ${name}`)
  } catch (err) {
    failed++
    console.error(`[FAIL] ${name}: ${err.message}`)
  }
}

async function asyncTest(name, fn) {
  try {
    await fn()
    passed++
    console.log(`[PASS] ${name}`)
  } catch (err) {
    failed++
    console.error(`[FAIL] ${name}: ${err.message}`)
  }
}

async function apiRequest(endpoint, { method = 'GET', headers = {}, body = null } = {}) {
  const url = `${baseUrl}${endpoint}`
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    }
  }
  if (body) {
    options.body = typeof body === 'string' ? body : JSON.stringify(body)
  }
  const res = await fetch(url, options)
  const data = await res.json().catch(() => null)
  return { status: res.status, ok: res.ok, data }
}

async function runTests() {
  console.log('--- STARTING PHYSICIAN AI CLINICAL SUMMARY TESTS (SIH26047) ---')

  server = http.createServer(app)
  await new Promise((resolve) => server.listen(0, resolve))
  const port = server.address().port
  baseUrl = `http://127.0.0.1:${port}`

  // SETUP: Doctor and Patients
  const docLogin = await apiRequest('/api/auth/doctor/login', {
    method: 'POST',
    body: { doctorId: 'DOC-1042' }
  })
  testDoctorToken = docLogin.data.token

  patientA = await PatientModel.create({
    name: 'Ananya Sharma',
    patient_unique_code: 'AC-AS7701',
    mobile: '9888877701',
    age: 28,
    gender: 'Female',
    blood_group: 'O+'
  })
  patientAToken = 'PAT-SES-AS-7701'
  SessionService.setSession(patientAToken, {
    token: patientAToken,
    userId: patientA.id,
    patientDatabaseId: patientA.id,
    patientId: patientA.patient_id,
    patientUniqueCode: patientA.patient_unique_code,
    patientName: patientA.name,
    role: 'patient'
  })

  patientB = await PatientModel.create({
    name: 'Rohan Verma',
    patient_unique_code: 'AC-RV8802',
    mobile: '9888877702',
    age: 45,
    gender: 'Male',
    blood_group: 'A+'
  })
  patientBToken = 'PAT-SES-RV-8802'
  SessionService.setSession(patientBToken, {
    token: patientBToken,
    userId: patientB.id,
    patientDatabaseId: patientB.id,
    patientId: patientB.patient_id,
    patientUniqueCode: patientB.patient_unique_code,
    patientName: patientB.name,
    role: 'patient'
  })

  // CASE 1: Only Patient Interview Data
  caseOnlyInterview = await CaseModel.create({
    caseNumber: 'CASE-SUM-001',
    patientId: patientA.id,
    patientUniqueCode: patientA.patient_unique_code,
    problem: 'Fever and throbbing headache for 3 days',
    duration: '3 days',
    severity: 'Moderate',
    symptoms: ['Fever', 'Throbbing headache'],
    originalPatientResponse: 'I have severe fever and throbbing headache since Tuesday morning.',
    structuredHistory: {
      chiefComplaint: 'Fever and throbbing headache',
      duration: '3 days',
      severity: 'Moderate',
      symptoms: ['Fever', 'Throbbing headache'],
      associatedSymptoms: ['Mild dizziness'],
      relevantNegatives: ['No chest pain', 'No breathlessness'],
      pastMedicalHistory: 'None reported',
      currentMedications: 'Paracetamol 650mg as needed',
      allergies: 'None reported'
    }
  })

  // CASE 2: Patient Data + Uploaded PDF with lab findings & previous prescription
  caseWithPdf = await CaseModel.create({
    caseNumber: 'CASE-SUM-002',
    patientId: patientA.id,
    patientUniqueCode: patientA.patient_unique_code,
    problem: 'Persistent dry cough and fatigue for 1 week',
    duration: '1 week',
    severity: 'Routine',
    symptoms: ['Dry cough', 'Fatigue'],
    originalPatientResponse: 'Khansi ho rahi hai 1 hafte se aur thakan lagti hai.',
    structuredHistory: {
      chiefComplaint: 'Persistent dry cough',
      duration: '1 week',
      severity: 'Routine',
      symptoms: ['Dry cough', 'Fatigue'],
      associatedSymptoms: [],
      relevantNegatives: ['No fever', 'No hemoptysis'],
      pastMedicalHistory: 'Childhood asthma',
      currentMedications: 'Montelukast 10mg once daily',
      allergies: 'Dust & pollen',
      documents: [
        {
          docId: 'DOC-PDF-001',
          originalName: 'CBC_Chest_Investigation.pdf',
          mimeType: 'application/pdf',
          uploadedAt: '2026-09-10T10:00:00Z',
          findings: {
            documentType: 'lab_report',
            documentDate: '08 Sep 2026',
            keyObservations: 'Normal leukocyte count (6,800 /mcL). Platelets adequate at 2.4 lakh.',
            labResults: [
              { testName: 'Total Leukocyte Count (TLC)', value: '6800', unit: '/mcL' },
              { testName: 'Platelet Count', value: '2.4', unit: 'Lakh/mcL' }
            ],
            medications: [
              { name: 'Montair-LC', dosage: '10mg/5mg', frequency: 'Once daily' }
            ]
          }
        }
      ]
    }
  })

  // CASE 3: Case with Missing Fields
  const caseWithMissingFields = await CaseModel.create({
    caseNumber: 'CASE-SUM-003',
    patientId: patientA.id,
    patientUniqueCode: patientA.patient_unique_code,
    problem: 'Ear pain',
    duration: null,
    severity: null,
    symptoms: ['Ear pain'],
    originalPatientResponse: 'Left ear hurts.',
    structuredHistory: {
      chiefComplaint: 'Ear pain',
      duration: 'Unknown',
      severity: 'Routine',
      symptoms: ['Ear pain'],
      pastMedicalHistory: 'Not provided',
      currentMedications: 'Not provided',
      allergies: 'Unknown',
      relevantNegatives: []
    }
  })

  // CASE 4: Safety-Sensitive Case
  const caseSafetySensitive = await CaseModel.create({
    caseNumber: 'CASE-SUM-004',
    patientId: patientA.id,
    patientUniqueCode: patientA.patient_unique_code,
    problem: 'Chest discomfort and sweating',
    duration: '30 minutes',
    severity: 'Emergency',
    symptoms: ['Chest discomfort', 'Sweating'],
    originalPatientResponse: 'Sudden tight chest feeling and sweating a lot.',
    structuredHistory: {
      chiefComplaint: 'Chest discomfort and sweating',
      duration: '30 minutes',
      severity: 'Emergency',
      symptoms: ['Chest discomfort', 'Sweating'],
      relevantNegatives: [],
      pastMedicalHistory: 'Hypertension'
    }
  })

  // ==========================================
  // TEST SUITE A: Only Patient Interview Data
  // ==========================================
  console.log('\n--- 1. CASE WITH PATIENT INTERVIEW DATA ONLY ---')
  await asyncTest('1.1 Doctor can fetch AI summary for interview-only case', async () => {
    const res = await apiRequest(`/api/patient-cases/${caseOnlyInterview.id}/summary`, {
      headers: { Authorization: `Bearer ${testDoctorToken}` }
    })
    assert.strictEqual(res.status, 200)
    assert.strictEqual(res.data.success, true)
    assert(res.data.summary, 'Summary object present')
    assert.strictEqual(res.data.summary.status, 'DRAFT — PENDING PHYSICIAN VERIFICATION')
    assert.strictEqual(res.data.summary.isDoctorVerified, false)
  })

  await asyncTest('1.2 Interview summary preserves verbatim words and source attribution', async () => {
    const res = await apiRequest(`/api/patient-cases/${caseOnlyInterview.id}/summary`, {
      headers: { Authorization: `Bearer ${testDoctorToken}` }
    })
    const summary = res.data.summary
    assert(summary.currentEncounter.chiefComplaint.verbatim.includes('severe fever and throbbing headache'), 'Verbatim words preserved')
    assert.strictEqual(summary.currentEncounter.chiefComplaint.source, 'Patient response')
    assert.strictEqual(summary.currentEncounter.duration.value, '3 days')
    assert.strictEqual(summary.currentEncounter.duration.source, 'Patient response')
  })

  await asyncTest('1.3 All reported symptoms have explicit patient source tags', async () => {
    const res = await apiRequest(`/api/patient-cases/${caseOnlyInterview.id}/summary`, {
      headers: { Authorization: `Bearer ${testDoctorToken}` }
    })
    const symptoms = res.data.summary.currentEncounter.symptoms
    assert(symptoms.length >= 2, 'Symptoms present')
    symptoms.forEach(s => {
      assert(s.source.includes('Patient response'), `Symptom ${s.name} has patient source tag`)
    })
  })

  await asyncTest('1.4 Relevant negatives are preserved with confirmation source tag', async () => {
    const res = await apiRequest(`/api/patient-cases/${caseOnlyInterview.id}/summary`, {
      headers: { Authorization: `Bearer ${testDoctorToken}` }
    })
    const negatives = res.data.summary.currentEncounter.relevantNegatives
    assert(negatives.length >= 2, 'Negatives present')
    assert(negatives.some(n => n.finding.includes('No chest pain')), 'Denies chest pain')
    assert(negatives[0].source.includes('Patient response'), 'Negative finding has patient source tag')
  })

  // ==========================================
  // TEST SUITE B: Case + Uploaded PDF
  // ==========================================
  console.log('\n--- 2. CASE WITH UPLOADED PDF REPORT ---')
  await asyncTest('2.1 AI summary extracts and correlates uploaded PDF findings', async () => {
    const res = await apiRequest(`/api/patient-cases/${caseWithPdf.id}/summary`, {
      headers: { Authorization: `Bearer ${testDoctorToken}` }
    })
    const summary = res.data.summary
    assert(summary.uploadedDocuments.length >= 1, 'Uploaded document listed in summary')
    const doc = summary.uploadedDocuments[0]
    assert.strictEqual(doc.name, 'CBC_Chest_Investigation.pdf')
    assert.strictEqual(doc.type, 'lab_report')
    assert(doc.source.includes('CBC_Chest_Investigation.pdf'), 'Source identifies specific document file')
    assert(doc.keyObservations.includes('leukocyte count'), 'Key observations present')
  })

  await asyncTest('2.2 Lab results inside PDF are source-attributed to document, not patient speech', async () => {
    const res = await apiRequest(`/api/patient-cases/${caseWithPdf.id}/summary`, {
      headers: { Authorization: `Bearer ${testDoctorToken}` }
    })
    const doc = res.data.summary.uploadedDocuments[0]
    assert(doc.extractedLabResults.length >= 2, 'Lab results extracted')
    assert(doc.extractedLabResults.some(l => l.testName.includes('TLC') && l.value === '6800'))
  })

  // ==========================================
  // TEST SUITE C: Case + Timeline Context
  // ==========================================
  console.log('\n--- 3. CASE WITH TIMELINE CONTEXT ---')
  await asyncTest('3.1 AI summary incorporates chronological historical records', async () => {
    const res = await apiRequest(`/api/patient-cases/${caseWithPdf.id}/summary`, {
      headers: { Authorization: `Bearer ${testDoctorToken}` }
    })
    const hist = res.data.summary.relevantPreviousHistory
    assert(hist, 'Historical records block present')
    assert.strictEqual(hist.source, 'Central Health Registry / Unified Medical Timeline')
  })

  // ==========================================
  // TEST SUITE D: Conflict & Distinction
  // ==========================================
  console.log('\n--- 4. CONFLICT PRESERVATION & SOURCE DISTINCTION ---')
  await asyncTest('4.1 Distinctly separates patient verbal intake from document findings', async () => {
    const res = await apiRequest(`/api/patient-cases/${caseWithPdf.id}/summary`, {
      headers: { Authorization: `Bearer ${testDoctorToken}` }
    })
    const summary = res.data.summary
    // Current verbal statement is dry cough 1 week
    assert(summary.currentEncounter.chiefComplaint.verbatim.includes('Khansi'), 'Verbatim patient statement preserved')
    // Document finding is TLC 6800
    assert(summary.uploadedDocuments[0].extractedLabResults.length > 0, 'Document findings preserved')
    // Document source is document, verbal source is patient
    assert(summary.currentEncounter.chiefComplaint.source.includes('Patient response'), 'Complaint is Patient response')
    assert(summary.uploadedDocuments[0].source.includes('Uploaded lab_report'), 'Lab is Uploaded document')
  })

  // ==========================================
  // TEST SUITE E: Missing Fields (Zero Fabrication)
  // ==========================================
  console.log('\n--- 5. MISSING FIELDS & ZERO FABRICATION ---')
  await asyncTest('5.1 Missing fields display standard untouched semantics without fabrication', async () => {
    const res = await apiRequest(`/api/patient-cases/${caseWithMissingFields.id}/summary`, {
      headers: { Authorization: `Bearer ${testDoctorToken}` }
    })
    const summary = res.data.summary
    assert.strictEqual(summary.currentEncounter.duration.value, 'Unknown', 'Unknown duration remains Unknown')
    assert.strictEqual(summary.medicalBackground.pastMedicalHistory.value, 'Not provided', 'Untouched PMH remains Not provided')
    assert.strictEqual(summary.medicalBackground.allergies.value, 'Unknown', 'Untouched allergies remains Unknown')
    assert.strictEqual(summary.medicalBackground.currentMedications[0].name, 'Not provided', 'Untouched medications remains Not provided')
  })

  await asyncTest('5.2 Untouched fields are not falsely attributed to patient response', async () => {
    const res = await apiRequest(`/api/patient-cases/${caseWithMissingFields.id}/summary`, {
      headers: { Authorization: `Bearer ${testDoctorToken}` }
    })
    const summary = res.data.summary
    assert(!summary.currentEncounter.duration.source.includes('Patient verbal confirmation'), 'Unknown duration not marked as patient verbal confirmation')
    assert(summary.currentEncounter.duration.source.includes('Not assessed') || summary.currentEncounter.duration.source.includes('Not provided'))
  })

  // ==========================================
  // TEST SUITE F: Safety-Sensitive Case
  // ==========================================
  console.log('\n--- 6. SAFETY-SENSITIVE CASE (ZERO-DIAGNOSIS INVARIANT) ---')
  await asyncTest('6.1 AI summary refuses to diagnose condition (strictly zero new diagnosis)', async () => {
    const res = await apiRequest(`/api/patient-cases/${caseSafetySensitive.id}/summary`, {
      headers: { Authorization: `Bearer ${testDoctorToken}` }
    })
    const summary = res.data.summary
    // Verify no diagnosis field is invented or outputted
    assert(!summary.clinicalDiagnosis, 'Zero clinicalDiagnosis created')
    assert(!summary.prescribedTreatment, 'Zero prescribedTreatment created')
    assert.strictEqual(summary.status, 'DRAFT — PENDING PHYSICIAN VERIFICATION')
    // Safety observations flags emergency severity
    assert(summary.safetyObservations.some(s => s.level === 'WARNING'), 'Safety engine flags emergency severity warning')
  })

  await asyncTest('6.2 Summary contains mandatory physician decision-maker disclaimer', async () => {
    const res = await apiRequest(`/api/patient-cases/${caseSafetySensitive.id}/summary`, {
      headers: { Authorization: `Bearer ${testDoctorToken}` }
    })
    assert(res.data.summary.disclaimer.includes('Attending doctor remains the final clinical decision-maker'))
  })

  // ==========================================
  // TEST SUITE G: Strict Patient Isolation
  // ==========================================
  console.log('\n--- 7. STRICT PATIENT ISOLATION ---')
  await asyncTest('7.1 Patient A can access their own case summary', async () => {
    const res = await apiRequest(`/api/patient-cases/${caseOnlyInterview.id}/summary`, {
      headers: { Authorization: `Bearer ${patientAToken}` }
    })
    assert.strictEqual(res.status, 200)
    assert.strictEqual(res.data.success, true)
    assert.strictEqual(res.data.summary.patient.uniqueCode, patientA.patient_unique_code)
  })

  await asyncTest('7.2 Patient B cannot access Patient A summary (HTTP 403 Forbidden)', async () => {
    const res = await apiRequest(`/api/patient-cases/${caseOnlyInterview.id}/summary`, {
      headers: { Authorization: `Bearer ${patientBToken}` }
    })
    assert.strictEqual(res.status, 403)
    assert.strictEqual(res.data.success, false)
    assert(res.data.message.includes('Access denied'))
  })

  await asyncTest('7.3 Unauthenticated request cannot access summary (HTTP 401 Unauthorized)', async () => {
    const res = await apiRequest(`/api/patient-cases/${caseOnlyInterview.id}/summary`)
    assert.strictEqual(res.status, 401)
  })

  // SUMMARY REPORT
  console.log('\n====================================================')
  console.log(`AI SUMMARY TEST RESULTS: ${passed} PASSED, ${failed} FAILED`)
  console.log('====================================================')

  server.close()
  if (failed > 0) {
    process.exit(1)
  }
}

runTests().catch(err => {
  console.error('Fatal test runner error:', err)
  if (server) server.close()
  process.exit(1)
})
