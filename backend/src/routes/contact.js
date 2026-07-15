const express = require('express')

const router = express.Router()
const WEBHOOK_URL = 'https://go.webhooks.cc/w/spos39e569'

router.post('/', async (req, res) => {
  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
    })
    const text = await response.text()
    res.status(response.status).send(text)
  } catch (err) {
    res.status(502).json({ message: 'Failed to reach webhook', error: err.message })
  }
})

module.exports = router
