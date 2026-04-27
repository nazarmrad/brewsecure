# BrewSecure Backend

Intentionally vulnerable Node.js + Express API for an e-commerce demo app — modeled after [OWASP Juice Shop](https://github.com/juice-shop/juice-shop) for Akamai security product demonstrations.

> **Warning:** This backend contains deliberate security vulnerabilities. Never deploy to production.

---

## Setup

```bash
cd backend
npm install
npm run seed   # populate SQLite with 12 products and 3 users
npm start      # server starts on http://localhost:3001
```

For hot-reload during development:

```bash
npm run dev
```

Swagger UI (API inventory): **http://localhost:3001/api-docs**

---

## Seed Credentials

| Role  | Email                      | Password   |
|-------|----------------------------|------------|
| Admin | admin@brewsecure.com       | admin123   |
| User  | user@brewsecure.com        | password1  |
| Test  | test@brewsecure.com        | test123    |

---

## Endpoints

### Auth
| Method | Path           | Description                              |
|--------|----------------|------------------------------------------|
| POST   | /api/login     | Login — returns JWT (no rate limiting)   |
| POST   | /api/register  | Register new user                        |
| POST   | /api/logout    | Logout (stateless)                       |

### Products
| Method | Path               | Description                         |
|--------|--------------------|-------------------------------------|
| GET    | /api/products      | List all (?category=, ?q=)          |
| GET    | /api/products/:id  | Get product by ID                   |
| POST   | /api/products      | Create product (admin JWT required) |

### Cart
| Method | Path                 | Description             |
|--------|----------------------|-------------------------|
| GET    | /api/cart            | Get cart (JWT required) |
| POST   | /api/cart            | Add item to cart        |
| DELETE | /api/cart/:itemId    | Remove item from cart   |

### Orders
| Method | Path              | Description                           |
|--------|-------------------|---------------------------------------|
| POST   | /api/orders       | Place order                           |
| GET    | /api/orders       | List orders for current user          |
| GET    | /api/orders/:id   | Get order by ID (VULN: no BOLA check) |

### Users
| Method | Path           | Description                               |
|--------|----------------|-------------------------------------------|
| GET    | /api/users/me  | Current user profile                      |
| PUT    | /api/users/me  | Update profile (VULN: mass assignment)    |
| GET    | /api/users     | All users — admin (VULN: exposes hashes)  |

### Search
| Method | Path        | Description                      |
|--------|-------------|----------------------------------|
| GET    | /api/search | Search (?q=) — VULN: SQL injection |

### Other
| Method | Path           | Description          |
|--------|----------------|----------------------|
| GET    | /api/health    | Health check         |
| GET    | /api-docs      | Swagger UI           |

---

## Vulnerabilities & Akamai Controls Mapping

| # | Vulnerability | Endpoint / Location | OWASP Category | Akamai Product |
|---|---------------|---------------------|----------------|----------------|
| 1 | **SQL Injection** — raw string interpolation in query | `GET /api/search?q=` | A03:2021 Injection | **App & API Protector** — WAF SQLi rule set detects and blocks injection payloads in query params |
| 2 | **BOLA / IDOR** — no ownership check on order lookup | `GET /api/orders/:id` | A01:2021 Broken Access Control | **API Security** — behavioral analytics flags cross-user resource access; **App & API Protector** enforces object-level ACL policies |
| 3 | **No Rate Limiting on Login** — brute-force / credential stuffing | `POST /api/login` | A07:2021 Auth Failures | **Bot Manager** — behavioral fingerprinting detects automated login traffic; **Account Protector** — velocity + IP reputation signals block ATO campaigns |
| 4 | **Excessive Data Exposure** — password hashes returned | `GET /api/users` | A02:2021 Cryptographic Failures | **API Security** — discovers sensitive field leakage via response inspection; **App & API Protector** — response-side data masking |
| 5 | **Weak JWT Secret** (`secret123`) — offline brute-forceable | `middleware/auth.js` | A02:2021 Cryptographic Failures | **App & API Protector** — intercepts forged/tampered tokens before they reach the origin; **API Security** — anomalous token patterns |
| 6 | **Mass Assignment** — `isAdmin` accepted via PUT body | `PUT /api/users/me` | A01:2021 Broken Access Control | **API Security** — schema enforcement flags unexpected fields; **App & API Protector** — request body inspection blocks privilege-escalation payloads |
| 7 | **Verbose Error Messages** — stack traces in 500 responses | All catch blocks | A05:2021 Security Misconfiguration | **App & API Protector** — response-side inspection strips stack traces and internal error details |

---

## Tech Stack

- **Runtime:** Node.js + Express 4
- **Database:** SQLite via `better-sqlite3` (WAL mode, no setup required)
- **Auth:** JWT (`jsonwebtoken`) — intentionally weak secret
- **Passwords:** `bcryptjs` — intentionally low cost factor (saltRounds=4)
- **Docs:** `swagger-ui-express` at `/api-docs`
- **Security headers:** `helmet` (permissive config for demo visibility)
- **CORS:** Open to `localhost:5173` (Vite) and `localhost:5174`
