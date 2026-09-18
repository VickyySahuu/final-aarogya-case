import pg from 'pg'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Ensure backend/.env is loaded whether run from root or backend/
const backendEnvPath = path.join(__dirname, '../.env')
if (fs.existsSync(backendEnvPath)) {
  dotenv.config({ path: backendEnvPath })
} else {
  dotenv.config()
}

const { Pool } = pg

const isSupabase = !!(process.env.DATABASE_URL && process.env.DATABASE_URL.includes('supabase.com'))
const isSsl = isSupabase || process.env.DB_SSL === 'true' || process.env.NODE_ENV === 'production'

const connectionConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ...(isSsl ? { ssl: { rejectUnauthorized: false } } : {})
    }
  : {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'aarogya_case',
      ...(isSsl ? { ssl: { rejectUnauthorized: false } } : {})
    }

export const pool = new Pool({
  ...connectionConfig,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
})

let isDbConnected = false

export async function checkConnection() {
  try {
    const client = await pool.connect()
    const res = await client.query('SELECT current_database() as db, NOW() as time')
    client.release()
    isDbConnected = true
    console.log(`[Database] PostgreSQL connected successfully to '${res.rows[0].db}' at ${res.rows[0].time}`)
    return true
  } catch (err) {
    isDbConnected = false
    console.warn(`[Database] Notice: PostgreSQL connection check could not connect (${err.message}). The backend will operate in fallback mode until PostgreSQL is started.`)
    return false
  }
}

export async function query(text, params) {
  const start = Date.now()
  try {
    const res = await pool.query(text, params)
    const duration = Date.now() - start
    return res
  } catch (err) {
    console.error(`[Database Error] Query: ${text} | Error: ${err.message}`)
    throw err
  }
}

export function isConnected() {
  return isDbConnected
}

export async function initDb() {
  const connected = await checkConnection()
  if (!connected) {
    console.log('[Database] Skipping auto-migration because PostgreSQL server is not connected.')
    return false
  }

  try {
    const schemaPath = path.join(__dirname, 'schema.sql')
    if (fs.existsSync(schemaPath)) {
      const sql = fs.readFileSync(schemaPath, 'utf-8')
      await pool.query(sql)
      console.log('[Database] Schema migrations applied successfully.')
    }
    return true
  } catch (err) {
    console.error(`[Database Error] Failed applying schema migrations: ${err.message}`)
    return false
  }
}

export default {
  pool,
  query,
  checkConnection,
  isConnected,
  initDb
}
