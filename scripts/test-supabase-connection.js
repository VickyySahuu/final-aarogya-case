import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import dotenv from '../backend/node_modules/dotenv/lib/main.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 1. Load backend/.env explicitly
const envPath = path.join(__dirname, '../backend/.env')
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath })
} else {
  console.error('[Error] backend/.env file not found')
  process.exit(1)
}

// 2. Import existing database module
const { pool, checkConnection } = await import('../backend/db/index.js')

async function runTest() {
  console.log('--- SUPABASE POSTGRESQL CONNECTION TEST ---')
  console.log('[Safe Config] Checking environment configuration...')
  
  if (!process.env.DATABASE_URL) {
    console.error('[FAIL] process.env.DATABASE_URL is not set')
    process.exit(1)
  }

  // Safe sanitized host reporting (no credentials or secrets)
  try {
    const parsed = new URL(process.env.DATABASE_URL)
    console.log(`[Safe Config] Host: ${parsed.hostname}`)
    console.log(`[Safe Config] Port: ${parsed.port || '5432'}`)
    console.log(`[Safe Config] Database: ${parsed.pathname.replace('/', '')}`)
    console.log(`[Safe Config] Protocol: ${parsed.protocol}`)
  } catch (urlErr) {
    console.error('[Safe Config] Could not parse URL format safely')
  }

  console.log('\n[Connection] Testing reachability to Supabase PostgreSQL pooler...')
  try {
    const isConnected = await checkConnection()
    if (!isConnected) {
      console.error('[FAIL] Could not establish connection')
      await pool.end()
      process.exit(1)
    }

    // Run read-only query to inspect existing public tables (zero modifications)
    const client = await pool.connect()
    const tablesRes = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `)
    client.release()

    console.log('\n[Data Safety Check] Read-only inspection of existing public tables:')
    console.log(`[Data Safety Check] Public tables count: ${tablesRes.rows.length}`)
    if (tablesRes.rows.length > 0) {
      console.log(`[Data Safety Check] Existing tables: ${tablesRes.rows.map(r => r.table_name).join(', ')}`)
    } else {
      console.log('[Data Safety Check] Clean remote database — 0 public tables detected (ready for future migration)')
    }

    console.log('\n[Summary] Connection successful without data or schema changes.')
    await pool.end()
    process.exit(0)
  } catch (err) {
    console.error('[Connection Error]', err.message)
    await pool.end()
    process.exit(1)
  }
}

runTest()
