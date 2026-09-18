import { DoctorModel } from '../models/doctorModel.js'
import { HospitalModel } from '../models/hospitalModel.js'
import { MedicineModel } from '../models/medicineModel.js'
import { AmbulanceModel } from '../models/ambulanceModel.js'
import { DiagnosticTestModel } from '../models/diagnosticTestModel.js'

function normalizeDoctor(doc) {
  if (!doc) return doc
  return {
    ...doc,
    doctorId: doc.doctorId || doc.doctor_id || 'DOC-1042',
    doctor_id: doc.doctor_id || doc.doctorId || 'DOC-1042',
    hospitalName: doc.hospitalName || doc.hospital_name || 'District Civil Hospital',
    hospital_name: doc.hospital_name || doc.hospitalName || 'District Civil Hospital',
    hospital: doc.hospital || doc.hospitalName || doc.hospital_name || 'District Civil Hospital',
    tokensAvailable: doc.tokensAvailable || doc.tokens_available || 'Available',
    tokens_available: doc.tokens_available || doc.tokensAvailable || 'Available'
  }
}

function normalizeHospital(h) {
  if (!h) return h
  return {
    ...h,
    hospitalId: h.hospitalId || h.hospital_id || 'HOSP-DEL-01',
    hospital_id: h.hospital_id || h.hospitalId || 'HOSP-DEL-01',
    facilityType: h.facilityType || h.facility_type || 'Public Multi-Specialty Civic Hospital & Triage Hub',
    facility_type: h.facility_type || h.facilityType || 'Public Multi-Specialty Civic Hospital & Triage Hub',
    emergencyWard: h.emergencyWard || h.emergency_ward || 'Ground Floor, Bay 01 - 04',
    emergency_ward: h.emergency_ward || h.emergencyWard || 'Ground Floor, Bay 01 - 04',
    connectedHubs: h.connectedHubs || h.connected_hubs || 'AIIMS Trauma Wing & Emergency Response 108',
    connected_hubs: h.connected_hubs || h.connectedHubs || 'AIIMS Trauma Wing & Emergency Response 108',
    location: h.location || h.address || 'Sector 4, Civil Lines, New Delhi — 110054',
    address: h.address || h.location || 'Sector 4, Civil Lines, New Delhi — 110054',
    opdHours: h.opdHours || h.opd_hours || 'Mon - Sat: 8:00 AM - 2:00 PM',
    opd_hours: h.opd_hours || h.opdHours || 'Mon - Sat: 8:00 AM - 2:00 PM'
  }
}

function normalizeMedicine(m) {
  if (!m) return m
  const qty = m.availableQty !== undefined ? m.availableQty : m.available_qty
  return {
    ...m,
    availableQty: qty,
    available_qty: qty,
    medicineId: m.medicineId || m.medicine_id || `MED-${m.id}`,
    medicine_id: m.medicine_id || m.medicineId || `MED-${m.id}`
  }
}

function normalizeAmbulance(a) {
  if (!a) return a
  return {
    ...a,
    ambulanceNumber: a.ambulanceNumber || a.ambulance_number || a.unit || 'Ambulance Unit #08',
    ambulance_number: a.ambulance_number || a.ambulanceNumber || a.unit || 'Ambulance Unit #08',
    vehicleNumber: a.vehicleNumber || a.vehicle_number || 'DL-01-EQ-9041',
    vehicle_number: a.vehicle_number || a.vehicleNumber || 'DL-01-EQ-9041',
    baseStation: a.baseStation || a.base_station || 'District Dispatch Cluster',
    base_station: a.base_station || a.baseStation || 'District Dispatch Cluster',
    operatorName: a.operatorName || a.operator_name || 'Paramedic',
    operator_name: a.operator_name || a.operatorName || 'Paramedic',
    operatorId: a.operatorId || a.operator_id || 'AMB-OP-104',
    operator_id: a.operator_id || a.operatorId || 'AMB-OP-104'
  }
}

