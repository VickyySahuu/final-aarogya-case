import { query, isConnected } from '../db/index.js'

const defaultHospitals = [
  {
    id: 1,
    hospital_id: 'HOSP-DEL-01',
    name: 'District Civil Hospital',
    facility_type: 'Public Multi-Specialty Civic Hospital & Triage Hub',
    address: 'Sector 4, Civil Lines, New Delhi — 110054',
    emergency_ward: 'Ground Floor, Bay 01 - 04',
    connected_hubs: 'AIIMS Trauma Wing & Emergency Response 108',
    distance: '1.8 km away',
    opd_hours: 'Mon - Sat: 8:00 AM - 2:00 PM',
    beds: '500 Beds',
    latitude: 28.6790,
    longitude: 77.2227,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
]

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
    latitude: h.latitude !== undefined && h.latitude !== null ? Number(h.latitude) : 28.6790,
    longitude: h.longitude !== undefined && h.longitude !== null ? Number(h.longitude) : 77.2227,
    opdHours: h.opdHours || h.opd_hours || 'Mon - Sat: 8:00 AM - 2:00 PM',
    opd_hours: h.opd_hours || h.opdHours || 'Mon - Sat: 8:00 AM - 2:00 PM'
  }
}

export const HospitalModel = {
  normalizeHospital,

  async getAll() {
    if (isConnected()) {
      try {
        const res = await query('SELECT * FROM hospitals WHERE is_active = TRUE ORDER BY id ASC')
        if (res.rows.length > 0) return res.rows.map(normalizeHospital)
      } catch (err) {
        console.warn('[HospitalModel] DB query error, using fallback:', err.message)
      }
    }
    return defaultHospitals.filter(h => h.is_active).map(normalizeHospital)
  },

  async getPrimaryHospital() {
    if (isConnected()) {
      try {
        const res = await query('SELECT * FROM hospitals ORDER BY id ASC LIMIT 1')
        if (res.rows.length > 0) return normalizeHospital(res.rows[0])
      } catch (err) {
        console.warn('[HospitalModel] DB query error, using fallback:', err.message)
      }
    }
    return normalizeHospital(defaultHospitals[0]) || null
  },

  async findByHospitalId(hospitalId) {
    if (isConnected()) {
      try {
        const res = await query('SELECT * FROM hospitals WHERE hospital_id = $1 LIMIT 1', [hospitalId])
        if (res.rows.length > 0) return normalizeHospital(res.rows[0])
      } catch (err) {
        console.warn('[HospitalModel] DB query error, using fallback:', err.message)
      }
    }
    const found = defaultHospitals.find(h => h.hospital_id === hospitalId || String(h.id) === String(hospitalId))
    return normalizeHospital(found) || null
  },

  async updatePrimaryHospital({ name, address, facilityType, emergencyWard, connectedHubs }) {
    if (isConnected()) {
      try {
        const current = await this.getPrimaryHospital()
        if (!current) {
          const inserted = await query(
            `INSERT INTO hospitals (hospital_id, name, address, facility_type, emergency_ward, connected_hubs)
             VALUES ('HOSP-DEL-01', $1, $2, $3, $4, $5) RETURNING *`,
            [name, address, facilityType, emergencyWard, connectedHubs]
          )
          return normalizeHospital(inserted.rows[0])
        }

        const res = await query(
          `UPDATE hospitals SET
            name = COALESCE($1, name),
            address = COALESCE($2, address),
            facility_type = COALESCE($3, facility_type),
            emergency_ward = COALESCE($4, emergency_ward),
            connected_hubs = COALESCE($5, connected_hubs),
            updated_at = CURRENT_TIMESTAMP
           WHERE id = $6 RETURNING *`,
          [name, address, facilityType, emergencyWard, connectedHubs, current.id]
        )
        return normalizeHospital(res.rows[0])
      } catch (err) {
        console.warn('[HospitalModel] DB update error, using fallback:', err.message)
      }
    }

    const item = defaultHospitals[0]
    if (item) {
      if (name) item.name = name
      if (address) item.address = address
      if (facilityType) item.facility_type = facilityType
      if (emergencyWard) item.emergency_ward = emergencyWard
      if (connectedHubs) item.connected_hubs = connectedHubs
      item.updated_at = new Date().toISOString()
      return normalizeHospital(item)
    }
    return null
  }
}
