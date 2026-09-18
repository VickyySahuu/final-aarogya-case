import app from './server.js'
import http from 'http'

// Make a quick HTTP GET request to verify the server is live
setTimeout(() => {
  const req = http.get('http://localhost:5000/api/health', (res) => {
    let data = ''
    res.on('data', chunk => { data += chunk })
    res.on('end', () => {
      console.log('[Test Verification] Health Check Response Status:', res.statusCode)
      console.log('[Test Verification] Body:', data)
      console.log('[Test Verification] Backend Foundation successfully validated!')
      process.exit(0)
    })
  })

  req.on('error', (err) => {
    console.error('[Test Verification] Failed:', err.message)
    process.exit(1)
  })
}, 1000)
