const Database = require('better-sqlite3')
const path = require('path')

const db = new Database(path.join(__dirname, '..', 'brewsecure.db'))

db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    name      TEXT    NOT NULL,
    email     TEXT    UNIQUE NOT NULL,
    password  TEXT    NOT NULL,
    isAdmin   INTEGER NOT NULL DEFAULT 0,
    createdAt TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS products (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT    NOT NULL,
    description TEXT,
    price       REAL    NOT NULL,
    imageUrl    TEXT,
    stock       INTEGER NOT NULL DEFAULT 100,
    category    TEXT    NOT NULL,
    badge       TEXT,
    rating      REAL    DEFAULT 4.5,
    reviews     INTEGER DEFAULT 0,
    roastLevel  INTEGER DEFAULT 5,
    process     TEXT,
    altitude    TEXT,
    origin      TEXT,
    region      TEXT,
    notes       TEXT
  );

  CREATE TABLE IF NOT EXISTS cart_items (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    userId    INTEGER NOT NULL,
    productId INTEGER NOT NULL,
    quantity  INTEGER NOT NULL DEFAULT 1,
    size      TEXT    NOT NULL DEFAULT '250g',
    FOREIGN KEY (userId)    REFERENCES users(id)    ON DELETE CASCADE,
    FOREIGN KEY (productId) REFERENCES products(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS orders (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    userId          INTEGER NOT NULL,
    status          TEXT    NOT NULL DEFAULT 'confirmed',
    total           REAL,
    shippingAddress TEXT,
    paymentMethod   TEXT,
    createdAt       TEXT    NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (userId) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS order_items (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    orderId   INTEGER NOT NULL,
    productId INTEGER NOT NULL,
    name      TEXT,
    price     REAL,
    quantity  INTEGER,
    size      TEXT,
    FOREIGN KEY (orderId) REFERENCES orders(id)
  );
`)

module.exports = db
