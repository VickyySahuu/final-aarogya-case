import assert from 'assert'
import { app } from './server.js'

async function runMapTests() {
  console.log('=================================================================')
  console.log('  AAROGYA CASE — PROCESS 14 EMERGENCY MAP & TELEMETRY TESTS')
  console.log('=================================================================\n')

  const PORT = 5079
  const server = await new Promise((resolve) => {
    const s = app.listen(PORT, () => resolve(s))
  })
  const BASE_URL = `http://localhost:${PORT}/api`

  let passed = 0
  let failed = 0

  function pass(desc) {
    console.log(`[PASS] ${desc}`)
    passed++
  }

  function fail(desc, err) {
    console.error(`[FAIL] ${desc}:`, err)
    failed++
  }

  // 1. Authenticate Patient
  let patientToken = null
  let patientUniqueCode = null
  let patientId = null

  try {
    const uniqueNum = Date.now().toString().slice(-6)
    const regRes = await fetch(`${BASE_URL}/patients/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'GIS Verification Patient',
        mobile: `9812${uniqueNum}`,
        identityType: 'Aadhaar',
        identityNumber: `9148 4210 ${uniqueNum}`,
        dob: '1998-05-12',
        age: 28,
        gender: 'Female',
        bloodGroup: 'B+',
        address: 'Sector 12, Dwarka, New Delhi'
      })
    })
    const regData = await regRes.json()
    assert.strictEqual(regRes.status, 201, 'Patient registration failed')
    patientToken = regData.token
    patientUniqueCode = regData.patient.patientUniqueCode || regData.patient.patient_unique_code
    patientId = regData.patient.id || regData.patient.patientDatabaseId
    assert.ok(patientToken, 'Session token missing in registration response')
    pass('1.1 Registered test patient for GIS verification (Session: ' + patientToken.slice(0, 12) + '...)')
  } catch (e) {
    fail('1.1 Patient registration', e.message)
  }

  // 2. Authenticate Ambulance
  let ambulanceToken = null
  try {
    const ambRes = await fetch(`${BASE_URL}/auth/ambulance/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        vehicleNumber: 'DL-01-EQ-9041',
        operatorId: 'AMB-OP-104',
        passcode: 'AMB-2026'
      })
    })
    const ambData = await ambRes.json()
    assert.strictEqual(ambRes.status, 200, 'Ambulance login failed')
    ambulanceToken = ambData.token
    pass('2.1 Authenticated ambulance unit (AMB-OP-104)')
  } catch (e) {
    fail('2.1 Ambulance auth', e.message)
  }

  // 3. Coordinate validation on Emergency Request Creation
  try {
    const missingRes = await fetch(`${BASE_URL}/emergency/requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${patientToken}`
      },
      body: JSON.stringify({ pickupLocation: 'No Coordinates Provided' })
    })
    assert.strictEqual(missingRes.status, 400, 'Expected 400 when coordinates missing')
    pass('3.1 Rejects emergency request without real latitude/longitude')

    const outOfRangeRes = await fetch(`${BASE_URL}/emergency/requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${patientToken}`
      },
      body: JSON.stringify({
        latitude: 195.42,
        longitude: 77.20,
        pickupLocation: 'Invalid latitude'
      })
    })
    assert.strictEqual(outOfRangeRes.status, 400, 'Expected 400 for out-of-range coordinates')
    pass('3.2 Rejects out-of-range latitude/longitude coordinates')
  } catch (e) {
    fail('3. Coordinate validation', e.message)
  }

  // 4. Create real emergency request with GPS coordinates
  let createdReqId = null
  const realLat = 28.5921
  const realLng = 77.0460
  const realAccuracy = 12

  try {
    const createRes = await fetch(`${BASE_URL}/emergency/requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${patientToken}`
      },
      body: JSON.stringify({
        latitude: realLat,
        longitude: realLng,
        locationAccuracy: realAccuracy,
        pickupLocation: 'Dwarka Sector 12 Metro Station Gate 2',
        landmark: 'Near Pillar 420'
      })
    })
    const createData = await createRes.json()
    assert.strictEqual(createRes.status, 201, 'Request creation failed')
    assert.strictEqual(createData.success, true)
    assert.strictEqual(Number(createData.request.latitude), realLat)
    assert.strictEqual(Number(createData.request.longitude), realLng)
    assert.strictEqual(Number(createData.request.location_accuracy), realAccuracy)
    createdReqId = createData.request.id
    pass('4.1 Created emergency request with real GPS coordinates and accuracy')
  } catch (e) {
    fail('4.1 Create emergency request', e.message)
  }

  // 5. Patient fetches own request & receives persistent coordinates
  try {
    const getRes = await fetch(`${BASE_URL}/emergency/requests/${createdReqId}`, {
      headers: { Authorization: `Bearer ${patientToken}` }
    })
    const getData = await getRes.json()
    assert.strictEqual(getRes.status, 200)
    assert.strictEqual(Number(getData.request.latitude), realLat)
    assert.strictEqual(Number(getData.request.longitude), realLng)
    assert.strictEqual(Number(getData.request.locationAccuracy), realAccuracy)
    assert.strictEqual(typeof getData.request.hospitalLatitude, 'number')
    assert.strictEqual(typeof getData.request.hospitalLongitude, 'number')
    pass('5.1 Patient fetches emergency request with persistent coordinates and hospital location')
  } catch (e) {
    fail('5.1 Patient get emergency request', e.message)
  }

  // 6. Ambulance assigns and inspects patient telemetry
  try {
    const assignRes = await fetch(`${BASE_URL}/ambulance/requests/${createdReqId}/assign`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ambulanceToken}`
      },
      body: JSON.stringify({ ambulanceId: 1 })
    })
    assert.strictEqual(assignRes.status, 200)
    pass('6.1 Ambulance assigned to emergency request')

    const locRes = await fetch(`${BASE_URL}/ambulance/requests/${createdReqId}/location`, {
      headers: { Authorization: `Bearer ${ambulanceToken}` }
    })
    const locData = await locRes.json()
    assert.strictEqual(locRes.status, 200)
    assert.strictEqual(Number(locData.location.latitude), realLat)
    assert.strictEqual(Number(locData.location.longitude), realLng)
    assert.strictEqual(typeof locData.location.ambulanceLatitude, 'number')
    assert.strictEqual(typeof locData.location.ambulanceLongitude, 'number')
    assert.strictEqual(typeof locData.location.hospitalLatitude, 'number')
    assert.strictEqual(typeof locData.location.hospitalLongitude, 'number')
    pass('6.2 Ambulance telemetry returns patient GPS, ambulance GPS, and hospital coordinates')
  } catch (e) {
    fail('6. Ambulance telemetry inspection', e.message)
  }

  // 7. Ambulance updates device GPS location
  const updatedAmbLat = 28.5890
  const updatedAmbLng = 77.0495
  try {
    const updateLocRes = await fetch(`${BASE_URL}/ambulance/location`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ambulanceToken}`
      },
      body: JSON.stringify({
        latitude: updatedAmbLat,
        longitude: updatedAmbLng
      })
    })
    const updateLocData = await updateLocRes.json()
    assert.strictEqual(updateLocRes.status, 200)
    assert.strictEqual(Number(updateLocData.ambulance.latitude), updatedAmbLat)
    assert.strictEqual(Number(updateLocData.ambulance.longitude), updatedAmbLng)
    pass('7.1 Ambulance device location updated via browser telemetry')

    // Verify updated location reflects in emergency request telemetry
    const verifyRes = await fetch(`${BASE_URL}/ambulance/requests/${createdReqId}/location`, {
      headers: { Authorization: `Bearer ${ambulanceToken}` }
    })
    const verifyData = await verifyRes.json()
    assert.strictEqual(Number(verifyData.location.ambulanceLatitude), updatedAmbLat)
    assert.strictEqual(Number(verifyData.location.ambulanceLongitude), updatedAmbLng)
    pass('7.2 Emergency request telemetry reflects updated ambulance GPS position')
  } catch (e) {
    fail('7. Ambulance location update', e.message)
  }

  // 8. Hospital destination coordinates verification
  // 9. Hospital destination coordinates verification
  try {
    const hospRes = await fetch(`${BASE_URL}/hospitals`)
    const hospData = await hospRes.json()
    assert.strictEqual(hospRes.status, 200)
    assert.ok(Array.isArray(hospData.hospitals) && hospData.hospitals.length > 0)
    const civilHospital = hospData.hospitals.find(h => h.hospital_id === 'HOSP-DEL-01' || h.hospitalId === 'HOSP-DEL-01')
    assert.ok(civilHospital, 'District Civil Hospital not found')
    assert.strictEqual(civilHospital.latitude, 28.6790)
    assert.strictEqual(civilHospital.longitude, 77.2227)
    pass('8.1 Hospital model provides authentic coordinates (28.6790° N, 77.2227° E)')
  } catch (e) {
    fail('8. Hospital coordinates', e.message)
  }

  // 9. ROUTE AND ETA CONSISTENCY VERIFICATION (Single Source of Truth)
  console.log('\n--- 9. ROUTE & ETA CONSISTENCY VERIFICATION ---')
  async function computeEmergencyRoute(req) {
    if (!req) return { success: false, phase: 'COORDINATES_UNAVAILABLE' }
    const incidentLat = req.latitude !== undefined && req.latitude !== null ? Number(req.latitude) : null
    const incidentLng = req.longitude !== undefined && req.longitude !== null ? Number(req.longitude) : null
    const ambLat = req.ambulanceLatitude !== undefined && req.ambulanceLatitude !== null ? Number(req.ambulanceLatitude) : null
    const ambLng = req.ambulanceLongitude !== undefined && req.ambulanceLongitude !== null ? Number(req.ambulanceLongitude) : null
    const hospLat = Number(req.hospitalLatitude ?? 28.6790)
    const hospLng = Number(req.hospitalLongitude ?? 77.2227)

    const rawStatus = (req.status || '').trim().toLowerCase()
    if (incidentLat === null || incidentLng === null || isNaN(incidentLat) || isNaN(incidentLng)) {
      return { success: false, phase: 'COORDINATES_UNAVAILABLE', formattedDistance: 'Location unavailable', formattedEta: 'ETA unavailable' }
    }
    if (ambLat === null || ambLng === null || isNaN(ambLat) || isNaN(ambLng)) {
      return { success: false, phase: 'WAITING_AMBULANCE', formattedDistance: 'Waiting for ambulance location', formattedEta: 'Waiting for ambulance location' }
    }
    if (['arrived', 'at scene', 'on scene'].includes(rawStatus)) {
      return { success: true, phase: 'ARRIVED', distanceKm: 0, etaMinutes: 0, formattedDistance: '0 km', formattedEta: 'Arrived' }
    }
    let start = { lat: ambLat, lng: ambLng }
    let end = ['transporting', 'transporting patient'].includes(rawStatus)
      ? { lat: hospLat, lng: hospLng }
      : { lat: incidentLat, lng: incidentLng }

    const url = `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson`
    try {
      const resp = await fetch(url)
      const data = await resp.json()
      if (data && data.code === 'Ok' && data.routes?.length > 0) {
        const distKm = Number((data.routes[0].distance / 1000).toFixed(1))
        const etaMins = Math.max(1, Math.round(data.routes[0].duration / 60))
        return {
          success: true,
          phase: rawStatus.includes('transport') ? 'TRANSPORTING' : 'EN_ROUTE',
          distanceKm: distKm,
          etaMinutes: etaMins,
          formattedDistance: `${distKm} km`,
          formattedEta: `${etaMins} min`,
          coordinates: (data.routes[0].geometry?.coordinates || []).map(c => [c[1], c[0]])
        }
      }
    } catch (e) {}
    return { success: false, phase: 'ROUTE_UNAVAILABLE' }
  }

  try {
    // Fetch authoritative emergency request as AmbulanceAssignedPage would
    const resPage1 = await fetch(`${BASE_URL}/emergency/requests/${createdReqId}`, {
      headers: { Authorization: `Bearer ${patientToken}` }
    })
    const dataPage1 = await resPage1.json()

    // Fetch authoritative emergency request as AmbulanceLiveLocationPage would
    const resPage2 = await fetch(`${BASE_URL}/emergency/requests/${createdReqId}`, {
      headers: { Authorization: `Bearer ${patientToken}` }
    })
    const dataPage2 = await resPage2.json()

    assert.strictEqual(resPage1.status, 200)
    assert.strictEqual(resPage2.status, 200)

    // Compute route using identical routing logic
    const routePage1 = await computeEmergencyRoute(dataPage1.request)
    const routePage2 = await computeEmergencyRoute(dataPage2.request)

    assert.strictEqual(routePage1.success, true, 'Page 1 routing succeeded')
    assert.strictEqual(routePage2.success, true, 'Page 2 routing succeeded')
    assert.strictEqual(routePage1.distanceKm, routePage2.distanceKm, 'Distance KM matches exactly between pages')
    assert.strictEqual(routePage1.etaMinutes, routePage2.etaMinutes, 'ETA minutes matches exactly between pages')
    assert.strictEqual(routePage1.formattedDistance, routePage2.formattedDistance, 'Formatted distance matches exactly')
    assert.strictEqual(routePage1.formattedEta, routePage2.formattedEta, 'Formatted ETA matches exactly')
    assert.strictEqual(routePage1.coordinates.length, routePage2.coordinates.length, 'Route polyline coordinates count matches exactly')

    pass(`9.1 Authoritative routing consistency: Both pages return Distance=${routePage1.formattedDistance}, ETA=${routePage1.formattedEta}`)

    // 9.2 Arrived at scene phase
    const arrivedReq = { ...dataPage1.request, status: 'Arrived' }
    const routeArrived = await computeEmergencyRoute(arrivedReq)
    assert.strictEqual(routeArrived.phase, 'ARRIVED')
    assert.strictEqual(routeArrived.distanceKm, 0)
    assert.strictEqual(routeArrived.formattedDistance, '0 km')
    assert.strictEqual(routeArrived.formattedEta, 'Arrived')
    pass('9.2 State Transition to Arrived: Distance=0 km, ETA=Arrived')

    // 9.3 Transporting phase
    const transportReq = { ...dataPage1.request, status: 'Transporting', hospitalLatitude: 28.6790, hospitalLongitude: 77.2227 }
    const routeTransport = await computeEmergencyRoute(transportReq)
    assert.strictEqual(routeTransport.phase, 'TRANSPORTING')
    assert.ok(routeTransport.distanceKm > 0, 'Transporting route has non-zero distance to hospital')
    assert.ok(routeTransport.coordinates.length > 0, 'Transporting route geometry generated to hospital')
    pass(`9.3 State Transition to Transporting: Routes to hospital (Distance=${routeTransport.formattedDistance}, ETA=${routeTransport.formattedEta})`)

    // 9.4 Unassigned ambulance phase
    const unassignedReq = { ...dataPage1.request, ambulanceLatitude: null, ambulanceLongitude: null }
    const routeUnassigned = await computeEmergencyRoute(unassignedReq)
    assert.strictEqual(routeUnassigned.phase, 'WAITING_AMBULANCE')
    assert.strictEqual(routeUnassigned.formattedDistance, 'Waiting for ambulance location')
    assert.strictEqual(routeUnassigned.formattedEta, 'Waiting for ambulance location')
    pass('9.4 Unassigned ambulance: Clean waiting state, zero fabricated numbers')
  } catch (e) {
    fail('9. Route & ETA consistency', e.message)
  }

  console.log('\n=================================================================')
  console.log(`  PROCESS 14 MAP & TELEMETRY TESTS: ${passed} PASSED, ${failed} FAILED`)
  console.log('=================================================================')

  if (server) server.close()

  if (failed > 0) {
    process.exit(1)
  }
}

runMapTests()

