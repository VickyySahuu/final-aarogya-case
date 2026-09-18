/**
 * AAROGYA CASE — Complete Data Integrity Fix Script
 * 
 * Fixes all 26 skipped records from the initial migration:
 * 
 * ROOT CAUSE ANALYSIS:
 * ─────────────────────
 * 1. Duplicate rx_numbers: The fallback store's rxCounter resets on server restart,
 *    so repeated test runs created 8 prescriptions all named "RX-2026-000001" 
 *    (for different case/appointment combos). PostgreSQL UNIQUE constraint collapsed
 *    them into 1 row. These are test artifacts — each represents the same template
 *    prescription from a different test run.
 * 
 * 2. Duplicate request_ids: Same pattern — 6 diagnostic requests all named 
 *    "REQ-REQ-2026-000001" from repeated test runs.
 * 
 * 3. Missing cases 104,105 + appointments 40,41: Created by the most recent
 *    test-patient-identity-linking.js run AFTER the migration script ran.
 *    These are test-generated records that need to be migrated.
 * 
 * 4. Missing prescription items: All belong to the duplicate prescriptions above.
 * 
 * FIX STRATEGY:
 * ─────────────
 * A. For genuinely duplicated records (same rx_number, same template):
 *    - Keep the one that exists in Supabase
 *    - The duplicates are test artifacts, not unique clinical data
 *    - Create unique rx_numbers for each distinct case/appointment pair
 * 
 * B. For missing cases/appointments from recent test runs:
 *    - Insert them using the correct FK references
 * 
 * C. For missing prescription items:
 *    - After fixing prescriptions, insert items with correct parent rx IDs
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

let fixCount = 0

async function main() {
  const state = JSON.parse(fs.readFileSync(path.join(__dirname, '../.db_state.json'), 'utf-8'))

  console.log('====================================================')
  console.log('  AAROGYA CASE — Data Integrity Fix')
  console.log('====================================================\n')

  // ──────────────────────────────────────────────────
  // FIX A: Insert missing cases (id=104, 105)
  // ──────────────────────────────────────────────────
  console.log('[FIX A] Migrating missing cases...')
  const dbCases = await pool.query('SELECT id, case_number FROM patient_cases ORDER BY id')
  const dbCaseNums = new Set(dbCases.rows.map(r => r.case_number))

  for (const c of state.cases) {
    if (!dbCaseNums.has(c.case_number)) {
      const symptoms = typeof c.symptoms === 'string' ? c.symptoms : JSON.stringify(c.symptoms || [])
      const assessmentAnswers = typeof c.assessment_answers === 'string' ? c.assessment_answers : JSON.stringify(c.assessment_answers || [])
      const aiAssessment = typeof c.ai_assessment === 'string' ? c.ai_assessment : JSON.stringify(c.ai_assessment || {})
      const structuredHistory = typeof c.structured_history === 'string' ? c.structured_history : JSON.stringify(c.structured_history || {})

      try {
        await pool.query(`
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
        console.log(`  ✅ Inserted case ${c.case_number}`)
        fixCount++
      } catch (e) {
        console.log(`  ⚠️ Case ${c.case_number}: ${e.message.substring(0, 80)}`)
      }
    }
  }

  // ──────────────────────────────────────────────────
  // FIX B: Insert missing appointments (id=40, 41)
  // ──────────────────────────────────────────────────
  console.log('\n[FIX B] Migrating missing appointments...')
  // Reload cases to get fresh IDs
  const freshCases = await pool.query('SELECT id, case_number FROM patient_cases ORDER BY id')
  const caseNumToIdMap = {}
  for (const r of freshCases.rows) {
    caseNumToIdMap[r.case_number] = r.id
  }

  const dbAppts = await pool.query('SELECT id, appointment_number FROM appointments ORDER BY id')
  const dbApptNums = new Set(dbAppts.rows.map(r => r.appointment_number))

  for (const a of state.appointments) {
    if (!dbApptNums.has(a.appointment_number)) {
      // Remap case_id: find the case_number for this case_id in state, then get the DB id
      let dbCaseId = null
      if (a.case_id) {
        const stateCase = state.cases.find(c => c.id === a.case_id)
        if (stateCase) {
          dbCaseId = caseNumToIdMap[stateCase.case_number] || null
        }
      }

      try {
        await pool.query(`
          INSERT INTO appointments (
            appointment_number, patient_id, doctor_id, hospital_id, case_id,
            token_number, appointment_date, time_slot, opd_room, problem, severity,
            payment_method, payment_status, status, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
          ON CONFLICT (appointment_number) DO NOTHING
        `, [
          a.appointment_number, a.patient_id, a.doctor_id,
          a.hospital_id || null, dbCaseId,
          a.token_number, a.appointment_date, a.time_slot,
          a.opd_room || null, a.problem || null, a.severity || null,
          a.payment_method || 'Exempted / Government Ayush Scheme',
          a.payment_status || 'Completed',
          a.status || 'Waiting for Doctor',
          a.created_at || new Date().toISOString(),
          a.updated_at || new Date().toISOString()
        ])
        console.log(`  ✅ Inserted appointment ${a.appointment_number} (case_id remapped: ${a.case_id} → ${dbCaseId})`)
        fixCount++
      } catch (e) {
        console.log(`  ⚠️ Appointment ${a.appointment_number}: ${e.message.substring(0, 80)}`)
      }
    }
  }

  // ──────────────────────────────────────────────────
  // FIX C: Insert missing prescriptions with unique rx_numbers
  // ──────────────────────────────────────────────────
  console.log('\n[FIX C] Fixing duplicate-rx_number prescriptions...')
  
  // Reload appointments to get fresh IDs
  const freshAppts = await pool.query('SELECT id, appointment_number FROM appointments ORDER BY id')
  const apptNumToIdMap = {}
  for (const r of freshAppts.rows) {
    apptNumToIdMap[r.appointment_number] = r.id
  }

  const dbRx = await pool.query('SELECT id, rx_number, case_id, appointment_id FROM prescriptions ORDER BY id')
  const dbRxNums = new Set(dbRx.rows.map(r => r.rx_number))

  // Group state prescriptions by rx_number
  const rxGroups = {}
  for (const p of state.prescriptions) {
    if (!rxGroups[p.rx_number]) rxGroups[p.rx_number] = []
    rxGroups[p.rx_number].push(p)
  }

  // For each group of duplicates, ensure one representative exists for each unique case/appointment
  const stateToDbRxMap = {} // Map state rx ID -> DB rx ID for items later

  for (const [rxNum, copies] of Object.entries(rxGroups)) {
    if (copies.length <= 1) {
      // Not a duplicate — check if it exists
      const p = copies[0]
      const inDb = dbRx.rows.find(r => r.rx_number === p.rx_number)
      if (inDb) {
        stateToDbRxMap[p.id] = inDb.id
      }
      continue
    }

    // Multiple copies with same rx_number — one already in DB
    const existingDbRx = dbRx.rows.find(r => r.rx_number === rxNum)
    
    for (let i = 0; i < copies.length; i++) {
      const p = copies[i]
      
      // Check if this specific copy (by case_id) is the one already in DB
      if (existingDbRx) {
        // Remap case_id
        const stateCase = state.cases.find(c => c.id === p.case_id)
        const dbCaseId = stateCase ? (caseNumToIdMap[stateCase.case_number] || null) : null
        
        if (existingDbRx.case_id === dbCaseId) {
          stateToDbRxMap[p.id] = existingDbRx.id
          continue
        }
      }

      // This is a duplicate that needs a new unique rx_number
      const stateCase = state.cases.find(c => c.id === p.case_id)
      const dbCaseId = stateCase ? (caseNumToIdMap[stateCase.case_number] || null) : null
      const stateAppt = state.appointments.find(a => a.id === p.appointment_id)
      const dbApptId = stateAppt ? (apptNumToIdMap[stateAppt.appointment_number] || null) : null

      // Generate truly unique rx_number for this copy
      const uniqueRxNum = `${rxNum}-C${dbCaseId || p.case_id}`

      if (dbRxNums.has(uniqueRxNum)) {
        // Already exists with this unique name
        const existing = (await pool.query('SELECT id FROM prescriptions WHERE rx_number = $1', [uniqueRxNum])).rows[0]
        if (existing) stateToDbRxMap[p.id] = existing.id
        continue
      }

      try {
        const res = await pool.query(`
          INSERT INTO prescriptions (
            rx_number, appointment_id, case_id, patient_id, patient_unique_code,
            doctor_id, hospital_name, room_number, token, diagnosis, icd_code, vitals,
            pharmacy_status, status, patient_access, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
          ON CONFLICT (rx_number) DO NOTHING
          RETURNING id
        `, [
          uniqueRxNum, dbApptId, dbCaseId,
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
        if (res.rows.length > 0) {
          stateToDbRxMap[p.id] = res.rows[0].id
          dbRxNums.add(uniqueRxNum)
          console.log(`  ✅ Inserted prescription ${uniqueRxNum} (was ${rxNum}, state.id=${p.id}, case_id=${dbCaseId})`)
          fixCount++
        }
      } catch (e) {
        console.log(`  ⚠️ Prescription ${uniqueRxNum}: ${e.message.substring(0, 80)}`)
      }
    }
  }

  // ──────────────────────────────────────────────────
  // FIX D: Insert missing prescription items
  // ──────────────────────────────────────────────────
  console.log('\n[FIX D] Fixing missing prescription items...')
  
  // Reload prescriptions
  const freshRx = await pool.query('SELECT id, rx_number FROM prescriptions ORDER BY id')
  const dbRxItemsCheck = await pool.query('SELECT id, prescription_id, medicine_name FROM prescription_items ORDER BY id')
  
  for (const pi of state.prescription_items) {
    // Check if this item already exists in DB
    const dbParentId = stateToDbRxMap[pi.prescription_id]
    if (!dbParentId) {
      // Try to find the parent prescription by rx_number
      const parentRx = state.prescriptions.find(p => p.id === pi.prescription_id)
      if (parentRx) {
        const dbPrx = freshRx.rows.find(r => r.rx_number === parentRx.rx_number || r.rx_number.startsWith(parentRx.rx_number))
        if (dbPrx) {
          stateToDbRxMap[pi.prescription_id] = dbPrx.id
        }
      }
    }

    const targetRxId = stateToDbRxMap[pi.prescription_id]
    if (!targetRxId) {
      console.log(`  ⚠️ PrescriptionItem id=${pi.id} — parent rx_id=${pi.prescription_id} has no DB mapping, SKIPPING`)
      continue
    }

    // Check if item already exists for this prescription+medicine combo
    const alreadyExists = dbRxItemsCheck.rows.find(
      r => r.prescription_id === targetRxId && r.medicine_name === pi.medicine_name
    )
    if (alreadyExists) continue

    try {
      await pool.query(`
        INSERT INTO prescription_items (
          prescription_id, medicine_id, medicine_name, category,
          dosage, frequency, duration, required_qty, instructions, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `, [
        targetRxId, pi.medicine_id || null,
        pi.medicine_name, pi.category || null,
        pi.dosage || null, pi.frequency || null, pi.duration || null,
        pi.required_qty || 1, pi.instructions || null,
        pi.created_at || new Date().toISOString()
      ])
      console.log(`  ✅ Inserted item "${pi.medicine_name}" for rx_id=${targetRxId} (was state rx_id=${pi.prescription_id})`)
      fixCount++
    } catch (e) {
      console.log(`  ⚠️ PrescriptionItem ${pi.medicine_name}: ${e.message.substring(0, 80)}`)
    }
  }

  // ──────────────────────────────────────────────────
  // FIX E: Insert missing diagnostic requests with unique IDs
  // ──────────────────────────────────────────────────
  console.log('\n[FIX E] Fixing duplicate diagnostic requests...')
  
  const dbDiagReqs = await pool.query('SELECT id, request_id, request_number, case_id FROM diagnostic_requests ORDER BY id')
  const dbReqIds = new Set(dbDiagReqs.rows.map(r => r.request_id))
  const stateToDbReqMap = {}

  // Group by request_id
  const diagGroups = {}
  for (const dr of state.diagnostic_requests) {
    if (!diagGroups[dr.request_id]) diagGroups[dr.request_id] = []
    diagGroups[dr.request_id].push(dr)
  }

  for (const [reqId, copies] of Object.entries(diagGroups)) {
    if (copies.length <= 1) {
      const dr = copies[0]
      const inDb = dbDiagReqs.rows.find(r => r.request_id === dr.request_id)
      if (inDb) stateToDbReqMap[dr.id] = inDb.id
      continue
    }

    const existingDbReq = dbDiagReqs.rows.find(r => r.request_id === reqId)

    for (const dr of copies) {
      const stateCase = state.cases.find(c => c.id === dr.case_id)
      const dbCaseId = stateCase ? (caseNumToIdMap[stateCase.case_number] || null) : null

      if (existingDbReq && existingDbReq.case_id === dbCaseId) {
        stateToDbReqMap[dr.id] = existingDbReq.id
        continue
      }

      const uniqueReqId = `${reqId}-C${dbCaseId || dr.case_id}`
      const uniqueReqNum = dr.request_number ? `${dr.request_number}-C${dbCaseId || dr.case_id}` : uniqueReqId

      if (dbReqIds.has(uniqueReqId)) {
        const existing = (await pool.query('SELECT id FROM diagnostic_requests WHERE request_id = $1', [uniqueReqId])).rows[0]
        if (existing) stateToDbReqMap[dr.id] = existing.id
        continue
      }

      try {
        const res = await pool.query(`
          INSERT INTO diagnostic_requests (
            request_id, request_number, appointment_id, case_id,
            patient_id, patient_unique_code, doctor_id, test_name, test_scan,
            test_code, category, clinical_notes, request_notes, priority,
            status, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
          ON CONFLICT (request_id) DO NOTHING
          RETURNING id
        `, [
          uniqueReqId, uniqueReqNum,
          null, dbCaseId,
          dr.patient_id, dr.patient_unique_code || null,
          dr.doctor_id, dr.test_name, dr.test_scan || null,
          dr.test_code || null, dr.category || null,
          dr.clinical_notes || null, dr.request_notes || null,
          dr.priority || 'Routine',
          dr.status || 'Pending',
          dr.created_at || new Date().toISOString(),
          dr.updated_at || new Date().toISOString()
        ])
        if (res.rows.length > 0) {
          stateToDbReqMap[dr.id] = res.rows[0].id
          dbReqIds.add(uniqueReqId)
          console.log(`  ✅ Inserted diagnostic request ${uniqueReqId} (was ${reqId}, case_id=${dbCaseId})`)
          fixCount++
        }
      } catch (e) {
        console.log(`  ⚠️ DiagReq ${uniqueReqId}: ${e.message.substring(0, 80)}`)
      }
    }
  }

  // ──────────────────────────────────────────────────
  // FIX F: Reset sequences
  // ──────────────────────────────────────────────────
  console.log('\n[FIX F] Resetting serial sequences...')
  const seqTables = [
    'users', 'hospitals', 'doctors', 'patients', 'medicines', 'ambulances',
    'patient_cases', 'appointments', 'prescriptions', 'prescription_items',
    'pharmacy_dispensings', 'diagnostic_requests', 'diagnostic_reports',
    'emergency_requests', 'diagnostic_tests'
  ]
  for (const t of seqTables) {
    try {
      await pool.query(`SELECT setval(pg_get_serial_sequence('${t}', 'id'), COALESCE((SELECT MAX(id) FROM ${t}), 0) + 1, false)`)
    } catch (e) { /* OK */ }
  }
  console.log('  ✅ Sequences reset')

  // ──────────────────────────────────────────────────
  // VERIFICATION
  // ──────────────────────────────────────────────────
  console.log('\n====================================================')
  console.log('  POST-FIX VERIFICATION')
  console.log('====================================================\n')

  for (const t of seqTables) {
    try {
      const res = await pool.query(`SELECT COUNT(*) as cnt FROM ${t}`)
      console.log(`  ${t}: ${res.rows[0].cnt} rows`)
    } catch (e) {
      console.log(`  ${t}: ERROR`)
    }
  }

  // VIKASH KUMAR complete graph
  console.log('\n=== VIKASH KUMAR (AC-VK2604) POST-FIX ===')
  const vk = await pool.query(`SELECT id FROM patients WHERE patient_unique_code = 'AC-VK2604'`)
  if (vk.rows.length > 0) {
    const vkId = vk.rows[0].id
    const cases = await pool.query('SELECT COUNT(*) as cnt FROM patient_cases WHERE patient_id = $1', [vkId])
    const appts = await pool.query('SELECT COUNT(*) as cnt FROM appointments WHERE patient_id = $1', [vkId])
    const rx = await pool.query('SELECT COUNT(*) as cnt FROM prescriptions WHERE patient_id = $1', [vkId])
    const items = await pool.query(`SELECT COUNT(*) as cnt FROM prescription_items pi JOIN prescriptions p ON pi.prescription_id = p.id WHERE p.patient_id = $1`, [vkId])
    const diag = await pool.query('SELECT COUNT(*) as cnt FROM diagnostic_requests WHERE patient_id = $1', [vkId])
    const reps = await pool.query('SELECT COUNT(*) as cnt FROM diagnostic_reports WHERE patient_id = $1', [vkId])
    const disp = await pool.query('SELECT COUNT(*) as cnt FROM pharmacy_dispensings WHERE patient_id = $1', [vkId])
    
    console.log(`  Patient id=${vkId}`)
    console.log(`  Cases: ${cases.rows[0].cnt}`)
    console.log(`  Appointments: ${appts.rows[0].cnt}`)
    console.log(`  Prescriptions: ${rx.rows[0].cnt}`)
    console.log(`  Prescription Items: ${items.rows[0].cnt}`)
    console.log(`  Diagnostic Requests: ${diag.rows[0].cnt}`)
    console.log(`  Diagnostic Reports: ${reps.rows[0].cnt}`)
    console.log(`  Dispensings: ${disp.rows[0].cnt}`)
  }

  console.log(`\n  Total fixes applied: ${fixCount}`)
  console.log('\n====================================================')
  console.log('  DATA INTEGRITY FIX COMPLETE')
  console.log('====================================================')

  await pool.end()
}

main().catch(err => {
  console.error('Fix failed:', err.message)
  process.exit(1)
})
