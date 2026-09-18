import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const STATE_FILE = path.join(__dirname, '../.db_state.json')

let saveTimeout = null

/**
 * AAROGYA CASE — Fallback State Storage Service
 * Persists fallback database tables to disk (.db_state.json) so that
 * all clinical entities (patients, cases, appointments, prescriptions,
 * diagnostics, dispensings) survive server reboots and maintain
 * uninterrupted patient history across restarts.
 */
export const StateStorageService = {
  loadState() {
    try {
      if (fs.existsSync(STATE_FILE)) {
        const raw = fs.readFileSync(STATE_FILE, 'utf8')
        return JSON.parse(raw)
      }
    } catch (e) {
      console.warn('[StateStorage] Could not load state from disk:', e.message)
    }
    return null
  },

  saveStateSync(state) {
    try {
      if (!state || typeof state !== 'object') return
      fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf8')
    } catch (e) {
      console.warn('[StateStorage] Synchronous save failed:', e.message)
    }
  },

  scheduleSave(getStateCallback) {
    if (saveTimeout) clearTimeout(saveTimeout)
    saveTimeout = setTimeout(() => {
      try {
        const state = typeof getStateCallback === 'function' ? getStateCallback() : getStateCallback
        this.saveStateSync(state)
      } catch (e) {
        console.warn('[StateStorage] Debounced save failed:', e.message)
      }
    }, 150)
  }
}

export default StateStorageService
