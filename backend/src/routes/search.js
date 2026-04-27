const express = require('express')
const db = require('../db')

const router = express.Router()

// VULN: SQL Injection — user input is interpolated directly into the query string
// Payload: ?q=' OR '1'='1  lists all products; ?q=x' UNION SELECT... exfiltrates data
// Akamai: App & API Protector (WAF) detects and blocks SQLi patterns in query params
router.get('/', (req, res) => {
  try {
    const q = req.query.q ?? ''

    // Intentionally vulnerable — do NOT use parameterized query here (demo purpose)
    const results = db.prepare(
      `SELECT * FROM products WHERE name LIKE '%${q}%' OR description LIKE '%${q}%'`
    ).all()

    res.json(results)
  } catch (err) {
    // VULN: Verbose Error Messages — SQLite error detail (including injected clause) returned to caller
    res.status(500).json({ message: err.message, stack: err.stack })
  }
})

module.exports = router
