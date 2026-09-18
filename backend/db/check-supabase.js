import pg from 'pg'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
dotenv.config({ path: path.join(__dirname, '../.env') })

const { Pool } = pg
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
})

async function main() {
  try {
    // 1. Check tables
    const tables = await pool.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `)
    console.log('=== EXISTING TABLES ===')
    tables.rows.forEach(r => console.log(' -', r.table_name))
    console.log('Total:', tables.rows.length)

    // 2. Check row counts for key tables
    const keyTables = ['users', 'patients', 'hospitals', 'doctors', 'medicines', 
                       'ambulances', 'patient_cases', 'appointments', 'prescriptions',
                       'prescription_items', 'pharmacy_dispensings', 'diagnostic_requests',
                       'diagnostic_reports', 'emergency_requests', 'diagnostic_tests']
    
    console.log('\n=== ROW COUNTS ===')
    for (const t of keyTables) {
      try {
        const res = await pool.query(`SELECT COUNT(*) as cnt FROM ${t}`)
        console.log(` ${t}: ${res.rows[0].cnt} rows`)
      } catch (e) {
        console.log(` ${t}: TABLE NOT FOUND (${e.message.substring(0, 60)})`)
      }
    }

    // 3. Check if VIKASH KUMAR exists in patients
    console.log('\n=== VIKASH KUMAR CHECK ===')
    try {
      const vk = await pool.query(`SELECT id, patient_id, patient_unique_code, name, mobile FROM patients WHERE patient_unique_code = 'AC-VK2604' OR name ILIKE '%vikash%'`)
      if (vk.rows.length > 0) {
        console.log('VIKASH KUMAR found:', JSON.stringify(vk.rows, null, 2))
      } else {
        console.log('VIKASH KUMAR NOT FOUND in patients table')
      }
    } catch (e) {
      console.log('patients table error:', e.message)
    }

    // 4. Check Rajesh patient
    console.log('\n=== RAJESH CHECK ===')
    try {
      const rj = await pool.query(`SELECT id, patient_id, patient_unique_code, name FROM patients WHERE patient_unique_code = 'AC-7F42K9' OR name ILIKE '%rajesh%'`)
      if (rj.rows.length > 0) {
        console.log('Rajesh found:', JSON.stringify(rj.rows, null, 2))
      } else {
        console.log('Rajesh NOT FOUND in patients table')
      }
    } catch (e) {
      console.log('patients table error:', e.message)
    }

  } catch (err) {
    console.error('Connection error:', err.message)
  } finally {
    await pool.end()
  }
}

main()
