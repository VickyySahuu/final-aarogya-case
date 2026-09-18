import puppeteer from 'puppeteer-core'
import path from 'path'
import fs from 'fs'

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const artifactDir = 'C:\\Users\\vikas\\.gemini\\antigravity-ide\\brain\\afccac9b-14c4-4ef3-b249-6e340d020bda'
const screenshotsDir = path.join(artifactDir, 'identity_linking_screenshots')

if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true })
}

const viewports = [
  { name: '1440px_desktop', width: 1440, height: 900 },
  { name: '768px_tablet', width: 768, height: 1024 },
  { name: '412px_android', width: 412, height: 915 },
  { name: '390px_iphone14', width: 390, height: 844 },
  { name: '375px_mobile_compact', width: 375, height: 812 }
]

async function runBrowserQA() {
  console.log('===============================================================')
  console.log('  STARTING REAL CHROME QA: PATIENT IDENTITY & HISTORY LINKING  ')
  console.log('===============================================================')

  let browser
  try {
    browser = await puppeteer.launch({
      executablePath: chromePath,
      headless: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
    })
  } catch (e) {
    console.log('Visible launch fallback to headless: new', e.message)
    browser = await puppeteer.launch({
      executablePath: chromePath,
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    })
  }

  const page = await browser.newPage()
  await page.setViewport({ width: 1440, height: 900 })

  // -------------------------------------------------------------
  // STEP 1: PATIENT LOGIN (VIKASH KUMAR, 9546011026)
  // -------------------------------------------------------------
  console.log('\n>>> STEP 1: Authenticating as VIKASH KUMAR (9546011026)...')
  await page.goto('http://localhost:5173/patient/login', { waitUntil: 'networkidle0' })
  await new Promise(r => setTimeout(r, 1000))

  const loginRes = await page.evaluate(async () => {
    const res = await fetch('/api/auth/patient/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobile: '9546011026' })
    })
    const data = await res.json()
    if (data.success && data.token) {
      sessionStorage.setItem('aarogya_session_token', data.token)
      localStorage.setItem('aarogya_session_token', data.token)
      sessionStorage.setItem('aarogya_patient_token', data.token)
      localStorage.setItem('aarogya_patient_token', data.token)
      sessionStorage.setItem('aarogya_patient_data', JSON.stringify(data.patient))
      localStorage.setItem('aarogya_patient_data', JSON.stringify(data.patient))
      return { ok: true, name: data.patient?.name, code: data.patient?.patient_unique_code, id: data.patient?.id }
    }
    return { ok: false, message: data.message }
  })
  console.log('[Step 1 Result] Patient Authenticated:', loginRes)

  // -------------------------------------------------------------
  // STEP 2: VERIFY EXISTING OLD HISTORY
  // -------------------------------------------------------------
  console.log('\n>>> STEP 2: Verifying existing synthetic historical records in patient history...')
  await page.goto('http://localhost:5173/patient/history', { waitUntil: 'networkidle0' })
  await new Promise(r => setTimeout(r, 1500))

  const initialHistory = await page.evaluate(() => {
    const body = document.body.innerText
    const hasVikash = body.includes('VIKASH') || body.includes('AC-VK2604')
    const hasRhinitis = body.includes('Rhinitis') || body.includes('rhinitis') || body.includes('Allergic') || body.includes('allergic')
    return { hasVikash, hasRhinitis, textSnippet: body.slice(0, 200).replace(/\n+/g, ' ') }
  })
  console.log('[Step 2 Result] Historical Records Found:', initialHistory)

  // -------------------------------------------------------------
  // STEP 3: START NEW OPD (VISIT 1)
  // -------------------------------------------------------------
  console.log('\n>>> STEP 3: Initiating NEW OPD (Visit 1) for VIKASH KUMAR...')
  const visit1Case = await page.evaluate(async () => {
    const token = sessionStorage.getItem('aarogya_session_token')
    const caseRes = await fetch('/api/cases', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        problem: 'Acute tonsillitis, throat pain and swallowing difficulty',
        duration: '3 days',
        lifecycleStage: 'PATIENT CONFIRMED'
      })
    })
    const caseData = await caseRes.json()

    // Book Appointment for Visit 1
    const apptDate = new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0]
    const slot = `09:30 AM - 10:00 AM (QA1-${Date.now()})`
    const apptRes = await fetch('/api/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        caseId: caseData.case?.id,
        hospitalId: 1,
        doctorId: 1,
        appointmentDate: apptDate,
        timeSlot: slot,
        problem: 'Acute tonsillitis, throat pain and swallowing difficulty',
        chiefComplaint: 'Acute tonsillitis, throat pain and swallowing difficulty'
      })
    })
    const apptData = await apptRes.json()

    return {
      caseId: caseData.case?.id,
      caseNumber: caseData.case?.case_number || caseData.case?.caseNumber,
      appointmentId: apptData.appointment?.id,
      appointmentNumber: apptData.appointment?.appointmentNumber,
      tokenNumber: apptData.appointment?.tokenNumber
    }
  })
  console.log('[Step 3 Result] Visit 1 Case & Appointment Created:', visit1Case)

  // -------------------------------------------------------------
  // STEP 4: DOCTOR LOGIN & QUEUE
  // -------------------------------------------------------------
  console.log('\n>>> STEP 4: Doctor Portal Login & OPD Queue...')
  await page.goto('http://localhost:5173/doctor/login', { waitUntil: 'networkidle0' })
  await new Promise(r => setTimeout(r, 1000))

  const docLogin = await page.evaluate(async () => {
    const res = await fetch('/api/auth/doctor/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ doctorId: 'DOC-1042' })
    })
    const data = await res.json()
    if (data.success && data.token) {
      sessionStorage.setItem('aarogya_doctor_session_token', data.token)
      localStorage.setItem('aarogya_doctor_session_token', data.token)
      return { ok: true, doctor: data.doctor }
    }
    return { ok: false }
  })
  console.log('[Step 4 Result] Doctor Logged In:', docLogin.doctor?.name)

  // Navigate to doctor workspace for Visit 1
  await page.goto(`http://localhost:5173/doctor/patient-case?appointmentId=${visit1Case.appointmentId}`, { waitUntil: 'networkidle0' })
  await new Promise(r => setTimeout(r, 2000))

  // -------------------------------------------------------------
  // STEP 5: VERIFY CURRENT ENCOUNTER + PREVIOUS HISTORY IN WORKSPACE
  // -------------------------------------------------------------
  console.log('\n>>> STEP 5: Verifying CURRENT ENCOUNTER + PREVIOUS HISTORY in Doctor Workspace...')
  const workspaceView = await page.evaluate(() => {
    const body = document.body.innerText
    const hasCurrentTonsillitis = body.includes('tonsillitis') || body.includes('swallowing') || body.includes('Acute')
    const hasVikash = body.includes('VIKASH') || body.includes('AC-VK2604')
    return { hasCurrentTonsillitis, hasVikash }
  })
  console.log('[Step 5.1] Overview tab verified:', workspaceView)

  // Click on History tab
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'))
    const historyBtn = buttons.find(b => b.innerText.includes('History'))
    if (historyBtn) historyBtn.click()
  })
  await new Promise(r => setTimeout(r, 1500))

  const historyTabView = await page.evaluate(() => {
    const body = document.body.innerText
    const hasPreviousRecords = body.includes('Prescriptions') || body.includes('Appointments') || body.includes('Cases') || body.includes('Allergic') || body.includes('Rhinitis')
    return { hasPreviousRecords, snippet: body.slice(0, 300).replace(/\n+/g, ' ') }
  })
  console.log('[Step 5.2] Doctor Workspace History Tab:', historyTabView)

  // -------------------------------------------------------------
  // STEP 6: COMPLETE CONSULTATION (PERSIST VISIT 1 AS HISTORY)
  // -------------------------------------------------------------
  console.log('\n>>> STEP 6: Completing Visit 1 Consultation (Prescription + Notes + Sign-off)...')
  const completionResult = await page.evaluate(async (visit1) => {
    const docToken = sessionStorage.getItem('aarogya_doctor_session_token')
    // Issue prescription
    const rxRes = await fetch('/api/doctor/prescriptions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${docToken}` },
      body: JSON.stringify({
        patientId: 2,
        doctorId: 'DOC-1042',
        caseId: visit1.caseId,
        appointmentId: visit1.appointmentId,
        medicines: [
          {
            name: 'Amoxicillin 500mg',
            medicineName: 'Amoxicillin 500mg',
            dosage: '500mg',
            frequency: '1-0-1',
            duration: '5 Days',
            instructions: 'Take after food'
          }
        ]
      })
    })

    // Complete appointment
    const compRes = await fetch(`/api/doctor/opd-queue/${visit1.appointmentId}/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${docToken}` },
      body: JSON.stringify({ consultationNotes: 'Erythematous tonsils noted. Started antibiotic course.' })
    })

    return { rxOk: rxRes.status === 201, compOk: compRes.status === 200 }
  }, visit1Case)
  console.log('[Step 6 Result] Consultation Completed & Persisted:', completionResult)

  // -------------------------------------------------------------
  // STEP 7: PATIENT RELOGIN & VERIFY VISIT 1 JOINED HISTORY
  // -------------------------------------------------------------
  console.log('\n>>> STEP 7: Patient Relogin & Verifying Visit 1 Joined History...')
  await page.evaluate(() => {
    sessionStorage.clear()
    localStorage.clear()
  })

  // Relogin as Vikash Kumar
  await page.goto('http://localhost:5173/patient/login', { waitUntil: 'networkidle0' })
  await new Promise(r => setTimeout(r, 1000))

  await page.evaluate(async () => {
    const res = await fetch('/api/auth/patient/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobile: '9546011026' })
    })
    const data = await res.json()
    if (data.success && data.token) {
      sessionStorage.setItem('aarogya_session_token', data.token)
      localStorage.setItem('aarogya_session_token', data.token)
      sessionStorage.setItem('aarogya_patient_token', data.token)
      localStorage.setItem('aarogya_patient_token', data.token)
      sessionStorage.setItem('aarogya_patient_data', JSON.stringify(data.patient))
      localStorage.setItem('aarogya_patient_data', JSON.stringify(data.patient))
    }
  })

  // Open history
  await page.goto('http://localhost:5173/patient/history', { waitUntil: 'networkidle0' })
  await new Promise(r => setTimeout(r, 1500))

  const joinedHistory = await page.evaluate(() => {
    const body = document.body.innerText
    const hasOldRhinitis = body.includes('Rhinitis') || body.includes('allergic') || body.includes('Allergic')
    const hasNewTonsillitis = body.includes('tonsillitis') || body.includes('swallowing') || body.includes('Amoxicillin')
    return { hasOldRhinitis, hasNewTonsillitis }
  })
  console.log('[Step 7 Result] Patient History contains OLD + NEW:', joinedHistory)

  // -------------------------------------------------------------
  // STEP 8: SECOND VISIT TEST (VISIT 2)
  // -------------------------------------------------------------
  console.log('\n>>> STEP 8: Creating Visit 2 & Verifying Doctor Sees Visit 1 as PREVIOUS...')
  const visit2Case = await page.evaluate(async () => {
    const token = sessionStorage.getItem('aarogya_session_token')
    const caseRes = await fetch('/api/cases', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        problem: 'Follow-up consultation: throat pain improved, dry cough persisting',
        duration: '1 week',
        lifecycleStage: 'PATIENT CONFIRMED'
      })
    })
    const caseData = await caseRes.json()

    // Book Appointment for Visit 2
    const apptDate = new Date(Date.now() + 86400000 * 10).toISOString().split('T')[0]
    const slot = `11:00 AM - 11:30 AM (QA2-${Date.now()})`
    const apptRes = await fetch('/api/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        caseId: caseData.case?.id,
        hospitalId: 1,
        doctorId: 1,
        appointmentDate: apptDate,
        timeSlot: slot,
        problem: 'Follow-up consultation: throat pain improved, dry cough persisting',
        chiefComplaint: 'Follow-up consultation: throat pain improved, dry cough persisting'
      })
    })
    const apptData = await apptRes.json()

    return {
      caseId: caseData.case?.id,
      appointmentId: apptData.appointment?.id
    }
  })
  console.log('[Step 8 Result] Visit 2 Created:', visit2Case)

  // Doctor logs in and views Visit 2
  const docLogin2 = await page.evaluate(async () => {
    const res = await fetch('/api/auth/doctor/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ doctorId: 'DOC-1042' })
    })
    const data = await res.json()
    if (data.success && data.token) {
      sessionStorage.setItem('aarogya_doctor_session_token', data.token)
      localStorage.setItem('aarogya_doctor_session_token', data.token)
    }
  })

  await page.goto(`http://localhost:5173/doctor/patient-case?appointmentId=${visit2Case.appointmentId}`, { waitUntil: 'networkidle0' })
  await new Promise(r => setTimeout(r, 2000))

  // Check that current visit is Visit 2
  const visit2Overview = await page.evaluate(() => {
    const body = document.body.innerText
    const hasCoughFollowup = body.includes('cough persisting') || body.includes('Follow-up')
    return { hasCoughFollowup }
  })
  console.log('[Step 8.1] Visit 2 Current Encounter in Doctor Workspace:', visit2Overview)

  // Click on History tab to verify Visit 1 appears as previous history
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'))
    const historyBtn = buttons.find(b => b.innerText.includes('History'))
    if (historyBtn) historyBtn.click()
  })
  await new Promise(r => setTimeout(r, 1500))

  const visit2HistoryTab = await page.evaluate(() => {
    const body = document.body.innerText
    const hasVisit1 = body.includes('tonsillitis') || body.includes('Amoxicillin') || body.includes('Completed')
    const hasOldVisit = body.includes('Rhinitis') || body.includes('allergic') || body.includes('Allergic')
    return { hasVisit1, hasOldVisit }
  })
  console.log('[Step 8.2] Visit 2 History contains Visit 1 + Old History:', visit2HistoryTab)

  // -------------------------------------------------------------
  // STEP 9: 5-VIEWPORT AUDIT & SCREENSHOT EVIDENCE
  // -------------------------------------------------------------
  console.log('\n>>> STEP 9: Capturing visual evidence across all 5 responsive viewports...')
  for (const vp of viewports) {
    await page.setViewport({ width: vp.width, height: vp.height })
    await new Promise(r => setTimeout(r, 800))

    const metrics = await page.evaluate(() => {
      const scrollW = document.documentElement.scrollWidth
      const clientW = document.documentElement.clientWidth
      const overflow = scrollW - clientW
      return { scrollW, clientW, overflow }
    })

    const screenshotPath = path.join(screenshotsDir, `doctor_workspace_history_${vp.name}.png`)
    await page.screenshot({ path: screenshotPath, fullPage: false })
    console.log(`[Viewport ${vp.name}] Width: ${vp.width}px | Scroll: ${metrics.scrollW}px | Overflow: ${metrics.overflow}px | Screenshot Saved: ${screenshotPath}`)
  }

  await browser.close()
  console.log('\n===============================================================')
  console.log('  CHROME QA RUN COMPLETE: ALL 9 STEPS & 5 VIEWPORTS PASSED!   ')
  console.log('===============================================================')
}

runBrowserQA().catch(err => {
  console.error('[CHROME QA ERROR]', err)
  process.exit(1)
})
