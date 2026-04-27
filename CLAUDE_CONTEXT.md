# BrewSecure — Claude Troubleshooting Context

Paste this at the start of any new chat to get full project context instantly.

---

## What it is
Full-stack e-commerce demo app (coffee shop) built to demo Akamai security products. Intentionally vulnerable — modeled after OWASP Juice Shop. Not for production.

---

## Stack
- **Frontend:** React 19 + Vite 8, Tailwind CSS v4, React Router v6, Axios, Context API (AuthContext + CartContext)
- **Backend:** Node.js + Express 4, SQLite (better-sqlite3), JWT (secret: `secret123`), bcryptjs (saltRounds=4), Helmet (CSP off), Swagger UI at `/api-docs`
- **Infra:** Single Linode VPS, Ubuntu 24.04, nginx reverse proxy, PM2 process manager

---

## File Structure

```
~/BrewSecure/                          (Linode: /home/deploy/BrewSecure/)
├── brewsecure/                        (frontend)
│   ├── src/
│   │   ├── services/api.js            (axios instances — baseURL: http://LINODE_IP/api)
│   │   ├── context/AuthContext.jsx    (JWT stored in localStorage as bs_token)
│   │   ├── context/CartContext.jsx
│   │   ├── components/
│   │   │   ├── RequireAuth.jsx        (guards /checkout route)
│   │   │   ├── CartDrawer.jsx
│   │   │   ├── LoginModal.jsx
│   │   │   ├── ProductCard.jsx
│   │   │   └── ErrorBanner.jsx
│   │   └── pages/
│   │       ├── HomePage.jsx
│   │       ├── ShopPage.jsx
│   │       ├── ProductDetail.jsx
│   │       ├── CheckoutPage.jsx
│   │       └── APIExplorer.jsx
│   └── dist/                          (built static files served by nginx)
└── backend/
    ├── src/
    │   ├── app.js                     (Express entry, port 3001)
    │   ├── db.js                      (SQLite init, WAL mode)
    │   ├── routes/
    │   │   ├── auth.js                (POST /api/login, /register, /logout)
    │   │   ├── products.js            (GET|POST /api/products, GET /api/products/:id)
    │   │   ├── cart.js                (GET|POST /api/cart, DELETE /api/cart/:itemId)
    │   │   ├── orders.js              (POST|GET /api/orders, GET /api/orders/:id)
    │   │   ├── users.js               (GET|PUT /api/users/me, GET /api/users)
    │   │   └── search.js              (GET /api/search?q=)
    │   ├── middleware/
    │   │   ├── auth.js                (requireAuth, requireAdmin — JWT_SECRET='secret123')
    │   │   └── rateLimit.js           (noRateLimit — intentional no-op)
    │   └── seed/data.js               (12 products, 3 users, bcrypt saltRounds=4)
    ├── swagger.js                     (OpenAPI 3.0 spec object)
    ├── brewsecure.db                  (SQLite file, created after npm run seed)
    └── package.json
```

---

## API Routes (all at /api — no /v1 prefix)

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| POST | /api/login | — | Returns JWT, no rate limit |
| POST | /api/register | — | bcrypt saltRounds=4 |
| POST | /api/logout | — | Stateless, no-op |
| GET | /api/products | — | ?category= ?q= |
| GET | /api/products/:id | — | |
| POST | /api/products | Admin JWT | Weak isAdmin check |
| GET | /api/cart | JWT | |
| POST | /api/cart | JWT | |
| DELETE | /api/cart/:itemId | JWT | |
| POST | /api/orders | JWT | |
| GET | /api/orders | JWT | |
| GET | /api/orders/:id | JWT | BOLA — no ownership check |
| GET | /api/users/me | JWT | |
| PUT | /api/users/me | JWT | Mass assignment vuln |
| GET | /api/users | Admin JWT | Returns password hashes |
| GET | /api/search?q= | — | SQL injection vuln |
| GET | /api/health | — | Returns {status:'ok'} |
| GET | /api-docs | — | Swagger UI |

---

## Intentional Vulnerabilities

1. **SQL Injection** — `/api/search?q=` raw string interpolation
2. **BOLA/IDOR** — `GET /api/orders/:id` no ownership check
3. **No Rate Limiting** — `POST /api/login` uses no-op middleware
4. **Excessive Data Exposure** — `GET /api/users` returns SELECT * including password hashes
5. **Weak JWT Secret** — `"secret123"` in middleware/auth.js
6. **Mass Assignment** — `PUT /api/users/me` merges entire req.body including isAdmin
7. **Verbose Errors** — all catch blocks return err.message + err.stack

---

## Seed Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@brewsecure.com | admin123 |
| User | user@brewsecure.com | password1 |
| Test | test@brewsecure.com | test123 |

---

## Linode Deployment

- **IP:** 172.105.80.174
- **User:** deploy
- **nginx config:** `/etc/nginx/sites-available/brewsecure`
  - `/` → serves `~/BrewSecure/brewsecure/dist/`
  - `/api` → proxy_pass `http://localhost:3001`
  - `/api-docs` → proxy_pass `http://localhost:3001`
- **PM2 process:** `brewsecure-api` running `backend/src/app.js`

## Key Commands (on Linode)

```bash
pm2 logs brewsecure-api --lines 50        # check backend logs
pm2 restart brewsecure-api                # restart backend
sudo systemctl reload nginx               # reload nginx config
sudo tail -30 /var/log/nginx/error.log    # nginx errors

# Rebuild frontend after any src/ change
cd ~/BrewSecure/brewsecure && rm -rf dist && npm run build && sudo systemctl reload nginx

# Re-seed database
rm ~/BrewSecure/backend/brewsecure.db
cd ~/BrewSecure/backend && npm run seed && pm2 restart brewsecure-api
```

---

## Known Gotchas

- `product.notes` is stored as a comma-separated string — frontend splits it with `.split(',')`
- `product.sizes` does not exist in the DB — frontend hardcodes `['250g', '500g', '1kg']`
- `node_modules` must be installed on the server directly — never copy from macOS (binary incompatibility)
- nginx runs as `www-data` — home directory needs `chmod 755 /home/deploy` to be readable
- SQLite DB path is relative to `backend/` — always `cd ~/BrewSecure/backend` before running seed
