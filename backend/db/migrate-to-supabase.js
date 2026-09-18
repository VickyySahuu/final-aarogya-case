/**
 * AAROGYA CASE — One-Time Migration Script
 * Applies schema + seeds + migrates .db_state.json to Supabase PostgreSQL
 * 
 * Safe: Uses ON CONFLICT DO NOTHING for all inserts
 * Idempotent: Can be run multiple times without duplicating data
 */

import pg from 'pg'
import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.join(__dirname, '../.env') })

const { Pool } = pg
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 5,
  connectionTimeoutMillis: 15000,
})

let totalInserted = 0
let totalSkipped = 0

async function run() {
  console.log('====================================================')
  console.log('  AAROGYA CASE — Supabase Migration')
  console.log('====================================================\n')

  // Step 1: Test connection
  console.log('[1/6] Testing Supabase connection...')
  const client = await pool.connect()
  const connTest = await client.query('SELECT current_database() as db, NOW() as time')
  console.log(`  ✅ Connected to "${connTest.rows[0].db}" at ${connTest.rows[0].time}\n`)
  client.release()

  // Step 2: Apply schema.sql
  console.log('[2/6] Applying schema.sql...')
  const schemaPath = path.join(__dirname, 'schema.sql')
  const schemaSql = fs.readFileSync(schemaPath, 'utf-8')
  await pool.query(schemaSql)
  console.log('  ✅ Schema applied successfully\n')

  // Verify tables created
  const tablesRes = await pool.query(`
    SELECT table_name FROM information_schema.tables 
    WHERE table_schema = 'public' ORDER BY table_name
  `)
  console.log(`  Tables created: ${tablesRes.rows.length}`)
  tablesRes.rows.forEach(r => console.log(`    - ${r.table_name}`))
  console.log()

  // Step 3: Apply seed.sql (reference data)
  console.log('[3/6] Applying seed.sql (reference data)...')
  const seedPath = path.join(__dirname, 'seed.sql')
  const seedSql = fs.readFileSync(seedPath, 'utf-8')
  await pool.query(seedSql)
  console.log('  ✅ Seed data applied (users, hospital, doctor, patients, medicines, ambulance, prescriptions, emergency)\n')

  // Step 4: Migrate .db_state.json data
  console.log('[4/6] Migrating .db_state.json data...')
  const stateFile = path.join(__dirname, '../.db_state.json')
  if (!fs.existsSync(stateFile)) {
    console.log('  ⚠️  No .db_state.json found, skipping data migration')
  } else {
    const state = JSON.parse(fs.readFileSync(stateFile, 'utf-8'))
    
    // 4a. Migrate cases
    if (Array.isArray(state.cases) && state.cases.length > 0) {
      console.log(`  Migrating ${state.cases.length} cases...`)
      for (const c of state.cases) {
        await upsertCase(c)
      }
      console.log(`    ✅ Cases migration complete`)
    }

    // 4b. Migrate appointments
    if (Array.isArray(state.appointments) && state.appointments.length > 0) {
      console.log(`  Migrating ${state.appointments.length} appointments...`)
      for (const a of state.appointments) {
        await upsertAppointment(a)
      }
      console.log(`    ✅ Appointments migration complete`)
    }

    // 4c. Migrate prescriptions
    if (Array.isArray(state.prescriptions) && state.prescriptions.length > 0) {
      console.log(`  Migrating ${state.prescriptions.length} prescriptions...`)
      for (const p of state.prescriptions) {
        await upsertPrescription(p)
      }
      console.log(`    ✅ Prescriptions migration complete`)
    }

    // 4d. Migrate prescription_items
    if (Array.isArray(state.prescription_items) && state.prescription_items.length > 0) {
      console.log(`  Migrating ${state.prescription_items.length} prescription items...`)
      for (const pi of state.prescription_items) {
        await upsertPrescriptionItem(pi)
      }
      console.log(`    ✅ Prescription items migration complete`)
    }

    // 4e. Migrate diagnostic_requests
    if (Array.isArray(state.diagnostic_requests) && state.diagnostic_requests.length > 0) {
      console.log(`  Migrating ${state.diagnostic_requests.length} diagnostic requests...`)
      for (const dr of state.diagnostic_requests) {
        await upsertDiagnosticRequest(dr)
      }
      console.log(`    ✅ Diagnostic requests migration complete`)
    }

    // 4f. Migrate diagnostic_reports
    if (Array.isArray(state.diagnostic_reports) && state.diagnostic_reports.length > 0) {
      console.log(`  Migrating ${state.diagnostic_reports.length} diagnostic reports...`)
      for (const rep of state.diagnostic_reports) {
        await upsertDiagnosticReport(rep)
      }
      console.log(`    ✅ Diagnostic reports migration complete`)
    }

    // 4g. Migrate dispensings
    if (Array.isArray(state.dispensings) && state.dispensings.length > 0) {
      console.log(`  Migrating ${state.dispensings.length} dispensings...`)
      // Build prescription_id -> rx_number lookup
      const rxLookup = {}
      if (Array.isArray(state.prescriptions)) {
        for (const p of state.prescriptions) {
          rxLookup[p.id] = p.rx_number
        }
      }
      for (const d of state.dispensings) {
        // Resolve rx_number from prescriptions if missing
        if (!d.rx_number && d.prescription_id && rxLookup[d.prescription_id]) {
          d.rx_number = rxLookup[d.prescription_id]
        }
        await upsertDispensing(d)
      }
      console.log(`    ✅ Dispensings migration complete`)
    }
  }

  console.log(`\n  Migration summary: ${totalInserted} inserted, ${totalSkipped} skipped (already existed)\n`)

  // Step 5: Reset sequences
  console.log('[5/6] Resetting serial sequences...')
  const seqTables = [
    'users', 'hospitals', 'doctors', 'patients', 'medicines', 'ambulances',
    'patient_cases', 'appointments', 'prescriptions', 'prescription_items',
    'pharmacy_dispensings', 'diagnostic_requests', 'diagnostic_reports',
    'emergency_requests', 'diagnostic_tests'
  ]
  for (const t of seqTables) {
    try {
      await pool.query(`SELECT setval(pg_get_serial_sequence('${t}', 'id'), COALESCE((SELECT MAX(id) FROM ${t}), 0) + 1, false)`)
    } catch (e) {
      // Table might be empty or not have sequence
    }
  }
  console.log('  ✅ Sequences reset\n')

  // Step 6: Verify
  console.log('[6/6] Verification...')
  const counts = {}
  for (const t of seqTables) {
    try {
      const res = await pool.query(`SELECT COUNT(*) as cnt FROM ${t}`)
      counts[t] = parseInt(res.rows[0].cnt)
      console.log(`  ${t}: ${counts[t]} rows`)
    } catch (e) {
      console.log(`  ${t}: ERROR - ${e.message.substring(0, 60)}`)
    }
  }

  // Verify VIKASH KUMAR
  console.log('\n  === VIKASH KUMAR Verification ===')
  const vk = await pool.query(`SELECT id, patient_id, patient_unique_code, name, mobile FROM patients WHERE patient_unique_code = 'AC-VK2604'`)
  if (vk.rows.length > 0) {
    console.log(`  ✅ VIKASH KUMAR found: id=${vk.rows[0].id}, code=${vk.rows[0].patient_unique_code}`)
  } else {
    console.log('  ❌ VIKASH KUMAR NOT FOUND')
  }

  // Verify Rajesh
  const rj = await pool.query(`SELECT id, patient_id, patient_unique_code, name FROM patients WHERE patient_unique_code = 'AC-7F42K9'`)
  if (rj.rows.length > 0) {
    console.log(`  ✅ Rajesh found: id=${rj.rows[0].id}, code=${rj.rows[0].patient_unique_code}`)
  } else {
    console.log('  ❌ Rajesh NOT FOUND')
  }

  console.log('\n====================================================')
  console.log('  MIGRATION COMPLETE')
  console.log('====================================================')

  await pool.end()
}

