const express = require('express')
const db = require('../db')
const { requireAdmin } = require('../middleware/auth')
const mcpAuth = require('../middleware/mcpAuth')

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

// MCP: full-text search across origin, region, notes, process (and name/description)
router.get('/search', mcpAuth, (req, res) => {
  try {
    const { q = '', category, in_stock_only = 'true' } = req.query
    const inStock = in_stock_only !== 'false'
    const like = `%${q}%`
    const params = [like, like, like, like, like, like]

    let sql =
      'SELECT id, name, description, price, stock, category, badge, rating,' +
      ' roastLevel, process, altitude, origin, region, notes' +
      ' FROM products' +
      ' WHERE (name LIKE ? OR description LIKE ? OR origin LIKE ?' +
      '   OR region LIKE ? OR notes LIKE ? OR process LIKE ?)'

    if (category) {
      sql += ' AND category = ?'
      params.push(category)
    }
    if (inStock) sql += ' AND stock > 0'
    sql += ' ORDER BY rating DESC LIMIT 6'

    res.json(db.prepare(sql).all(...params))
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// MCP: bulk stock check for multiple product IDs
router.get('/stock', mcpAuth, (req, res) => {
  try {
    const ids = (req.query.ids || '')
      .split(',')
      .map(Number)
      .filter(n => Number.isInteger(n) && n > 0)

    if (ids.length === 0) return res.json([])

    const ph = ids.map(() => '?').join(',')
    const rows = db.prepare(`SELECT id, name, stock FROM products WHERE id IN (${ph})`).all(...ids)
    res.json(rows.map(r => ({ id: r.id, name: r.name, stock: r.stock, in_stock: r.stock > 0 })))
  } catch (err) {
    res.status(500).json({ message: err.message })
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
