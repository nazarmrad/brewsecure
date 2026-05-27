# BrewSecure MCP Server — Handoff

## What It Is

A standalone FastMCP 3.x server that exposes BrewSecure data as MCP tools. Two consumers:

1. **ElevenLabs voice agent** — calls the MCP protocol endpoint directly over HTTPS
2. **BrewSecure chat widget** — calls the REST helper endpoints (`/tools`, `/call`) to integrate tool calling into the Ollama chat flow

---

## Servers & Repos

| | BrewSecure Web Server | MCP Server |
|---|---|---|
| **Repo** | `nazarmrad/brewsecure` | `nazarmrad/brewsecure_MCP` |
| **Domain** | `org-lnd-01.brewsecure.store` / `shop.brewsecure.store` | `mcp.brewsecure.store` |
| **Process** | PM2 `brewsecure-api` · port 3001 | PM2 `brewsecure-mcp` · port 3002 |
| **Nginx** | Proxies `/api/`, `/`, etc. | Proxies everything → 3002 |

---

## File Structure (MCP server)

```
/root/
  ecosystem.config.js     ← PM2 config + env vars (not in git)
  mcp/
    server.py             ← FastMCP 3.x server (all tools + REST endpoints)
  mcp-venv/               ← Python virtual environment
  mcp_repo/               ← git clone of nazarmrad/brewsecure_MCP
    mcp/
      server.py           ← source (copy to /root/mcp/ after pull)
      requirements.txt
```

---

## Environment Variables (`/root/ecosystem.config.js`)

```js
module.exports = {
  apps: [{
    name: "brewsecure-mcp",
    script: "/root/mcp/server.py",
    interpreter: "/root/mcp-venv/bin/python3",
    cwd: "/root",
    env: {
      MCP_SECRET_TOKEN:   "<token>",   // ElevenLabs sends this; also used for /tools and /call
      BREWSECURE_API_URL: "https://shop.brewsecure.store",  // BrewSecure REST API base URL
      BREWSECURE_API_KEY: "<token>",   // same value — sent as Bearer on all BrewSecure API calls
      MCP_PORT:           "3002"
    }
  }]
};
```

> `MCP_SECRET_TOKEN` and `BREWSECURE_API_KEY` share the same value by design — one token controls both inbound auth (from ElevenLabs) and outbound auth (to BrewSecure API).

---

## How It Works

The MCP server **does not read SQLite directly**. It calls the BrewSecure Express REST API over HTTPS:

```
ElevenLabs ──HTTPS──► mcp.brewsecure.store/mcp  ──HTTPS+API key──► shop.brewsecure.store/api/...
                              FastMCP 3.x                                Express + SQLite
```

> **SSL note:** `verify=False` is set in httpx because the BrewSecure server uses a self-signed cert. Fix: run `certbot --nginx -d shop.brewsecure.store` on the BrewSecure server and remove `verify=False` from `_get()` and `_post()` in `server.py`.

---

## Exposed Endpoints

### MCP Protocol (for ElevenLabs)
```
POST https://mcp.brewsecure.store/mcp
Authorization: Bearer <MCP_SECRET_TOKEN>
```
ElevenLabs dashboard config:
- **Server URL:** `https://mcp.brewsecure.store/mcp`
- **Secret Token:** value of `MCP_SECRET_TOKEN`
- All 6 tools set to **Auto-approved**

### REST Helpers (for Ollama chat widget)
```
GET  /health          → {"status":"ok"}  — no auth required
GET  /tools           → Ollama function-calling schema for all 6 tools
POST /call            → {"name":"tool_name","arguments":{...}} → {"result":...}
```
These are called by the Express chat route (`backend/src/routes/chat.js`) when integrating tool calling with `qwen2.5:3b`.

---

## Tools

| Tool | BrewSecure API call | Description |
|---|---|---|
| `get_all_products` | `GET /api/products` | Full catalogue, sorted by rating |
| `get_product_by_id` | `GET /api/products/:id` | Single product detail |
| `search_products` | `GET /api/products/search?q=&category=&in_stock_only=` | Full-text search (name, origin, notes, process…) |
| `check_stock` | `GET /api/products/stock?ids=1,2,3` | Bulk stock check |
| `get_customer_orders` | `GET /api/orders/by-email?email=` | Customer order history by email |
| `place_order` | `POST /api/orders/by-email` | Place order on behalf of customer; prices resolved server-side |

---

## Nginx Config (`/etc/nginx/sites-enabled/default`)

```nginx
server {
    listen 80;
    server_name mcp.brewsecure.store;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name mcp.brewsecure.store;

    ssl_certificate     /etc/letsencrypt/live/mcp.brewsecure.store/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/mcp.brewsecure.store/privkey.pem;

    location / {
        proxy_pass         http://127.0.0.1:3002;
        proxy_http_version 1.1;
        proxy_set_header   Connection "";
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_read_timeout 300s;
        proxy_buffering    off;
        proxy_cache        off;
    }
}
```

---

## Deploy / Update Sequence

```bash
# Pull latest code
cd ~/mcp_repo && git pull origin main

# Copy server file to live location
cp ~/mcp_repo/mcp/server.py ~/mcp/server.py

# Install any new dependencies
source ~/mcp-venv/bin/activate
pip install -r ~/mcp_repo/mcp/requirements.txt

# Restart
pm2 restart brewsecure-mcp --update-env
pm2 save

# Verify
curl https://mcp.brewsecure.store/health
curl -H "Authorization: Bearer <MCP_SECRET_TOKEN>" https://mcp.brewsecure.store/tools
```

---

## Known Gotchas

- **`verify=False` in httpx** — temporary workaround for self-signed cert on BrewSecure server. Remove once a proper Let's Encrypt cert is installed there.
- **FastMCP 3.x path** — ElevenLabs URL must be `https://mcp.brewsecure.store/mcp` (no trailing slash). A trailing slash causes a 307 redirect which drops the auth header.
- **PM2 env vars** — always use `pm2 restart brewsecure-mcp --update-env` after changing `ecosystem.config.js`. Plain `pm2 restart` uses the cached env.
- **`place_order` tool** — prices are always resolved server-side from the SQLite DB. The agent should call `search_products` first to get the `productId`, then confirm with the customer before calling `place_order`.
- **`get_customer_orders` and `place_order`** — these operate on real customer data by email, no authentication from the customer. Treat with care in a production context.