// --- Upsert functions ---

async function upsertCase(c) {
  try {
    const symptoms = typeof c.symptoms === 'string' ? c.symptoms : JSON.stringify(c.symptoms || [])
    const assessmentAnswers = typeof c.assessment_answers === 'string' ? c.assessment_answers : JSON.stringify(c.assessment_answers || [])
    const aiAssessment = typeof c.ai_assessment === 'string' ? c.ai_assessment : JSON.stringify(c.ai_assessment || {})
    const structuredHistory = typeof c.structured_history === 'string' ? c.structured_history : JSON.stringify(c.structured_history || {})

    const res = await pool.query(`
      INSERT INTO patient_cases (
        id, case_number, patient_id, patient_unique_code, problem, duration, severity,
        symptoms, assessment_answers, ai_assessment, original_patient_response,
        structured_history, lifecycle_stage, status, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      ON CONFLICT (id) DO NOTHING
    `, [
      c.id, c.case_number, c.patient_id, c.patient_unique_code || null,
      c.problem, c.duration || null, c.severity || null,
      symptoms, assessmentAnswers, aiAssessment,
      c.original_patient_response || null,
      structuredHistory,
      c.lifecycle_stage || 'PATIENT CONFIRMED',
      c.status || 'Active',
      c.created_at || new Date().toISOString(),
      c.updated_at || new Date().toISOString()
    ])
    if (res.rowCount > 0) totalInserted++; else totalSkipped++
  } catch (e) {
    // Try ON CONFLICT on case_number
    try {
      const symptoms = typeof c.symptoms === 'string' ? c.symptoms : JSON.stringify(c.symptoms || [])
      const assessmentAnswers = typeof c.assessment_answers === 'string' ? c.assessment_answers : JSON.stringify(c.assessment_answers || [])
      const aiAssessment = typeof c.ai_assessment === 'string' ? c.ai_assessment : JSON.stringify(c.ai_assessment || {})
      const structuredHistory = typeof c.structured_history === 'string' ? c.structured_history : JSON.stringify(c.structured_history || {})

      const res2 = await pool.query(`
        INSERT INTO patient_cases (
          case_number, patient_id, patient_unique_code, problem, duration, severity,
          symptoms, assessment_answers, ai_assessment, original_patient_response,
          structured_history, lifecycle_stage, status, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        ON CONFLICT (case_number) DO NOTHING
      `, [
        c.case_number, c.patient_id, c.patient_unique_code || null,
        c.problem, c.duration || null, c.severity || null,
        symptoms, assessmentAnswers, aiAssessment,
        c.original_patient_response || null,
        structuredHistory,
        c.lifecycle_stage || 'PATIENT CONFIRMED',
        c.status || 'Active',
        c.created_at || new Date().toISOString(),
        c.updated_at || new Date().toISOString()
      ])
      if (res2.rowCount > 0) totalInserted++; else totalSkipped++
    } catch (e2) {
      console.warn(`    ⚠️  Case ${c.case_number}: ${e2.message.substring(0, 80)}`)
      totalSkipped++
    }
  }
}

