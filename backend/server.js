import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import apiRoutes from './routes/api.js'
import { errorHandler } from './middleware/errorHandler.js'
import { checkConnection, initDb, isConnected } from './db/index.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

// Core middleware
const originSetting = process.env.CORS_ORIGIN || process.env.FRONTEND_URL
const allowedOrigins = originSetting
  ? (originSetting.includes(',') ? originSetting.split(',').map(s => s.trim()) : originSetting.trim())
  : '*'
app.use(cors({
  origin: allowedOrigins === '*' ? true : allowedOrigins,
  credentials: true
}))
app.use(express.json({ limit: '25mb' }))
app.use(express.urlencoded({ extended: true, limit: '25mb' }))

// Health check endpoints (supports both /health and /api/health for Render/cloud monitoring)
app.get('/health', (req, res) => {
  res.json({
    status: 'online',
    service: 'AAROGYA CASE Unified Backend API',
    timestamp: new Date().toISOString(),
    database: {
      connected: isConnected(),
      type: 'PostgreSQL'
    }
  })
})

// Root ping
app.get('/', (req, res) => {
  res.json({
    name: 'AAROGYA CASE Unified Health Platform API',
    version: '1.0.0',
    endpoints: ['/health', '/api/health']
  })
})

// Main API routes
app.use('/api', apiRoutes)

// Error handling middleware
app.use(errorHandler)

// Server startup
async function startServer() {
  console.log('====================================================')
  console.log('  AAROGYA CASE — Unified Backend Foundation (Node/PostgreSQL)')
  console.log('====================================================')

  // Check database connectivity
  try {
    const isConn = await checkConnection()
    if (isConn && process.env.AUTO_MIGRATE === 'true') {
      await initDb()
    }
    // Pre-seed demo patient VIKASH KUMAR with synthetic history
    if (process.env.AUTO_SEED === 'true' || !isConn) {
      const { DemoSeedService } = await import('./services/demoSeedService.js')
      await DemoSeedService.ensureDemoPatient()
    }
  } catch (err) {
    console.warn('[Database] Startup warning:', err.message)
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] Backend listening on:`)
    console.log(`  - Local:   http://localhost:${PORT}`)
    console.log(`  - Network: http://0.0.0.0:${PORT}`)
    console.log(`[Server] Health check: http://localhost:${PORT}/api/health`)
  })

  // Graceful shutdown
  const shutdown = () => {
    console.log('[Server] Shutting down gracefully...')
    server.close(() => {
      console.log('[Server] Closed.')
      process.exit(0)
    })
  }

  return server
}

// Auto-start only when run directly
import { fileURLToPath } from 'url'
const isMain = process.argv[1] && (
  fileURLToPath(import.meta.url).toLowerCase() === process.argv[1].toLowerCase() ||
  process.argv[1].replace(/\\/g, '/').endsWith('/backend/server.js')
)
if (isMain) {
  startServer()
}

export { app, startServer }
export default app
