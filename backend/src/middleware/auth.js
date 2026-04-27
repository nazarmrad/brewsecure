const jwt = require('jsonwebtoken')

// VULN: Weak JWT secret — trivially brute-forceable offline
// Akamai API Security: detects anomalous token patterns; App & API Protector
// intercepts forged/tampered tokens before they reach the origin
const JWT_SECRET = 'secret123'

function requireAuth(req, res, next) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Missing or malformed Authorization header' })
  }
  try {
    req.user = jwt.verify(header.slice(7), JWT_SECRET)
    next()
  } catch (err) {
    // VULN: Verbose Error Messages — exposes token failure reason to caller
    // Akamai App & API Protector: response-side inspection strips stack traces
    res.status(401).json({ message: 'Token invalid or expired', detail: err.message })
  }
}

function requireAdmin(req, res, next) {
  requireAuth(req, res, () => {
    // VULN: Weak admin check — trusts isAdmin claim from the JWT payload directly.
    // An attacker who forges a token with "secret123" can elevate privileges.
    // Akamai API Security: behavioral analytics flags privilege-escalation patterns
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Admin access required' })
    }
    next()
  })
}

module.exports = { requireAuth, requireAdmin, JWT_SECRET }
