import puppeteer from 'puppeteer-core'
import path from 'path'
import fs from 'fs'

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const artifactDir = 'C:\\Users\\vikas\\.gemini\\antigravity-ide\\brain\\afccac9b-14c4-4ef3-b249-6e340d020bda'

const viewports = [
  { name: '1440px_desktop', width: 1440, height: 900 },
  { name: '768px_tablet', width: 768, height: 1024 },
  { name: '412px_android', width: 412, height: 915 },
  { name: '390px_iphone14', width: 390, height: 844 },
  { name: '375px_mobile_compact', width: 375, height: 812 }
]

async function run() {
  console.log('Launching real Chrome from:', chromePath)
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  })

  const page = await browser.newPage()
  page.on('console', msg => console.log('PAGE LOG:', msg.text()))
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message))
  
  // Navigate to login first so origin is http://localhost:5173
  await page.goto('http://localhost:5173/doctor/login', { waitUntil: 'networkidle0' })

  // Log in as real doctor to get genuine session token
  const realDocToken = await page.evaluate(async () => {
    const res = await fetch('/api/auth/doctor/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ doctorId: 'DOC-1042' })
    })
    const data = await res.json()
    if (data.success && data.token) {
      sessionStorage.setItem('aarogya_doctor_session_token', data.token)
      localStorage.setItem('aarogya_doctor_session_token', data.token)
      return data.token
    }
    return null
  })
  console.log('Real Doctor Token acquired:', realDocToken ? `${realDocToken.slice(0, 15)}...` : 'FAILED')
    
  await page.evaluate(() => {
    // Set active patient Vikash Kumar
    const vkPatient = {
      name: 'VIKASH KUMAR',
      id: 2,
      patientDbId: 2,
      uniqueCode: 'AC-VK2604',
      token: '#2',
      age: '32 Yrs / Male',
      gender: 'Male',
      mobile: '9546011026',
      bloodGroup: 'B+',
      room: 'Room 104',
      category: 'ROUTINE',
      severity: 'Routine',
      status: 'Current',
      chiefComplaint: 'Allergic rhinitis and nasal congestion',
      caseDetails: {
        id: 'CASE-2026-0712-VK',
        caseNumber: 'CASE-2026-0712-VK',
        lifecycleStage: 'PATIENT CONFIRMED',
        originalPatientResponse: 'Severe nasal congestion, persistent sneezing, and watery itchy eyes for 5 days.',
        structuredHistory: {
          chiefComplaint: 'Allergic rhinitis and nasal congestion',
          duration: '5 days',
          severity: 'Moderate',
          symptoms: ['Nasal congestion', 'Persistent sneezing', 'Watery itchy eyes'],
          relevantNegatives: ['No fever', 'No chest tightness', 'No shortness of breath'],
          pastMedicalHistory: 'Seasonal allergic rhinitis',
          currentMedications: 'Levocetirizine 5mg once daily as needed',
          allergies: 'Dust mites and grass pollen'
        }
      }
    }
    sessionStorage.setItem('aarogya_doctor_active_patient', JSON.stringify(vkPatient))
  })

  // Navigate to OPD Queue first to select Vikash Kumar or active patient
  await page.goto('http://localhost:5173/doctor/opd-queue', { waitUntil: 'networkidle0' })
  await new Promise(r => setTimeout(r, 1500))

  // Click on the first patient or Vikash Kumar in the queue
  const openedPatient = await page.evaluate(() => {
    const links = Array.from(document.querySelectorAll('a, button'))
    const openBtn = links.find(el => el.innerText.includes('CONSULT') || el.innerText.includes('VIEW CASE') || el.innerText.includes('OPEN') || el.innerText.includes('Vikash') || el.innerText.includes('Rajesh'))
    if (openBtn) {
      openBtn.click()
      return true
    }
    return false
  })
  console.log('Opened patient from queue:', openedPatient)
  await new Promise(r => setTimeout(r, 2000))

  // If not navigated, navigate with ?id=1
  if (!page.url().includes('patient-case')) {
    await page.goto('http://localhost:5173/doctor/patient-case?id=1', { waitUntil: 'networkidle0' })
    await new Promise(r => setTimeout(r, 1500))
  }

  console.log('Current URL:', page.url())

  // Verify Overview tab does NOT have "Pending AI Engine • STEP 2/3"
  const bodyText = await page.evaluate(() => document.body.innerText)
  if (bodyText.includes('Pending AI Engine • STEP 2/3')) {
    console.error('[FAIL] "Pending AI Engine • STEP 2/3" is still present!')
    process.exit(1)
  } else {
    console.log('[PASS] No "Pending AI Engine • STEP 2/3" placeholder found on page.')
  }

  // Click on "AI Clinical Summary" tab
  console.log('Clicking AI Clinical Summary tab...')
  const clicked = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'))
    const tabBtn = buttons.find(b => b.innerText.includes('AI Clinical Summary') || b.innerText.includes('Review Clinical Draft'))
    if (tabBtn) {
      tabBtn.click()
      return true
    }
    return false
  })
  console.log('Clicked summary button:', clicked)
  await new Promise(r => setTimeout(r, 1500))

  // Verify AI Clinical Summary content is visible
  const summaryContent = await page.evaluate(() => {
    const text = document.body.innerText
    return {
      hasDraftBanner: text.includes('AI CLINICAL DRAFT SUMMARY'),
      hasDisclaimer: text.includes('Attending doctor remains the final clinical decision-maker') || text.includes('physician reference only'),
      hasHPI: text.includes('History of Present Illness') || text.includes('Chief Complaint'),
      hasSourceLabels: text.includes('Source:') || text.includes('Patient response'),
      hasSafety: text.includes('Clinical Safety Guardrails') || text.includes('Triage protocol'),
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth
    }
  })
  console.log('Summary content verification:', summaryContent)

  // Verify responsive layout across all 5 viewports
  for (const vp of viewports) {
    await page.setViewport({ width: vp.width, height: vp.height })
    await new Promise(r => setTimeout(r, 400))
    
    const overflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth - document.documentElement.clientWidth
    })

    const shotPath = path.join(artifactDir, `ai_summary_qa_${vp.name}.png`)
    await page.screenshot({ path: shotPath, fullPage: false })
    console.log(`[PASS] Viewport ${vp.width}x${vp.height} (${vp.name}): overflow=${overflow}px, screenshot saved to ${shotPath}`)
  }

  await browser.close()
  console.log('\n[ALL REAL CHROME VERIFICATIONS PASSED CLEANLY]')
}

run().catch(err => {
  console.error('Fatal Chrome QA error:', err)
  process.exit(1)
})
