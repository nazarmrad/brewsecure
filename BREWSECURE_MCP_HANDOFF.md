# BrewSecure Web Server — MCP Integration Handoff

## What This Document Covers

Changes made to the BrewSecure Express API to support the MCP server. The MCP server itself lives in a separate repo (`nazarmrad/brewsecure_MCP`) — see `MCP_SERVER_HANDOFF.md` for its full setup.

---

## Architecture

The MCP server is **separate from the BrewSecure server**. It cannot access SQLite directly, so it calls the BrewSecure Express REST API over HTTPS:

```
ElevenLabs ──HTTPS──► mcp.brewsecure.store (FastMCP)
                              │
                              │ HTTPS + Bearer token
                              ▼
             shop.brewsecure.store/api/... (Express + SQLite)
```

The BrewSecure chat widget also participates:

```
Browser ──► OpenResty ──► Express /api/chat ──► MCP /tools + /call
                                  │
                                  └──► Ollama qwen2.5:3b (with tool results)
```

---

## Files Changed

### `backend/src/middleware/mcpAuth.js` (NEW)

Protects MCP-facing endpoints with a Bearer token. If `MCP_API_KEY` env var is not set, all requests pass through (safe for local dev without config).

```js
module.exports = function mcpAuth(req, res, next) {
  const key = process.env.MCP_API_KEY
  if (!key) return next()
  const [scheme, token] = (req.headers.authorization || '').split(' ')
  if (scheme !== 'Bearer' || token !== key) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  next()
}
```

---

### `backend/src/routes/products.js` (MODIFIED)

Added `mcpAuth` import and two new routes **before** the `/:id` catch-all route (order is critical — Express matches top-to-bottom).

#### `GET /api/products/search`

Full-text search across name, description, origin, region, notes, and process fields. Supports category filter and in-stock filter. Returns max 6 results sorted by rating DESC.

```
GET /api/products/search?q=kenya&category=Light&in_stock_only=true
Authorization: Bearer <MCP_API_KEY>
```

Response: array of product objects with fields:
`id, name, description, price, stock, category, badge, rating, roastLevel, process, altitude, origin, region, notes`

#### `GET /api/products/stock`

Bulk stock check for multiple product IDs in a single request.

```
GET /api/products/stock?ids=1,2,3
Authorization: Bearer <MCP_API_KEY>
```

Response: `[{ id, name, stock, in_stock }]`

---

### `backend/src/routes/orders.js` (MODIFIED)

Added `mcpAuth` import and two new routes under `/by-email`.

#### `GET /api/orders/by-email`

Returns full order history for a customer by email. No JWT/session required — protected by `mcpAuth` only. Returns customer name + email plus all orders with line items.

```
GET /api/orders/by-email?email=user@example.com
Authorization: Bearer <MCP_API_KEY>
```

Response:
```json
{
  "customer": { "name": "...", "email": "..." },
  "orders": [{ "id", "total", "status", "items": [...], "createdAt" }]
}
```

#### `POST /api/orders/by-email`

Places an order on behalf of a customer identified by email. **Prices are always resolved server-side from the SQLite DB** — the client/agent never supplies prices. Also clears the customer's cart and fires the webhook.

```
POST /api/orders/by-email
Authorization: Bearer <MCP_API_KEY>
Content-Type: application/json

{
  "email": "user@example.com",
  "items": [{ "productId": 1, "quantity": 2, "size": "250g" }],
  "paymentMethod": "PayPal",
  "shippingAddress": { ... }
}
```

Response: `{ orderId, total, status: "confirmed", items }`

Errors:
- `404` if email not found or product not found
- `400` if product is out of stock or items array is empty

---

## Environment Variables

Add to `ecosystem.config.js` on the BrewSecure server:

```js
MCP_API_KEY: "<same-value-as-MCP_SECRET_TOKEN-on-MCP-server>"
```

> This key is the same value used as `BREWSECURE_API_KEY` on the MCP server. One shared token controls auth in both directions.

If this var is absent, all MCP-facing endpoints are **unprotected** — always set it in production.

---

## Ollama Chat Integration

`backend/src/routes/chat.js` integrates MCP tool calling into the Ollama chat flow:

