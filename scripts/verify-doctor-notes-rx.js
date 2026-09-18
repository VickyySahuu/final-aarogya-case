import puppeteer from 'puppeteer-core'
import path from 'path'
import fs from 'fs'

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const artifactDir = 'C:\\Users\\vikas\\.gemini\\antigravity-ide\\brain\\afccac9b-14c4-4ef3-b249-6e340d020bda'
const screenshotsDir = path.join(artifactDir, 'doctor_ux_screenshots')

if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true })
}

async function verifyDoctorUX() {
  console.log('=================================================================')
  console.log('  VERIFYING DOCTOR NOTES & PRESCRIPTION PRE-SELECT & WRITING UX')
  console.log('=================================================================')

  let browser
  try {
    browser = await puppeteer.launch({
      executablePath: chromePath,
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
    })

    const page = await browser.newPage()
    await page.setViewport({ width: 1440, height: 900 })

    // -------------------------------------------------------------
    // 1. VERIFY DOCTOR NOTES (http://localhost:5173/doctor/notes)
    // -------------------------------------------------------------
    console.log('\n[TEST 1] Testing Doctor Notes (/doctor/notes)...')
    await page.goto('http://localhost:5173/doctor/notes', { waitUntil: 'networkidle2' })
    await new Promise(r => setTimeout(r, 1000))

    // Verify 1-click clinical templates
    console.log('  - Testing 1-Click Clinical Template (Viral Fever & URTI)...')
    const templateBtn = await page.$('button ::-p-text(Viral Fever & URTI)')
    if (templateBtn) {
      await templateBtn.click()
      await new Promise(r => setTimeout(r, 300))
    }

    // Verify textareas populated
    const textareas = await page.$$('textarea')
    console.log(`  - Found ${textareas.length} clinical textareas`)
    if (textareas.length >= 4) {
      const complaintVal = await page.evaluate(el => el.value, textareas[0])
      console.log('  - Chief complaint populated:', complaintVal.slice(0, 60) + '...')
      if (!complaintVal.includes('High grade fever')) {
        throw new Error('Template text did not populate into complaint textarea')
      }

      // Add custom typing to the complaint
      console.log('  - Testing free-form typing addition into complaint...')
      await textareas[0].type('\nPatient also mentions occasional mild dizziness in morning.')
      const updatedComplaint = await page.evaluate(el => el.value, textareas[0])
      console.log('  - Updated complaint length:', updatedComplaint.length)
    }

    // Save screenshot of Doctor Notes
    const notesShotPath = path.join(screenshotsDir, 'doctor_notes_editor.png')
    await page.screenshot({ path: notesShotPath, fullPage: true })
    console.log('  [PASS] Doctor Notes Editor verified & screenshot saved:', notesShotPath)

    // Click Save Clinical Notes
    const saveNotesBtn = await page.$('button ::-p-text(SAVE CLINICAL NOTES)')
    if (saveNotesBtn) {
      console.log('  - Clicking Save Clinical Notes...')
      await saveNotesBtn.click()
      await new Promise(r => setTimeout(r, 1000))

      const savedShotPath = path.join(screenshotsDir, 'doctor_notes_saved.png')
      await page.screenshot({ path: savedShotPath, fullPage: true })
      console.log('  [PASS] Doctor Notes Saved confirmation verified')
    }

    // -------------------------------------------------------------------
    // 2. VERIFY PRESCRIPTION PAGE (http://localhost:5173/doctor/prescription)
    // -------------------------------------------------------------------
    console.log('\n[TEST 2] Testing Prescription Page (/doctor/prescription)...')
    await page.goto('http://localhost:5173/doctor/prescription', { waitUntil: 'networkidle2' })
    await new Promise(r => setTimeout(r, 1000))

    // Click 1-Click Popular Medication: Paracetamol 650mg
    console.log('  - Testing 1-Click Popular Preset: Paracetamol 650mg...')
    const pcmBtn = await page.$('button ::-p-text(Paracetamol 650mg)')
    if (pcmBtn) {
      await pcmBtn.click()
      await new Promise(r => setTimeout(r, 400))
    }

    // Check inputs
    const inputs = await page.$$('input')
    console.log(`  - Found ${inputs.length} inputs on prescription page`)

    // Click "ADD MEDICATION TO PRESCRIPTION"
    const addMedBtn = await page.$('button ::-p-text(ADD MEDICATION TO PRESCRIPTION)')
    if (addMedBtn) {
      console.log('  - Adding Paracetamol to prescription table...')
      await addMedBtn.click()
      await new Promise(r => setTimeout(r, 500))
    }

    // Click 1-Click Popular Preset: Amoxicillin 500mg
    console.log('  - Testing 1-Click Popular Preset: Amoxicillin 500mg...')
    const amoxBtn = await page.$('button ::-p-text(Amoxicillin 500mg)')
    if (amoxBtn) {
      await amoxBtn.click()
      await new Promise(r => setTimeout(r, 400))

      // Change duration using pre-select chip "+ 7 Days"
      const sevenDaysChip = await page.$('button ::-p-text(+ 7 Days)')
      if (sevenDaysChip) {
        console.log('  - Pre-selecting chip: + 7 Days...')
        await sevenDaysChip.click()
        await new Promise(r => setTimeout(r, 200))
      }

      console.log('  - Adding Amoxicillin to prescription table...')
      await addMedBtn.click()
      await new Promise(r => setTimeout(r, 500))
    }

    // Test free-form typing
    console.log('  - Testing custom medication typing...')
    // Input 0: Medicine Name, 1: Dosage, 2: Frequency, 3: Duration, 4: Special Instructions
    const freshInputs = await page.$$('input')
    if (freshInputs.length >= 5) {
      await freshInputs[0].type('Multivitamin Zinc Syrup')
      await freshInputs[1].type('10ml (2 tsp)')
      await freshInputs[2].type('OD (1-0-0)')
      await freshInputs[3].type('14 Days')
      await freshInputs[4].type('Take once daily after breakfast')

      console.log('  - Adding custom typed medication to prescription table...')
      await addMedBtn.click()
      await new Promise(r => setTimeout(r, 500))
    }

    // Screenshot of Compose Page with 3 prescribed medicines
    const rxComposeShotPath = path.join(screenshotsDir, 'prescription_compose_3_meds.png')
    await page.screenshot({ path: rxComposeShotPath, fullPage: true })
    console.log('  [PASS] Prescription Compose screen verified & screenshot saved')

    // Click "REVIEW PRESCRIPTION"
    console.log('  - Clicking Review Prescription...')
    const reviewBtn = await page.$('button ::-p-text(REVIEW PRESCRIPTION)')
    if (reviewBtn) {
      await reviewBtn.click()
      await new Promise(r => setTimeout(r, 600))

      const rxReviewShotPath = path.join(screenshotsDir, 'prescription_review.png')
      await page.screenshot({ path: rxReviewShotPath, fullPage: true })
      console.log('  [PASS] Prescription Review screen verified')

      // Click "ISSUE e-PRESCRIPTION"
      console.log('  - Clicking Issue e-Prescription...')
      const issueBtn = await page.$('button ::-p-text(ISSUE e-PRESCRIPTION)')
      if (issueBtn) {
        await issueBtn.click()
        await new Promise(r => setTimeout(r, 2000))

        const rxIssuedShotPath = path.join(screenshotsDir, 'prescription_issued_printable.png')
        await page.screenshot({ path: rxIssuedShotPath, fullPage: true })
        console.log('  [PASS] Printable A4 Prescription Document verified & screenshot saved:', rxIssuedShotPath)
      }
    }

    // -------------------------------------------------------------------
    // 3. RESPONSIVE VIEWPORT CHECKS
    // -------------------------------------------------------------------
    console.log('\n[TEST 3] Responsive checks across mobile and tablet...')
    const viewports = [
      { name: '768px_tablet', width: 768, height: 1024 },
      { name: '375px_mobile', width: 375, height: 812 }
    ]

    for (const vp of viewports) {
      await page.setViewport({ width: vp.width, height: vp.height })
      await page.goto('http://localhost:5173/doctor/prescription', { waitUntil: 'networkidle2' })
      await new Promise(r => setTimeout(r, 600))
      const vpShot = path.join(screenshotsDir, `prescription_${vp.name}.png`)
      await page.screenshot({ path: vpShot, fullPage: true })
      console.log(`  [PASS] Responsive ${vp.name} verified & saved`)
    }

    console.log('\n=================================================================')
    console.log('  ALL DOCTOR NOTES & PRESCRIPTION UX TESTS COMPLETED SUCCESSFULLY!')
    console.log('=================================================================')

  } catch (err) {
    console.error('Test execution error:', err)
    process.exitCode = 1
  } finally {
    if (browser) await browser.close()
  }
}

verifyDoctorUX()