export const AdminController = {
  // GET /api/admin/dashboard
  async getDashboard(req, res, next) {
    try {
      const doctors = await DoctorModel.getAll()
      const hospitals = await HospitalModel.getAll()
      const medicines = await MedicineModel.getAll()
      const diagnostics = await DiagnosticTestModel.getAll()
      const ambulances = await AmbulanceModel.getAllAmbulances()
      const activeEmergencies = await AmbulanceModel.getRequests({ activeOnly: true })

      return res.status(200).json({
        success: true,
        counts: {
          doctors: doctors.length,
          hospitals: hospitals.length,
          medicines: medicines.length,
          diagnostics: diagnostics.length,
          ambulances: ambulances.length,
          activeEmergencyRequests: activeEmergencies.length
        }
      })
    } catch (err) {
      next(err)
    }
  },

  // -------------------------------------------------------------
  // DOCTOR MANAGEMENT
  // -------------------------------------------------------------
  // GET /api/admin/doctors
  async listDoctors(req, res, next) {
    try {
      const doctors = await DoctorModel.getAll()
      return res.status(200).json({ success: true, doctors: doctors.map(normalizeDoctor) })
    } catch (err) {
      next(err)
    }
  },

  // GET /api/admin/doctors/:id
  async getDoctor(req, res, next) {
    try {
      const { id } = req.params
      let doctor = null
      if (!isNaN(Number(id))) {
        doctor = await DoctorModel.findById(parseInt(id, 10))
      }
      if (!doctor) {
        doctor = await DoctorModel.findByDoctorId(id)
      }
      if (!doctor && (id === '1' || id === 'DOC-1042')) {
        doctor = await DoctorModel.getSingleDoctor()
      }

      if (!doctor) {
        return res.status(404).json({ success: false, message: 'Doctor record not found.' })
      }

      return res.status(200).json({ success: true, doctor: normalizeDoctor(doctor) })
    } catch (err) {
      next(err)
    }
  },

  // PATCH /api/admin/doctors/:id
  async updateDoctor(req, res, next) {
    try {
      const { id } = req.params || {}
      let existing = null
      if (id) {
        if (!isNaN(Number(id))) {
          existing = await DoctorModel.findById(parseInt(id, 10))
        }
        if (!existing) {
          existing = await DoctorModel.findByDoctorId(id)
        }
        if (!existing) {
          return res.status(404).json({ success: false, message: 'Doctor record not found for update.' })
        }
      }

      const { name, specialization, hospitalName, hospital, hospital_name, room, days, tokensAvailable, tokens_available } = req.body || {}
      const targetHospital = hospitalName || hospital || hospital_name

      const updated = await DoctorModel.updateSingleDoctor({
        name,
        specialization,
        hospitalName: targetHospital,
        room,
        days,
        tokensAvailable: tokensAvailable || tokens_available
      })

      return res.status(200).json({
        success: true,
        message: 'Doctor record updated successfully.',
        doctor: normalizeDoctor(updated)
      })
    } catch (err) {
      next(err)
    }
  },

  // -------------------------------------------------------------
  // HOSPITAL MANAGEMENT
  // -------------------------------------------------------------
  // GET /api/admin/hospitals
  async listHospitals(req, res, next) {
    try {
      const hospitals = await HospitalModel.getAll()
      return res.status(200).json({ success: true, hospitals: hospitals.map(normalizeHospital) })
    } catch (err) {
      next(err)
    }
  },

  // GET /api/admin/hospitals/:id
  async getHospital(req, res, next) {
    try {
      const { id } = req.params
      let hospital = await HospitalModel.findByHospitalId(id)
      if (!hospital && (id === '1' || id === 'HOSP-DEL-01')) {
        hospital = await HospitalModel.getPrimaryHospital()
      }

      if (!hospital) {
        return res.status(404).json({ success: false, message: 'Hospital record not found.' })
      }

      return res.status(200).json({ success: true, hospital: normalizeHospital(hospital) })
    } catch (err) {
      next(err)
    }
  },

  // PATCH /api/admin/hospitals/:id
  async updateHospital(req, res, next) {
    try {
      const { id } = req.params || {}
      if (id) {
        let existing = await HospitalModel.findByHospitalId(id)
        if (!existing && id !== '1' && id !== 'HOSP-DEL-01') {
          return res.status(404).json({ success: false, message: 'Hospital record not found for update.' })
        }
      }

      const { name, address, location, facilityType, facility_type, emergencyWard, emergency_ward, connectedHubs, connected_hubs } = req.body || {}
      const updated = await HospitalModel.updatePrimaryHospital({
        name,
        address: address || location,
        facilityType: facilityType || facility_type,
        emergencyWard: emergencyWard || emergency_ward,
        connectedHubs: connectedHubs || connected_hubs
      })

      return res.status(200).json({
        success: true,
        message: 'Hospital record updated successfully.',
        hospital: normalizeHospital(updated)
      })
    } catch (err) {
      next(err)
    }
  },

  // -------------------------------------------------------------
  // MEDICINE MANAGEMENT
  // -------------------------------------------------------------
  // GET /api/admin/medicines
  async listMedicines(req, res, next) {
    try {
      const medicines = await MedicineModel.getAll()
      return res.status(200).json({ success: true, medicines: medicines.map(normalizeMedicine) })
    } catch (err) {
      next(err)
    }
  },

  // POST /api/admin/medicines
  async createMedicine(req, res, next) {
    try {
      const { name, category, availableQty, available_qty, unit, rack, status } = req.body || {}
      if (!name || !name.trim()) {
        return res.status(400).json({ success: false, message: 'Medicine name is required.' })
      }

      const cleanName = name.trim()
      const allMeds = await MedicineModel.getAll()
      const isDuplicate = allMeds.some(m => m.name.toLowerCase() === cleanName.toLowerCase())
      if (isDuplicate) {
        return res.status(400).json({ success: false, message: 'A medicine with this name already exists in catalog.' })
      }

      const medId = `MED-${cleanName.slice(0, 4).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`
      const qty = availableQty !== undefined ? Number(availableQty) : (available_qty !== undefined ? Number(available_qty) : 100)

      const medicine = await MedicineModel.create({
        medicineId: medId,
        name: cleanName,
        category: category || 'General Formulary',
        availableQty: isNaN(qty) ? 0 : qty,
        unit: unit || 'Tablets',
        rack: rack || 'Rack A-01',
        status: status || (qty > 0 ? 'Available' : 'Out of Stock')
      })

      return res.status(201).json({
        success: true,
        message: 'Medicine created successfully.',
        medicine: normalizeMedicine(medicine)
      })
    } catch (err) {
      next(err)
    }
  },

  // PATCH /api/admin/medicines/:id
  async updateMedicine(req, res, next) {
    try {
      const { id } = req.params
      const existing = await MedicineModel.findByMedicineId(id)
      if (!existing) {
        return res.status(404).json({ success: false, message: 'Medicine record not found for update.' })
      }

      const { name, category, availableQty, available_qty, unit, status, rack } = req.body || {}
      const qty = availableQty !== undefined ? Number(availableQty) : (available_qty !== undefined ? Number(available_qty) : undefined)

      const updated = await MedicineModel.update(existing.id, {
        name,
        category,
        availableQty: qty,
        unit,
        status: status || (qty !== undefined ? (qty <= 0 ? 'Out of Stock' : 'Available') : undefined),
        rack
      })

      return res.status(200).json({
        success: true,
        message: 'Medicine updated successfully.',
        medicine: normalizeMedicine(updated)
      })
    } catch (err) {
      next(err)
    }
  },

  // -------------------------------------------------------------
  // DIAGNOSTIC MANAGEMENT
  // -------------------------------------------------------------
  // GET /api/admin/diagnostics
  async listDiagnostics(req, res, next) {
    try {
      const diagnostics = await DiagnosticTestModel.getAll()
      return res.status(200).json({ success: true, diagnostics })
    } catch (err) {
      next(err)
    }
  },

  // POST /api/admin/diagnostics
  async createDiagnostic(req, res, next) {
    try {
      const { name, testName, category, turnaround, status, icon } = req.body || {}
      const cleanName = (name || testName || '').trim()
      if (!cleanName) {
        return res.status(400).json({ success: false, message: 'Diagnostic test/modality name is required.' })
      }

      const existing = await DiagnosticTestModel.findByName(cleanName)
      if (existing) {
        return res.status(400).json({ success: false, message: 'A diagnostic modality with this name already exists.' })
      }

      const diagnostic = await DiagnosticTestModel.create({
        name: cleanName,
        category: category || 'General Diagnostic',
        turnaround: turnaround || '25 Mins',
        status: status || 'Active',
        icon: icon || 'biotech'
      })

      return res.status(201).json({
        success: true,
        message: 'Diagnostic modality created successfully.',
        diagnostic
      })
    } catch (err) {
      next(err)
    }
  },

  // PATCH /api/admin/diagnostics/:id
  async updateDiagnostic(req, res, next) {
    try {
      const { id } = req.params
      const existing = await DiagnosticTestModel.findById(id)
      if (!existing) {
        return res.status(404).json({ success: false, message: 'Diagnostic modality not found for update.' })
      }

      const { name, testName, category, turnaround, status } = req.body || {}
      const updated = await DiagnosticTestModel.update(id, {
        name: name || testName,
        category,
        turnaround,
        status
      })

      return res.status(200).json({
        success: true,
        message: 'Diagnostic modality updated successfully.',
        diagnostic: updated
      })
    } catch (err) {
      next(err)
    }
  },

  // -------------------------------------------------------------
  // AMBULANCE MANAGEMENT
  // -------------------------------------------------------------
  // GET /api/admin/ambulances
  async listAmbulances(req, res, next) {
    try {
      const ambulances = await AmbulanceModel.getAllAmbulances()
      return res.status(200).json({ success: true, ambulances: ambulances.map(normalizeAmbulance) })
    } catch (err) {
      next(err)
    }
  },

  // GET /api/admin/ambulances/:id
  async getAmbulance(req, res, next) {
    try {
      const { id } = req.params
      const ambulance = await AmbulanceModel.findById(id) || await AmbulanceModel.findByUnitOrVehicle(id)
      if (!ambulance) {
        return res.status(404).json({ success: false, message: 'Ambulance record not found.' })
      }
      return res.status(200).json({ success: true, ambulance: normalizeAmbulance(ambulance) })
    } catch (err) {
      next(err)
    }
  },

  // POST /api/admin/ambulances
  async createAmbulance(req, res, next) {
    try {
      const { ambulanceNumber, ambulance_number, vehicleNumber, vehicle_number, specification, baseStation, base_station, operatorName, operatorId, status } = req.body || {}
      const ambNum = ambulanceNumber || ambulance_number
      const vehNum = vehicleNumber || vehicle_number

      if (!ambNum || !ambNum.trim()) {
        return res.status(400).json({ success: false, message: 'Ambulance number is required.' })
      }
      if (!vehNum || !vehNum.trim()) {
        return res.status(400).json({ success: false, message: 'Vehicle registration plate number is required.' })
      }

      const allAmbs = await AmbulanceModel.getAllAmbulances()
      const isDuplicate = allAmbs.some(a => 
        a.ambulance_number?.toLowerCase() === ambNum.trim().toLowerCase() ||
        a.vehicle_number?.toLowerCase() === vehNum.trim().toLowerCase()
      )
      if (isDuplicate) {
        return res.status(400).json({ success: false, message: 'An ambulance with this unit or vehicle plate number already exists.' })
      }

      const ambulance = await AmbulanceModel.createAmbulance({
        ambulanceNumber: ambNum.trim(),
        vehicleNumber: vehNum.trim(),
        specification: specification || 'Advanced Life Support (ALS)',
        baseStation: baseStation || base_station || 'District Dispatch Cluster',
        operatorName,
        operatorId,
        status: status || 'available'
      })

      return res.status(201).json({
        success: true,
        message: 'Ambulance unit created successfully.',
        ambulance: normalizeAmbulance(ambulance)
      })
    } catch (err) {
      next(err)
    }
  },

  // PATCH /api/admin/ambulances/:id
  async updateAmbulance(req, res, next) {
    try {
      const { id } = req.params || {}
      let existing = null
      if (id) {
        existing = await AmbulanceModel.findById(id) || await AmbulanceModel.findByUnitOrVehicle(id)
        if (!existing) {
          return res.status(404).json({ success: false, message: 'Ambulance record not found for update.' })
        }
      } else {
        existing = await AmbulanceModel.getPrimaryAmbulance()
      }

      if (!existing) {
        return res.status(404).json({ success: false, message: 'Ambulance not found' })
      }

      const { ambulanceNumber, ambulance_number, vehicleNumber, vehicle_number, status, specification, baseStation, base_station } = req.body || {}
      const updated = await AmbulanceModel.updateAmbulance(existing.id, {
        ambulanceNumber: ambulanceNumber || ambulance_number,
        vehicleNumber: vehicleNumber || vehicle_number,
        status,
        specification,
        baseStation: baseStation || base_station
      })

      return res.status(200).json({
        success: true,
        message: 'Ambulance updated successfully.',
        ambulance: normalizeAmbulance(updated)
      })
    } catch (err) {
      next(err)
    }
  },

  // Legacy overview endpoint
  async getOverview(req, res, next) {
    try {
      const doctor = await DoctorModel.getSingleDoctor()
      const hospital = await HospitalModel.getPrimaryHospital()
      const medicines = await MedicineModel.getAll()
      const ambulance = await AmbulanceModel.getPrimaryAmbulance()

      return res.json({
        success: true,
        data: {
          doctor,
          hospital,
          medicineCount: medicines.length,
          ambulance
        }
      })
    } catch (err) {
      next(err)
    }
  }
}
