const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const swaggerUi = require('swagger-ui-express')
const swaggerSpec = require('../swagger')

const authRoutes    = require('./routes/auth')
const productRoutes = require('./routes/products')
const cartRoutes    = require('./routes/cart')
const orderRoutes   = require('./routes/orders')
const userRoutes    = require('./routes/users')
const searchRoutes  = require('./routes/search')

const app = express()

// VULN: Helmet configured permissively — CSP and other protections disabled for demo visibility
// Akamai: App & API Protector enforces security headers at the edge
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}))

// CORS open to Vite dev server — intentionally broad for demo
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}))

app.use(express.json())

// ── Swagger ───────────────────────────────────────────────────────────────────
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api', authRoutes)
app.use('/api/products', productRoutes)
app.use('/api/cart', cartRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/users', userRoutes)
app.use('/api/search', searchRoutes)

// ── Health ────────────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => res.json({ status: 'ok', app: 'BrewSecure' }))

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ message: 'Not found' }))

const PORT = process.env.PORT || 3001
app.listen(PORT, () => console.log(`BrewSecure API running on http://localhost:${PORT}`))

module.exports = app
