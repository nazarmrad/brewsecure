const bcrypt = require('bcryptjs')
const db = require('../db')

// ── Users ──────────────────────────────────────────────────────────────────────
// VULN: Weak bcrypt cost — saltRounds=4 for demo (real apps use 12+)
const SALT_ROUNDS = 4

const users = [
  { name: 'Admin User',  email: 'admin@brewsecure.com', password: 'admin123',  isAdmin: 1 },
  { name: 'Jane Doe',    email: 'user@brewsecure.com',  password: 'password1', isAdmin: 0 },
  { name: 'Test User',   email: 'test@brewsecure.com',  password: 'test123',   isAdmin: 0 },
]

// ── Products ───────────────────────────────────────────────────────────────────
const products = [
  // Light Roast
  {
    name: 'Ethiopian Yirgacheffe',
    description: 'Bright and floral with notes of jasmine, bergamot, and a delicate citrus finish.',
    price: 18.99,
    imageUrl: 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=400',
    stock: 120,
    category: 'Light',
    badge: 'Single Origin',
    rating: 4.8,
    reviews: 142,
    roastLevel: 2,
    process: 'Washed',
    altitude: '1,800–2,200m',
    origin: 'Ethiopia',
    region: 'Yirgacheffe',
    notes: 'Jasmine, Bergamot, Lemon',
  },
  {
    name: 'Kenya AA Kirinyaga',
    description: 'Complex blackcurrant and tomato acidity balanced with a syrupy body.',
    price: 21.50,
    imageUrl: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400',
    stock: 85,
    category: 'Light',
    badge: 'Award Winner',
    rating: 4.9,
    reviews: 98,
    roastLevel: 3,
    process: 'Washed',
    altitude: '1,700–2,000m',
    origin: 'Kenya',
    region: 'Kirinyaga',
    notes: 'Blackcurrant, Tomato, Brown Sugar',
  },
  {
    name: 'Panama Geisha Boquete',
    description: 'The legendary Geisha variety — tea-like, exotic, with peach and tropical flowers.',
    price: 34.00,
    imageUrl: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400',
    stock: 40,
    category: 'Light',
    badge: 'Rare',
    rating: 5.0,
    reviews: 67,
    roastLevel: 2,
    process: 'Natural',
    altitude: '1,600–1,800m',
    origin: 'Panama',
    region: 'Boquete',
    notes: 'Peach, Tropical Fruit, Jasmine Tea',
  },
  // Medium Roast
  {
    name: 'Colombia Huila Supremo',
    description: 'Classic Colombian profile — caramel sweetness, mild nuttiness, clean bright finish.',
    price: 16.50,
    imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400',
    stock: 200,
    category: 'Medium',
    badge: 'Best Seller',
    rating: 4.7,
    reviews: 231,
    roastLevel: 5,
    process: 'Washed',
    altitude: '1,500–1,900m',
    origin: 'Colombia',
    region: 'Huila',
    notes: 'Caramel, Hazelnut, Apple',
  },
  {
    name: 'Guatemala Antigua',
    description: 'Rich chocolate and spice from volcanic soil with a velvety smooth body.',
    price: 17.00,
    imageUrl: 'https://images.unsplash.com/photo-1498804103079-a6351b050096?w=400',
    stock: 150,
    category: 'Medium',
    badge: null,
    rating: 4.6,
    reviews: 178,
    roastLevel: 5,
    process: 'Washed',
    altitude: '1,500–1,700m',
    origin: 'Guatemala',
    region: 'Antigua',
    notes: 'Dark Chocolate, Spice, Brown Sugar',
  },
  {
    name: 'Costa Rica Tarrazu',
    description: 'Bright acidity with honey process sweetness and a clean citrus aftertaste.',
    price: 19.00,
    imageUrl: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400',
    stock: 110,
    category: 'Medium',
    badge: 'New Arrival',
    rating: 4.7,
    reviews: 89,
    roastLevel: 4,
    process: 'Honey',
    altitude: '1,200–1,900m',
    origin: 'Costa Rica',
    region: 'Tarrazu',
    notes: 'Honey, Orange, Almond',
  },
  // Dark Roast
  {
    name: 'Sumatra Mandheling',
    description: 'Full-bodied and earthy with low acidity, deep cedar and dark cocoa tones.',
    price: 15.99,
    imageUrl: 'https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=400',
    stock: 175,
    category: 'Dark',
    badge: null,
    rating: 4.5,
    reviews: 203,
    roastLevel: 8,
    process: 'Wet-Hulled',
    altitude: '900–1,500m',
    origin: 'Indonesia',
    region: 'Sumatra',
    notes: 'Dark Cocoa, Cedar, Earthy',
  },
  {
    name: 'French Roast Espresso',
    description: 'Intense smoky-sweet espresso roast — bold crema, bittersweet finish, no compromise.',
    price: 14.50,
    imageUrl: 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=400',
    stock: 220,
    category: 'Dark',
    badge: 'Espresso Blend',
    rating: 4.4,
    reviews: 315,
    roastLevel: 9,
    process: 'Washed',
    altitude: null,
    origin: 'Brazil / Vietnam Blend',
    region: null,
    notes: 'Smoke, Dark Chocolate, Roasted Nut',
  },
  {
    name: 'Sulawesi Toraja',
    description: 'Syrupy body with dark fruit undertones and a lingering smoky-sweet finish.',
    price: 20.00,
    imageUrl: 'https://images.unsplash.com/photo-1504630083234-14187a9df0f5?w=400',
    stock: 60,
    category: 'Dark',
    badge: 'Rare',
    rating: 4.6,
    reviews: 54,
    roastLevel: 7,
    process: 'Wet-Hulled',
    altitude: '1,100–1,800m',
    origin: 'Indonesia',
    region: 'Sulawesi',
    notes: 'Dark Fruit, Smoke, Caramel',
  },
  // Blends
  {
    name: 'BrewSecure House Blend',
    description: 'Our signature blend of Ethiopian and Colombian beans — approachable, balanced, everyday.',
    price: 13.99,
    imageUrl: 'https://images.unsplash.com/photo-1516743619420-154b70a65fea?w=400',
    stock: 300,
    category: 'Blends',
    badge: 'House Blend',
    rating: 4.5,
    reviews: 412,
    roastLevel: 5,
    process: 'Mixed',
    altitude: null,
    origin: 'Ethiopia / Colombia',
    region: null,
    notes: 'Caramel, Citrus, Chocolate',
  },
  {
    name: 'Morning Ritual Blend',
    description: 'Brazilian base with a Kenyan top note — reliable morning coffee with gentle brightness.',
    price: 14.99,
    imageUrl: 'https://images.unsplash.com/photo-1487664010913-c779d8e851c0?w=400',
    stock: 250,
    category: 'Blends',
    badge: 'Subscriber Favorite',
    rating: 4.6,
    reviews: 287,
    roastLevel: 6,
    process: 'Mixed',
    altitude: null,
    origin: 'Brazil / Kenya',
    region: null,
    notes: 'Toffee, Red Berry, Smooth',
  },
  {
    name: 'Midnight Espresso Blend',
    description: 'Deep, dark, and mysterious — bold robusta backbone with Guatemalan sweetness.',
    price: 15.50,
    imageUrl: 'https://images.unsplash.com/photo-1525088553748-01d6e210e00b?w=400',
    stock: 190,
    category: 'Blends',
    badge: 'Barista Pick',
    rating: 4.7,
    reviews: 196,
    roastLevel: 8,
    process: 'Mixed',
    altitude: null,
    origin: 'Guatemala / Vietnam',
    region: null,
    notes: 'Dark Chocolate, Espresso, Walnut',
  },
]

// ── Seed ───────────────────────────────────────────────────────────────────────
function seed() {
  console.log('Seeding users...')
  const insertUser = db.prepare(
    'INSERT OR IGNORE INTO users (name, email, password, isAdmin) VALUES (?, ?, ?, ?)'
  )
  for (const u of users) {
    const hash = bcrypt.hashSync(u.password, SALT_ROUNDS)
    insertUser.run(u.name, u.email, hash, u.isAdmin)
  }

  console.log('Seeding products...')
  const insertProduct = db.prepare(`
    INSERT OR IGNORE INTO products
      (name, description, price, imageUrl, stock, category, badge, rating, reviews,
       roastLevel, process, altitude, origin, region, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
  for (const p of products) {
    insertProduct.run(
      p.name, p.description, p.price, p.imageUrl, p.stock, p.category,
      p.badge ?? null, p.rating, p.reviews, p.roastLevel,
      p.process ?? null, p.altitude ?? null, p.origin ?? null,
      p.region ?? null, p.notes ?? null
    )
  }

  console.log(`Seeded ${users.length} users and ${products.length} products.`)
}

seed()
