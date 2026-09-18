import { query, isConnected } from '../db/index.js'

const defaultDoctors = [
  {
    id: 1,
    user_id: 2,
    doctor_id: 'DOC-1042',
    name: 'Dr. Ramanathan Venkatraman',
    specialization: 'General Medicine',
    hospital_id: 'HOSP-DEL-01',
    hospital_name: 'District Civil Hospital',
    room: 'Room 104',
    days: 'Mon - Sat (08:30 – 14:00)',
    tokens_available: 'Available',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
]

export const DoctorModel = {
  // Returns all doctors (for prototype, exactly one doctor)
  async getAll() {
    if (isConnected()) {
      try {
        const res = await query('SELECT * FROM doctors ORDER BY id ASC')
        if (res.rows.length > 0) return res.rows
      } catch (err) {
        console.warn('[DoctorModel] DB query error, using fallback:', err.message)
      }
    }
    return defaultDoctors
  },

  // Returns the single doctor record for the prototype
  async getSingleDoctor() {
    if (isConnected()) {
      try {
        const res = await query('SELECT * FROM doctors ORDER BY id ASC LIMIT 1')
        if (res.rows.length > 0) return res.rows[0]
      } catch (err) {
        console.warn('[DoctorModel] DB query error, using fallback:', err.message)
      }
    }
    return defaultDoctors[0] || null
  },

  async findById(id) {
    const numId = parseInt(id, 10)
    if (isConnected()) {
      try {
        const res = await query('SELECT * FROM doctors WHERE id = $1 LIMIT 1', [numId])
        if (res.rows.length > 0) return res.rows[0]
      } catch (err) {
        console.warn('[DoctorModel] DB query error, using fallback:', err.message)
      }
    }
    return defaultDoctors.find(d => d.id === numId) || null
  },

  async findByDoctorId(doctorId) {
    if (isConnected()) {
      try {
        const res = await query('SELECT * FROM doctors WHERE doctor_id = $1 LIMIT 1', [doctorId])
        if (res.rows.length > 0) return res.rows[0]
      } catch (err) {
        console.warn('[DoctorModel] DB query error, using fallback:', err.message)
      }
    }
    return defaultDoctors.find(d => d.doctor_id === doctorId || String(d.id) === String(doctorId)) || null
  },

  // Update the single doctor record (used by Admin Portal)
  async updateSingleDoctor({ name, specialization, hospitalName, room, days, tokensAvailable }) {
    if (isConnected()) {
      try {
        const current = await this.getSingleDoctor()
        if (!current) {
          const inserted = await query(
            `INSERT INTO doctors (doctor_id, name, specialization, hospital_name, room, days, tokens_available)
             VALUES ('DOC-1042', $1, $2, $3, $4, $5, $6) RETURNING *`,
            [name, specialization, hospitalName, room, days || 'Mon - Sat (08:30 – 14:00)', tokensAvailable || 'Available']
          )
          return inserted.rows[0]
        }

        const res = await query(
          `UPDATE doctors SET 
            name = COALESCE($1, name),
            specialization = COALESCE($2, specialization),
            hospital_name = COALESCE($3, hospital_name),
            room = COALESCE($4, room),
            days = COALESCE($5, days),
            tokens_available = COALESCE($6, tokens_available),
            updated_at = CURRENT_TIMESTAMP
           WHERE id = $7 RETURNING *`,
          [name, specialization, hospitalName, room, days, tokensAvailable, current.id]
        )
        return res.rows[0]
      } catch (err) {
        console.warn('[DoctorModel] DB update error, using fallback:', err.message)
      }
    }

    const item = defaultDoctors[0]
    if (item) {
      if (name) item.name = name
      if (specialization) item.specialization = specialization
      if (hospitalName) item.hospital_name = hospitalName
      if (room) item.room = room
      if (days) item.days = days
      if (tokensAvailable) item.tokens_available = tokensAvailable
      item.updated_at = new Date().toISOString()
      return item
    }
    return null
  }
}
