import { AmbulanceModel, formatEmergencyRequest } from '../models/ambulanceModel.js'

export const EmergencyController = {
  // POST /api/emergency/requests
  async createRequest(req, res, next) {
    try {
      const patient = req.patient
      if (!patient) {
        return res.status(401).json({
          success: false,
          message: 'Patient authentication required to submit an emergency request.'
        })
      }

      const {
        latitude,
        longitude,
        locationAccuracy,
        pickupLocation,
        landmark,
        destination,
        destinationBay,
        distance,
        eta
      } = req.body || {}

      // Coordinate validation
      if (latitude === undefined || longitude === undefined || latitude === null || longitude === null) {
        return res.status(400).json({
          success: false,
          message: 'Invalid location telemetry. Valid latitude and longitude coordinates are required.'
        })
      }

      const numLat = Number(latitude)
      const numLng = Number(longitude)
      if (isNaN(numLat) || isNaN(numLng) || numLat < -90 || numLat > 90 || numLng < -180 || numLng > 180) {
        return res.status(400).json({
          success: false,
          message: 'Coordinates out of valid geographic range (-90 to 90 lat, -180 to 180 lng).'
        })
      }

      // Patient identity is derived STRICTLY from authenticated session (req.patient)
      const patientUniqueCode = patient.patient_unique_code || patient.patientUniqueCode || patient.unique_code || req.session?.patientUniqueCode
      const patientName = patient.name || patient.full_name || patient.fullName || 'Patient'
      const contactNumber = patient.mobile || patient.mobile_number || patient.mobileNumber || req.body.contactNumber

      const request = await AmbulanceModel.createEmergencyRequest({
        patientId: patient.id,
        patientName,
        patientUniqueCode,
        contactNumber,
        latitude: numLat,
        longitude: numLng,
        locationAccuracy: locationAccuracy !== undefined && !isNaN(Number(locationAccuracy)) ? Number(locationAccuracy) : null,
        pickupLocation: pickupLocation || `${numLat.toFixed(4)}° N, ${numLng.toFixed(4)}° E`,
        landmark: landmark || null,
        destination: destination || 'District Civil Hospital Emergency Wing',
        destinationBay: destinationBay || 'Emergency Admissions Bay 03',
        distance: distance || '5.2 km',
        eta: eta || '10 mins',
        status: 'Requested'
      })

      return res.status(201).json({
        success: true,
        message: 'Emergency request created successfully.',
        request: formatEmergencyRequest(request)
      })
    } catch (err) {
      next(err)
    }
  },

  // GET /api/emergency/requests/:id
  async getRequestById(req, res, next) {
    try {
      const patient = req.patient
      if (!patient) {
        return res.status(401).json({
          success: false,
          message: 'Patient authentication required.'
        })
      }

      const { id } = req.params
      const request = await AmbulanceModel.findEmergencyRequestById(id)

      if (!request) {
        return res.status(404).json({
          success: false,
          message: 'Emergency request not found.'
        })
      }

      // Strict Privacy check: Patient can only view their own emergency request
      const patCode = patient.patient_unique_code || patient.patientUniqueCode || patient.unique_code || req.session?.patientUniqueCode
      const isOwner = (request.patient_id && Number(request.patient_id) === Number(patient.id)) ||
                      (request.patient_unique_code && patCode && request.patient_unique_code === patCode)

      if (!isOwner) {
        return res.status(403).json({
          success: false,
          message: 'Access forbidden. You are not authorized to view another patient emergency request.'
        })
      }

      return res.status(200).json({
        success: true,
        request: {
          id: request.id,
          requestNumber: request.request_number,
          status: request.status,
          patientId: request.patient_id,
          patientName: request.patient_name,
          patientUniqueCode: request.patient_unique_code,
          contactNumber: request.contact_number,
          latitude: request.latitude,
          longitude: request.longitude,
          locationAccuracy: request.location_accuracy,
          pickupLocation: request.pickup_location,
          landmark: request.landmark,
          ambulanceNumber: request.ambulance_number,
          vehicleNumber: request.vehicle_number,
          operatorName: request.operator_name,
          distance: request.distance,
          eta: request.eta,
          destination: request.destination,
          destinationBay: request.destination_bay,
          ambulanceLatitude: request.ambulance_latitude !== undefined && request.ambulance_latitude !== null ? Number(request.ambulance_latitude) : null,
          ambulanceLongitude: request.ambulance_longitude !== undefined && request.ambulance_longitude !== null ? Number(request.ambulance_longitude) : null,
          ambulanceLocationUpdatedAt: request.ambulance_location_updated_at || null,
          hospitalLatitude: 28.6790,
          hospitalLongitude: 77.2227,
          receivingHospital: request.receiving_hospital || null,
          receivingBuilding: request.receiving_building || null,
          receivingFloor: request.receiving_floor || null,
          receivingUnit: request.receiving_unit || null,
          receivingRoom: request.receiving_room || null,
          assignedAt: request.assigned_at,
          completedAt: request.completed_at,
          createdAt: request.created_at,
          updatedAt: request.updated_at
        }
      })
    } catch (err) {
      next(err)
    }
  },

  // PATCH /api/emergency/requests/:id/destination (hospital assigns receiving location)
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
        return res.status(404).json({ success: false, message: 'Emergency request not found.' })
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

  // GET /api/emergency/requests/:id/destination (patient-readable destination)
  async getDestination(req, res, next) {
    try {
      const patient = req.patient
      if (!patient) {
        return res.status(401).json({ success: false, message: 'Patient authentication required.' })
      }

      const { id } = req.params
      const request = await AmbulanceModel.findEmergencyRequestById(id)
      if (!request) {
        return res.status(404).json({ success: false, message: 'Emergency request not found.' })
      }

      // Privacy check
      const patCode = patient.patient_unique_code || patient.patientUniqueCode || patient.unique_code || req.session?.patientUniqueCode
      const isOwner = (request.patient_id && Number(request.patient_id) === Number(patient.id)) ||
                      (request.patient_unique_code && patCode && request.patient_unique_code === patCode)
      if (!isOwner) {
        return res.status(403).json({ success: false, message: 'Access forbidden.' })
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
