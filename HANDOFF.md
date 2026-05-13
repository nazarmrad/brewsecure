# BrewSecure — Project Handoff

## What Is This

BrewSecure is an **intentionally vulnerable** full-stack e-commerce demo app (specialty coffee shop) built to demonstrate Akamai security products. It is not a real store. Every vulnerability is deliberate and commented in the code with the matching Akamai mitigation.

Live URL: `https://shop.brewsecure.store`
GitHub: `https://github.com/nazarmrad/brewsecure`
Owner: `nelmurad` / `nazar.mrad.95@gmail.com`

---

## Architecture

```
Browser
  └── Akamai CDN (shop.brewsecure.store)
        └── Linode VPS (172.105.80.174)
              ├── nginx (port 80/443)
              │     ├── /api/* → proxy to localhost:3001
              │     ├── /api-docs → proxy to localhost:3001
              │     └── /* → /home/deploy/BrewSecure/brewsecure/dist (static React build)
              └── PM2 → Node.js API (port 3001)
                        └── SQLite DB (backend/src/brewsecure.db)
```

### Frontend
- **React 19 + Vite 8**, Tailwind CSS v4, React Router v6, Axios
- Built to `/brewsecure/dist`, served as static files by nginx
- API calls use relative `/api` path in production (`import.meta.env.VITE_API_URL ?? '/api'`)
- For local dev: set `VITE_API_URL=http://localhost:3001/api` in `brewsecure/.env`

### Backend
- **Node.js + Express 4**, better-sqlite3, JWT, bcryptjs
- Runs on port 3001 via PM2 (`brewsecure-api` process)
- Swagger UI at `/api-docs`
- DB file at `backend/src/brewsecure.db` (not in git — persists on Linode)

---

## Server Setup (Linode)

**SSH:** `ssh deploy@172.105.80.174`

**PM2 — API process:**
```bash
pm2 status              # check running
pm2 logs brewsecure-api # tail logs
pm2 restart brewsecure-api
```

PM2 is registered as a systemd service (auto-starts on reboot via `pm2 startup` + `pm2 save`).

**ecosystem.config.js** lives on Linode only (NOT in git — contains secrets):
```js
module.exports = {
  apps: [{
    name: "brewsecure-api",
    script: "backend/src/app.js",
    cwd: "/home/deploy/BrewSecure",
    env: {
      PORT: 3001,
      ORDER_WEBHOOK_URL: "https://go.webhooks.cc/w/spos39e569",
      IMAGE_BASE_URL: "https://brewsecure-imagesv2.es-mad-1.linodeobjects.com"
    }
  }]
}
```

**nginx config:** `/etc/nginx/sites-enabled/org-lnd-01.brewsecure.store`
- Blocks direct IP access (returns 444)
- HTTP → HTTPS redirect
- HTTPS with self-signed cert at `/etc/ssl/certs/brewsecure.crt`
- Proxies `/api/*` and `/api-docs` to port 3001
- Serves static frontend from `/home/deploy/BrewSecure/brewsecure/dist`

**Deploying updates from GitHub:**
```bash
cd /home/deploy/BrewSecure
git pull origin main
cd brewsecure && npm run build && cd ..
pm2 restart brewsecure-api
```

---

## Environment Variables

| Variable | Where Set | Value | Purpose |
|---|---|---|---|
| `PORT` | ecosystem.config.js (Linode) | `3001` | API port |
| `ORDER_WEBHOOK_URL` | ecosystem.config.js (Linode) | `https://go.webhooks.cc/w/spos39e569` | Fires on order placement |
| `IMAGE_BASE_URL` | ecosystem.config.js (Linode) | `https://brewsecure-imagesv2.es-mad-1.linodeobjects.com` | Linode Object Storage bucket |
| `VITE_API_URL` | `brewsecure/.env` (local only) | `http://localhost:3001/api` | Local dev only — not used in production |

---

## Product Images

Stored in **Linode Object Storage** bucket:
`https://brewsecure-imagesv2.es-mad-1.linodeobjects.com`

Files are set to **public read**. Access policy in `assets/bucket-policy.json`.

Image filenames (12 products): `Yirgacheffe.png`, `Antigua.png`, `HouseBlend.png`, etc.

In seed data (`backend/src/seed/data.js`), `IMAGE_BASE_URL` env var is used so the URL is never hardcoded in the repo.

---

## Seed Accounts (pre-loaded in DB)

| Email | Password | Role |
|---|---|---|
| admin@brewsecure.com | admin123 | Admin |
| user@brewsecure.com | password1 | User |
| test@brewsecure.com | test123 | User |

---

## API Routes

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/login` | — | Login, returns JWT |
| POST | `/api/register` | — | Register, returns JWT |
| GET | `/api/products` | — | List products (filter: `?category=`, `?q=`) |
| GET | `/api/products/:id` | — | Get product |
| POST | `/api/products` | Admin | Create product |
| GET | `/api/search?q=` | — | **Vulnerable SQLi endpoint** |
| GET | `/api/cart` | Auth | Get cart |
| POST | `/api/cart` | Auth | Add to cart |
| DELETE | `/api/cart/:id` | Auth | Remove from cart |
| POST | `/api/orders` | Auth | Place order (fires webhook) |
| GET | `/api/orders` | Auth | List own orders |
| GET | `/api/orders/:id` | Auth | Get order by ID (**BOLA vuln**) |
| GET | `/api/users/me` | Auth | Get own profile |
| PUT | `/api/users/me` | Auth | Update profile (**Mass Assignment vuln**) |
| GET | `/api/users` | Admin | List all users (**Excessive Data Exposure**) |
| GET | `/api/health` | — | Health check |

JWT token stored in `localStorage` as `bs_token`. Secret is `secret123` (intentionally weak).

---

## Intentional Vulnerabilities

Each vuln is commented in the source with `// VULN:` and the Akamai mitigation:

