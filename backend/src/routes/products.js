const express = require('express')
const db = require('../db')
const { requireAdmin } = require('../middleware/auth')

const router = express.Router()

router.get('/', (req, res) => {
  try {
    const { category, q } = req.query
    let query = 'SELECT * FROM products WHERE 1=1'
    const params = []

    if (category) {
      query += ' AND category = ?'
      params.push(category)
    }
    if (q) {
      query += ' AND (name LIKE ? OR description LIKE ?)'
      params.push(`%${q}%`, `%${q}%`)
    }

    const products = db.prepare(query).all(...params)
    res.json(products)
  } catch (err) {
    // VULN: Verbose Error Messages — stack trace exposed to caller
    res.status(500).json({ message: err.message, stack: err.stack })
  }
})

router.get('/:id', (req, res) => {
  try {
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id)
    if (!product) return res.status(404).json({ message: 'Product not found' })
    res.json(product)
  } catch (err) {
    res.status(500).json({ message: err.message, stack: err.stack })
  }
})

// VULN: Weak admin check — requireAdmin trusts isAdmin claim from the JWT payload
// An attacker with the weak secret can forge isAdmin=true
// Akamai: API Security flags privilege-escalation patterns; App & API Protector blocks forged tokens
router.post('/', requireAdmin, (req, res) => {
  try {
    const { name, description, price, imageUrl, stock, category, badge, rating, reviews,
            roastLevel, process, altitude, origin, region, notes } = req.body

    if (!name || !price || !category) {
      return res.status(400).json({ message: 'name, price and category are required' })
    }

    const result = db.prepare(`
      INSERT INTO products (name, description, price, imageUrl, stock, category, badge,
        rating, reviews, roastLevel, process, altitude, origin, region, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(name, description ?? null, price, imageUrl ?? null, stock ?? 100, category,
           badge ?? null, rating ?? 4.5, reviews ?? 0, roastLevel ?? 5,
           process ?? null, altitude ?? null, origin ?? null, region ?? null, notes ?? null)

    res.status(201).json({ id: result.lastInsertRowid, name, price, category })
  } catch (err) {
    res.status(500).json({ message: err.message, stack: err.stack })
  }
})

module.exports = router
