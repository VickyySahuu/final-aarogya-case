// backend/qa-browser-flow.js
// Autonomous real Chrome QA script using native Chrome DevTools Protocol (CDP) and native Node 24 WebSocket

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const os = require('os');
const USER_DATA_DIR = path.join(os.tmpdir(), 'chrome-qa-profile-' + Date.now());
const SCREENSHOTS_DIR = 'C:\\Users\\vikas\\.gemini\\antigravity-ide\\brain\\afccac9b-14c4-4ef3-b249-6e340d020bda';
const PORT = 9222;

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch(e) { reject(e); }
      });
    }).on('error', reject);
  });
}

class CDPClient {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.id = 1;
    this.callbacks = new Map();
    this.ready = new Promise((resolve, reject) => {
      this.ws.onopen = resolve;
      this.ws.onerror = reject;
    });
    this.ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && this.callbacks.has(msg.id)) {
        const { resolve, reject } = this.callbacks.get(msg.id);
        this.callbacks.delete(msg.id);
        if (msg.error) reject(msg.error);
        else resolve(msg.result);
      }
    };
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = this.id++;
      this.callbacks.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async evaluate(expression) {
    const res = await this.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    return res.result ? res.result.value : null;
  }

  async screenshot(filePath, width, height) {
    if (width && height) {
      await this.send('Emulation.setDeviceMetricsOverride', {
        width,
        height,
        deviceScaleFactor: 1,
        mobile: width < 768
      });
      await delay(400);
    }
    const { data } = await this.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(filePath, Buffer.from(data, 'base64'));
    console.log(`[QA] Screenshot saved: ${path.basename(filePath)} (${width}x${height})`);
  }
}

