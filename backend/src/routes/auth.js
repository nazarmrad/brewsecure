const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const db = require('../db')
const { noRateLimit } = require('../middleware/rateLimit')
const { JWT_SECRET } = require('../middleware/auth')

const router = express.Router()

// VULN: No Rate Limiting — noRateLimit is a no-op; credential stuffing / brute-force unthrottled
// Akamai: Bot Manager (behavioral fingerprinting), Account Protector (ATO velocity)
router.post('/login', noRateLimit, (req, res) => {
  const { email, password } = req.body
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' })
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email)
  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' })
  }

  const valid = bcrypt.compareSync(password, user.password)
  if (!valid) {
    return res.status(401).json({ message: 'Invalid credentials' })
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, isAdmin: !!user.isAdmin },
    JWT_SECRET,
    { expiresIn: '8h' }
  )

  res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, isAdmin: !!user.isAdmin },
  })
})

router.post('/register', (req, res) => {
  const { name, email, password } = req.body
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email and password are required' })
  }

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email)
  if (existing) {
    return res.status(409).json({ message: 'Email already registered' })
  }

  // VULN: Weak bcrypt cost — saltRounds=4 is far below the recommended 12+
  // Akamai: credential-stuffing attacks are rate-limited before they reach the origin
  const hash = bcrypt.hashSync(password, 4)
  const result = db.prepare(
    'INSERT INTO users (name, email, password) VALUES (?, ?, ?)'
  ).run(name, email, hash)

  const token = jwt.sign(
    { id: result.lastInsertRowid, email, isAdmin: false },
    JWT_SECRET,
    { expiresIn: '8h' }
  )

  res.status(201).json({
    token,
    user: { id: result.lastInsertRowid, name, email, isAdmin: false },
  })
})

router.post('/logout', (_req, res) => {
  // Stateless JWT — nothing to invalidate server-side
  res.json({ message: 'Logged out' })
})

module.exports = router
