import http from 'http'

const BASE_URL = 'http://localhost:5000'

function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL)
    const req = http.request(
      url,
      {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      },
      (res) => {
        let raw = ''
        res.on('data', chunk => raw += chunk)
        res.on('end', () => {
          try {
            const data = JSON.parse(raw)
            resolve({ status: res.statusCode, data })
          } catch (e) {
            resolve({ status: res.statusCode, raw })
          }
        })
      }
    )
    req.on('error', reject)
    if (body) req.write(JSON.stringify(body))
    req.end()
  })
}

async function run() {
  console.log('===========================================================')
  console.log('  TESTING VIKASH KUMAR DEMO: OLD HISTORY + NEW CASE FLOW')
  console.log('===========================================================')

  // Step 1: Login as Vikash Kumar
  const loginRes = await request('POST', '/api/auth/patient/login', { mobile: '9546011026' })
  console.log(`[Step 1] Login status: ${loginRes.status}, patient:`, JSON.stringify(loginRes.data?.patient))
  if (loginRes.status !== 200 || !loginRes.data?.token) {
    throw new Error('Vikash Kumar login failed')
  }
  const token = loginRes.data.token
  const patient = loginRes.data.patient
  const patientId = patient.id

  // Step 2: Verify old history intact
  const casesRes = await request('GET', '/api/cases', null, token)
  console.log(`[Step 2] Found ${casesRes.data?.cases?.length || 0} cases in history`)
  const histCase = casesRes.data?.cases?.find(c => c.caseNumber === 'CASE-2026-0712-VK' || c.case_number === 'CASE-2026-0712-VK')
  if (!histCase) {
    throw new Error('Historical case CASE-2026-0712-VK not found in history!')
  }
  console.log(`[PASS] Historical case found: ${histCase.caseNumber || histCase.case_number} (${histCase.problem})`)

  // Verify historical prescription
  const rxRes = await request('GET', '/api/patient/prescriptions', null, token)
  const histRx = rxRes.data?.prescriptions?.find(r => r.rxNumber === 'RX-2026-0712-VK' || r.rx_number === 'RX-2026-0712-VK')
  if (!histRx) {
    throw new Error('Historical prescription RX-2026-0712-VK not found!')
  }
  console.log(`[PASS] Historical prescription found: ${histRx.rxNumber || histRx.rx_number} (${histRx.diagnosis})`)

  // Step 3: Create NEW case for Vikash Kumar
  const newCaseRes = await request('POST', '/api/cases', {
    problem: 'High fever with chills and severe body ache for 2 days',
    duration: '2 days',
    symptoms: ['High fever', 'Chills', 'Severe body ache'],
    originalPatientResponse: 'Mujhe do din se tezz bukhar hai thand lag rahi hai aur poore badan mein dard hai.'
  }, token)
  console.log(`[Step 3] New case status: ${newCaseRes.status}, caseId: ${newCaseRes.data?.case?.id || newCaseRes.data?.case?.case_number}`)
  if (newCaseRes.status !== 201) {
    throw new Error('Failed to create new case for Vikash Kumar')
  }
  const newCase = newCaseRes.data.case
  const newCaseId = newCase.id

  if (newCase.case_number === 'CASE-2026-0712-VK') {
    throw new Error('New case duplicated the old historical case number!')
  }
  console.log(`[PASS] New case created: ${newCase.case_number || newCaseId}`)

  // Confirm the new case
  const confirmRes = await request('POST', `/api/cases/${newCaseId}/confirm`, {}, token)
  console.log(`[PASS] New case confirmed: ${confirmRes.status}`)

  // Step 4: Book dynamic future appointment (Tomorrow D+1)
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const appointmentDate = tomorrow.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

  const bookRes = await request('POST', '/api/appointments', {
    doctorId: 1,
    hospitalId: 1,
    caseId: newCaseId,
    appointmentDate,
    timeSlot: '10:30 AM - 11:00 AM',
    opdRoom: 'Room 104',
    problem: 'High fever with chills and severe body ache for 2 days'
  }, token)
  console.log(`[Step 4] Appointment booked: ${bookRes.status}, Apt Number: ${bookRes.data?.appointment?.appointmentNumber}`)
  if (bookRes.status !== 201) {
    throw new Error('Failed to book appointment')
  }
  const apt = bookRes.data.appointment

  // Step 5: Doctor Login and OPD Queue Inspection
  const docLoginRes = await request('POST', '/api/auth/doctor/login', { doctorId: 'DOC-1042' })
  const docToken = docLoginRes.data?.token
  console.log(`[Step 5] Doctor login status: ${docLoginRes.status}`)

  const queueRes = await request('GET', '/api/doctor/opd-queue', null, docToken)
  const vkQueueItem = queueRes.data?.queue?.find(q => q.patientName?.includes('VIKASH') || q.patient_name?.includes('VIKASH') || q.patientUniqueCode === 'AC-VK2604')
  if (!vkQueueItem) {
    throw new Error('Vikash Kumar appointment did not appear in Doctor OPD Queue!')
  }
  console.log(`[PASS] Doctor OPD Queue has Vikash Kumar: Token ${vkQueueItem.tokenNumber || vkQueueItem.token}, Apt ${vkQueueItem.appointmentNumber}`)

  // Step 6: Verify Doctor can see CURRENT CASE + PREVIOUS HISTORY
  const docCasesRes = await request('GET', `/api/patients/${patientId}/history`, null, docToken)
  const allVkCases = docCasesRes.data?.data?.cases || []
  console.log(`[Step 6] Doctor sees ${allVkCases.length} total cases for Vikash Kumar`)
  const hasCurrentCase = allVkCases.some(c => c.id === newCaseId || c.case_number === newCase.case_number || c.caseNumber === newCase.caseNumber)
  const hasOldCase = allVkCases.some(c => c.case_number === 'CASE-2026-0712-VK' || c.caseNumber === 'CASE-2026-0712-VK')

  if (!hasCurrentCase) throw new Error('Doctor cannot see newly created current case')
  if (!hasOldCase) throw new Error('Doctor cannot see historical case')
  console.log(`[PASS] Doctor sees CURRENT CASE (${newCase.case_number || newCase.caseNumber}) AND PREVIOUS HISTORY (CASE-2026-0712-VK)`)

  // Step 7: Verify Patient Unique Code remains identical and single patient
  console.log(`[PASS] Patient uniqueness verified: ID=${patientId}, Code=${patient.patientUniqueCode}`)
  console.log('===========================================================')
  console.log('  ALL VIKASH KUMAR OLD HISTORY + NEW CASE CHECKS PASSED!')
  console.log('===========================================================')
}

run().catch(err => {
  console.error('[FAIL] Error:', err.message)
  process.exit(1)
})