async function runRealChromeQA() {
  console.log('=== REAL CHROME BROWSER QA AUTOMATION STARTING ===');

  // 1. Log in patient on backend to obtain clean auth session
  const loginRes = await fetch('http://localhost:5000/api/auth/patient/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mobile: '9876543210' })
  });
  const loginData = await loginRes.json();
  const token = loginData.token;
  const patient = loginData.patient;
  console.log(`[QA] Authenticated test patient: ${patient.name} (${patient.uniqueCode || patient.patient_id})`);

  // Start Chrome
  const chromeProcess = spawn(CHROME_PATH, [
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${USER_DATA_DIR}`,
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    'http://localhost:5173/patient/login'
  ]);

  await delay(3000);

  try {
    const targets = await fetchJson(`http://127.0.0.1:${PORT}/json/list`);
    const pageTarget = targets.find(t => t.type === 'page') || targets[0];
    if (!pageTarget) throw new Error('No page target found');

    const cdp = new CDPClient(pageTarget.webSocketDebuggerUrl);
    await cdp.ready;

    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');
    await cdp.send('DOM.enable');

    console.log('[QA] Connected to Chrome DevTools Protocol on page target');

    // Navigate to patient portal to set localStorage
    await cdp.send('Page.navigate', { url: 'http://localhost:5173/patient/login' });
    await delay(1500);

    // Set auth tokens in localStorage exactly as AuthApi does
    await cdp.evaluate(`
      localStorage.setItem('aarogya_session_token', '${token}');
      localStorage.setItem('aarogya_patient_session_token', '${token}');
      localStorage.setItem('aarogya_session_data', JSON.stringify({ patient: ${JSON.stringify(patient)} }));
      localStorage.setItem('aarogya_patient_profile', JSON.stringify(${JSON.stringify(patient)}));
    `);

    // Navigate to AI Case Interview page
    await cdp.send('Page.navigate', { url: 'http://localhost:5173/patient/ai-interview' });
    await delay(3000);

    // Check if page loaded
    const pageTitle = await cdp.evaluate('document.title');
    console.log(`[QA] Page title: ${pageTitle}`);

    // Check if document upload button exists
    const hasUploadBtn = await cdp.evaluate("!!document.querySelector('#btn-upload-document')");
    console.log(`[QA] Document Upload button present: ${hasUploadBtn}`);

    // Test Viewports: 375px, 390px, 412px, 768px, 1440px
    const viewports = [
      { w: 375, h: 667, name: 'viewport_375px_qa.png' },
      { w: 390, h: 844, name: 'viewport_390px_qa.png' },
      { w: 412, h: 915, name: 'viewport_412px_qa.png' },
      { w: 768, h: 1024, name: 'viewport_768px_qa.png' },
      { w: 1440, h: 900, name: 'viewport_1440px_qa.png' }
    ];

    for (const vp of viewports) {
      const outPath = path.join(SCREENSHOTS_DIR, vp.name);
      await cdp.screenshot(outPath, vp.w, vp.h);
    }

    // Now type a medical complaint in the conversation
    console.log('[QA] Typing patient symptom in chat...');
    await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
    await delay(300);

    await cdp.evaluate(`
      const input = document.querySelector('#input-patient-message') || document.querySelector('input[type="text"]');
      if (input) {
        input.value = "Mujhe 5 din se fever aur headache hai.";
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
    `);
    await delay(500);

    await cdp.evaluate(`
      const btn = document.querySelector('#btn-send-message') || document.querySelector('button[type="submit"]');
      if (btn) btn.click();
    `);
    console.log('[QA] Message sent, waiting for AI response...');
    await delay(4000);

    // Capture interview state after symptom
    await cdp.screenshot(path.join(SCREENSHOTS_DIR, 'interview_with_symptom.png'), 1440, 900);

    // Simulate Document Upload via the file input or directly invoke upload API
    console.log('[QA] Simulating medical document attachment...');
    const pdfPath = path.join(__dirname, '..', 'sample_documents', 'CBC_Lab_Report.pdf');
    const pdfBytes = fs.readFileSync(pdfPath).toString('base64');

    await cdp.evaluate(`
      (async () => {
        // Find active case ID from window or DOM
        const token = localStorage.getItem('aarogya_session_token');
        const caseRes = await fetch('http://localhost:5000/api/patient-cases/active', {
          headers: { 'Authorization': 'Bearer ' + token }
        });
        const caseData = await caseRes.json();
        const caseId = caseData.case.id || caseData.case.case_id;

        // Base64 to blob
        const byteCharacters = atob('${pdfBytes}');
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'application/pdf' });
        const file = new File([blob], 'CBC_Blood_Test_Report.pdf', { type: 'application/pdf' });

        const formData = new FormData();
        formData.append('document', file);

        const uploadRes = await fetch('http://localhost:5000/api/patient-cases/' + caseId + '/documents', {
          method: 'POST',
          headers: { 'Authorization': 'Bearer ' + token },
          body: formData
        });
        return await uploadRes.json();
      })()
    `);

    console.log('[QA] Document uploaded via case API, refreshing view...');
    await cdp.send('Page.navigate', { url: 'http://localhost:5173/patient/ai-interview' });
    await delay(3000);

    // Capture view showing uploaded document & analyzed findings
    await cdp.screenshot(path.join(SCREENSHOTS_DIR, 'interview_with_document_findings.png'), 1440, 900);

    // Click "Review & Confirm Case"
    console.log('[QA] Navigating to Case Review screen...');
    await cdp.evaluate(`
      const reviewBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Review') || b.textContent.includes('Preview'));
      if (reviewBtn) reviewBtn.click();
    `);
    await delay(2000);

    // Capture Case Review screen showing uploaded documents & findings
    await cdp.screenshot(path.join(SCREENSHOTS_DIR, 'case_review_with_documents.png'), 1440, 900);

    console.log('=== REAL CHROME BROWSER QA AUTOMATION COMPLETED SUCCESSFULLY ===');
  } finally {
    chromeProcess.kill();
  }
}

runRealChromeQA().catch(err => {
  console.error('[QA] Failed:', err);
  process.exit(1);
});
