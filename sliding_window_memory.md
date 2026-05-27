# Sliding Window Memory — Implementation Handoff

## What This Does
Gives the AI agent short-term memory within and across sessions.
Every message is saved to SQLite and the last 20 messages (10 exchanges)
are injected into every Ollama request as context.

---

## Stack
- DB: existing `brewsecure.db` on the web server (SQLite, better-sqlite3)
- Session ID: cookie set by Express, read on every request
- Memory limit: last 20 rows = 10 user/assistant exchanges
- No new infrastructure needed

---

## Step 1 — Add table to db.js

File: `/home/deploy/BrewSecure/backend/src/db.js`

Add this block alongside the existing CREATE TABLE statements:

```javascript
db.exec(`
  CREATE TABLE IF NOT EXISTS conversations (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id  TEXT NOT NULL,
    role        TEXT NOT NULL CHECK(role IN ('user', 'assistant', 'system')),
    content     TEXT NOT NULL,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE INDEX IF NOT EXISTS idx_conversations_session
    ON conversations(session_id, created_at);
`);
```

---

## Step 2 — Add cookie middleware to app.js

File: `/home/deploy/BrewSecure/backend/src/app.js`

Install cookie parser if not already present:
```bash
npm install cookie-parser
```

Add to app.js:
```javascript
import cookieParser from 'cookie-parser';
app.use(cookieParser());
```

---

## Step 3 — Update the /api/chat route

File: `/home/deploy/BrewSecure/backend/src/routes/chat.js`

Replace the existing route with:

```javascript
import crypto from 'crypto';
import db from '../db.js';

router.post('/chat', async (req, res) => {
  const { messages } = req.body;
  if (!messages || !messages.length) {
    return res.status(400).json({ error: 'messages array required' });
  }

  // 1. Get or create session ID from cookie
  let sessionId = req.cookies.session_id;
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    res.cookie('session_id', sessionId, {
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });
  }

  // 2. Extract current user message (last in array)
  const userMessage = messages[messages.length - 1].content;

  // 3. Load last 20 messages from DB for this session (sliding window)
  const history = db.prepare(`
    SELECT role, content FROM conversations
    WHERE session_id = ?
    ORDER BY created_at DESC
    LIMIT 20
  `).all(sessionId).reverse(); // reverse to chronological order

  // 4. Build full context: system prompt + history + new message
  const fullMessages = [
    {
      role: 'system',
      content: 'You are a helpful assistant for BrewSecure, a brewery management platform. Answer questions about products, inventory, and orders clearly and concisely.'
    },
    ...history,
    { role: 'user', content: userMessage }
  ];

  // 5. Langfuse trace start
  const trace = langfuse.trace({ name: 'chat-widget' });
  const generation = trace.generation({
    name: 'ollama-response',
    model: 'qwen2.5:3b',
    input: fullMessages
  });

  try {
    // 6. Call Ollama with full context via VLAN
    const response = await fetch('http://10.0.0.2:11434/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'qwen2.5:3b',
        messages: fullMessages,
        stream: true
      })
    });

    // 7. Set SSE headers for streaming
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    let fullResponse = '';

    // 8. Stream tokens to browser
    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const text = decoder.decode(value);
      const lines = text.split('\n').filter(l => l.trim());

      for (const line of lines) {
        try {
          const json = JSON.parse(line);
          if (json.message?.content) {
            fullResponse += json.message.content;
            res.write(`data: ${JSON.stringify({ token: json.message.content })}\n\n`);
          }
          if (json.done) {
            res.write('data: [DONE]\n\n');
          }
        } catch (e) {
          // skip malformed chunk
        }
      }
    }

    res.end();

    // 9. Save exchange to DB after response is sent
    const saveMsg = db.prepare(
      'INSERT INTO conversations (session_id, role, content) VALUES (?, ?, ?)'
    );
    saveMsg.run(sessionId, 'user', userMessage);
    saveMsg.run(sessionId, 'assistant', fullResponse);

    // 10. End Langfuse trace
    generation.end({ output: fullResponse });
    await langfuse.flushAsync();

  } catch (error) {
    generation.end({ output: error.message, level: 'ERROR' });
    await langfuse.flushAsync();
    res.status(500).json({ error: 'AI service unavailable' });
  }
});
```

---

## Step 4 — Restart PM2

```bash
pm2 restart brewsecure-api
pm2 logs brewsecure-api --lines 20
```

---

## Step 5 — Validate

Test memory is working across messages:

```bash
# Message 1
curl -k -X POST https://org-lnd-01.brewsecure.store/api/chat \
  -H "Content-Type: application/json" \
  -c /tmp/cookies.txt \
  -d '{"messages": [{"role": "user", "content": "my name is Nazar"}]}'

# Message 2 — model should remember the name
curl -k -X POST https://org-lnd-01.brewsecure.store/api/chat \
  -H "Content-Type: application/json" \
  -c /tmp/cookies.txt -b /tmp/cookies.txt \
  -d '{"messages": [{"role": "user", "content": "what is my name?"}]}'
```

Check conversations are being saved in SQLite:
```bash
cd /home/deploy/BrewSecure/backend/src
sqlite3 brewsecure.db "SELECT session_id, role, substr(content,1,50), created_at FROM conversations ORDER BY created_at DESC LIMIT 10;"
```

---

## How the sliding window works

```
Session has 30 messages stored in DB:
  turns 1-10  (oldest)
  turns 11-20
  turns 21-30 (newest)

LIMIT 20 + DESC + reverse = sends turns 11-30 to Ollama
turns 1-10 are silently dropped — model never sees them

On turn 31:
  sends turns 12-31
  turn 11 is now dropped
  window slides forward by 1
```

---

## Key notes for the agent

- `session_id` cookie lasts 30 days — user gets memory across browser sessions
- If user clears cookies → new session_id → fresh conversation, no history
- If user is logged in, replace `session_id` cookie with `user_id` from JWT for
  persistent memory tied to account rather than browser
- The `LIMIT 20` cap keeps context within qwen2.5:3b's 2048 token window safely
- Messages are saved AFTER the response is streamed — if the request crashes
  mid-stream, that exchange is not saved (acceptable tradeoff for demo)
- Old conversations are never deleted — add a cleanup job for production:
  ```sql
  DELETE FROM conversations 
  WHERE created_at < datetime('now', '-30 days');
  ```