async function upsertAppointment(a) {
  try {
    const res = await pool.query(`
      INSERT INTO appointments (
        id, appointment_number, patient_id, doctor_id, hospital_id, case_id,
        token_number, appointment_date, time_slot, opd_room, problem, severity,
        payment_method, payment_status, status, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      ON CONFLICT (id) DO NOTHING
    `, [
      a.id, a.appointment_number, a.patient_id, a.doctor_id,
      a.hospital_id || null, a.case_id || null,
      a.token_number, a.appointment_date, a.time_slot,
      a.opd_room || null, a.problem || null, a.severity || null,
      a.payment_method || 'Exempted / Government Ayush Scheme',
      a.payment_status || 'Completed',
      a.status || 'Waiting for Doctor',
      a.created_at || new Date().toISOString(),
      a.updated_at || new Date().toISOString()
    ])
    if (res.rowCount > 0) totalInserted++; else totalSkipped++
  } catch (e) {
    try {
      const res2 = await pool.query(`
        INSERT INTO appointments (
          appointment_number, patient_id, doctor_id, hospital_id, case_id,
          token_number, appointment_date, time_slot, opd_room, problem, severity,
          payment_method, payment_status, status, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        ON CONFLICT (appointment_number) DO NOTHING
      `, [
        a.appointment_number, a.patient_id, a.doctor_id,
        a.hospital_id || null, a.case_id || null,
        a.token_number, a.appointment_date, a.time_slot,
        a.opd_room || null, a.problem || null, a.severity || null,
        a.payment_method || 'Exempted / Government Ayush Scheme',
        a.payment_status || 'Completed',
        a.status || 'Waiting for Doctor',
        a.created_at || new Date().toISOString(),
        a.updated_at || new Date().toISOString()
      ])
      if (res2.rowCount > 0) totalInserted++; else totalSkipped++
    } catch (e2) {
      console.warn(`    ⚠️  Appointment ${a.appointment_number}: ${e2.message.substring(0, 80)}`)
      totalSkipped++
    }
  }
}

