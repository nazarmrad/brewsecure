const express = require('express')
const db = require('../db')
const { requireAuth } = require('../middleware/auth')

const router = express.Router()

router.get('/', requireAuth, (req, res) => {
  try {
    const items = db.prepare(`
      SELECT ci.id, ci.quantity, ci.size,
             p.id AS productId, p.name, p.price, p.imageUrl, p.category
      FROM cart_items ci
      JOIN products p ON p.id = ci.productId
      WHERE ci.userId = ?
    `).all(req.user.id)
    res.json(items)
  } catch (err) {
    res.status(500).json({ message: err.message, stack: err.stack })
  }
})

router.post('/', requireAuth, (req, res) => {
  try {
    const { productId, quantity = 1, size = '250g' } = req.body
    if (!productId) return res.status(400).json({ message: 'productId is required' })

    const product = db.prepare('SELECT id FROM products WHERE id = ?').get(productId)
    if (!product) return res.status(404).json({ message: 'Product not found' })

    const existing = db.prepare(
      'SELECT id, quantity FROM cart_items WHERE userId = ? AND productId = ? AND size = ?'
    ).get(req.user.id, productId, size)

    if (existing) {
      db.prepare('UPDATE cart_items SET quantity = ? WHERE id = ?')
        .run(existing.quantity + quantity, existing.id)
      return res.json({ id: existing.id, productId, quantity: existing.quantity + quantity, size })
    }

    const result = db.prepare(
      'INSERT INTO cart_items (userId, productId, quantity, size) VALUES (?, ?, ?, ?)'
    ).run(req.user.id, productId, quantity, size)

    res.status(201).json({ id: result.lastInsertRowid, productId, quantity, size })
  } catch (err) {
    res.status(500).json({ message: err.message, stack: err.stack })
  }
})

router.delete('/:itemId', requireAuth, (req, res) => {
  try {
    const item = db.prepare('SELECT * FROM cart_items WHERE id = ?').get(req.params.itemId)
    if (!item) return res.status(404).json({ message: 'Cart item not found' })
    if (item.userId !== req.user.id) return res.status(403).json({ message: 'Forbidden' })

    db.prepare('DELETE FROM cart_items WHERE id = ?').run(req.params.itemId)
    res.json({ message: 'Item removed' })
  } catch (err) {
    res.status(500).json({ message: err.message, stack: err.stack })
  }
})

module.exports = router
