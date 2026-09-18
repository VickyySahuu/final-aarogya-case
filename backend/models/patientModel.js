import { query, isConnected } from '../db/index.js'
import { memoryPatients, scheduleSaveFallbackState } from '../db/fallbackStore.js'

export const PatientModel = {
  async findByUniqueCode(uniqueCode) {
    if (!uniqueCode) return null
    const cleanCode = String(uniqueCode).trim()
    if (isConnected()) {
      try {
        const res = await query('SELECT * FROM patients WHERE UPPER(patient_unique_code) = UPPER($1) LIMIT 1', [cleanCode])
        if (res.rows.length > 0) return res.rows[0]
      } catch (err) {
        console.warn('[PatientModel] DB query failed, using memory fallback:', err.message)
      }
    }
    return memoryPatients.find(p => p.patient_unique_code?.toUpperCase() === cleanCode.toUpperCase()) || null
  },

  async findByPatientId(patientId) {
    if (!patientId) return null
    const cleanId = String(patientId).trim()
    if (isConnected()) {
      try {
        const res = await query('SELECT * FROM patients WHERE patient_id = $1 LIMIT 1', [cleanId])
        if (res.rows.length > 0) return res.rows[0]
      } catch (err) {
        console.warn('[PatientModel] DB query failed, using memory fallback:', err.message)
      }
    }
    return memoryPatients.find(p => p.patient_id === cleanId) || null
  },

  async findById(id) {
    if (!id) return null
    const numId = parseInt(id, 10)
    if (isConnected() && !isNaN(numId)) {
      try {
        const res = await query('SELECT * FROM patients WHERE id = $1', [numId])
        if (res.rows.length > 0) return res.rows[0]
      } catch (err) {
        console.warn('[PatientModel] DB query failed, using memory fallback:', err.message)
      }
    }
    return memoryPatients.find(p => p.id === numId) || null
  },

  async findByMobile(mobile) {
    if (!mobile) return null
    const clean = String(mobile).replace(/\D/g, '').slice(-10)
    if (!clean) return null
    if (isConnected()) {
      try {
        const res = await query(`SELECT * FROM patients WHERE RIGHT(REGEXP_REPLACE(mobile, '[^0-9]', '', 'g'), 10) = $1 LIMIT 1`, [clean])
        if (res.rows.length > 0) return res.rows[0]
      } catch (err) {
        console.warn('[PatientModel] DB findByMobile failed:', err.message)
      }
    }
    return memoryPatients.find(p => (p.mobile || '').replace(/\D/g, '').slice(-10) === clean) || null
  },

  async findByPhone(phone) {
    return this.findByMobile(phone)
  },

  async resolvePatient(idOrCode) {
    if (!idOrCode) return null
    if (typeof idOrCode === 'object' && idOrCode.id) return idOrCode

    const str = String(idOrCode).trim()
    const numId = parseInt(str, 10)
    const cleanMobile = str.replace(/\D/g, '').slice(-10)

    if (isConnected()) {
      try {
        const isNum = !isNaN(numId)
        let sql = `SELECT * FROM patients WHERE UPPER(patient_unique_code) = UPPER($1) OR patient_id = $1`
        const params = [str]
        if (isNum) {
          params.push(numId)
          sql += ` OR id = $${params.length}`
        }
        if (cleanMobile.length === 10) {
          params.push(cleanMobile)
          sql += ` OR RIGHT(REGEXP_REPLACE(mobile, '[^0-9]', '', 'g'), 10) = $${params.length}`
        }
        sql += ` LIMIT 1`
        const res = await query(sql, params)
        if (res.rows.length > 0) return res.rows[0]
      } catch (err) {
        console.warn('[PatientModel] DB resolvePatient failed:', err.message)
      }
    }

    return this.getByIdSync(str) || null
  },

  getByIdSync(id) {
    if (!id) return null
    if (typeof id === 'object' && id.id) return id
    const str = String(id).trim()
    const numId = parseInt(str, 10)
    const cleanMobile = str.replace(/\D/g, '').slice(-10)

    return memoryPatients.find(p => {
      if (!isNaN(numId) && p.id === numId) return true
      if (p.patient_id && (p.patient_id === str || p.patient_id.toUpperCase() === str.toUpperCase())) return true
      if (p.patient_unique_code && (p.patient_unique_code === str || p.patient_unique_code.toUpperCase() === str.toUpperCase())) return true
      if (cleanMobile && cleanMobile.length === 10) {
        const pMob = (p.mobile || '').replace(/\D/g, '').slice(-10)
        if (pMob === cleanMobile) return true
      }
      return false
    }) || null
  },

  findByUniqueCodeSync(uniqueCode) {
    if (!uniqueCode) return null
    return memoryPatients.find(p => p.patient_unique_code?.toUpperCase() === String(uniqueCode).trim().toUpperCase()) || null
  },

  getAllSync() {
    return [...memoryPatients]
  },

  seedPatientSync(patientData) {
    if (!patientData) return null
    const existing = memoryPatients.find(
      p => (p.mobile && patientData.mobile && p.mobile.replace(/\D/g, '').slice(-10) === patientData.mobile.replace(/\D/g, '').slice(-10)) ||
           (p.patient_unique_code && p.patient_unique_code.toUpperCase() === (patientData.patient_unique_code || '').toUpperCase()) ||
           p.id === patientData.id
    )
    if (!existing) {
      memoryPatients.push({ ...patientData })
      scheduleSaveFallbackState()
      return patientData
    }
    Object.assign(existing, patientData)
    scheduleSaveFallbackState()
    return existing
  },

  async getAll() {
    if (isConnected()) {
      try {
        const res = await query('SELECT * FROM patients ORDER BY id DESC')
        return res.rows
      } catch (err) {
        console.warn('[PatientModel] DB query failed, using memory fallback:', err.message)
      }
    }
    return [...memoryPatients]
  },


  async findByMobileOrIdentity(mobile, identityNumber) {
    const cleanMobile = (mobile || '').replace(/\D/g, '')
    const cleanIdentity = (identityNumber || '').trim().replace(/\s+/g, '')

    if (isConnected()) {
      try {
        const res = await query(
          `SELECT * FROM patients 
           WHERE RIGHT(REGEXP_REPLACE(mobile, '[^0-9]', '', 'g'), 10) = $1 
              OR (identity_number IS NOT NULL AND UPPER(REPLACE(identity_number, ' ', '')) = UPPER($2))
           LIMIT 1`,
          [cleanMobile.slice(-10), cleanIdentity]
        )
        if (res.rows.length > 0) return res.rows[0]
      } catch (err) {
        console.warn('[PatientModel] DB query failed, using memory fallback:', err.message)
      }
    }

    return memoryPatients.find(p => {
      const pMobile = (p.mobile || '').replace(/\D/g, '')
      const pIdent = (p.identity_number || '').trim().replace(/\s+/g, '').toUpperCase()
      const matchMobile = cleanMobile && pMobile.slice(-10) === cleanMobile.slice(-10)
      const matchIdent = cleanIdentity && pIdent === cleanIdentity.toUpperCase()
      return matchMobile || matchIdent
    }) || null
  },

  async create({
    userId,
    user_id,
    patientId,
    patient_id,
    patientUniqueCode,
    patient_unique_code,
    name,
    mobile,
    dob,
    age,
    gender,
    identityType,
    identity_type,
    identityNumber,
    identity_number,
    bloodGroup,
    blood_group,
    address
  }) {
    const finalUserId = userId || user_id || null
    const finalPatientId = patientId || patient_id || `AC-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`
    const finalUniqueCode = patientUniqueCode || patient_unique_code || `AC-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
    const finalIdentityType = identityType || identity_type || 'Aadhaar'
    const finalIdentityNumber = identityNumber || identity_number || null
    const finalBloodGroup = bloodGroup || blood_group || 'B+'

    // Check if patient with same mobile/identity already exists to prevent duplicate creation
    const existing = await this.findByMobileOrIdentity(mobile, finalIdentityNumber)
    if (existing) {
      return existing
    }

    if (isConnected()) {
      try {
        const res = await query(
          `INSERT INTO patients (
            user_id, patient_id, patient_unique_code, name, mobile, dob, age, gender, identity_type, identity_number, blood_group, address
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
          RETURNING *`,
          [finalUserId, finalPatientId, finalUniqueCode, name, mobile, dob, age, gender, finalIdentityType, finalIdentityNumber, finalBloodGroup, address]
        )
        if (res.rows.length > 0) {
          memoryPatients.push(res.rows[0])
          scheduleSaveFallbackState()
          return res.rows[0]
        }
      } catch (err) {
        console.warn('[PatientModel] DB insert failed, using memory fallback:', err.message)
      }
    }

    // Memory fallback record
    const newRecord = {
      id: memoryPatients.length + 1,
      user_id: finalUserId,
      patient_id: finalPatientId,
      patient_unique_code: finalUniqueCode,
      name,
      mobile,
      dob,
      age: age || '48',
      gender: gender || 'Male',
      identity_type: identityType || 'Aadhaar',
      identity_number: identityNumber,
      blood_group: bloodGroup || 'B+',
      address: address || '',
      created_at: new Date().toISOString()
    }
    memoryPatients.push(newRecord)
    scheduleSaveFallbackState()
    return newRecord
  },

  async update(id, fields) {
    if (isConnected()) {
      try {
        const keys = Object.keys(fields)
        if (keys.length === 0) return this.findById(id)
        const setClause = keys.map((k, i) => `${k} = $${i + 2}`).join(', ')
        const values = Object.values(fields)
        const res = await query(
          `UPDATE patients SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
          [id, ...values]
        )
        return res.rows[0] || null
      } catch (err) {
        console.warn('[PatientModel] DB update failed:', err.message)
      }
    }

    const patient = memoryPatients.find(p => p.id === parseInt(id, 10))
    if (patient) {
      Object.assign(patient, fields)
      scheduleSaveFallbackState()
      return patient
    }
    return null
  }
}
