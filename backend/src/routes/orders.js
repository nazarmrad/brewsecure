const express = require('express')
const db = require('../db')
const { requireAuth } = require('../middleware/auth')
const mcpAuth = require('../middleware/mcpAuth')

const router = express.Router()

const WEBHOOK_URL = process.env.ORDER_WEBHOOK_URL

function fireWebhook(payload) {
  if (!WEBHOOK_URL) return
  fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).catch(() => {})
}

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

    fireWebhook({
      event: 'order.placed',
      orderId,
      total,
      status: 'confirmed',
      userId: req.user.id,
      email: req.user.email,
      items,
      shippingAddress,
      paymentMethod,
      createdAt: new Date().toISOString(),
    })

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

// MCP: order lookup by customer email — no user session needed, protected by API key
router.get('/by-email', mcpAuth, (req, res) => {
  try {
    const { email } = req.query
    if (!email) return res.status(400).json({ message: 'email is required' })

    const user = db.prepare('SELECT id, name, email FROM users WHERE email = ?').get(email)
    if (!user) return res.status(404).json({ message: 'No account found for that email' })

    const orders = db.prepare(`
      SELECT o.id, o.total, o.status, o.shippingAddress, o.paymentMethod, o.createdAt,
             json_group_array(json_object(
               'name', oi.name, 'price', oi.price, 'quantity', oi.quantity, 'size', oi.size
             )) AS items
      FROM orders o
      LEFT JOIN order_items oi ON oi.orderId = o.id
      WHERE o.userId = ?
      GROUP BY o.id
      ORDER BY o.createdAt DESC
    `).all(user.id)

    res.json({
      customer: { name: user.name, email: user.email },
      orders: orders.map(o => ({ ...o, items: JSON.parse(o.items) })),
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// MCP: place an order on behalf of a customer identified by email
router.post('/by-email', mcpAuth, (req, res) => {
  try {
    const { email, items, paymentMethod, shippingAddress } = req.body
    if (!email) return res.status(400).json({ message: 'email is required' })
    if (!items?.length) return res.status(400).json({ message: 'items are required' })

    const user = db.prepare('SELECT id, name, email FROM users WHERE email = ?').get(email)
    if (!user) return res.status(404).json({ message: 'No account found for that email' })

    // Resolve prices server-side — never trust client-provided prices
    let total = 0
    const resolvedItems = []
    for (const item of items) {
      const product = db.prepare('SELECT id, name, price, stock FROM products WHERE id = ?').get(item.productId)
      if (!product) return res.status(404).json({ message: `Product ${item.productId} not found` })
      const qty = item.quantity || 1
      if (product.stock < qty) return res.status(400).json({ message: `${product.name} is out of stock` })
      total += product.price * qty
      resolvedItems.push({ productId: product.id, name: product.name, price: product.price, quantity: qty, size: item.size || '250g' })
    }

    const orderResult = db.prepare(`
      INSERT INTO orders (userId, total, shippingAddress, paymentMethod)
      VALUES (?, ?, ?, ?)
    `).run(user.id, total, JSON.stringify(shippingAddress || {}), paymentMethod || 'Online')

    const orderId = orderResult.lastInsertRowid
    const insertItem = db.prepare(
      'INSERT INTO order_items (orderId, productId, name, price, quantity, size) VALUES (?, ?, ?, ?, ?, ?)'
    )
    for (const item of resolvedItems) {
      insertItem.run(orderId, item.productId, item.name, item.price, item.quantity, item.size)
    }

    db.prepare('DELETE FROM cart_items WHERE userId = ?').run(user.id)

    fireWebhook({
      event: 'order.placed', orderId, total, status: 'confirmed',
      userId: user.id, email: user.email, items: resolvedItems,
      shippingAddress, paymentMethod, createdAt: new Date().toISOString(),
    })

    res.status(201).json({ orderId, total: total.toFixed(2), status: 'confirmed', items: resolvedItems })
  } catch (err) {
    res.status(500).json({ message: err.message })
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
