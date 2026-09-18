import { query, isConnected } from '../db/index.js'

const SEED_MEDICINES = [
  { id: 1, medicine_id: 'MED-PARA-650', name: 'Paracetamol 650mg Tablet', category: 'Analgesic / Antipyretic', available_qty: 850, unit: 'Tablets', rack: 'Rack A-01', status: 'Available' },
  { id: 2, medicine_id: 'MED-CET-10', name: 'Cetirizine 10mg Tablet', category: 'Antihistamine', available_qty: 420, unit: 'Tablets', rack: 'Rack B-03', status: 'Available' },
  { id: 3, medicine_id: 'MED-AMOX-500', name: 'Amoxicillin 500mg Capsule', category: 'Antibiotic', available_qty: 300, unit: 'Capsules', rack: 'Rack C-02', status: 'Available' },
  { id: 4, medicine_id: 'MED-AZI-500', name: 'Azithromycin 500mg Tablet', category: 'Antibiotic', available_qty: 180, unit: 'Tablets', rack: 'Rack C-05', status: 'Available' },
  { id: 5, medicine_id: 'MED-PAN-40', name: 'Pantoprazole 40mg Tablet', category: 'Antacid / PPI', available_qty: 550, unit: 'Tablets', rack: 'Rack A-04', status: 'Available' },
  { id: 6, medicine_id: 'MED-IBU-400', name: 'Ibuprofen 400mg Tablet', category: 'NSAID / Pain Relief', available_qty: 350, unit: 'Tablets', rack: 'Rack A-02', status: 'Available' },
  { id: 7, medicine_id: 'MED-MET-500', name: 'Metformin 500mg Tablet', category: 'Antidiabetic', available_qty: 600, unit: 'Tablets', rack: 'Rack D-01', status: 'Available' },
  { id: 8, medicine_id: 'MED-AML-5', name: 'Amlodipine 5mg Tablet', category: 'Antihypertensive', available_qty: 400, unit: 'Tablets', rack: 'Rack D-03', status: 'Available' },
  { id: 9, medicine_id: 'MED-ORS-1', name: 'ORS Sachet (Oral Rehydration Salts)', category: 'Electrolyte', available_qty: 250, unit: 'Sachets', rack: 'Rack E-01', status: 'Available' },
  { id: 10, medicine_id: 'MED-BET-100', name: 'Betadine Gargle 2% (100ml)', category: 'Antiseptic', available_qty: 120, unit: 'Bottles', rack: 'Rack E-04', status: 'Available' }
]

const memoryMedicines = [...SEED_MEDICINES]

export const MedicineModel = {
  async getAll() {
    if (isConnected()) {
      try {
        const res = await query('SELECT * FROM medicines ORDER BY id ASC')
        if (res.rows.length > 0) return res.rows
      } catch (err) {
        console.warn('[MedicineModel] PostgreSQL query failed, using memory store:', err.message)
      }
    }
    return memoryMedicines
  },

  async findByMedicineId(medId) {
    if (isConnected()) {
      try {
        const res = await query('SELECT * FROM medicines WHERE medicine_id = $1', [medId])
        if (res.rows[0]) return res.rows[0]
      } catch (err) {
        console.warn('[MedicineModel] PostgreSQL findByMedicineId failed, using memory store:', err.message)
      }
    }
    return memoryMedicines.find(m => m.medicine_id === medId || m.id === parseInt(medId, 10)) || null
  },

  async create({ medicineId, name, category, availableQty, unit, rack, status }) {
    if (isConnected()) {
      try {
        const res = await query(
          `INSERT INTO medicines (medicine_id, name, category, available_qty, unit, rack, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING *`,
          [
            medicineId,
            name,
            category || 'General Formulary',
            availableQty || 0,
            unit || 'Tablets',
            rack || 'General Dispensary Storage',
            status || 'Available'
          ]
        )
        if (res.rows[0]) {
          memoryMedicines.push(res.rows[0])
          return res.rows[0]
        }
      } catch (err) {
        console.warn('[MedicineModel] PostgreSQL insert failed, using memory store:', err.message)
      }
    }

    const newMed = {
      id: memoryMedicines.length + 1,
      medicine_id: medicineId,
      name,
      category: category || 'General Formulary',
      available_qty: availableQty || 0,
      unit: unit || 'Tablets',
      rack: rack || 'General Dispensary Storage',
      status: status || 'Available',
      created_at: new Date().toISOString()
    }
    memoryMedicines.push(newMed)
    return newMed
  },

  async update(id, { name, category, availableQty, unit, status }) {
    if (isConnected()) {
      try {
        const res = await query(
          `UPDATE medicines SET
            name = COALESCE($1, name),
            category = COALESCE($2, category),
            available_qty = COALESCE($3, available_qty),
            unit = COALESCE($4, unit),
            status = COALESCE($5, status),
            updated_at = CURRENT_TIMESTAMP
           WHERE id = $6 RETURNING *`,
          [name, category, availableQty, unit, status, id]
        )
        if (res.rows[0]) return res.rows[0]
      } catch (err) {
        console.warn('[MedicineModel] PostgreSQL update failed, using memory store:', err.message)
      }
    }

    const idx = memoryMedicines.findIndex(m => m.id === parseInt(id, 10))
    if (idx !== -1) {
      memoryMedicines[idx] = {
        ...memoryMedicines[idx],
        name: name !== undefined ? name : memoryMedicines[idx].name,
        category: category !== undefined ? category : memoryMedicines[idx].category,
        available_qty: availableQty !== undefined ? availableQty : memoryMedicines[idx].available_qty,
        unit: unit !== undefined ? unit : memoryMedicines[idx].unit,
        status: status !== undefined ? status : memoryMedicines[idx].status,
        updated_at: new Date().toISOString()
      }
      return memoryMedicines[idx]
    }
    return null
  },

  async deductStock(id, qty) {
    if (isConnected()) {
      try {
        const res = await query(
          `UPDATE medicines 
           SET available_qty = GREATEST(0, available_qty - $1),
               status = CASE WHEN available_qty - $1 <= 0 THEN 'Out of Stock' ELSE 'Available' END,
               updated_at = CURRENT_TIMESTAMP
           WHERE id = $2 RETURNING *`,
          [qty, id]
        )
        if (res.rows[0]) return res.rows[0]
      } catch (err) {
        console.warn('[MedicineModel] PostgreSQL deductStock failed, using memory store:', err.message)
      }
    }

    const idx = memoryMedicines.findIndex(m => m.id === parseInt(id, 10))
    if (idx !== -1) {
      const newQty = Math.max(0, memoryMedicines[idx].available_qty - qty)
      memoryMedicines[idx].available_qty = newQty
      memoryMedicines[idx].status = newQty <= 0 ? 'Out of Stock' : 'Available'
      memoryMedicines[idx].updated_at = new Date().toISOString()
      return memoryMedicines[idx]
    }
    return null
  }
}
