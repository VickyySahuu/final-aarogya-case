import pg from 'pg'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '../.env') })
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } })
async function run() {
  // Clean up the test case
  const del = await pool.query(`DELETE FROM patient_cases WHERE case_number = 'CASE-2026-9739'`)
  console.log('Deleted test case:', del.rowCount)
  const cnt = await pool.query('SELECT COUNT(*) as cnt FROM patient_cases WHERE patient_id = 2')
  console.log('VK cases after cleanup:', cnt.rows[0].cnt)
  // Reset sequence
  await pool.query(`SELECT setval(pg_get_serial_sequence('patient_cases', 'id'), COALESCE((SELECT MAX(id) FROM patient_cases), 0) + 1, false)`)
  await pool.end()
}
run()
