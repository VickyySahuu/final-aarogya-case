// Automated Test Suite for Process 4: Patient Appointment Booking Lifecycle
import { app } from './server.js'

async function runTests() {
  console.log('--- STARTING PROCESS 4 APPOINTMENT BOOKING TESTS ---')

  const PORT = 5058
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
    console.log('\n[SETUP] Authenticating patient session for booking...')
    const loginRes = await fetch(`${BASE}/auth/patient/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobile: '9876543210' })
    })
    const loginData = await loginRes.json()
    assert(loginRes.status === 200 && !!loginData.token, 'Setup: Patient session established')
    const token = loginData.token
    const patient = loginData.patient
    const permanentUniqueCode = patient.patientUniqueCode

    // -------------------------------------------------------------
    // TEST 1: Authenticated patient can fetch hospitals
    // -------------------------------------------------------------
    console.log('\n[TEST 1] Authenticated patient can fetch hospitals...')
    const hospRes = await fetch(`${BASE}/hospitals`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    const hospData = await hospRes.json()
    assert(hospRes.status === 200, '1.1 GET /api/hospitals returns HTTP 200')
    assert(hospData.success === true, '1.2 Hospitals success is true')
    assert(Array.isArray(hospData.hospitals) && hospData.hospitals.length > 0, '1.3 Hospitals array returned from PostgreSQL')
    const primaryHospital = hospData.hospitals[0]
    assert(!!primaryHospital.name, '1.4 Hospital record contains facility name')

    // -------------------------------------------------------------
    // TEST 2: Authenticated patient can fetch doctors
    // -------------------------------------------------------------
    console.log('\n[TEST 2] Authenticated patient can fetch doctors...')
    const docRes = await fetch(`${BASE}/doctors`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    const docData = await docRes.json()
    assert(docRes.status === 200, '2.1 GET /api/doctors returns HTTP 200')
    assert(docData.success === true, '2.2 Doctors success is true')
    assert(Array.isArray(docData.doctors) && docData.doctors.length > 0, '2.3 Doctors array returned from PostgreSQL')
    const primaryDoctor = docData.doctors[0]
    assert(primaryDoctor.name === 'Dr. Ramanathan Venkatraman', '2.4 Prototype doctor is Dr. Ramanathan Venkatraman')
    assert(!!primaryDoctor.room, '2.5 Doctor record contains OPD Room information')

    // -------------------------------------------------------------
    // TEST 3: Patient can view available slots
    // -------------------------------------------------------------
    console.log('\n[TEST 3] Patient can view available slots...')
    const testDate = '20 Oct 2025'
    const slotsRes = await fetch(`${BASE}/appointments/slots?doctorId=${primaryDoctor.id}&date=${encodeURIComponent(testDate)}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    const slotsData = await slotsRes.json()
    assert(slotsRes.status === 200, '3.1 GET /api/appointments/slots returns HTTP 200')
    assert(Array.isArray(slotsData.morningSlots) && slotsData.morningSlots.length > 0, '3.2 Morning session slots returned')
    assert(Array.isArray(slotsData.afternoonSlots) && slotsData.afternoonSlots.length > 0, '3.3 Afternoon session slots returned')

    // -------------------------------------------------------------
    // TEST 4: Patient can create an appointment
    // -------------------------------------------------------------
    console.log('\n[TEST 4] Patient can create an appointment...')
    const targetSlot = '10:00 AM - 10:30 AM'
    const createAptRes = await fetch(`${BASE}/appointments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        hospitalId: primaryHospital.id,
        doctorId: primaryDoctor.id,
        appointmentDate: testDate,
        timeSlot: targetSlot,
        problem: 'Acute joint tenderness and fever',
        severity: 'Moderate',
        paymentMethod: 'Universal Public Health Free OPD Token',
        paymentStatus: 'Completed'
      })
    })
    const createAptData = await createAptRes.json()
    assert(createAptRes.status === 201, '4.1 POST /api/appointments returns HTTP 201 Created')
    assert(createAptData.success === true, '4.2 Appointment created successfully')
    const createdAppointment = createAptData.appointment
    assert(!!createdAppointment.id, '4.3 Created appointment contains numeric database ID')

    // -------------------------------------------------------------
    // TEST 5: Appointment belongs to the correct patient
    // -------------------------------------------------------------
    console.log('\n[TEST 5] Appointment belongs to the correct patient...')
    assert(createdAppointment.patientId === patient.id, '5.1 Appointment patientId matches authenticated patient DB ID')
    assert(createdAppointment.patientUniqueCode === permanentUniqueCode, '5.2 Appointment links to patient permanent unique code')
    assert(createdAppointment.patientName === patient.name, '5.3 Appointment contains patient name')

    // -------------------------------------------------------------
    // TEST 6: Appointment stores correct doctor/hospital/date/time
    // -------------------------------------------------------------
    console.log('\n[TEST 6] Appointment stores correct doctor/hospital/date/time...')
    assert(createdAppointment.doctorId === primaryDoctor.id, '6.1 Appointment references selected doctor ID')
    assert(createdAppointment.doctorName === primaryDoctor.name, '6.2 Doctor name matches selected practitioner')
    assert(createdAppointment.hospitalName === primaryHospital.name, '6.3 Hospital name matches selected facility')
    assert(createdAppointment.date === testDate, '6.4 Appointment date matches selected date')
    assert(createdAppointment.time === targetSlot, '6.5 Time slot matches selected token window')
    assert(createdAppointment.room === (primaryDoctor.room || 'Room 104'), '6.6 OPD room stored with appointment')

    // -------------------------------------------------------------
    // TEST 7: Appointment number is unique
    // -------------------------------------------------------------
    console.log('\n[TEST 7] Appointment number is unique and distinct from patient unique code...')
    assert(!!createdAppointment.appointmentNumber && createdAppointment.appointmentNumber.startsWith('APT-'), '7.1 Appointment number has valid format APT-YYYY-XXXXXX')
    assert(createdAppointment.appointmentNumber !== permanentUniqueCode, '7.2 Appointment number is distinct from Patient Unique Code')

    // -------------------------------------------------------------
    // TEST 8: Token is generated
    // -------------------------------------------------------------
    console.log('\n[TEST 8] Token number is generated...')
    assert(!!createdAppointment.token && createdAppointment.token.startsWith('#'), '8.1 Token number generated with prefix # (e.g. #14)')

    // -------------------------------------------------------------
    // TEST 9: Payment confirmation finalizes appointment
    // -------------------------------------------------------------
    console.log('\n[TEST 9] Payment confirmation finalizes appointment...')
    assert(createdAppointment.paymentStatus === 'Completed', '9.1 Payment status is finalized as Completed')
    assert(createdAppointment.status === 'Waiting for Doctor', '9.2 Appointment status is confirmed (Waiting for Doctor)')

    // -------------------------------------------------------------
    // TEST 10: Duplicate/unavailable slot is rejected
    // -------------------------------------------------------------
    console.log('\n[TEST 10] Duplicate / unavailable slot is rejected...')
    const duplicateRes = await fetch(`${BASE}/appointments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        hospitalId: primaryHospital.id,
        doctorId: primaryDoctor.id,
        appointmentDate: testDate,
        timeSlot: targetSlot,
        problem: 'Second patient trying same slot',
        severity: 'Mild'
      })
    })
    const duplicateData = await duplicateRes.json()
    assert(duplicateRes.status === 409, '10.1 Duplicate booking for same slot returns HTTP 409 Conflict')
    assert(duplicateData.success === false && duplicateData.message.includes('already booked'), '10.2 Slot conflict error message returned')

    // -------------------------------------------------------------
    // TEST 11: Unauthenticated booking is rejected
    // -------------------------------------------------------------
    console.log('\n[TEST 11] Unauthenticated booking is rejected...')
    const unauthBookRes = await fetch(`${BASE}/appointments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        hospitalId: primaryHospital.id,
        doctorId: primaryDoctor.id,
        appointmentDate: testDate,
        timeSlot: '11:00 AM - 11:30 AM'
      })
    })
    assert(unauthBookRes.status === 401, '11.1 Unauthenticated POST /api/appointments returns HTTP 401 Unauthorized')

    const unauthGetRes = await fetch(`${BASE}/appointments`)
    assert(unauthGetRes.status === 401, '11.2 Unauthenticated GET /api/appointments returns HTTP 401 Unauthorized')

    // -------------------------------------------------------------
    // TEST 12: Appointment can be retrieved
    // -------------------------------------------------------------
    console.log('\n[TEST 12] Appointment can be retrieved by ID and appointment number...')
    const getByIdRes = await fetch(`${BASE}/appointments/${createdAppointment.id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    const getByIdData = await getByIdRes.json()
    assert(getByIdRes.status === 200, '12.1 GET /api/appointments/:id returns HTTP 200')
    assert(getByIdData.appointment?.id === createdAppointment.id, '12.2 Retrieved appointment ID matches')
    assert(getByIdData.appointment?.appointmentNumber === createdAppointment.appointmentNumber, '12.3 Retrieved appointment number matches')

    const getByNumRes = await fetch(`${BASE}/appointments/${createdAppointment.appointmentNumber}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    const getByNumData = await getByNumRes.json()
    assert(getByNumRes.status === 200 && getByNumData.appointment?.id === createdAppointment.id, '12.4 Retrieval by appointment number succeeds')

    // -------------------------------------------------------------
    // TEST 13: Patient Unique Code remains unchanged
    // -------------------------------------------------------------
    console.log('\n[TEST 13] Patient Unique Code remains permanent and unchanged...')
    const meRes = await fetch(`${BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    const meData = await meRes.json()
    assert(meData.patient?.patientUniqueCode === permanentUniqueCode, '13.1 Patient Unique Code in session is unchanged')
    assert(createdAppointment.patientUniqueCode === permanentUniqueCode, '13.2 Patient Unique Code in appointment matches permanent code')

    // -------------------------------------------------------------
    // TEST 14: Existing Process 1 registration still works
    // -------------------------------------------------------------
    console.log('\n[TEST 14] Regression: Process 1 registration still works...')
    const regSuffix = Date.now().toString().slice(-6)
    const newCitizen = {
      name: `Regression Citizen ${regSuffix}`,
      mobile: `9833${regSuffix}`,
      dob: '10/10/1988',
      age: '37',
      gender: 'Male',
      identityType: 'Aadhaar',
      identityNumber: `5544 3322 ${regSuffix}`,
      bloodGroup: 'AB+'
    }
    const regRes = await fetch(`${BASE}/patients/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newCitizen)
    })
    const regData = await regRes.json()
    assert(regRes.status === 201 && regData.success === true, '14.1 Process 1 registration succeeds (HTTP 201)')
    const regPatient = regData.patient

    // -------------------------------------------------------------
    // TEST 15: Existing Process 2 login still works
    // -------------------------------------------------------------
    console.log('\n[TEST 15] Regression: Process 2 login still works...')
    const regLoginRes = await fetch(`${BASE}/auth/patient/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobile: newCitizen.mobile })
    })
    const regLoginData = await regLoginRes.json()
    assert(regLoginRes.status === 200 && !!regLoginData.token, '15.1 Process 2 patient login succeeds (HTTP 200)')
    assert(regLoginData.patient.patientUniqueCode === regPatient.patientUniqueCode, '15.2 Login returns identical Patient Unique Code')
    const regToken = regLoginData.token

    // -------------------------------------------------------------
    // TEST 16: Existing Process 3 case creation still works
    // -------------------------------------------------------------
    console.log('\n[TEST 16] Regression: Process 3 case creation still works...')
    const caseRes = await fetch(`${BASE}/patient-cases`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${regToken}`
      },
      body: JSON.stringify({
        problem: 'Chest congestion with mild breathlessness',
        duration: '1-3-days'
      })
    })
    const caseData = await caseRes.json()
    assert(caseRes.status === 201 && caseData.success === true, '16.1 Process 3 case creation succeeds (HTTP 201)')
    assert(caseData.case?.patientId === regPatient.id, '16.2 Case linked to newly registered patient DB ID')
    assert(caseData.case?.patientUniqueCode === regPatient.patientUniqueCode, '16.3 Case linked to patient permanent unique code')

    console.log('\n==================================================')
    console.log(`PROCESS 4 TEST SUMMARY: ${passed} passed, ${failed} failed`)
    console.log('==================================================')
  } catch (err) {
    console.error('Process 4 test error:', err)
    failed++
  } finally {
    server.close(() => {
      console.log('Process 4 test server closed cleanly.')
      process.exitCode = failed > 0 ? 1 : 0
    })
  }
}

runTests()