1. On each request, fetches the Ollama-format tool schema from `MCP_SERVER_URL/tools`
2. Passes tools to `qwen2.5:3b` via Ollama `/api/chat`
3. If the model requests a tool call, POSTs `{ name, arguments }` to `MCP_SERVER_URL/call`
4. Appends the tool result to the message history and sends a follow-up to Ollama
5. Streams the final response back to the browser via SSE

Environment vars needed in `ecosystem.config.js`:
```js
MCP_SERVER_URL: "https://mcp.brewsecure.store",  // or http://127.0.0.1:3002 if on same host
MCP_API_KEY:    "<shared-token>"
```

---

## What Was NOT Changed

- `backend/src/routes/products.js` existing routes (`GET /`, `GET /:id`, `POST /`) — untouched
- `backend/src/routes/orders.js` existing routes (`POST /`, `GET /`, `GET /:id`) — untouched
- Any other middleware, routes, or the React frontend
- The SQLite schema — no changes

---

## Security Notes

- The `POST /api/orders/by-email` endpoint operates on real customer data without a user session. It is protected only by the shared API key. Do not expose `MCP_API_KEY` publicly.
- The `GET /api/orders/by-email` endpoint is similarly sensitive — email address is the only "auth factor". This is intentional for the AI agent use case, but treat it carefully in production.
- The existing `GET /api/orders/:id` intentionally has no ownership check (BOLA vulnerability for demo purposes — see comment in orders.js).

---

## Deploy Sequence (BrewSecure Server)

```bash
# Pull latest backend changes
cd ~/BrewSecure && git pull origin main

# Add MCP_API_KEY to ecosystem.config.js (nano or heredoc)
# Then restart with updated env:
pm2 restart brewsecure-api --update-env
pm2 save

# Verify new endpoints
curl -H "Authorization: Bearer <MCP_API_KEY>" \
  "https://shop.brewsecure.store/api/products/search?q=kenya"

curl -H "Authorization: Bearer <MCP_API_KEY>" \
  "https://shop.brewsecure.store/api/products/stock?ids=1,2"

curl -H "Authorization: Bearer <MCP_API_KEY>" \
  "https://shop.brewsecure.store/api/orders/by-email?email=test@brewsecure.com"
```

---

## Frontend Changes — ElevenLabs Voice Widget

Added a standalone ElevenLabs Conversational AI voice widget to the React frontend. It loads via CDN (no npm dependency at runtime) and connects directly to ElevenLabs via WebRTC — the BrewSecure server is not in the audio path.

### `brewsecure/index.html` (MODIFIED)

Added ElevenLabs CDN script in `<head>`:

```html
<script src="https://elevenlabs.io/convai-widget/index.js" async type="text/javascript"></script>
```

### `brewsecure/src/App.jsx` (MODIFIED)

Added the `<elevenlabs-convai>` web component inside the `Layout` component, shown on all non-API pages alongside the existing text ChatWidget:

```jsx
{!isApiPage && (
  <elevenlabs-convai agent-id="agent_5501ks0p98cxex3a60tkfw4ahh8d" />
)}
```

ElevenLabs renders its own floating button and panel (bottom-right) — no custom React code required.

### `brewsecure/src/components/ChatWidget.jsx` (MODIFIED)

Moved the text chat widget from `fixed bottom-6 right-6` to `fixed bottom-6 left-6` so it no longer overlaps with the ElevenLabs voice widget (which defaults to bottom-right).

---

### ElevenLabs Agent Details

| Field | Value |
|---|---|
| Agent Name | My Agent |
| Agent ID | `agent_5501ks0p98cxex3a60tkfw4ahh8d` |
| MCP connection | `https://mcp.brewsecure.store/mcp` (Bearer auth) — configured in ElevenLabs dashboard |
| Browser audio path | WebRTC direct — browser ↔ ElevenLabs cloud, no server proxy |
| Widget delivery | CDN embed via `<elevenlabs-convai>` web component |

---

## Related Handoffs

- **MCP server setup, Nginx config, PM2 config, and tool list:** `MCP_SERVER_HANDOFF.md`
- **Architecture diagram:** `brewsecure_server_architecture.svg`
