const express = require('express')
const db = require('../db')
const { requireAuth, requireAdmin } = require('../middleware/auth')

const router = express.Router()

router.get('/me', requireAuth, (req, res) => {
  try {
    const user = db.prepare('SELECT id, name, email, isAdmin, createdAt FROM users WHERE id = ?').get(req.user.id)
    if (!user) return res.status(404).json({ message: 'User not found' })
    res.json(user)
  } catch (err) {
    res.status(500).json({ message: err.message, stack: err.stack })
  }
})

// VULN: Mass Assignment — any field sent in the body (including isAdmin) is written directly
// Akamai: API Security flags parameter tampering; schema enforcement blocks unexpected fields
router.put('/me', requireAuth, (req, res) => {
  try {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id)
    if (!user) return res.status(404).json({ message: 'User not found' })

    const updated = { ...user, ...req.body, id: user.id }

    db.prepare(`
      UPDATE users SET name = ?, email = ?, isAdmin = ? WHERE id = ?
    `).run(updated.name, updated.email, updated.isAdmin ? 1 : 0, user.id)

    res.json({ id: user.id, name: updated.name, email: updated.email, isAdmin: !!updated.isAdmin })
  } catch (err) {
    res.status(500).json({ message: err.message, stack: err.stack })
  }
})

// VULN: Excessive Data Exposure — returns password hashes and all internal fields
// Akamai: API Security discovers sensitive field leakage; response inspection masks PII
router.get('/', requireAdmin, (req, res) => {
  try {
    // Intentionally SELECT * to expose password hashes for demo
    const users = db.prepare('SELECT * FROM users').all()
    res.json(users)
  } catch (err) {
    res.status(500).json({ message: err.message, stack: err.stack })
  }
})

module.exports = router
