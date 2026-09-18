// Automated Test Suite for Process 9: Emergency + Ambulance Backend Integration
import { app } from './server.js'
import { AmbulanceModel } from './models/ambulanceModel.js'

async function runTests() {
  console.log('=================================================================')
  console.log('  AAROGYA CASE — PROCESS 9 EMERGENCY + AMBULANCE TESTS')
  console.log('=================================================================')

  const PORT = 5068
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
    AmbulanceModel.clearMemory()

    // -------------------------------------------------------------
    // SETUP: Authenticate Roles
    // -------------------------------------------------------------
    console.log('\n[SETUP] Authenticating Patient, Doctor & Ambulance roles...')

    // 1. Patient 1 Login
    const pat1LoginRes = await fetch(`${BASE}/auth/patient/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobile: '9876543210' })
    })
    const pat1LoginData = await pat1LoginRes.json()
    assert(pat1LoginRes.status === 200 && !!pat1LoginData.token, 'Setup: Patient 1 authenticated with session token')
    const pat1Token = pat1LoginData.token
    const patient1 = pat1LoginData.patient

    // 2. Patient 2 Registration & Login (for cross-patient privacy checks)
    const p2Suffix = Date.now().toString().slice(-6)
    const pat2RegRes = await fetch(`${BASE}/patients/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: `Sunita Sharma ${p2Suffix}`,
        mobile: `9123${p2Suffix}`,
        dob: '15/06/1992',
        age: '33',
        gender: 'Female',
        identityType: 'Aadhaar',
        identityNumber: `9123 4567 ${p2Suffix}`,
        bloodGroup: 'A+',
        address: 'Sector 10 Dwarka, New Delhi'
      })
    })
    const pat2RegData = await pat2RegRes.json()
    assert(pat2RegRes.status === 201 || pat2RegRes.status === 200, 'Setup: Patient 2 registered')

    const pat2LoginRes = await fetch(`${BASE}/auth/patient/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobile: `9123${p2Suffix}` })
    })
    const pat2LoginData = await pat2LoginRes.json()
    assert(pat2LoginRes.status === 200 && !!pat2LoginData.token, 'Setup: Patient 2 authenticated with session token')
    const pat2Token = pat2LoginData.token

    // 3. Ambulance 1 Unit Login (Primary: Unit #08, ID 1)
    const amb1LoginRes = await fetch(`${BASE}/auth/ambulance/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ambulanceId: 'Ambulance Unit #08' })
    })
    const amb1LoginData = await amb1LoginRes.json()
    assert(amb1LoginRes.status === 200 && !!amb1LoginData.token, 'Setup: Ambulance 1 authenticated')
    const amb1Token = amb1LoginData.token

    // 4. Ambulance 2 Unit Login (Secondary: Unit #02, ID 2, for unauthorized modification tests)
    const amb2LoginRes = await fetch(`${BASE}/auth/ambulance/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ambulanceId: 'Ambulance Unit #02' })
    })
    const amb2LoginData = await amb2LoginRes.json()
    assert(amb2LoginRes.status === 200 && !!amb2LoginData.token, 'Setup: Ambulance 2 authenticated')
    const amb2Token = amb2LoginData.token

    // 5. Doctor Login (for cross-role permission checks)
    const docLoginRes = await fetch(`${BASE}/auth/doctor/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ doctorId: 'DOC-1042' })
    })
    const docLoginData = await docLoginRes.json()
    assert(docLoginRes.status === 200 && !!docLoginData.token, 'Setup: Doctor authenticated')
    const docToken = docLoginData.token

    // -------------------------------------------------------------
    // SECTION 1: AUTHENTICATION GUARDS
    // -------------------------------------------------------------
    console.log('\n[TEST 1] Authentication Guards & Token Validation...')

    // 1.1 Unauthenticated patient cannot create emergency request
    const unauthCreateRes = await fetch(`${BASE}/emergency/requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ latitude: 28.5921, longitude: 77.0460 })
    })
    assert(unauthCreateRes.status === 401, 'Unauthenticated patient emergency request rejected with HTTP 401')

    // 1.2 Unauthenticated patient cannot get emergency request
    const unauthGetRes = await fetch(`${BASE}/emergency/requests/1`)
    assert(unauthGetRes.status === 401, 'Unauthenticated patient emergency details request rejected with HTTP 401')

    // 1.3 Invalid session token rejected
    const invalidTokenRes = await fetch(`${BASE}/emergency/requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer INVALID-TOKEN-XYZ'
      },
      body: JSON.stringify({ latitude: 28.5921, longitude: 77.0460 })
    })
    assert(invalidTokenRes.status === 401, 'Invalid session token rejected with HTTP 401')

    // 1.4 Unauthenticated ambulance cannot view dispatch queue
    const unauthAmbListRes = await fetch(`${BASE}/ambulance/requests`)
    assert(unauthAmbListRes.status === 401, 'Unauthenticated ambulance queue access rejected with HTTP 401')

    // 1.5 Unauthenticated ambulance cannot assign request
    const unauthAssignRes = await fetch(`${BASE}/ambulance/requests/1/assign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    })
    assert(unauthAssignRes.status === 401, 'Unauthenticated ambulance assignment rejected with HTTP 401')

    // 1.6 Unauthenticated ambulance cannot update status
    const unauthStatusRes = await fetch(`${BASE}/ambulance/requests/1/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'En Route' })
    })
    assert(unauthStatusRes.status === 401, 'Unauthenticated ambulance status update rejected with HTTP 401')

    // 1.7 Doctor token cannot access ambulance endpoints (role mismatch)
    const docAmbRes = await fetch(`${BASE}/ambulance/requests`, {
      headers: { Authorization: `Bearer ${docToken}` }
    })
    assert(docAmbRes.status === 401, 'Role mismatch: Doctor token rejected on ambulance endpoints')

    // -------------------------------------------------------------
    // SECTION 2: EMERGENCY REQUEST CREATION & VALIDATION
    // -------------------------------------------------------------
    console.log('\n[TEST 2] Patient Emergency Request Creation & Telemetry Validation...')

    // 2.1 Missing coordinates rejected
    const missingCoordsRes = await fetch(`${BASE}/emergency/requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${pat1Token}`
      },
      body: JSON.stringify({ pickupLocation: 'Dwarka Sector 14' })
    })
    assert(missingCoordsRes.status === 400, 'Missing coordinates rejected with HTTP 400')

    // 2.2 Non-numeric coordinates rejected
    const invalidCoordsRes = await fetch(`${BASE}/emergency/requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${pat1Token}`
      },
      body: JSON.stringify({ latitude: 'NOT_A_NUMBER', longitude: 77.0460 })
    })
    assert(invalidCoordsRes.status === 400, 'Non-numeric coordinates rejected with HTTP 400')

    // 2.3 Out-of-bounds geographic coordinates rejected
    const outOfBoundsRes = await fetch(`${BASE}/emergency/requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${pat1Token}`
      },
      body: JSON.stringify({ latitude: 195.0, longitude: 77.0460 })
    })
    assert(outOfBoundsRes.status === 400, 'Out-of-bounds coordinates rejected with HTTP 400')

    // 2.4 Valid emergency request — NO patient name/age/diagnosis required
    const createReqRes = await fetch(`${BASE}/emergency/requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${pat1Token}`
      },
      body: JSON.stringify({
        latitude: 28.5921,
        longitude: 77.0460,
        locationAccuracy: 12.5,
        pickupLocation: 'Sector 14 Dwarka, Near Metro Pillar 420',
        landmark: 'Opposite City Metro Station',
        patientId: 99999 // Must NOT be accepted; backend must link to authenticated patient!
      })
    })
    const createReqData = await createReqRes.json()
    assert(createReqRes.status === 201 && createReqData.success, 'Valid authenticated emergency request created with HTTP 201')

    const emergencyReq = createReqData.request
    assert(!!emergencyReq && typeof emergencyReq.id !== 'undefined', 'Emergency request record has persistent ID')
    assert(/^EMG-\d{4}-\d{6}$/.test(emergencyReq.request_number), `Generated unique request number format valid (${emergencyReq.request_number})`)
    assert(emergencyReq.status === 'Requested', 'Initial emergency request status is "Requested"')
    assert(Number(emergencyReq.latitude) === 28.5921, 'Stored latitude matches provided coordinates (28.5921)')
    assert(Number(emergencyReq.longitude) === 77.0460, 'Stored longitude matches provided coordinates (77.0460)')
    assert(Number(emergencyReq.location_accuracy) === 12.5, 'Stored accuracy matches provided telemetry (12.5m)')
    assert(Number(emergencyReq.patient_id) === Number(patient1.id), 'Emergency request is securely bound to authenticated patient ID (arbitrary ID ignored)')
    assert(emergencyReq.patient_unique_code === (patient1.patient_unique_code || patient1.patientUniqueCode || patient1.unique_code), 'Patient Unique Code matches authenticated citizen identity')
    assert(!!emergencyReq.created_at, 'Creation timestamp is recorded')

    // 2.5 Initial request does NOT contain diagnosis or clinical data
    assert(!emergencyReq.incident_category, 'Initial request does not contain incident category (filled after scene assessment)')
    assert(!emergencyReq.patient_condition, 'Initial request does not contain patient condition (filled after scene assessment)')
    assert(!emergencyReq.incident_description, 'Initial request does not contain incident description')

    // -------------------------------------------------------------
    // SECTION 3: DETAILS & PRIVACY VERIFICATION
    // -------------------------------------------------------------
    console.log('\n[TEST 3] Emergency Request Details & Privacy Isolation...')

    // 3.1 Patient 1 can fetch their own request
    const pat1GetReqRes = await fetch(`${BASE}/emergency/requests/${emergencyReq.id}`, {
      headers: { Authorization: `Bearer ${pat1Token}` }
    })
    const pat1GetReqData = await pat1GetReqRes.json()
    assert(pat1GetReqRes.status === 200 && pat1GetReqData.success, 'Patient 1 successfully fetches own emergency request')
    assert(pat1GetReqData.request.requestNumber === emergencyReq.request_number, 'Returned requestNumber matches created record')
    assert(pat1GetReqData.request.status === 'Requested', 'Returned status is "Requested"')
    assert(Number(pat1GetReqData.request.latitude) === 28.5921, 'Returned latitude matches coordinates')

    // 3.2 Patient 2 tries to access Patient 1's request -> 403 Forbidden
    const pat2GetPat1ReqRes = await fetch(`${BASE}/emergency/requests/${emergencyReq.id}`, {
      headers: { Authorization: `Bearer ${pat2Token}` }
    })
    assert(pat2GetPat1ReqRes.status === 403, 'Cross-patient privacy guard: Patient 2 forbidden from accessing Patient 1 request (HTTP 403)')

    // 3.3 Non-existent emergency request returns 404
    const notFoundReqRes = await fetch(`${BASE}/emergency/requests/999999`, {
      headers: { Authorization: `Bearer ${pat1Token}` }
    })
    assert(notFoundReqRes.status === 404, 'Non-existent emergency request returns HTTP 404')

    // -------------------------------------------------------------
    // SECTION 4: AMBULANCE QUEUE, ASSIGNMENT & TELEMETRY
    // -------------------------------------------------------------
    console.log('\n[TEST 4] Ambulance Portal: Queue, Assignment & Telemetry...')

    // 4.1 Ambulance views active emergency queue
    const ambQueueRes = await fetch(`${BASE}/ambulance/requests?activeOnly=true`, {
      headers: { Authorization: `Bearer ${amb1Token}` }
    })
    const ambQueueData = await ambQueueRes.json()
    assert(ambQueueRes.status === 200 && Array.isArray(ambQueueData.requests), 'Ambulance successfully retrieves active dispatch queue')
    const foundInQueue = ambQueueData.requests.some(r => r.id === emergencyReq.id)
    assert(foundInQueue, 'Patient 1 emergency request is present in active ambulance queue')

    // 4.2 Ambulance retrieves patient location telemetry
    const locRes = await fetch(`${BASE}/ambulance/requests/${emergencyReq.id}/location`, {
      headers: { Authorization: `Bearer ${amb1Token}` }
    })
    const locData = await locRes.json()
    assert(locRes.status === 200 && locData.success, 'Ambulance successfully retrieves patient location telemetry')
    assert(Number(locData.location.latitude) === 28.5921, 'Location telemetry contains correct latitude')
    assert(Number(locData.location.longitude) === 77.0460, 'Location telemetry contains correct longitude')
    assert(locData.location.pickupLocation === emergencyReq.pickup_location, 'Location telemetry contains pickup location')
    assert(!locData.location.prescriptions && !locData.location.medicalHistory, 'Location telemetry does NOT leak unnecessary private medical records')

    // 4.3 Invalid ambulance ID assignment rejected
    const invalidAmbAssignRes = await fetch(`${BASE}/ambulance/requests/${emergencyReq.id}/assign`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${amb1Token}`
      },
      body: JSON.stringify({ ambulanceId: 99999 })
    })
    assert(invalidAmbAssignRes.status === 404, 'Invalid ambulance ID assignment rejected with HTTP 404')

    // 4.4 Ambulance 1 assigns request
    const assignRes = await fetch(`${BASE}/ambulance/requests/${emergencyReq.id}/assign`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${amb1Token}`
      },
      body: JSON.stringify({ ambulanceId: 1 })
    })
    const assignData = await assignRes.json()
    assert(assignRes.status === 200 && assignData.success, 'Ambulance 1 successfully assigned to emergency request')
    assert(assignData.request.status === 'Assigned', 'Emergency request status transitioned to "Assigned"')
    assert(Number(assignData.request.ambulance_id) === 1, 'Assigned ambulance ID is set to 1')
    assert(!!assignData.request.assigned_at, 'Assignment timestamp recorded')
    assert(assignData.request.ambulance_number === 'Ambulance Unit #08', 'Assigned ambulance number included')
    assert(assignData.request.vehicle_number === 'DL-01-EQ-9041', 'Assigned vehicle registration number included')

    // 4.5 Patient 1 checks status and sees assigned ambulance
    const pat1CheckAssignRes = await fetch(`${BASE}/emergency/requests/${emergencyReq.id}`, {
      headers: { Authorization: `Bearer ${pat1Token}` }
    })
    const pat1CheckAssignData = await pat1CheckAssignRes.json()
    assert(pat1CheckAssignRes.status === 200, 'Patient 1 fetches updated assigned request')
    assert(pat1CheckAssignData.request.status === 'Assigned', 'Patient 1 sees updated status "Assigned"')
    assert(pat1CheckAssignData.request.ambulanceNumber === 'Ambulance Unit #08', 'Patient 1 sees assigned ambulance unit')
    assert(pat1CheckAssignData.request.vehicleNumber === 'DL-01-EQ-9041', 'Patient 1 sees vehicle number')

    // -------------------------------------------------------------
    // SECTION 5: SCENE ASSESSMENT
    // -------------------------------------------------------------
    console.log('\n[TEST 5] Scene Assessment (Paramedic On-Scene)...')

    // 5.1 Unauthenticated ambulance cannot submit scene assessment
    const unauthAssessRes = await fetch(`${BASE}/ambulance/requests/${emergencyReq.id}/assessment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ incidentCategory: 'Road Accident' })
    })
    assert(unauthAssessRes.status === 401, 'Unauthenticated ambulance cannot submit scene assessment (HTTP 401)')

    // 5.2 Missing incident category rejected
    const missingCatRes = await fetch(`${BASE}/ambulance/requests/${emergencyReq.id}/assessment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${amb1Token}`
      },
      body: JSON.stringify({ patientName: 'Test Patient' })
    })
    assert(missingCatRes.status === 400, 'Missing incident category rejected with HTTP 400')

    // 5.3 Invalid incident category rejected
    const invalidCatRes = await fetch(`${BASE}/ambulance/requests/${emergencyReq.id}/assessment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${amb1Token}`
      },
      body: JSON.stringify({ incidentCategory: 'Alien Abduction' })
    })
    assert(invalidCatRes.status === 400, 'Invalid incident category rejected with HTTP 400')

    // 5.4 Invalid patient condition rejected
    const invalidCondRes = await fetch(`${BASE}/ambulance/requests/${emergencyReq.id}/assessment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${amb1Token}`
      },
      body: JSON.stringify({ incidentCategory: 'Road Accident', patientCondition: 'Levitating' })
    })
    assert(invalidCondRes.status === 400, 'Invalid patient condition rejected with HTTP 400')

    // 5.5 Valid scene assessment with optional patient identity
    const assessRes = await fetch(`${BASE}/ambulance/requests/${emergencyReq.id}/assessment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${amb1Token}`
      },
      body: JSON.stringify({
        patientName: 'Rajesh Kumar Verma',
        patientAge: '45',
        patientGender: 'Male',
        incidentCategory: 'Road Accident',
        incidentDescription: 'Two-wheeler collision near metro pillar 420',
        patientCondition: 'Conscious'
      })
    })
    const assessData = await assessRes.json()
    assert(assessRes.status === 200 && assessData.success, 'Scene assessment saved successfully')
    assert(assessData.request.incident_category === 'Road Accident', 'Incident category recorded as "Road Accident"')
    assert(assessData.request.patient_condition === 'Conscious', 'Patient condition recorded as "Conscious"')
    assert(assessData.request.patient_name === 'Rajesh Kumar Verma', 'Patient name recorded from scene assessment')
    assert(assessData.request.patient_age === '45', 'Patient age recorded from scene assessment')
    assert(assessData.request.patient_gender === 'Male', 'Patient gender recorded from scene assessment')

    // 5.6 Scene assessment without patient identity (identity unknown)
    // Create a new request for this test
    const p2CreateRes = await fetch(`${BASE}/emergency/requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${pat2Token}`
      },
      body: JSON.stringify({
        latitude: 28.6139,
        longitude: 77.2090,
        locationAccuracy: 10,
        pickupLocation: 'Connaught Place Outer Circle, New Delhi'
      })
    })
    const p2CreateData = await p2CreateRes.json()
    assert(p2CreateRes.status === 201, 'Patient 2 creates emergency request')
    const p2Req = p2CreateData.request

    // Assign ambulance 2 to patient 2
    const p2AssignRes = await fetch(`${BASE}/ambulance/requests/${p2Req.id}/assign`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${amb2Token}`
      },
      body: JSON.stringify({ ambulanceId: 2 })
    })
    assert(p2AssignRes.status === 200, 'Ambulance 2 assigned to Patient 2 request')

    // Submit assessment without patient name/age/gender
    const anonAssessRes = await fetch(`${BASE}/ambulance/requests/${p2Req.id}/assessment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${amb2Token}`
      },
      body: JSON.stringify({
        incidentCategory: 'Fall',
        patientCondition: 'Unknown'
      })
    })
    const anonAssessData = await anonAssessRes.json()
    assert(anonAssessRes.status === 200 && anonAssessData.success, 'Scene assessment without patient identity succeeds')
    assert(anonAssessData.request.incident_category === 'Fall', 'Incident category "Fall" recorded without patient identity')

    // 5.7 Assessment for non-existent request returns 404
    const noReqAssessRes = await fetch(`${BASE}/ambulance/requests/999999/assessment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${amb1Token}`
      },
      body: JSON.stringify({ incidentCategory: 'Burn' })
    })
    assert(noReqAssessRes.status === 404, 'Assessment for non-existent request returns HTTP 404')

    // -------------------------------------------------------------
    // SECTION 6: PRE-ARRIVAL ALERT
    // -------------------------------------------------------------
    console.log('\n[TEST 6] Pre-Arrival Emergency Alert...')

    // 6.1 Pre-arrival alert requires scene assessment first
    // Create a fresh request to test this guard
    const freshReqRes = await fetch(`${BASE}/emergency/requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${pat1Token}`
      },
      body: JSON.stringify({
        latitude: 28.7041,
        longitude: 77.1025,
        locationAccuracy: 8,
        pickupLocation: 'India Gate, New Delhi'
      })
    })
    const freshReqData = await freshReqRes.json()
    assert(freshReqRes.status === 201, 'Fresh emergency request created for pre-arrival alert test')
    const freshReqId = freshReqData.request.id

    const alertWithoutAssessRes = await fetch(`${BASE}/ambulance/requests/${freshReqId}/prearrival-alert`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${amb1Token}` }
    })
    const alertWithoutAssessData = await alertWithoutAssessRes.json()
    assert(alertWithoutAssessRes.status === 400, 'Pre-arrival alert rejected without scene assessment (HTTP 400)')

    // 6.2 Send pre-arrival alert after assessment (using emergencyReq which has assessment)
    const alertRes = await fetch(`${BASE}/ambulance/requests/${emergencyReq.id}/prearrival-alert`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${amb1Token}` }
    })
    const alertData = await alertRes.json()
    assert(alertRes.status === 200 && alertData.success, 'Pre-arrival alert sent successfully')
    assert(alertData.duplicate === false, 'First alert is not marked as duplicate')
    assert(!!alertData.alert.prearrivalAlertSentAt, 'Alert timestamp recorded')
    assert(alertData.alert.requestNumber === emergencyReq.request_number, 'Alert contains request number')
    assert(alertData.alert.incidentCategory === 'Road Accident', 'Alert contains incident category')
    assert(alertData.alert.patientCondition === 'Conscious', 'Alert contains patient condition')

    // 6.3 Duplicate pre-arrival alert handled safely
    const dupAlertRes = await fetch(`${BASE}/ambulance/requests/${emergencyReq.id}/prearrival-alert`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${amb1Token}` }
    })
    const dupAlertData = await dupAlertRes.json()
    assert(dupAlertRes.status === 200 && dupAlertData.success, 'Duplicate pre-arrival alert does not error')
    assert(dupAlertData.duplicate === true, 'Duplicate alert correctly flagged')

    // 6.4 Unauthenticated ambulance cannot send pre-arrival alert
    const unauthAlertRes = await fetch(`${BASE}/ambulance/requests/${emergencyReq.id}/prearrival-alert`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    })
    assert(unauthAlertRes.status === 401, 'Unauthenticated ambulance cannot send pre-arrival alert (HTTP 401)')

    // 6.5 Pre-arrival alert for non-existent request returns 404
    const alertNoReqRes = await fetch(`${BASE}/ambulance/requests/999999/prearrival-alert`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${amb1Token}` }
    })
    assert(alertNoReqRes.status === 404, 'Pre-arrival alert for non-existent request returns HTTP 404')

    // -------------------------------------------------------------
    // SECTION 7: HOSPITAL RECEIVING DESTINATION
    // -------------------------------------------------------------
    console.log('\n[TEST 7] Hospital Receiving Destination Assignment...')

    // 7.1 Missing hospital name rejected
    const noHospitalRes = await fetch(`${BASE}/emergency/requests/${emergencyReq.id}/destination`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ building: 'Block A' })
    })
    assert(noHospitalRes.status === 400, 'Missing hospital name rejected with HTTP 400')

    // 7.2 Assign receiving destination
    const destRes = await fetch(`${BASE}/emergency/requests/${emergencyReq.id}/destination`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        hospital: 'District Civil Hospital',
        building: 'Emergency Block A',
        floor: 'Ground Floor',
        unit: 'Trauma Unit',
        room: 'Bay 03'
      })
    })
    const destData = await destRes.json()
    assert(destRes.status === 200 && destData.success, 'Receiving destination assigned successfully')
    assert(destData.request.receiving_hospital === 'District Civil Hospital', 'Receiving hospital recorded')
    assert(destData.request.receiving_building === 'Emergency Block A', 'Receiving building recorded')
    assert(destData.request.receiving_floor === 'Ground Floor', 'Receiving floor recorded')
    assert(destData.request.receiving_unit === 'Trauma Unit', 'Receiving unit recorded')
    assert(destData.request.receiving_room === 'Bay 03', 'Receiving room/bay recorded')

    // 7.3 Non-existent request destination assignment returns 404
    const noReqDestRes = await fetch(`${BASE}/emergency/requests/999999/destination`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hospital: 'Test Hospital' })
    })
    assert(noReqDestRes.status === 404, 'Destination assignment for non-existent request returns HTTP 404')

    // 7.4 Ambulance retrieves receiving destination
    const ambDestRes = await fetch(`${BASE}/ambulance/requests/${emergencyReq.id}/destination`, {
      headers: { Authorization: `Bearer ${amb1Token}` }
    })
    const ambDestData = await ambDestRes.json()
    assert(ambDestRes.status === 200 && ambDestData.success, 'Ambulance retrieves receiving destination')
    assert(ambDestData.destination.receivingHospital === 'District Civil Hospital', 'Ambulance sees receiving hospital')
    assert(ambDestData.destination.receivingBuilding === 'Emergency Block A', 'Ambulance sees receiving building')
    assert(ambDestData.destination.receivingRoom === 'Bay 03', 'Ambulance sees receiving room/bay')

    // 7.5 Patient retrieves receiving destination (privacy-safe)
    const patDestRes = await fetch(`${BASE}/emergency/requests/${emergencyReq.id}/destination`, {
      headers: { Authorization: `Bearer ${pat1Token}` }
    })
    const patDestData = await patDestRes.json()
    assert(patDestRes.status === 200 && patDestData.success, 'Patient retrieves receiving destination')
    assert(patDestData.destination.receivingHospital === 'District Civil Hospital', 'Patient sees receiving hospital')
    assert(patDestData.destination.receivingRoom === 'Bay 03', 'Patient sees receiving room/bay')

    // 7.6 Patient 2 cannot access Patient 1 destination (privacy guard)
    const pat2DestRes = await fetch(`${BASE}/emergency/requests/${emergencyReq.id}/destination`, {
      headers: { Authorization: `Bearer ${pat2Token}` }
    })
    assert(pat2DestRes.status === 403, 'Cross-patient destination privacy guard: Patient 2 forbidden (HTTP 403)')

    // -------------------------------------------------------------
    // SECTION 8: STATUS LIFECYCLE & OPERATIONAL TRANSITIONS
    // -------------------------------------------------------------
    console.log('\n[TEST 8] Status Lifecycle & State Transitions...')

    // 8.1 Unauthorized Ambulance 2 cannot update Ambulance 1's assigned request
    const unauthAmb2UpdateRes = await fetch(`${BASE}/ambulance/requests/${emergencyReq.id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${amb2Token}`
      },
      body: JSON.stringify({ status: 'En Route' })
    })
    assert(unauthAmb2UpdateRes.status === 403, 'Unauthorized Ambulance 2 rejected from modifying Ambulance 1 request (HTTP 403)')

    // 8.2 Invalid status value rejected
    const invalidStatusRes = await fetch(`${BASE}/ambulance/requests/${emergencyReq.id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${amb1Token}`
      },
      body: JSON.stringify({ status: 'FLYING_AIRBORNE' })
    })
    assert(invalidStatusRes.status === 400, 'Invalid operational status rejected with HTTP 400')

    // 8.3 Valid Transition 1: Assigned -> En Route
    const enRouteRes = await fetch(`${BASE}/ambulance/requests/${emergencyReq.id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${amb1Token}`
      },
      body: JSON.stringify({ status: 'En Route' })
    })
    const enRouteData = await enRouteRes.json()
    assert(enRouteRes.status === 200 && enRouteData.request.status === 'En Route', 'Status transitioned to "En Route"')

    // 8.4 Valid Transition 2: En Route -> Arrived
    const arrivedRes = await fetch(`${BASE}/ambulance/requests/${emergencyReq.id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${amb1Token}`
      },
      body: JSON.stringify({ status: 'Arrived' })
    })
    const arrivedData = await arrivedRes.json()
    assert(arrivedRes.status === 200 && arrivedData.request.status === 'Arrived', 'Status transitioned to "Arrived"')

    // 8.5 Valid Transition 3: Arrived -> Completed
    const completedRes = await fetch(`${BASE}/ambulance/requests/${emergencyReq.id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${amb1Token}`
      },
      body: JSON.stringify({ status: 'Completed' })
    })
    const completedData = await completedRes.json()
    assert(completedRes.status === 200 && completedData.request.status === 'Completed', 'Status transitioned to "Completed"')
    assert(!!completedData.request.completed_at, 'Completion timestamp recorded')

    // 8.6 Duplicate completion prevented
    const dupCompletedRes = await fetch(`${BASE}/ambulance/requests/${emergencyReq.id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${amb1Token}`
      },
      body: JSON.stringify({ status: 'Completed' })
    })
    assert(dupCompletedRes.status === 400, 'Duplicate completion attempt rejected with HTTP 400')

    // 8.7 Cannot assign an already completed emergency request
    const reassignCompletedRes = await fetch(`${BASE}/ambulance/requests/${emergencyReq.id}/assign`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${amb1Token}`
      },
      body: JSON.stringify({ ambulanceId: 1 })
    })
    assert(reassignCompletedRes.status === 400, 'Assignment on completed request rejected with HTTP 400')

    // 8.8 Patient 1 views completed status
    const pat1FinalRes = await fetch(`${BASE}/emergency/requests/${emergencyReq.id}`, {
      headers: { Authorization: `Bearer ${pat1Token}` }
    })
    const pat1FinalData = await pat1FinalRes.json()
    assert(pat1FinalRes.status === 200 && pat1FinalData.request.status === 'Completed', 'Patient sees final "Completed" status')
    assert(!!pat1FinalData.request.completedAt, 'Patient sees completion timestamp')

    // -------------------------------------------------------------
    // SECTION 9: UI ALIAS STATUSES & MULTI-REQUEST QUEUE
    // -------------------------------------------------------------
    console.log('\n[TEST 9] UI Alias Compatibility & Queue Management...')

    // 9.1 Second request number format
    assert(/^EMG-\d{4}-\d{6}$/.test(p2Req.request_number), 'Second request number has sequential EMG format')

    // 9.2 Test UI Alias 'On the Way' (alias for 'En Route')
    const onTheWayRes = await fetch(`${BASE}/ambulance/requests/${p2Req.id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${amb2Token}`
      },
      body: JSON.stringify({ status: 'On the Way' })
    })
    const onTheWayData = await onTheWayRes.json()
    assert(onTheWayRes.status === 200 && onTheWayData.request.status === 'En Route', 'UI alias "On the Way" accepted and normalized to "En Route"')

    // 9.3 Ambulance destination for non-existent request returns 404
    const noReqAmbDestRes = await fetch(`${BASE}/ambulance/requests/999999/destination`, {
      headers: { Authorization: `Bearer ${amb1Token}` }
    })
    assert(noReqAmbDestRes.status === 404, 'Ambulance destination for non-existent request returns HTTP 404')

    // 9.4 Patient privacy: Patient cannot see clinical assessment via emergency request endpoint
    const pat1FinalCheck = await fetch(`${BASE}/emergency/requests/${emergencyReq.id}`, {
      headers: { Authorization: `Bearer ${pat1Token}` }
    })
    const pat1FinalCheckData = await pat1FinalCheck.json()
    assert(!pat1FinalCheckData.request.incidentDescription && !pat1FinalCheckData.request.incident_description, 'Patient view does not leak incident description from responder assessment')

  } catch (err) {
    console.error('[UNEXPECTED ERROR]', err)
    failed++
  } finally {
    server.close()
    console.log('\n=================================================================')
    console.log(`  PROCESS 9 EMERGENCY TESTS COMPLETE: ${passed} PASSED, ${failed} FAILED`)
    console.log('=================================================================')
    if (failed > 0) {
      process.exit(1)
    }
  }
}

runTests()
