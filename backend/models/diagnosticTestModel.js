import { query, isConnected } from '../db/index.js'

const SEED_DIAGNOSTICS = [
  {
    id: 1,
    test_id: 'DIAG-XR-01',
    name: 'Chest X-Ray (PA View)',
    category: 'Radiology / Digital Radiography',
    turnaround: '15 Mins',
    status: 'Active',
    icon: 'radiology',
    created_at: new Date().toISOString()
  },
  {
    id: 2,
    test_id: 'DIAG-MRI-02',
    name: 'Magnetic Resonance Imaging (MRI)',
    category: 'Advanced Neuro / Musculoskeletal Imaging',
    turnaround: '45 Mins',
    status: 'Active',
    icon: 'vital_signs',
    created_at: new Date().toISOString()
  },
  {
    id: 3,
    test_id: 'DIAG-BLD-03',
    name: 'Complete Blood Count (CBC)',
    category: 'Hematology / Pathology',
    turnaround: '30 Mins',
    status: 'Active',
    icon: 'bloodtype',
    created_at: new Date().toISOString()
  },
  {
    id: 4,
    test_id: 'DIAG-USG-04',
    name: 'Ultrasound Abdomen',
    category: 'Sonography',
    turnaround: '20 Mins',
    status: 'Active',
    icon: 'question_mark',
    created_at: new Date().toISOString()
  },
  {
    id: 5,
    test_id: 'DIAG-CTS-05',
    name: 'CT Scan (Head / Brain)',
    category: 'Computed Tomography',
    turnaround: '25 Mins',
    status: 'Active',
    icon: 'psychology',
    created_at: new Date().toISOString()
  }
]

const memoryDiagnosticTests = [...SEED_DIAGNOSTICS]

export const DiagnosticTestModel = {
  async getAll() {
    if (isConnected()) {
      try {
        const res = await query('SELECT * FROM diagnostic_tests ORDER BY id ASC')
        if (res.rows.length > 0) return res.rows
      } catch (err) {
        // Fall back to memory
      }
    }
    return memoryDiagnosticTests
  },

  async findById(id) {
    const numId = !isNaN(Number(id)) ? parseInt(id, 10) : null
    if (isConnected()) {
      try {
        const res = await query(
          numId 
            ? 'SELECT * FROM diagnostic_tests WHERE id = $1 OR test_id = $2' 
            : 'SELECT * FROM diagnostic_tests WHERE test_id = $1',
          numId ? [numId, String(id)] : [String(id)]
        )
        if (res.rows[0]) return res.rows[0]
      } catch (err) {
        // Fall back to memory
      }
    }
    return memoryDiagnosticTests.find(t => 
      String(t.id) === String(id) || t.test_id === String(id)
    ) || null
  },

  async findByName(name) {
    if (!name) return null
    const clean = String(name).trim().toLowerCase()
    if (isConnected()) {
      try {
        const res = await query('SELECT * FROM diagnostic_tests WHERE LOWER(name) = LOWER($1) LIMIT 1', [name.trim()])
        if (res.rows[0]) return res.rows[0]
      } catch (err) {
        // Fall back to memory
      }
    }
    return memoryDiagnosticTests.find(t => t.name.toLowerCase() === clean) || null
  },

  async create({ testId, name, category, turnaround, status, icon }) {
    const tid = testId || `DIAG-MOD-${String(memoryDiagnosticTests.length + 1).padStart(2, '0')}`
    if (isConnected()) {
      try {
        const res = await query(
          `INSERT INTO diagnostic_tests (test_id, name, category, turnaround, status, icon)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING *`,
          [
            tid,
            name,
            category || 'General Diagnostic',
            turnaround || '25 Mins',
            status || 'Active',
            icon || 'biotech'
          ]
        )
        if (res.rows[0]) {
          memoryDiagnosticTests.push(res.rows[0])
          return res.rows[0]
        }
      } catch (err) {
        // Fall back to memory
      }
    }

    const newTest = {
      id: memoryDiagnosticTests.length + 1,
      test_id: tid,
      name,
      category: category || 'General Diagnostic',
      turnaround: turnaround || '25 Mins',
      status: status || 'Active',
      icon: icon || 'biotech',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    memoryDiagnosticTests.push(newTest)
    return newTest
  },

  async update(id, { name, category, turnaround, status }) {
    const numId = !isNaN(Number(id)) ? parseInt(id, 10) : null
    if (isConnected()) {
      try {
        const res = await query(
          `UPDATE diagnostic_tests SET
            name = COALESCE($1, name),
            category = COALESCE($2, category),
            turnaround = COALESCE($3, turnaround),
            status = COALESCE($4, status),
            updated_at = CURRENT_TIMESTAMP
           WHERE ${numId ? 'id = $5 OR test_id = $6' : 'test_id = $5'}
           RETURNING *`,
          numId 
            ? [name, category, turnaround, status, numId, String(id)]
            : [name, category, turnaround, status, String(id)]
        )
        if (res.rows[0]) return res.rows[0]
      } catch (err) {
        // Fall back to memory
      }
    }

    const idx = memoryDiagnosticTests.findIndex(t => 
      String(t.id) === String(id) || t.test_id === String(id)
    )
    if (idx !== -1) {
      memoryDiagnosticTests[idx] = {
        ...memoryDiagnosticTests[idx],
        name: name !== undefined ? name : memoryDiagnosticTests[idx].name,
        category: category !== undefined ? category : memoryDiagnosticTests[idx].category,
        turnaround: turnaround !== undefined ? turnaround : memoryDiagnosticTests[idx].turnaround,
        status: status !== undefined ? status : memoryDiagnosticTests[idx].status,
        updated_at: new Date().toISOString()
      }
      return memoryDiagnosticTests[idx]
    }
    return null
  }
}
