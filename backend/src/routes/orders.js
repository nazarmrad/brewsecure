const express = require('express')
const db = require('../db')
const { requireAuth } = require('../middleware/auth')

const router = express.Router()

router.post('/', requireAuth, (req, res) => {
  try {
    const { items, shippingAddress, paymentMethod } = req.body
    if (!items?.length) return res.status(400).json({ message: 'items are required' })

    const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)

    const orderResult = db.prepare(`
      INSERT INTO orders (userId, total, shippingAddress, paymentMethod)
      VALUES (?, ?, ?, ?)
    `).run(req.user.id, total, JSON.stringify(shippingAddress), paymentMethod)

    const orderId = orderResult.lastInsertRowid

    const insertItem = db.prepare(`
      INSERT INTO order_items (orderId, productId, name, price, quantity, size)
      VALUES (?, ?, ?, ?, ?, ?)
    `)

    for (const item of items) {
      insertItem.run(orderId, item.productId, item.name, item.price, item.quantity, item.size ?? '250g')
    }

    db.prepare('DELETE FROM cart_items WHERE userId = ?').run(req.user.id)

    res.status(201).json({ orderId, total, status: 'confirmed' })
  } catch (err) {
    res.status(500).json({ message: err.message, stack: err.stack })
  }
})

router.get('/', requireAuth, (req, res) => {
  try {
    const orders = db.prepare(`
      SELECT o.*, json_group_array(json_object(
        'id', oi.id, 'productId', oi.productId, 'name', oi.name,
        'price', oi.price, 'quantity', oi.quantity, 'size', oi.size
      )) AS items
      FROM orders o
      LEFT JOIN order_items oi ON oi.orderId = o.id
      WHERE o.userId = ?
      GROUP BY o.id
      ORDER BY o.createdAt DESC
    `).all(req.user.id)

    res.json(orders.map(o => ({ ...o, items: JSON.parse(o.items) })))
  } catch (err) {
    res.status(500).json({ message: err.message, stack: err.stack })
  }
})

// VULN: BOLA / IDOR — no ownership check; any authenticated user can fetch any order by ID
// Akamai: API Security detects abnormal access patterns; App & API Protector enforces object-level rules
router.get('/:id', requireAuth, (req, res) => {
  try {
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id)
    if (!order) return res.status(404).json({ message: 'Order not found' })

    const items = db.prepare('SELECT * FROM order_items WHERE orderId = ?').all(req.params.id)
    res.json({ ...order, items })
  } catch (err) {
    res.status(500).json({ message: err.message, stack: err.stack })
  }
})

module.exports = router
