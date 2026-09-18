import { query, isConnected } from '../db/index.js'

const memoryUsers = [
  {
    id: 1,
    username: 'rajesh_sharma',
    password_hash: '$2b$10$demo_hash_not_returned',
    role: 'patient',
    is_active: true,
    created_at: new Date().toISOString()
  }
]

export const UserModel = {
  async findByUsername(username) {
    if (isConnected()) {
      try {
        const res = await query('SELECT id, username, role, is_active, created_at FROM users WHERE username = $1 LIMIT 1', [username])
        if (res.rows.length > 0) return res.rows[0]
      } catch (err) {
        console.warn('[UserModel] DB query error, using memory fallback:', err.message)
      }
    }
    return memoryUsers.find(u => u.username?.toLowerCase() === username?.toLowerCase()) || null
  },

  async findById(id) {
    if (isConnected()) {
      try {
        const res = await query('SELECT id, username, role, is_active, created_at FROM users WHERE id = $1', [id])
        if (res.rows.length > 0) return res.rows[0]
      } catch (err) {
        console.warn('[UserModel] DB query error, using memory fallback:', err.message)
      }
    }
    const numId = parseInt(id, 10)
    return memoryUsers.find(u => u.id === numId) || null
  },

  async create({ username, passwordHash, role }) {
    if (isConnected()) {
      try {
        const res = await query(
          'INSERT INTO users (username, password_hash, role) VALUES ($1, $2, $3) RETURNING id, username, role, created_at',
          [username, passwordHash, role || 'patient']
        )
        if (res.rows.length > 0) {
          memoryUsers.push(res.rows[0])
          return res.rows[0]
        }
      } catch (err) {
        console.warn('[UserModel] DB insert error, using memory fallback:', err.message)
      }
    }

    const newUser = {
      id: memoryUsers.length + 1,
      username,
      role: role || 'patient',
      is_active: true,
      created_at: new Date().toISOString()
    }
    memoryUsers.push(newUser)
    return newUser
  }
}
