/**
 * AAROGYA CASE — Deep Migration Audit Script
 * Compares .db_state.json against Supabase PostgreSQL row-by-row
 * Identifies every skipped record and its root cause
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

async function main() {
  const state = JSON.parse(fs.readFileSync(path.join(__dirname, '../.db_state.json'), 'utf-8'))

  console.log('====================================================')
  console.log('  DEEP MIGRATION AUDIT')
  console.log('====================================================\n')

  // 1. PATIENTS
  console.log('=== PATIENTS ===')
  const dbPatients = await pool.query('SELECT id, patient_id, patient_unique_code, name, mobile FROM patients ORDER BY id')
  console.log(`  .db_state.json: ${state.patients.length} | Supabase: ${dbPatients.rows.length}`)
  for (const p of state.patients) {
    const inDb = dbPatients.rows.find(r => r.patient_unique_code === p.patient_unique_code)
    console.log(`  [${inDb ? '✅' : '❌'}] id=${p.id} ${p.name} (${p.patient_unique_code}) ${inDb ? `DB id=${inDb.id}` : 'MISSING'}`)
  }

  // 2. CASES
  console.log('\n=== PATIENT CASES ===')
  const dbCases = await pool.query('SELECT id, case_number, patient_id, patient_unique_code FROM patient_cases ORDER BY id')
  const dbCaseNumbers = new Set(dbCases.rows.map(r => r.case_number))
  const dbCaseIds = new Set(dbCases.rows.map(r => r.id))
  console.log(`  .db_state.json: ${state.cases.length} | Supabase: ${dbCases.rows.length}`)
  const missingCases = []
  for (const c of state.cases) {
    const inDb = dbCases.rows.find(r => r.case_number === c.case_number)
    if (!inDb) {
      missingCases.push(c)
      console.log(`  [❌] id=${c.id} ${c.case_number} patient_id=${c.patient_id} — MISSING`)
    }
  }
  if (missingCases.length === 0) console.log('  All cases present ✅')

  // 3. APPOINTMENTS
  console.log('\n=== APPOINTMENTS ===')
  const dbAppts = await pool.query('SELECT id, appointment_number, patient_id, doctor_id, case_id FROM appointments ORDER BY id')
  const dbApptNums = new Set(dbAppts.rows.map(r => r.appointment_number))
  console.log(`  .db_state.json: ${state.appointments.length} | Supabase: ${dbAppts.rows.length}`)
  const missingAppts = []
  for (const a of state.appointments) {
    const inDb = dbAppts.rows.find(r => r.appointment_number === a.appointment_number)
    if (!inDb) {
      missingAppts.push(a)
      console.log(`  [❌] id=${a.id} ${a.appointment_number} patient_id=${a.patient_id} case_id=${a.case_id} — MISSING`)
    }
  }
  if (missingAppts.length === 0) console.log('  All appointments present ✅')

  // 4. PRESCRIPTIONS
  console.log('\n=== PRESCRIPTIONS ===')
  const dbRx = await pool.query('SELECT id, rx_number, patient_id, doctor_id, appointment_id, case_id FROM prescriptions ORDER BY id')
  console.log(`  .db_state.json: ${state.prescriptions.length} | Supabase: ${dbRx.rows.length}`)
  const missingRx = []
  for (const p of state.prescriptions) {
    const inDb = dbRx.rows.find(r => r.rx_number === p.rx_number)
    if (!inDb) {
      missingRx.push(p)
      // Check which FK is missing
      const caseExists = p.case_id ? dbCaseIds.has(p.case_id) : true
      const apptExists = p.appointment_id ? dbAppts.rows.some(r => r.id === p.appointment_id) : true
      console.log(`  [❌] id=${p.id} ${p.rx_number} patient_id=${p.patient_id} case_id=${p.case_id}(${caseExists?'exists':'MISSING'}) appt_id=${p.appointment_id}(${apptExists?'exists':'MISSING'}) — MISSING`)
    }
  }
  if (missingRx.length === 0) console.log('  All prescriptions present ✅')

  // 5. PRESCRIPTION ITEMS
  console.log('\n=== PRESCRIPTION ITEMS ===')
  const dbRxItems = await pool.query('SELECT id, prescription_id, medicine_name FROM prescription_items ORDER BY id')
  const dbRxIds = new Set(dbRx.rows.map(r => r.id))
  console.log(`  .db_state.json: ${state.prescription_items.length} | Supabase: ${dbRxItems.rows.length}`)
  const missingItems = []
  for (const pi of state.prescription_items) {
    const inDb = dbRxItems.rows.find(r => r.id === pi.id)
    if (!inDb) {
      const rxExists = dbRxIds.has(pi.prescription_id)
      const rxInState = state.prescriptions.find(p => p.id === pi.prescription_id)
      missingItems.push({ ...pi, rxExists, rxInState: !!rxInState })
      console.log(`  [❌] id=${pi.id} rx_id=${pi.prescription_id}(DB:${rxExists?'exists':'MISSING'}, State:${rxInState?'exists':'MISSING'}) ${pi.medicine_name} — MISSING`)
    }
  }
  if (missingItems.length === 0) console.log('  All prescription items present ✅')

  // 6. DIAGNOSTIC REQUESTS
  console.log('\n=== DIAGNOSTIC REQUESTS ===')
  const dbDiagReqs = await pool.query('SELECT id, request_id, request_number, patient_id, case_id FROM diagnostic_requests ORDER BY id')
  console.log(`  .db_state.json: ${state.diagnostic_requests.length} | Supabase: ${dbDiagReqs.rows.length}`)
  const missingDiagReqs = []
  for (const dr of state.diagnostic_requests) {
    const inDb = dbDiagReqs.rows.find(r => r.request_id === dr.request_id)
    if (!inDb) {
      const caseExists = dr.case_id ? dbCaseIds.has(dr.case_id) : true
      missingDiagReqs.push(dr)
      console.log(`  [❌] id=${dr.id} ${dr.request_id} case_id=${dr.case_id}(${caseExists?'exists':'MISSING'}) patient_id=${dr.patient_id} — MISSING`)
    }
  }
  if (missingDiagReqs.length === 0) console.log('  All diagnostic requests present ✅')

  // 7. DIAGNOSTIC REPORTS
  console.log('\n=== DIAGNOSTIC REPORTS ===')
  const dbDiagReps = await pool.query('SELECT id, report_id, request_id, patient_id FROM diagnostic_reports ORDER BY id')
  console.log(`  .db_state.json: ${state.diagnostic_reports.length} | Supabase: ${dbDiagReps.rows.length}`)
  const missingDiagReps = []
  for (const rep of state.diagnostic_reports) {
    const inDb = dbDiagReps.rows.find(r => r.report_id === rep.report_id)
    if (!inDb) {
      missingDiagReps.push(rep)
      console.log(`  [❌] id=${rep.id} ${rep.report_id} request_id=${rep.request_id} — MISSING`)
    }
  }
  if (missingDiagReps.length === 0) console.log('  All diagnostic reports present ✅')

  // 8. DISPENSINGS
  console.log('\n=== DISPENSINGS ===')
  const dbDisp = await pool.query('SELECT id, dispensing_number, prescription_id, patient_id FROM pharmacy_dispensings ORDER BY id')
  console.log(`  .db_state.json: ${state.dispensings.length} | Supabase: ${dbDisp.rows.length}`)
  for (const d of state.dispensings) {
    const inDb = dbDisp.rows.find(r => r.dispensing_number === d.dispensing_number)
    console.log(`  [${inDb ? '✅' : '❌'}] id=${d.id} ${d.dispensing_number} rx_id=${d.prescription_id} patient_id=${d.patient_id}`)
  }

  // 9. ID MAPPING ANALYSIS
  console.log('\n=== ID MAPPING ANALYSIS ===')
  console.log('  Checking if .db_state.json IDs map to Supabase IDs...')
  
  // Cases: check if state case IDs match DB case IDs
  const stateToDbCaseMap = {}
  for (const sc of state.cases) {
    const dbCase = dbCases.rows.find(r => r.case_number === sc.case_number)
    if (dbCase) {
      stateToDbCaseMap[sc.id] = dbCase.id
      if (sc.id !== dbCase.id) {
        console.log(`  Case ${sc.case_number}: state.id=${sc.id} → DB.id=${dbCase.id} (DIFFERENT)`)
      }
    }
  }

  // Appointments: check if state appointment IDs match DB appointment IDs
  const stateToDbApptMap = {}
  for (const sa of state.appointments) {
    const dbAppt = dbAppts.rows.find(r => r.appointment_number === sa.appointment_number)
    if (dbAppt) {
      stateToDbApptMap[sa.id] = dbAppt.id
      if (sa.id !== dbAppt.id) {
        console.log(`  Appointment ${sa.appointment_number}: state.id=${sa.id} → DB.id=${dbAppt.id} (DIFFERENT)`)
      }
    }
  }

  // Prescriptions: check if state rx IDs match DB rx IDs
  for (const sp of state.prescriptions) {
    const dbP = dbRx.rows.find(r => r.rx_number === sp.rx_number)
    if (dbP && sp.id !== dbP.id) {
      console.log(`  Prescription ${sp.rx_number}: state.id=${sp.id} → DB.id=${dbP.id} (DIFFERENT)`)
    }
  }

  // 10. VIKASH KUMAR RELATIONSHIP GRAPH
  console.log('\n=== VIKASH KUMAR (AC-VK2604) RELATIONSHIP GRAPH ===')
  const vkPatient = await pool.query(`SELECT * FROM patients WHERE patient_unique_code = 'AC-VK2604'`)
  if (vkPatient.rows.length > 0) {
    const vkId = vkPatient.rows[0].id
    console.log(`  Patient: id=${vkId}, name=${vkPatient.rows[0].name}, mobile=${vkPatient.rows[0].mobile}`)
    
    const vkCases = await pool.query('SELECT id, case_number, status, lifecycle_stage FROM patient_cases WHERE patient_id = $1 ORDER BY id', [vkId])
    console.log(`  Cases in DB: ${vkCases.rows.length}`)
    vkCases.rows.forEach(c => console.log(`    case_id=${c.id} ${c.case_number} status=${c.status} stage=${c.lifecycle_stage}`))
    
    const vkAppts = await pool.query('SELECT id, appointment_number, case_id, status FROM appointments WHERE patient_id = $1 ORDER BY id', [vkId])
    console.log(`  Appointments in DB: ${vkAppts.rows.length}`)
    
    const vkRx = await pool.query('SELECT id, rx_number, case_id, appointment_id FROM prescriptions WHERE patient_id = $1 ORDER BY id', [vkId])
    console.log(`  Prescriptions in DB: ${vkRx.rows.length}`)
    vkRx.rows.forEach(r => console.log(`    rx_id=${r.id} ${r.rx_number} case_id=${r.case_id} appt_id=${r.appointment_id}`))
    
    const vkDiagReqs = await pool.query('SELECT id, request_id, case_id FROM diagnostic_requests WHERE patient_id = $1 ORDER BY id', [vkId])
    console.log(`  Diagnostic Requests in DB: ${vkDiagReqs.rows.length}`)
    
    const vkDiagReps = await pool.query('SELECT id, report_id, request_id FROM diagnostic_reports WHERE patient_id = $1 ORDER BY id', [vkId])
    console.log(`  Diagnostic Reports in DB: ${vkDiagReps.rows.length}`)
    
    const vkDisp = await pool.query('SELECT id, dispensing_number, prescription_id FROM pharmacy_dispensings WHERE patient_id = $1 ORDER BY id', [vkId])
    console.log(`  Dispensings in DB: ${vkDisp.rows.length}`)

    // Compare against .db_state.json for VIKASH KUMAR
    const stateVkCases = state.cases.filter(c => c.patient_id === 2 || c.patient_unique_code === 'AC-VK2604')
    const stateVkAppts = state.appointments.filter(a => a.patient_id === 2 || a.patient_unique_code === 'AC-VK2604')
    const stateVkRx = state.prescriptions.filter(p => p.patient_id === 2 || p.patient_unique_code === 'AC-VK2604')
    const stateVkDiagReqs = state.diagnostic_requests.filter(d => d.patient_id === 2 || d.patient_unique_code === 'AC-VK2604')
    const stateVkDiagReps = state.diagnostic_reports.filter(d => d.patient_id === 2 || d.patient_unique_code === 'AC-VK2604')
    const stateVkDisp = state.dispensings.filter(d => d.patient_id === 2 || d.patient_unique_code === 'AC-VK2604')

    console.log('\n  .db_state.json VIKASH KUMAR records:')
    console.log(`    Cases: ${stateVkCases.length} (DB: ${vkCases.rows.length})`)
    console.log(`    Appointments: ${stateVkAppts.length} (DB: ${vkAppts.rows.length})`)
    console.log(`    Prescriptions: ${stateVkRx.length} (DB: ${vkRx.rows.length})`)
    console.log(`    Diagnostic Requests: ${stateVkDiagReqs.length} (DB: ${vkDiagReqs.rows.length})`)
    console.log(`    Diagnostic Reports: ${stateVkDiagReps.length} (DB: ${vkDiagReps.rows.length})`)
    console.log(`    Dispensings: ${stateVkDisp.length} (DB: ${vkDisp.rows.length})`)
  }

  // 11. Detailed prescriptions + items in state for VK
  console.log('\n=== DETAILED PRESCRIPTION ID CHAIN (state) ===')
  const stateVkRx = state.prescriptions.filter(p => p.patient_id === 2)
  for (const rx of stateVkRx) {
    const items = state.prescription_items.filter(i => i.prescription_id === rx.id)
    const inDb = dbRx.rows.find(r => r.rx_number === rx.rx_number)
    console.log(`  RX state.id=${rx.id} ${rx.rx_number} case_id=${rx.case_id} appt_id=${rx.appointment_id} → DB: ${inDb ? `id=${inDb.id}` : 'MISSING'}`)
    for (const item of items) {
      const itemInDb = dbRxItems.rows.find(r => r.id === item.id || (r.prescription_id === (inDb?.id || rx.id) && r.medicine_name === item.medicine_name))
      console.log(`    Item state.id=${item.id} rx_id=${item.prescription_id} ${item.medicine_name} → DB: ${itemInDb ? `id=${itemInDb.id}` : 'MISSING'}`)
    }
  }

  // 12. Detailed diagnostic requests in state for VK
  console.log('\n=== DETAILED DIAGNOSTIC CHAIN (state) ===')
  const stateVkDiag = state.diagnostic_requests.filter(d => d.patient_id === 2)
  for (const dr of stateVkDiag) {
    const inDb = dbDiagReqs.rows.find(r => r.request_id === dr.request_id)
    const caseInDb = dr.case_id ? dbCases.rows.find(c => c.id === dr.case_id) : null
    console.log(`  DiagReq state.id=${dr.id} ${dr.request_id} case_id=${dr.case_id}(DB:${caseInDb ? 'exists' : 'NEED_REMAP'}) → DB: ${inDb ? `id=${inDb.id}` : 'MISSING'}`)
  }

  // SUMMARY
  console.log('\n====================================================')
  console.log('  AUDIT SUMMARY')
  console.log('====================================================')
  console.log(`  Missing Cases: ${missingCases.length}`)
  console.log(`  Missing Appointments: ${missingAppts.length}`)
  console.log(`  Missing Prescriptions: ${missingRx.length}`)
  console.log(`  Missing Prescription Items: ${missingItems.length}`)
  console.log(`  Missing Diagnostic Requests: ${missingDiagReqs.length}`)
  console.log(`  Missing Diagnostic Reports: ${missingDiagReps.length}`)
  console.log(`  Total Missing: ${missingCases.length + missingAppts.length + missingRx.length + missingItems.length + missingDiagReqs.length + missingDiagReps.length}`)

  await pool.end()
}

main().catch(err => {
  console.error('Audit failed:', err.message)
  process.exit(1)
})
