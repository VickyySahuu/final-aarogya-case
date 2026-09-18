import { query, isConnected } from '../db/index.js'

let requestSeq = 1
const generateRequestNumber = () => {
  const year = new Date().getFullYear()
  const num = String(requestSeq++).padStart(6, '0')
  return `EMG-${year}-${num}`
}

// In-memory fallback stores for ambulances and emergency requests
const memoryAmbulances = [
  {
    id: 1,
    ambulance_number: 'Ambulance Unit #08',
    vehicle_number: 'DL-01-EQ-9041',
    specification: 'Advanced Life Support (ALS)',
    base_station: 'South West Dispatch Node • Dwarka Cluster',
    operator_name: 'Paramedic Lead Paramveer / Ravi',
    operator_id: 'AMB-OP-104',
    status: 'available',
    latitude: 28.5823,
    longitude: 77.0500,
    location_updated_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 2,
    ambulance_number: 'Ambulance Unit #02',
    vehicle_number: 'DL-01-EQ-4402',
    specification: 'Basic Life Support (BLS)',
    base_station: 'North Dispatch Node • Rohini Cluster',
    operator_name: 'Paramedic Operator Rajesh',
    operator_id: 'AMB-OP-102',
    status: 'available',
    latitude: 28.7159,
    longitude: 77.1168,
    location_updated_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
]

const memoryEmergencyRequests = []

export const ALLOWED_INCIDENT_CATEGORIES = [
  'Road Accident',
  'Fall',
  'Heart Attack / Chest Pain',
  'Stroke / Sudden Weakness',
  'Breathing Difficulty',
  'Unconscious / Unresponsive',
  'Severe Bleeding',
  'Burn',
  'Poisoning',
  'Seizure',
  'Pregnancy / Obstetric Emergency',
  'Other'
]

export function isValidIncidentCategory(cat) {
  if (!cat || typeof cat !== 'string') return false
  const clean = cat.trim().toLowerCase()
  return ALLOWED_INCIDENT_CATEGORIES.some(c => c.toLowerCase() === clean)
}

export function formatEmergencyRequest(r) {
  if (!r) return null
  return {
    ...r,
    id: r.id,
    requestNumber: r.request_number || r.requestNumber,
    request_number: r.request_number || r.requestNumber,
    patientId: r.patient_id !== undefined ? r.patient_id : r.patientId,
    patient_id: r.patient_id !== undefined ? r.patient_id : r.patientId,
    ambulanceId: r.ambulance_id !== undefined ? r.ambulance_id : r.ambulanceId,
    ambulance_id: r.ambulance_id !== undefined ? r.ambulance_id : r.ambulanceId,
    patientName: r.patient_name || r.patientName || 'Unknown Patient',
    patient_name: r.patient_name || r.patientName || 'Unknown Patient',
    patientUniqueCode: r.patient_unique_code || r.patientUniqueCode || null,
    patient_unique_code: r.patient_unique_code || r.patientUniqueCode || null,
    contactNumber: r.contact_number || r.contactNumber || null,
    contact_number: r.contact_number || r.contactNumber || null,
    patientAge: r.patient_age || r.patientAge || null,
    patient_age: r.patient_age || r.patientAge || null,
    patientGender: r.patient_gender || r.patientGender || null,
    patient_gender: r.patient_gender || r.patientGender || null,
    incidentCategory: r.incident_category || r.incidentCategory || null,
    incident_category: r.incident_category || r.incidentCategory || null,
    incidentDescription: r.incident_description || r.incidentDescription || null,
    incident_description: r.incident_description || r.incidentDescription || null,
    patientCondition: r.patient_condition || r.patientCondition || null,
    patient_condition: r.patient_condition || r.patientCondition || null,
    prearrivalAlertSentAt: r.prearrival_alert_sent_at || r.prearrivalAlertSentAt || null,
    prearrival_alert_sent_at: r.prearrival_alert_sent_at || r.prearrivalAlertSentAt || null,
    receivingHospital: r.receiving_hospital || r.receivingHospital || r.destination || 'District Civil Hospital',
    receiving_hospital: r.receiving_hospital || r.receivingHospital || r.destination || 'District Civil Hospital',
    receivingBuilding: r.receiving_building || r.receivingBuilding || null,
    receiving_building: r.receiving_building || r.receivingBuilding || null,
    receivingFloor: r.receiving_floor || r.receivingFloor || null,
    receiving_floor: r.receiving_floor || r.receivingFloor || null,
    receivingUnit: r.receiving_unit || r.receivingUnit || null,
    receiving_unit: r.receiving_unit || r.receivingUnit || null,
    receivingRoom: r.receiving_room || r.receivingRoom || null,
    receiving_room: r.receiving_room || r.receivingRoom || null,
    latitude: r.latitude !== undefined && r.latitude !== null ? Number(r.latitude) : null,
    longitude: r.longitude !== undefined && r.longitude !== null ? Number(r.longitude) : null,
    locationAccuracy: r.location_accuracy !== undefined && r.location_accuracy !== null ? Number(r.location_accuracy) : (r.locationAccuracy || null),
    location_accuracy: r.location_accuracy !== undefined && r.location_accuracy !== null ? Number(r.location_accuracy) : (r.locationAccuracy || null),
    pickupLocation: r.pickup_location || r.pickupLocation,
    pickup_location: r.pickup_location || r.pickupLocation,
    landmark: r.landmark || null,
    destination: r.destination,
    destinationBay: r.destination_bay || r.destinationBay,
    destination_bay: r.destination_bay || r.destinationBay,
    distance: r.distance,
    eta: r.eta,
    status: r.status,
    assignedAt: r.assigned_at || r.assignedAt || null,
    assigned_at: r.assigned_at || r.assignedAt || null,
    completedAt: r.completed_at || r.completedAt || null,
    completed_at: r.completed_at || r.completedAt || null,
    createdAt: r.created_at || r.createdAt,
    created_at: r.created_at || r.createdAt,
    updatedAt: r.updated_at || r.updatedAt,
    updated_at: r.updated_at || r.updatedAt,
    ambulanceNumber: r.ambulance_number || r.ambulanceNumber || null,
    ambulance_number: r.ambulance_number || r.ambulanceNumber || null,
    vehicleNumber: r.vehicle_number || r.vehicleNumber || null,
    vehicle_number: r.vehicle_number || r.vehicleNumber || null,
    operatorName: r.operator_name || r.operatorName || null,
    operator_name: r.operator_name || r.operatorName || null,
    operatorId: r.operator_id || r.operatorId || null,
    operator_id: r.operator_id || r.operatorId || null,
    specification: r.specification || null,
    baseStation: r.base_station || r.baseStation || null,
    base_station: r.base_station || r.baseStation || null,
    ambulanceLatitude: r.ambulance_latitude !== undefined && r.ambulance_latitude !== null ? Number(r.ambulance_latitude) : (r.ambulanceLatitude !== undefined && r.ambulanceLatitude !== null ? Number(r.ambulanceLatitude) : null),
    ambulance_latitude: r.ambulance_latitude !== undefined && r.ambulance_latitude !== null ? Number(r.ambulance_latitude) : (r.ambulanceLatitude !== undefined && r.ambulanceLatitude !== null ? Number(r.ambulanceLatitude) : null),
    ambulanceLongitude: r.ambulance_longitude !== undefined && r.ambulance_longitude !== null ? Number(r.ambulance_longitude) : (r.ambulanceLongitude !== undefined && r.ambulanceLongitude !== null ? Number(r.ambulanceLongitude) : null),
    ambulance_longitude: r.ambulance_longitude !== undefined && r.ambulance_longitude !== null ? Number(r.ambulance_longitude) : (r.ambulanceLongitude !== undefined && r.ambulanceLongitude !== null ? Number(r.ambulanceLongitude) : null),
    ambulanceLocationUpdatedAt: r.ambulance_location_updated_at || r.ambulanceLocationUpdatedAt || null,
    ambulance_location_updated_at: r.ambulance_location_updated_at || r.ambulanceLocationUpdatedAt || null
  }
}

export const AmbulanceModel = {
  // Clear in-memory state for testing
  clearMemory() {
    requestSeq = 1
    memoryEmergencyRequests.length = 0
    memoryAmbulances[0].status = 'available'
    memoryAmbulances[1].status = 'available'
  },

  async getPrimaryAmbulance() {
    if (isConnected()) {
      try {
        const res = await query('SELECT * FROM ambulances ORDER BY id ASC LIMIT 1')
        if (res.rows[0]) return res.rows[0]
      } catch (e) {
        // fall back to memory
      }
    }
    return memoryAmbulances[0] || null
  },

  async getAllAmbulances() {
    if (isConnected()) {
      try {
        const res = await query('SELECT * FROM ambulances ORDER BY id ASC')
        if (res.rows.length > 0) return res.rows
      } catch (e) {
        // fall back to memory
      }
    }
    return memoryAmbulances
  },

  async createAmbulance({ ambulanceNumber, vehicleNumber, specification, baseStation, operatorName, operatorId, status }) {
    if (isConnected()) {
      try {
        const res = await query(
          `INSERT INTO ambulances (ambulance_number, vehicle_number, specification, base_station, operator_name, operator_id, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING *`,
          [
            ambulanceNumber,
            vehicleNumber,
            specification || 'Advanced Life Support (ALS)',
            baseStation || 'District Dispatch Cluster',
            operatorName || 'Paramedic Crew',
            operatorId || `AMB-OP-${Math.floor(100 + Math.random() * 900)}`,
            status || 'available'
          ]
        )
        if (res.rows[0]) {
          memoryAmbulances.push(res.rows[0])
          return res.rows[0]
        }
      } catch (e) {
        // fall back to memory
      }
    }

    const newAmb = {
      id: memoryAmbulances.length + 1,
      ambulance_number: ambulanceNumber,
      vehicle_number: vehicleNumber,
      specification: specification || 'Advanced Life Support (ALS)',
      base_station: baseStation || 'District Dispatch Cluster',
      operator_name: operatorName || 'Paramedic Crew',
      operator_id: operatorId || `AMB-OP-${Math.floor(100 + Math.random() * 900)}`,
      status: status || 'available',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    memoryAmbulances.push(newAmb)
    return newAmb
  },

  async findById(id) {
    const numId = parseInt(id, 10)
    if (isConnected()) {
      try {
        const res = await query('SELECT * FROM ambulances WHERE id = $1', [numId])
        if (res.rows[0]) return res.rows[0]
      } catch (e) {
        // fall back to memory
      }
    }
    return memoryAmbulances.find(a => a.id === numId) || null
  },

  async findByUnitOrVehicle(identifier) {
    if (!identifier) return null
    const clean = String(identifier).trim().toLowerCase()
    if (isConnected()) {
      try {
        const res = await query(
          `SELECT * FROM ambulances 
           WHERE LOWER(ambulance_number) = LOWER($1) 
              OR LOWER(vehicle_number) = LOWER($1) 
              OR LOWER(operator_id) = LOWER($1)
           LIMIT 1`,
          [identifier.trim()]
        )
        if (res.rows[0]) return res.rows[0]
      } catch (e) {
        // fall back to memory
      }
    }
    return memoryAmbulances.find(a => 
      a.ambulance_number.toLowerCase() === clean ||
      a.vehicle_number.toLowerCase() === clean ||
      a.operator_id.toLowerCase() === clean ||
      String(a.id) === clean
    ) || null
  },

  async updateAmbulance(id, { ambulanceNumber, vehicleNumber, status, specification, baseStation }) {
    const numId = parseInt(id, 10)
    if (isConnected()) {
      try {
        const res = await query(
          `UPDATE ambulances SET
            ambulance_number = COALESCE($1, ambulance_number),
            vehicle_number = COALESCE($2, vehicle_number),
            status = COALESCE($3, status),
            specification = COALESCE($4, specification),
            base_station = COALESCE($5, base_station),
            updated_at = CURRENT_TIMESTAMP
           WHERE id = $6 RETURNING *`,
          [ambulanceNumber, vehicleNumber, status, specification, baseStation, numId]
        )
        if (res.rows[0]) return res.rows[0]
      } catch (e) {
        // fall back to memory
      }
    }
    const amb = memoryAmbulances.find(a => a.id === numId)
    if (amb) {
      if (ambulanceNumber) amb.ambulance_number = ambulanceNumber
      if (vehicleNumber) amb.vehicle_number = vehicleNumber
      if (status) amb.status = status
      if (specification) amb.specification = specification
      if (baseStation) amb.base_station = baseStation
      amb.updated_at = new Date().toISOString()
      return amb
    }
    return null
  },

  async updateAmbulanceLocation(id, { latitude, longitude }) {
    const numId = parseInt(id, 10)
    const numLat = Number(latitude)
    const numLng = Number(longitude)
    const now = new Date().toISOString()

    if (isConnected()) {
      try {
        const res = await query(
          `UPDATE ambulances SET latitude = $1, longitude = $2, location_updated_at = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4 RETURNING *`,
          [numLat, numLng, now, numId]
        )
        if (res.rows[0]) return res.rows[0]
      } catch (e) {
        // fall back to memory
      }
    }
    const amb = memoryAmbulances.find(a => a.id === numId)
    if (amb) {
      amb.latitude = numLat
      amb.longitude = numLng
      amb.location_updated_at = now
      amb.updated_at = now
      return amb
    }
    return null
  },

  async updateStatus(id, status) {
    const numId = parseInt(id, 10)
    if (isConnected()) {
      try {
        const res = await query(
          'UPDATE ambulances SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
          [status, numId]
        )
        if (res.rows[0]) return res.rows[0]
      } catch (e) {
        // fall back to memory
      }
    }
    const amb = memoryAmbulances.find(a => a.id === numId)
    if (amb) {
      amb.status = status
      amb.updated_at = new Date().toISOString()
      return amb
    }
    return null
  },

  async createEmergencyRequest({
    requestNumber,
    patientId,
    ambulanceId,
    patientName,
    patientUniqueCode,
    contactNumber,
    latitude,
    longitude,
    locationAccuracy,
    pickupLocation,
    landmark,
    destination,
    destinationBay,
    distance,
    eta,
    status
  }) {
    const reqNum = requestNumber || generateRequestNumber()
    const reqStatus = status || 'Requested'
    const now = new Date().toISOString()

    if (isConnected()) {
      try {
        const res = await query(
          `INSERT INTO emergency_requests (
            request_number, patient_id, ambulance_id, patient_name, patient_unique_code,
            contact_number, latitude, longitude, location_accuracy, pickup_location, landmark, destination, destination_bay,
            distance, eta, status, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          RETURNING *`,
          [
            reqNum,
            patientId || null,
            ambulanceId || null,
            patientName,
            patientUniqueCode || null,
            contactNumber || null,
            latitude !== undefined && latitude !== null ? Number(latitude) : null,
            longitude !== undefined && longitude !== null ? Number(longitude) : null,
            locationAccuracy !== undefined && locationAccuracy !== null ? Number(locationAccuracy) : null,
            pickupLocation || 'Live GPS Telemetry Point',
            landmark || null,
            destination || 'District Civil Hospital Emergency Wing',
            destinationBay || 'Emergency Admissions Bay 03',
            distance || '5.2 km',
            eta || '10 mins',
            reqStatus
          ]
        )
        if (res.rows[0]) return res.rows[0]
      } catch (e) {
        // fall back to memory
      }
    }

    const newReq = {
      id: memoryEmergencyRequests.length + 1,
      request_number: reqNum,
      patient_id: patientId || null,
      ambulance_id: ambulanceId || null,
      patient_name: patientName,
      patient_unique_code: patientUniqueCode || null,
      contact_number: contactNumber || null,
      latitude: latitude !== undefined && latitude !== null ? Number(latitude) : null,
      longitude: longitude !== undefined && longitude !== null ? Number(longitude) : null,
      location_accuracy: locationAccuracy !== undefined && locationAccuracy !== null ? Number(locationAccuracy) : null,
      pickup_location: pickupLocation || 'Live GPS Telemetry Point',
      landmark: landmark || null,
      destination: destination || 'District Civil Hospital Emergency Wing',
      destination_bay: destinationBay || 'Emergency Admissions Bay 03',
      distance: distance || '5.2 km',
      eta: eta || '10 mins',
      status: reqStatus,
      assigned_at: null,
      completed_at: null,
      created_at: now,
      updated_at: now
    }
    memoryEmergencyRequests.push(newReq)
    return newReq
  },

  async findEmergencyRequestById(idOrRef) {
    const isNum = !isNaN(Number(idOrRef))
    if (isConnected()) {
      try {
        const res = await query(
          `SELECT er.*, 
                  a.ambulance_number, a.vehicle_number, a.operator_name, a.operator_id, a.specification, a.base_station,
                  a.latitude as ambulance_latitude, a.longitude as ambulance_longitude, a.location_updated_at as ambulance_location_updated_at
           FROM emergency_requests er
           LEFT JOIN ambulances a ON er.ambulance_id = a.id
           WHERE ${isNum ? 'er.id = $1 OR er.request_number = $2' : 'er.request_number = $1'}`,
          isNum ? [parseInt(idOrRef, 10), String(idOrRef)] : [String(idOrRef)]
        )
        if (res.rows[0]) return res.rows[0]
      } catch (e) {
        // fall back to memory
      }
    }

    const req = memoryEmergencyRequests.find(r => 
      String(r.id) === String(idOrRef) || r.request_number === String(idOrRef)
    )
    if (!req) return null

    let amb = null
    if (req.ambulance_id) {
      amb = memoryAmbulances.find(a => a.id === req.ambulance_id)
    }

    return {
      ...req,
      ambulance_number: amb?.ambulance_number || null,
      vehicle_number: amb?.vehicle_number || null,
      operator_name: amb?.operator_name || null,
      operator_id: amb?.operator_id || null,
      specification: amb?.specification || null,
      base_station: amb?.base_station || null,
      ambulance_latitude: amb?.latitude !== undefined && amb?.latitude !== null ? Number(amb.latitude) : null,
      ambulance_longitude: amb?.longitude !== undefined && amb?.longitude !== null ? Number(amb.longitude) : null,
      ambulance_location_updated_at: amb?.location_updated_at || null
    }
  },

  async assignAmbulance(idOrRef, { ambulanceId, assignedAt }) {
    const ambId = parseInt(ambulanceId, 10)
    const isNum = !isNaN(Number(idOrRef))
    const timestamp = assignedAt || new Date().toISOString()

    if (isConnected()) {
      try {
        const res = await query(
          `UPDATE emergency_requests SET
            ambulance_id = $1,
            status = 'Assigned',
            assigned_at = COALESCE($2, CURRENT_TIMESTAMP),
            updated_at = CURRENT_TIMESTAMP
           WHERE ${isNum ? 'id = $3 OR request_number = $4' : 'request_number = $3'}
           RETURNING *`,
          isNum ? [ambId, timestamp, parseInt(idOrRef, 10), String(idOrRef)] : [ambId, timestamp, String(idOrRef)]
        )
        if (res.rows[0]) {
          await query('UPDATE ambulances SET status = $1 WHERE id = $2', ['busy', ambId])
          return await this.findEmergencyRequestById(res.rows[0].id)
        }
      } catch (e) {
        // fall back to memory
      }
    }

    const req = memoryEmergencyRequests.find(r => 
      String(r.id) === String(idOrRef) || r.request_number === String(idOrRef)
    )
    if (!req) return null

    req.ambulance_id = ambId
    req.status = 'Assigned'
    req.assigned_at = timestamp
    req.updated_at = new Date().toISOString()

    const amb = memoryAmbulances.find(a => a.id === ambId)
    if (amb) {
      amb.status = 'busy'
      amb.updated_at = new Date().toISOString()
    }

    return await this.findEmergencyRequestById(req.id)
  },

  async updateEmergencyRequestStatus(idOrRef, status, { ambulanceId, completedAt } = {}) {
    const isNum = !isNaN(Number(idOrRef))
    const now = new Date().toISOString()

    // Canonical status normalization
    let normalizedStatus = status
    if (status === 'Accepted') normalizedStatus = 'Assigned'
    if (status === 'On the Way') normalizedStatus = 'En Route'

    const isCompleted = normalizedStatus === 'Completed'
    const compTimestamp = isCompleted ? (completedAt || now) : null

    if (isConnected()) {
      try {
        const res = await query(
          `UPDATE emergency_requests SET
            status = $1,
            completed_at = CASE WHEN $2 THEN COALESCE($3, CURRENT_TIMESTAMP) ELSE completed_at END,
            updated_at = CURRENT_TIMESTAMP
           WHERE ${isNum ? 'id = $4 OR request_number = $5' : 'request_number = $4'}
           RETURNING *`,
          isNum 
            ? [normalizedStatus, isCompleted, compTimestamp, parseInt(idOrRef, 10), String(idOrRef)]
            : [normalizedStatus, isCompleted, compTimestamp, String(idOrRef)]
        )
        if (res.rows[0]) {
          if (isCompleted && res.rows[0].ambulance_id) {
            await query('UPDATE ambulances SET status = $1 WHERE id = $2', ['available', res.rows[0].ambulance_id])
          }
          return await this.findEmergencyRequestById(res.rows[0].id)
        }
      } catch (e) {
        // fall back to memory
      }
    }

    const req = memoryEmergencyRequests.find(r => 
      String(r.id) === String(idOrRef) || r.request_number === String(idOrRef)
    )
    if (!req) return null

    req.status = normalizedStatus
    if (isCompleted) {
      req.completed_at = compTimestamp
      if (req.ambulance_id) {
        const amb = memoryAmbulances.find(a => a.id === req.ambulance_id)
        if (amb) amb.status = 'available'
      }
    }
    req.updated_at = now

    return await this.findEmergencyRequestById(req.id)
  },

  async getLatestEmergencyRequest() {
    if (isConnected()) {
      try {
        const res = await query(
          `SELECT er.*, a.ambulance_number, a.vehicle_number, a.operator_name, a.operator_id, a.specification, a.base_station
           FROM emergency_requests er
           LEFT JOIN ambulances a ON er.ambulance_id = a.id
           ORDER BY er.id DESC LIMIT 1`
        )
        if (res.rows[0]) return res.rows[0]
      } catch (e) {
        // fall back to memory
      }
    }

    if (memoryEmergencyRequests.length === 0) return null
    const latest = memoryEmergencyRequests[memoryEmergencyRequests.length - 1]
    return await this.findEmergencyRequestById(latest.id)
  },

  async getRequests({ ambulanceId, status, activeOnly } = {}) {
    if (isConnected()) {
      try {
        let conditions = []
        let params = []
        if (ambulanceId) {
          params.push(parseInt(ambulanceId, 10))
          conditions.push(`er.ambulance_id = $${params.length}`)
        }
        if (status) {
          params.push(status)
          conditions.push(`er.status = $${params.length}`)
        } else if (activeOnly) {
          conditions.push(`er.status != 'Completed'`)
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
        const res = await query(
          `SELECT er.*, a.ambulance_number, a.vehicle_number, a.operator_name, a.operator_id, a.specification, a.base_station
           FROM emergency_requests er
           LEFT JOIN ambulances a ON er.ambulance_id = a.id
           ${whereClause}
           ORDER BY er.id DESC`,
          params
        )
        return res.rows
      } catch (e) {
        // fall back to memory
      }
    }

    let list = [...memoryEmergencyRequests]
    if (ambulanceId) {
      list = list.filter(r => r.ambulance_id === parseInt(ambulanceId, 10))
    }
    if (status) {
      list = list.filter(r => r.status === status)
    } else if (activeOnly) {
      list = list.filter(r => r.status !== 'Completed')
    }

    return list.map(req => {
      const amb = req.ambulance_id ? memoryAmbulances.find(a => a.id === req.ambulance_id) : null
      return {
        ...req,
        ambulance_number: amb?.ambulance_number || null,
        vehicle_number: amb?.vehicle_number || null,
        operator_name: amb?.operator_name || null,
        operator_id: amb?.operator_id || null
      }
    }).reverse()
  },

  async saveSceneAssessment(idOrRef, { patientName, patientAge, patientGender, incidentCategory, incidentDescription, patientCondition }) {
    const isNum = !isNaN(Number(idOrRef))
    const now = new Date().toISOString()

    if (isConnected()) {
      try {
        const res = await query(
          `UPDATE emergency_requests SET
            patient_name = COALESCE($1, patient_name),
            patient_age = COALESCE($2, patient_age),
            patient_gender = COALESCE($3, patient_gender),
            incident_category = $4,
            incident_description = COALESCE($5, incident_description),
            patient_condition = COALESCE($6, patient_condition),
            updated_at = CURRENT_TIMESTAMP
           WHERE ${isNum ? 'id = $7 OR request_number = $8' : 'request_number = $7'}
           RETURNING *`,
          isNum
            ? [patientName || null, patientAge || null, patientGender || null, incidentCategory, incidentDescription || null, patientCondition || null, parseInt(idOrRef, 10), String(idOrRef)]
            : [patientName || null, patientAge || null, patientGender || null, incidentCategory, incidentDescription || null, patientCondition || null, String(idOrRef)]
        )
        if (res.rows[0]) return await this.findEmergencyRequestById(res.rows[0].id)
      } catch (e) {
        // fall back to memory
      }
    }

    const req = memoryEmergencyRequests.find(r =>
      String(r.id) === String(idOrRef) || r.request_number === String(idOrRef)
    )
    if (!req) return null

    if (patientName) req.patient_name = patientName
    if (patientAge) req.patient_age = patientAge
    if (patientGender) req.patient_gender = patientGender
    req.incident_category = incidentCategory
    if (incidentDescription) req.incident_description = incidentDescription
    if (patientCondition) req.patient_condition = patientCondition
    req.updated_at = now

    return await this.findEmergencyRequestById(req.id)
  },

  async sendPreArrivalAlert(idOrRef) {
    const isNum = !isNaN(Number(idOrRef))
    const now = new Date().toISOString()

    if (isConnected()) {
      try {
        const res = await query(
          `UPDATE emergency_requests SET
            prearrival_alert_sent_at = COALESCE(prearrival_alert_sent_at, CURRENT_TIMESTAMP),
            updated_at = CURRENT_TIMESTAMP
           WHERE ${isNum ? 'id = $1 OR request_number = $2' : 'request_number = $1'}
           RETURNING *`,
          isNum ? [parseInt(idOrRef, 10), String(idOrRef)] : [String(idOrRef)]
        )
        if (res.rows[0]) return await this.findEmergencyRequestById(res.rows[0].id)
      } catch (e) {
        // fall back to memory
      }
    }

    const req = memoryEmergencyRequests.find(r =>
      String(r.id) === String(idOrRef) || r.request_number === String(idOrRef)
    )
    if (!req) return null

    if (!req.prearrival_alert_sent_at) {
      req.prearrival_alert_sent_at = now
    }
    req.updated_at = now

    return await this.findEmergencyRequestById(req.id)
  },

  async assignReceivingDestination(idOrRef, { hospital, building, floor, unit, room }) {
    const isNum = !isNaN(Number(idOrRef))
    const now = new Date().toISOString()

    if (isConnected()) {
      try {
        const res = await query(
          `UPDATE emergency_requests SET
            receiving_hospital = COALESCE($1, receiving_hospital),
            receiving_building = COALESCE($2, receiving_building),
            receiving_floor = COALESCE($3, receiving_floor),
            receiving_unit = COALESCE($4, receiving_unit),
            receiving_room = COALESCE($5, receiving_room),
            updated_at = CURRENT_TIMESTAMP
           WHERE ${isNum ? 'id = $6 OR request_number = $7' : 'request_number = $6'}
           RETURNING *`,
          isNum
            ? [hospital || null, building || null, floor || null, unit || null, room || null, parseInt(idOrRef, 10), String(idOrRef)]
            : [hospital || null, building || null, floor || null, unit || null, room || null, String(idOrRef)]
        )
        if (res.rows[0]) return await this.findEmergencyRequestById(res.rows[0].id)
      } catch (e) {
        // fall back to memory
      }
    }

    const req = memoryEmergencyRequests.find(r =>
      String(r.id) === String(idOrRef) || r.request_number === String(idOrRef)
    )
    if (!req) return null

    if (hospital) req.receiving_hospital = hospital
    if (building) req.receiving_building = building
    if (floor) req.receiving_floor = floor
    if (unit) req.receiving_unit = unit
    if (room) req.receiving_room = room
    req.updated_at = now

    return await this.findEmergencyRequestById(req.id)
  }
}