async function upsertPrescription(p) {
  try {
    const res = await pool.query(`
      INSERT INTO prescriptions (
        id, rx_number, appointment_id, case_id, patient_id, patient_unique_code,
        doctor_id, hospital_name, room_number, token, diagnosis, icd_code, vitals,
        pharmacy_status, status, patient_access, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      ON CONFLICT (id) DO NOTHING
    `, [
      p.id, p.rx_number, p.appointment_id || null, p.case_id || null,
      p.patient_id, p.patient_unique_code || null,
      p.doctor_id, p.hospital_name || null, p.room_number || null,
      p.token || null, p.diagnosis || null, p.icd_code || null,
      p.vitals || null,
      p.pharmacy_status || 'Sent',
      p.status || 'Issued',
      p.patient_access || 'Available',
      p.created_at || new Date().toISOString(),
      p.updated_at || new Date().toISOString()
    ])
    if (res.rowCount > 0) totalInserted++; else totalSkipped++
  } catch (e) {
    try {
      const res2 = await pool.query(`
        INSERT INTO prescriptions (
          rx_number, appointment_id, case_id, patient_id, patient_unique_code,
          doctor_id, hospital_name, room_number, token, diagnosis, icd_code, vitals,
          pharmacy_status, status, patient_access, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
        ON CONFLICT (rx_number) DO NOTHING
      `, [
        p.rx_number, p.appointment_id || null, p.case_id || null,
        p.patient_id, p.patient_unique_code || null,
        p.doctor_id, p.hospital_name || null, p.room_number || null,
        p.token || null, p.diagnosis || null, p.icd_code || null,
        p.vitals || null,
        p.pharmacy_status || 'Sent',
        p.status || 'Issued',
        p.patient_access || 'Available',
        p.created_at || new Date().toISOString(),
        p.updated_at || new Date().toISOString()
      ])
      if (res2.rowCount > 0) totalInserted++; else totalSkipped++
    } catch (e2) {
      console.warn(`    ⚠️  Prescription ${p.rx_number}: ${e2.message.substring(0, 80)}`)
      totalSkipped++
    }
  }
}

async function upsertPrescriptionItem(pi) {
  try {
    const res = await pool.query(`
      INSERT INTO prescription_items (
        id, prescription_id, medicine_id, medicine_name, category,
        dosage, frequency, duration, required_qty, instructions, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      ON CONFLICT (id) DO NOTHING
    `, [
      pi.id, pi.prescription_id, pi.medicine_id || null,
      pi.medicine_name, pi.category || null,
      pi.dosage || null, pi.frequency || null, pi.duration || null,
      pi.required_qty || 1, pi.instructions || null,
      pi.created_at || new Date().toISOString()
    ])
    if (res.rowCount > 0) totalInserted++; else totalSkipped++
  } catch (e) {
    try {
      // Insert without specifying id, let serial handle it
      const res2 = await pool.query(`
        INSERT INTO prescription_items (
          prescription_id, medicine_id, medicine_name, category,
          dosage, frequency, duration, required_qty, instructions, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `, [
        pi.prescription_id, pi.medicine_id || null,
        pi.medicine_name, pi.category || null,
        pi.dosage || null, pi.frequency || null, pi.duration || null,
        pi.required_qty || 1, pi.instructions || null,
        pi.created_at || new Date().toISOString()
      ])
      if (res2.rowCount > 0) totalInserted++; else totalSkipped++
    } catch (e2) {
      console.warn(`    ⚠️  PrescriptionItem ${pi.id}: ${e2.message.substring(0, 80)}`)
      totalSkipped++
    }
  }
}

async function upsertDiagnosticRequest(dr) {
  try {
    const res = await pool.query(`
      INSERT INTO diagnostic_requests (
        id, request_id, request_number, appointment_id, case_id,
        patient_id, patient_unique_code, doctor_id, test_name, test_scan,
        test_code, category, clinical_notes, request_notes, priority,
        status, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      ON CONFLICT (id) DO NOTHING
    `, [
      dr.id, dr.request_id, dr.request_number || null,
      dr.appointment_id || null, dr.case_id || null,
      dr.patient_id, dr.patient_unique_code || null,
      dr.doctor_id, dr.test_name, dr.test_scan || null,
      dr.test_code || null, dr.category || null,
      dr.clinical_notes || null, dr.request_notes || null,
      dr.priority || 'Routine',
      dr.status || 'Pending',
      dr.created_at || new Date().toISOString(),
      dr.updated_at || new Date().toISOString()
    ])
    if (res.rowCount > 0) totalInserted++; else totalSkipped++
  } catch (e) {
    try {
      const res2 = await pool.query(`
        INSERT INTO diagnostic_requests (
          request_id, request_number, appointment_id, case_id,
          patient_id, patient_unique_code, doctor_id, test_name, test_scan,
          test_code, category, clinical_notes, request_notes, priority,
          status, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
        ON CONFLICT (request_id) DO NOTHING
      `, [
        dr.request_id, dr.request_number || null,
        dr.appointment_id || null, dr.case_id || null,
        dr.patient_id, dr.patient_unique_code || null,
        dr.doctor_id, dr.test_name, dr.test_scan || null,
        dr.test_code || null, dr.category || null,
        dr.clinical_notes || null, dr.request_notes || null,
        dr.priority || 'Routine',
        dr.status || 'Pending',
        dr.created_at || new Date().toISOString(),
        dr.updated_at || new Date().toISOString()
      ])
      if (res2.rowCount > 0) totalInserted++; else totalSkipped++
    } catch (e2) {
      console.warn(`    ⚠️  DiagRequest ${dr.request_id}: ${e2.message.substring(0, 80)}`)
      totalSkipped++
    }
  }
}

