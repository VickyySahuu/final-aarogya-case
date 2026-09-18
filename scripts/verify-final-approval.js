import puppeteer from 'puppeteer-core'
import path from 'path'
import fs from 'fs'

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const artifactDir = 'C:\\Users\\vikas\\.gemini\\antigravity-ide\\brain\\afccac9b-14c4-4ef3-b249-6e340d020bda'
const screenshotsDir = path.join(artifactDir, 'doctor_ux_screenshots')

if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true })
}

async function verifyFinalApproval() {
  console.log('=================================================================')
  console.log('  VERIFYING FINAL APPROVAL SELECT ALL & CASE COMPLETION')
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

    console.log('[TEST 1] Navigating to /doctor/final-approval...')
    await page.goto('http://localhost:5173/doctor/final-approval', { waitUntil: 'networkidle2' })
    await new Promise(r => setTimeout(r, 800))

    // Capture initial state screenshot
    const initialShot = path.join(screenshotsDir, 'final_approval_initial.png')
    await page.screenshot({ path: initialShot, fullPage: true })
    console.log('  [PASS] Initial page loaded, screenshot saved')

    // Find and click "Select All"
    console.log('[TEST 2] Clicking "Select All" button...')
    const selectAllBtn = await page.$('button ::-p-text(Select All)')
    if (!selectAllBtn) {
      throw new Error('Could not find Select All button')
    }
    await selectAllBtn.click()
    await new Promise(r => setTimeout(r, 500))

    // Capture state with Select All active
    const selectedShot = path.join(screenshotsDir, 'final_approval_all_selected.png')
    await page.screenshot({ path: selectedShot, fullPage: true })
    console.log('  [PASS] All items selected, screenshot saved')

    // Verify "Deselect All" is now shown
    const deselectBtn = await page.$('button ::-p-text(Deselect All)')
    if (!deselectBtn) {
      throw new Error('Button did not switch to Deselect All')
    }
    console.log('  [PASS] Button properly toggled to "Deselect All"')

    // Verify "APPROVE & COMPLETE CASE" button is enabled
    console.log('[TEST 3] Verifying Approve & Complete Case button...')
    const approveBtn = await page.$('button ::-p-text(APPROVE & COMPLETE CASE)')
    if (!approveBtn) {
      throw new Error('Could not find Approve & Complete Case button')
    }

    const isDisabled = await page.evaluate(el => el.disabled, approveBtn)
    console.log('  - Approve button disabled state:', isDisabled)
    if (isDisabled) {
      throw new Error('Approve button should be enabled when all are checked')
    }

    // Click Approve & Complete Case
    console.log('  - Clicking APPROVE & COMPLETE CASE...')
    await approveBtn.click()
    await new Promise(r => setTimeout(r, 1200))

    const currentUrl = page.url()
    console.log('  - Navigated to:', currentUrl)
    if (!currentUrl.includes('/doctor/case-completed')) {
      throw new Error(`Expected navigation to /doctor/case-completed, but got: ${currentUrl}`)
    }

    const completedShot = path.join(screenshotsDir, 'case_completed.png')
    await page.screenshot({ path: completedShot, fullPage: true })
    console.log('  [PASS] Case Completed page reached & screenshot saved')

    // Also verify on 375px mobile
    console.log('\n[TEST 4] Mobile responsive check on 375px...')
    await page.setViewport({ width: 375, height: 812 })
    await page.goto('http://localhost:5173/doctor/final-approval', { waitUntil: 'networkidle2' })
    await new Promise(r => setTimeout(r, 600))
    const mobileShot = path.join(screenshotsDir, 'final_approval_375px_mobile.png')
    await page.screenshot({ path: mobileShot, fullPage: true })
    console.log('  [PASS] Mobile 375px screenshot saved')

    console.log('\n=================================================================')
    console.log('  SELECT ALL VERIFICATION TEST COMPLETED SUCCESSFULLY!')
    console.log('=================================================================')

  } catch (err) {
    console.error('Test execution error:', err)
    process.exitCode = 1
  } finally {
    if (browser) await browser.close()
  }
}

verifyFinalApproval()
