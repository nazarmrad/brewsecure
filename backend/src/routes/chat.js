const express = require('express')
const { Langfuse } = require('langfuse')

const router = express.Router()

const SYSTEM_PROMPT = `You are Brew, a friendly and knowledgeable assistant for BrewSecure — a specialty coffee roastery that sources beans directly from farmers around the world. You help customers discover coffees, understand roast profiles and flavor notes, navigate the shop, and answer questions about orders and account. Keep replies concise and warm. If you don't know something specific about BrewSecure's current inventory or a customer's order, suggest they visit the shop or contact support. Never make up prices or product details you are not certain of.`

const langfuse = new Langfuse({
  publicKey: process.env.LANGFUSE_PUBLIC_KEY,
  secretKey: process.env.LANGFUSE_SECRET_KEY,
  baseUrl: process.env.LANGFUSE_HOST ?? 'https://cloud.langfuse.com',
})

router.post('/', async (req, res) => {
  const { messages } = req.body
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages array required' })
  }

  const trace = langfuse.trace({ name: 'chat-widget' })
  const generation = trace.generation({
    name: 'ollama-response',
    model: 'qwen2.5:3b',
    input: messages,
  })

  try {
    const response = await fetch('http://10.0.0.2:11434/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'qwen2.5:3b',
        messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages],
        stream: true,
      }),
    })

    if (!response.ok) throw new Error(`Ollama HTTP ${response.status}`)

    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')
    res.setHeader('X-Accel-Buffering', 'no')

    let fullResponse = ''

    for await (const chunk of response.body) {
      const text = new TextDecoder().decode(chunk)
      const lines = text.split('\n').filter(l => l.trim())

      for (const line of lines) {
        try {
          const json = JSON.parse(line)
          if (json.message?.content) {
            fullResponse += json.message.content
            res.write(`data: ${JSON.stringify({ token: json.message.content })}\n\n`)
          }
          if (json.done) {
            res.write('data: [DONE]\n\n')
            res.end()
          }
        } catch (e) {
          // incomplete chunk, skip
        }
      }
    }

    generation.end({ output: fullResponse })
    await langfuse.flushAsync()
  } catch (err) {
    generation.end({ output: err.message, level: 'ERROR' })
    await langfuse.flushAsync()
    if (!res.headersSent) {
      res.status(500).json({ error: 'AI service unavailable' })
    }
  }
})

module.exports = router
