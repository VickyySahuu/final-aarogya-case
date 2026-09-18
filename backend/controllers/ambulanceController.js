import { AmbulanceModel, isValidIncidentCategory, ALLOWED_INCIDENT_CATEGORIES } from '../models/ambulanceModel.js'

const ALLOWED_STATUSES = [
  'Requested',
  'Assigned',
  'Accepted',      // UI alias for Assigned
  'En Route',
  'On the Way',    // UI alias for En Route
  'Arrived',
  'Transporting',  // Transit to receiving hospital
  'Completed'
]

export const AmbulanceController = {
  // GET /api/ambulance/requests
  async listRequests(req, res, next) {
    try {
      const { status, activeOnly } = req.query
      const requests = await AmbulanceModel.getRequests({
        status,
        activeOnly: activeOnly === 'true' || activeOnly === true
      })
      return res.status(200).json({ success: true, requests })
    } catch (err) {
      next(err)
    }
  },

  // GET /api/ambulance/requests/:id
  async getRequest(req, res, next) {
    try {
      const { id } = req.params
      const request = await AmbulanceModel.findEmergencyRequestById(id)
      if (!request) {
        return res.status(404).json({ success: false, message: 'Emergency request not found' })
      }
      return res.status(200).json({ success: true, request })
    } catch (err) {
      next(err)
    }
  },

  // GET /api/ambulance/requests/:id/location
  async getPatientLocation(req, res, next) {
    try {
      const { id } = req.params
      const request = await AmbulanceModel.findEmergencyRequestById(id)
      if (!request) {
        return res.status(404).json({ success: false, message: 'Emergency request not found' })
      }

      // Return only necessary telemetry, privacy-preserving
      return res.status(200).json({
        success: true,
        location: {
          requestId: request.id,
          requestNumber: request.request_number,
          status: request.status,
          patientName: request.patient_name,
          contactNumber: request.contact_number,
          latitude: request.latitude,
          longitude: request.longitude,
          locationAccuracy: request.location_accuracy,
          pickupLocation: request.pickup_location,
          landmark: request.landmark,
          destination: request.destination,
          destinationBay: request.destination_bay,
          ambulanceLatitude: request.ambulance_latitude,
          ambulanceLongitude: request.ambulance_longitude,
          ambulanceLocationUpdatedAt: request.ambulance_location_updated_at,
          hospitalLatitude: 28.6790,
          hospitalLongitude: 77.2227,
          distance: request.distance,
          eta: request.eta,
          updatedAt: request.updated_at
        }
      })
    } catch (err) {
      next(err)
    }
  },

  // PATCH /api/ambulance/location
  async updateAmbulanceLocation(req, res, next) {
    try {
      const ambulanceId = req.ambulance?.ambulanceId || req.body?.ambulanceId || 1
      const { latitude, longitude } = req.body || {}

      if (latitude === undefined || longitude === undefined || latitude === null || longitude === null) {
        return res.status(400).json({
          success: false,
          message: 'Valid latitude and longitude coordinates are required.'
        })
      }

      const numLat = Number(latitude)
      const numLng = Number(longitude)
      if (isNaN(numLat) || isNaN(numLng) || numLat < -90 || numLat > 90 || numLng < -180 || numLng > 180) {
        return res.status(400).json({
          success: false,
          message: 'Coordinates out of valid geographic range.'
        })
      }

      const updated = await AmbulanceModel.updateAmbulanceLocation(ambulanceId, {
        latitude: numLat,
        longitude: numLng
      })

      if (!updated) {
        return res.status(404).json({ success: false, message: 'Ambulance not found.' })
      }

      return res.status(200).json({
        success: true,
        message: 'Ambulance location updated.',
        ambulance: updated
      })
    } catch (err) {
      next(err)
    }
  },

  // POST /api/ambulance/requests/:id/assign
  async assignRequest(req, res, next) {
    try {
      const { id } = req.params
      const ambulanceId = req.body?.ambulanceId || req.ambulance?.ambulanceId || 1

      const ambulance = await AmbulanceModel.findById(ambulanceId)
      if (!ambulance) {
        return res.status(404).json({ success: false, message: 'Ambulance unit not found for assignment' })
      }

      const request = await AmbulanceModel.findEmergencyRequestById(id)
      if (!request) {
        return res.status(404).json({ success: false, message: 'Emergency request not found' })
      }

      if (request.status === 'Completed') {
        return res.status(400).json({ success: false, message: 'Cannot assign an already completed emergency request' })
      }

      const updated = await AmbulanceModel.assignAmbulance(id, {
        ambulanceId,
        assignedAt: new Date().toISOString()
      })

      return res.status(200).json({
        success: true,
        message: 'Ambulance assigned successfully.',
        request: updated
      })
    } catch (err) {
      next(err)
    }
  },

  // PATCH /api/ambulance/requests/:id/status
  async updateRequestStatus(req, res, next) {
    try {
      const { id } = req.params
      const { status } = req.body || {}

      if (!status || !ALLOWED_STATUSES.includes(status)) {
        return res.status(400).json({
          success: false,
          message: `Invalid status. Allowed values: Requested, Assigned, En Route, Arrived, Completed.`
        })
      }

      const request = await AmbulanceModel.findEmergencyRequestById(id)
      if (!request) {
        return res.status(404).json({ success: false, message: 'Emergency request not found' })
      }

      // Authorization guard: Only the assigned ambulance unit can update its request
      if (req.ambulance && request.ambulance_id && Number(request.ambulance_id) !== Number(req.ambulance.ambulanceId)) {
        return res.status(403).json({
          success: false,
          message: 'Unauthorized. Only the assigned ambulance unit can update this request.'
        })
      }

      // Duplicate completion guard
      if (request.status === 'Completed' && (status === 'Completed' || status.toLowerCase() === 'completed')) {
        return res.status(400).json({
          success: false,
          message: 'Emergency request has already been marked as Completed.'
        })
      }

      const updated = await AmbulanceModel.updateEmergencyRequestStatus(id, status, {
        ambulanceId: req.ambulance?.ambulanceId,
        completedAt: status === 'Completed' ? new Date().toISOString() : null
      })

      return res.status(200).json({
        success: true,
        message: `Status updated to ${status}.`,
        request: updated
      })
    } catch (err) {
      next(err)
    }
  },

  // Legacy prototype methods (maintained for backwards compatibility)
  async getUnit(req, res, next) {
    try {
      const ambulance = await AmbulanceModel.getPrimaryAmbulance()
      return res.json({ success: true, ambulance })
    } catch (err) {
      next(err)
    }
  },

  async updateStatus(req, res, next) {
    try {
      const { status } = req.body
      const ambulance = await AmbulanceModel.getPrimaryAmbulance()
      if (!ambulance) {
        return res.status(404).json({ success: false, message: 'Ambulance unit not found' })
      }
      const updated = await AmbulanceModel.updateStatus(ambulance.id, status)
      return res.json({ success: true, ambulance: updated })
    } catch (err) {
      next(err)
    }
  },

  async createRequest(req, res, next) {
    try {
      const {
        patientId,
        patientName,
        patientUniqueCode,
        contactNumber,
        pickupLocation,
        landmark,
        destination,
        destinationBay
      } = req.body

      const ambulance = await AmbulanceModel.getPrimaryAmbulance()
      const request = await AmbulanceModel.createEmergencyRequest({
        patientId,
        ambulanceId: ambulance?.id || 1,
        patientName,
        patientUniqueCode,
        contactNumber,
        pickupLocation,
        landmark,
        destination,
        destinationBay
      })

      return res.status(201).json({ success: true, request })
    } catch (err) {
      next(err)
    }
  },

  async getLatestRequest(req, res, next) {
    try {
      const request = await AmbulanceModel.getLatestEmergencyRequest()
      return res.json({ success: true, request })
    } catch (err) {
      next(err)
    }
  },

  // POST /api/ambulance/requests/:id/assessment
  async saveSceneAssessment(req, res, next) {
    try {
      const { id } = req.params
      const { patientName, patientAge, patientGender, incidentCategory, incidentDescription, patientCondition } = req.body || {}

      if (!incidentCategory || !isValidIncidentCategory(incidentCategory)) {
        return res.status(400).json({
          success: false,
          message: `Incident category is required. Allowed: ${ALLOWED_INCIDENT_CATEGORIES.join(', ')}`
        })
      }

      const ALLOWED_CONDITIONS = ['Conscious', 'Unconscious', 'Responding', 'Not Responding', 'Unknown']
      if (patientCondition && !ALLOWED_CONDITIONS.includes(patientCondition)) {
        return res.status(400).json({
          success: false,
          message: `Invalid patient condition. Allowed: ${ALLOWED_CONDITIONS.join(', ')}`
        })
      }

      const request = await AmbulanceModel.findEmergencyRequestById(id)
      if (!request) {
        return res.status(404).json({ success: false, message: 'Emergency request not found' })
      }

      const updated = await AmbulanceModel.saveSceneAssessment(id, {
        patientName: patientName || null,
        patientAge: patientAge || null,
        patientGender: patientGender || null,
        incidentCategory,
        incidentDescription: incidentDescription || null,
        patientCondition: patientCondition || null
      })

      return res.status(200).json({
        success: true,
        message: 'Scene assessment saved.',
        request: updated
      })
    } catch (err) {
      next(err)
    }
  },

  // POST /api/ambulance/requests/:id/prearrival-alert
  async sendPreArrivalAlert(req, res, next) {
    try {
      const { id } = req.params
      const request = await AmbulanceModel.findEmergencyRequestById(id)
      if (!request) {
        return res.status(404).json({ success: false, message: 'Emergency request not found' })
      }

      // Require scene assessment before alert
      if (!request.incident_category) {
        return res.status(400).json({
          success: false,
          message: 'Scene assessment must be completed before sending a pre-arrival alert.'
        })
      }

      const wasDuplicate = !!request.prearrival_alert_sent_at
      const updated = await AmbulanceModel.sendPreArrivalAlert(id)

      return res.status(200).json({
        success: true,
        duplicate: wasDuplicate,
        message: wasDuplicate ? 'Pre-arrival alert was already sent.' : 'Pre-arrival alert sent to receiving hospital.',
        alert: {
          requestNumber: updated.request_number,
          incidentCategory: updated.incident_category,
          patientCondition: updated.patient_condition,
          ambulanceNumber: updated.ambulance_number,
          vehicleNumber: updated.vehicle_number,
          eta: updated.eta,
          prearrivalAlertSentAt: updated.prearrival_alert_sent_at
        },
        request: updated
      })
    } catch (err) {
      next(err)
    }
  },

  // PATCH /api/ambulance/requests/:id/destination
  async assignDestination(req, res, next) {
    try {
      const { id } = req.params
      const { hospital, building, floor, unit, room } = req.body || {}

      if (!hospital) {
        return res.status(400).json({
          success: false,
          message: 'Receiving hospital name is required.'
        })
      }

      const request = await AmbulanceModel.findEmergencyRequestById(id)
      if (!request) {
        return res.status(404).json({ success: false, message: 'Emergency request not found' })
      }

      const updated = await AmbulanceModel.assignReceivingDestination(id, {
        hospital, building, floor, unit, room
      })

      return res.status(200).json({
        success: true,
        message: 'Receiving destination assigned.',
        request: updated
      })
    } catch (err) {
      next(err)
    }
  },

  // GET /api/ambulance/requests/:id/destination
  async getDestination(req, res, next) {
    try {
      const { id } = req.params
      const request = await AmbulanceModel.findEmergencyRequestById(id)
      if (!request) {
        return res.status(404).json({ success: false, message: 'Emergency request not found' })
      }

      return res.status(200).json({
        success: true,
        destination: {
          receivingHospital: request.receiving_hospital || null,
          receivingBuilding: request.receiving_building || null,
          receivingFloor: request.receiving_floor || null,
          receivingUnit: request.receiving_unit || null,
          receivingRoom: request.receiving_room || null
        }
      })
    } catch (err) {
      next(err)
    }
  }
}
