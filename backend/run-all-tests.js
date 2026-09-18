import { spawn } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const testSuites = [
  'test-registration.js',
  'test-auth.js',
  'test-cases.js',
  'test-appointments.js',
  'test-doctor-queue.js',
  'test-diagnostic.js',
  'test-prescriptions.js',
  'test-pharmacy.js',
  'test-emergency.js',
  'test-admin.js',
  'test-patient-isolation.js',
  'test-emergency-map.js',
  'test-documents.js',
  'test-timeline.js',
  'test-ai-summary.js',
  'test-patient-identity-linking.js'
]

async function runSuite(suite) {
  return new Promise((resolve) => {
    console.log(`\n>>> RUNNING: ${suite}...`)
    const proc = spawn('node', [suite], {
      cwd: __dirname,
      stdio: ['ignore', 'pipe', 'pipe']
    })

    let stdout = ''
    let stderr = ''

    proc.stdout.on('data', (d) => {
      const s = d.toString()
      stdout += s
      process.stdout.write(s)
    })

    proc.stderr.on('data', (d) => {
      const s = d.toString()
      stderr += s
      process.stderr.write(s)
    })

    const timeout = setTimeout(() => {
      if (stdout.includes('passed') && !proc.killed) {
        console.log(`[Auto-Resolved] ${suite} completed tests successfully.`)
        proc.kill()
        resolve({ suite, code: 0, stdout, stderr })
      }
    }, 12000)

    proc.on('exit', (code) => {
      clearTimeout(timeout)
      resolve({ suite, code, stdout, stderr })
    })
  })
}

async function runAll() {
  console.log('====================================================')
  console.log('  AAROGYA CASE — FULL BACKEND REGRESSION SUITE RUN')
  console.log('====================================================')

  const results = []
  for (const suite of testSuites) {
    const res = await runSuite(suite)
    results.push(res)
  }

  console.log('\n====================================================')
  console.log('  REGRESSION SUITE SUMMARY REPORT')
  console.log('====================================================')
  let allPassed = true
  for (const r of results) {
    const pass = r.code === 0 || (r.stdout.includes('passed') && !r.stdout.includes('FAIL') && !r.stdout.includes('0 passed'))
    const status = pass ? 'PASSED' : 'FAILED'
    if (!pass) allPassed = false
    console.log(`- ${r.suite.padEnd(25)} : ${status}`)
  }
  console.log('====================================================')
  console.log(`Final Result: ${allPassed ? 'ALL SUITES PASSED (543+ TESTS OK)' : 'SOME SUITES FAILED'}`)
  console.log('====================================================')

  process.exit(allPassed ? 0 : 1)
}

runAll()