| Vulnerability | File | Demo Method |
|---|---|---|
| **SQL Injection** | `routes/search.js:14` | `GET /api/search?q=' OR '1'='1` |
| **BOLA / IDOR** | `routes/orders.js:84` | Fetch `/api/orders/1` as any authenticated user |
| **Mass Assignment** | `routes/users.js:24` | `PUT /api/users/me` with `{"isAdmin": true}` |
| **Excessive Data Exposure** | `routes/users.js:41` | `GET /api/users` returns password hashes |
| **Weak JWT Secret** | `middleware/auth.js:6` | Secret is `secret123` — forge any token offline |
| **No Rate Limiting** | `routes/auth.js:12` | Brute-force `/api/login` — no throttle |
| **Weak bcrypt** | `routes/auth.js:53`, `seed/data.js:4` | saltRounds=4 (should be 12+) |
| **Verbose Errors** | All routes | 500 responses include `stack` trace |
| **Permissive Helmet** | `app.js:18` | CSP disabled |

All can be triggered via the **API Explorer** at `/api` or the Swagger UI at `/api-docs`.

---

## Frontend Pages & Routes

| Route | Page | Notes |
|---|---|---|
| `/` | HomePage | Landing / brand page |
| `/shop` | ShopPage | Product listing with filter/search |
| `/shop/:id` | ProductDetail | Product detail, size/qty, add to cart |
| `/checkout` | CheckoutPage | Requires auth — places order |
| `/profile` | ProfilePage | Requires auth — edit name/email, order history |
| `/partner` | PartnerJuiceShop | CORS demo — fetches from Juice Shop |
| `/api` | APIExplorer | Interactive vuln testing UI |

---

## Partner Juice Shop Tab (CORS Demo)

`/partner` page makes a live `fetch()` with `mode: 'cors'` to:
```
https://user1plwor.appsec-akaed.com/api/Products
```

- If CORS is **not configured** on Akamai CDN → shows a styled error panel explaining the missing headers
- If CORS is **configured** → renders Juice Shop products in a card grid

Product images load from: `https://user1plwor.appsec-akaed.com/assets/public/images/products/<filename>`

**Toggle for demo:** Enable/disable the parent CORS rule in the Akamai property (the rule that captures `Origin` into `PMUSER_CORS_ORIGIN`). Disabling it breaks CORS; enabling it restores it — one click, no code changes needed.

---

## Akamai CORS Configuration

The Juice Shop property (`user1plwor.appsec-akaed.com`) has three rules:

**Rule 1 — Capture Origin (master switch):**
- Criteria: `Request Header: Origin IS_ONE_OF https://*.brewsecure.store` (`matchWildcardValue: true`)
- Behavior: `setVariable PMUSER_CORS_ORIGIN = CLIENT_REQUEST_HEADER: Origin`

**Rule 2 — Handle OPTIONS preflight:**
- Criteria: `Request Method IS OPTIONS` AND `Request Header: Access-Control-Request-Method EXISTS`
- Behaviors: ADD CORS headers + `constructResponse 200` (synthetic — never hits origin)
- Headers: `Access-Control-Allow-Origin`, `Access-Control-Allow-Methods: GET, OPTIONS`, `Access-Control-Allow-Headers: Content-Type`, `Access-Control-Max-Age: 3600`
- Action must be `ADD` (not MODIFY) because `constructResponse` creates a blank synthetic response

**Rule 3 — Add ACAO to GET/POST responses:**
- Criteria: `Request Method IS_NOT OPTIONS`
- Behavior: `MODIFY Access-Control-Allow-Origin: {{user.PMUSER_CORS_ORIGIN}}`
- Must be `MODIFY` (not ADD) because Juice Shop's Express `cors()` middleware already sends `Access-Control-Allow-Origin: *` — ADD creates a duplicate that browsers reject

---

## Local Development

```bash
# Terminal 1 — backend
cd backend && npm install && node src/app.js

# Terminal 2 — frontend
cd brewsecure && npm install && npm run dev
```

Frontend runs on `http://localhost:5173`. Backend on `http://localhost:3001`.
`brewsecure/.env` contains `VITE_API_URL=http://localhost:3001/api`.

---

## Git

Remote: `git@github.com:nazarmrad/brewsecure.git` (SSH auth with ed25519 key)

Files excluded from repo (`.gitignore`):
- `ecosystem.config.js` — contains secrets
- `backend/src/brewsecure.db` — SQLite database
- `CLAUDE_CONTEXT.md` — had Linode IP

---

## Known Issues / Watch Out For

- **macOS Full Disk Access:** Claude Code may not be able to read/write files in `~/Desktop` if Terminal lacks Full Disk Access. Fix: System Settings → Privacy & Security → Full Disk Access → enable your terminal.
- **node_modules binary compatibility:** Never copy `node_modules` from Mac to Linux. Run `npm install` fresh on the server.
- **DB is not in git:** If the Linode is rebuilt, re-run the seed: `node backend/src/seed/data.js` (or check if seeding is in `db.js` — it auto-seeds on first run via `CREATE TABLE IF NOT EXISTS`).
- **PM2 ecosystem file:** Must be recreated manually on a fresh Linode — it's not in the repo.