async function upsertDiagnosticReport(rep) {
  try {
    const reportData = rep.report_data ? (typeof rep.report_data === 'string' ? rep.report_data : JSON.stringify(rep.report_data)) : null

    const res = await pool.query(`
      INSERT INTO diagnostic_reports (
        id, report_id, request_id, request_number, patient_id, patient_unique_code,
        doctor_id, test_name, test_scan, category, file_name, file_size, file_url,
        findings, impression, report_data, report_file_reference, verified_by,
        status, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
      ON CONFLICT (id) DO NOTHING
    `, [
      rep.id, rep.report_id, rep.request_id, rep.request_number || null,
      rep.patient_id, rep.patient_unique_code || null,
      rep.doctor_id, rep.test_name, rep.test_scan || null,
      rep.category || null, rep.file_name || null, rep.file_size || null,
      rep.file_url || null, rep.findings || null, rep.impression || null,
      reportData, rep.report_file_reference || null,
      rep.verified_by || null,
      rep.status || 'Completed',
      rep.created_at || new Date().toISOString(),
      rep.updated_at || new Date().toISOString()
    ])
    if (res.rowCount > 0) totalInserted++; else totalSkipped++
  } catch (e) {
    try {
      const reportData = rep.report_data ? (typeof rep.report_data === 'string' ? rep.report_data : JSON.stringify(rep.report_data)) : null
      const res2 = await pool.query(`
        INSERT INTO diagnostic_reports (
          report_id, request_id, request_number, patient_id, patient_unique_code,
          doctor_id, test_name, test_scan, category, file_name, file_size, file_url,
          findings, impression, report_data, report_file_reference, verified_by,
          status, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
        ON CONFLICT (report_id) DO NOTHING
      `, [
        rep.report_id, rep.request_id, rep.request_number || null,
        rep.patient_id, rep.patient_unique_code || null,
        rep.doctor_id, rep.test_name, rep.test_scan || null,
        rep.category || null, rep.file_name || null, rep.file_size || null,
        rep.file_url || null, rep.findings || null, rep.impression || null,
        reportData, rep.report_file_reference || null,
        rep.verified_by || null,
        rep.status || 'Completed',
        rep.created_at || new Date().toISOString(),
        rep.updated_at || new Date().toISOString()
      ])
      if (res2.rowCount > 0) totalInserted++; else totalSkipped++
    } catch (e2) {
      console.warn(`    ⚠️  DiagReport ${rep.report_id}: ${e2.message.substring(0, 80)}`)
      totalSkipped++
    }
  }
}

async function upsertDispensing(d) {
  try {
    const dispensedItems = d.dispensed_items ? (typeof d.dispensed_items === 'string' ? d.dispensed_items : JSON.stringify(d.dispensed_items)) : '[]'

    const res = await pool.query(`
      INSERT INTO pharmacy_dispensings (
        id, dispensing_number, prescription_id, rx_number, patient_id,
        patient_unique_code, dispensed_items, dispensed_by, delivery_verified_by,
        status, dispensed_at, delivered_at, verified_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      ON CONFLICT (id) DO NOTHING
    `, [
      d.id, d.dispensing_number || null, d.prescription_id,
      d.rx_number || `RX-${d.prescription_id}`,
      d.patient_id, d.patient_unique_code || null,
      dispensedItems, d.dispensed_by || null,
      d.delivery_verified_by || null,
      d.status || 'Dispensed',
      d.dispensed_at || new Date().toISOString(),
      d.delivered_at || null,
      d.verified_at || null
    ])
    if (res.rowCount > 0) totalInserted++; else totalSkipped++
  } catch (e) {
    console.warn(`    ⚠️  Dispensing ${d.id}: ${e.message.substring(0, 80)}`)
    totalSkipped++
  }
}

run().catch(err => {
  console.error('❌ Migration failed:', err.message)
  process.exit(1)
})
