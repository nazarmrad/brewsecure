const swaggerSpec = {
  openapi: '3.0.3',
  info: {
    title: 'BrewSecure API',
    version: '1.0.0',
    description:
      'Intentionally vulnerable e-commerce API for Akamai security product demos. ' +
      'Modeled after OWASP Juice Shop. **Do not deploy in production.**',
  },
  servers: [{ url: 'http://localhost:3001', description: 'Local dev' }],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
    schemas: {
      Product: {
        type: 'object',
        properties: {
          id:          { type: 'integer' },
          name:        { type: 'string' },
          description: { type: 'string' },
          price:       { type: 'number' },
          imageUrl:    { type: 'string' },
          stock:       { type: 'integer' },
          category:    { type: 'string', enum: ['Light', 'Medium', 'Dark', 'Blends'] },
          badge:       { type: 'string', nullable: true },
          rating:      { type: 'number' },
          reviews:     { type: 'integer' },
          roastLevel:  { type: 'integer', minimum: 1, maximum: 10 },
          process:     { type: 'string', nullable: true },
          altitude:    { type: 'string', nullable: true },
          origin:      { type: 'string', nullable: true },
          region:      { type: 'string', nullable: true },
          notes:       { type: 'string', nullable: true },
        },
      },
      User: {
        type: 'object',
        properties: {
          id:        { type: 'integer' },
          name:      { type: 'string' },
          email:     { type: 'string' },
          isAdmin:   { type: 'boolean' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      CartItem: {
        type: 'object',
        properties: {
          id:        { type: 'integer' },
          productId: { type: 'integer' },
          name:      { type: 'string' },
          price:     { type: 'number' },
          imageUrl:  { type: 'string' },
          category:  { type: 'string' },
          quantity:  { type: 'integer' },
          size:      { type: 'string' },
        },
      },
      Order: {
        type: 'object',
        properties: {
          id:              { type: 'integer' },
          userId:          { type: 'integer' },
          status:          { type: 'string' },
          total:           { type: 'number' },
          shippingAddress: { type: 'object' },
          paymentMethod:   { type: 'string' },
          createdAt:       { type: 'string', format: 'date-time' },
          items:           { type: 'array', items: { type: 'object' } },
        },
      },
      Error: {
        type: 'object',
        properties: {
          message: { type: 'string' },
          stack:   { type: 'string', description: 'VULN: verbose error — exposes stack trace' },
        },
      },
    },
  },
  paths: {
    '/api/login': {
      post: {
        tags: ['Auth'],
        summary: 'Login — VULN: No rate limiting (ATO demo)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: { email: { type: 'string' }, password: { type: 'string' } },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'JWT token',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { token: { type: 'string' }, user: { $ref: '#/components/schemas/User' } },
                },
              },
            },
          },
          401: { description: 'Invalid credentials' },
        },
      },
    },
    '/api/register': {
      post: {
        tags: ['Auth'],
        summary: 'Register new user',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'email', 'password'],
                properties: {
                  name:     { type: 'string' },
                  email:    { type: 'string' },
                  password: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Created', content: { 'application/json': { schema: { type: 'object', properties: { token: { type: 'string' }, user: { $ref: '#/components/schemas/User' } } } } } },
          409: { description: 'Email already registered' },
        },
      },
    },
    '/api/logout': {
      post: {
        tags: ['Auth'],
        summary: 'Logout (stateless — no server-side invalidation)',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Logged out' } },
      },
    },
    '/api/products': {
      get: {
        tags: ['Products'],
        summary: 'List all products',
        parameters: [
          { name: 'category', in: 'query', schema: { type: 'string', enum: ['Light', 'Medium', 'Dark', 'Blends'] } },
          { name: 'q', in: 'query', schema: { type: 'string' }, description: 'Keyword search (parameterized — safe)' },
        ],
        responses: { 200: { description: 'Product list', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Product' } } } } } },
      },
      post: {
        tags: ['Products'],
        summary: 'Create product — admin only (VULN: weak JWT claim check)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Product' } } },
        },
        responses: {
          201: { description: 'Created' },
          403: { description: 'Admin access required' },
        },
      },
    },
    '/api/products/{id}': {
      get: {
        tags: ['Products'],
        summary: 'Get product by ID',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          200: { description: 'Product', content: { 'application/json': { schema: { $ref: '#/components/schemas/Product' } } } },
          404: { description: 'Not found' },
        },
      },
    },
    '/api/cart': {
      get: {
        tags: ['Cart'],
        summary: 'Get current user cart',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Cart items', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/CartItem' } } } } } },
      },
      post: {
        tags: ['Cart'],
        summary: 'Add item to cart',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['productId'],
                properties: {
                  productId: { type: 'integer' },
                  quantity:  { type: 'integer', default: 1 },
                  size:      { type: 'string',  default: '250g' },
                },
              },
            },
          },
        },
        responses: { 201: { description: 'Item added' } },
      },
    },
    '/api/cart/{itemId}': {
      delete: {
        tags: ['Cart'],
        summary: 'Remove item from cart',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'itemId', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { 200: { description: 'Item removed' }, 403: { description: 'Forbidden' } },
      },
    },
    '/api/orders': {
      post: {
        tags: ['Orders'],
        summary: 'Place an order',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['items'],
                properties: {
                  items:           { type: 'array', items: { type: 'object' } },
                  shippingAddress: { type: 'object' },
                  paymentMethod:   { type: 'string' },
                },
              },
            },
          },
        },
        responses: { 201: { description: 'Order confirmed' } },
      },
      get: {
        tags: ['Orders'],
        summary: 'List orders for current user',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Orders', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Order' } } } } } },
      },
    },
    '/api/orders/{id}': {
      get: {
        tags: ['Orders'],
        summary: 'Get order by ID — VULN: BOLA/IDOR (no ownership check)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          200: { description: 'Order', content: { 'application/json': { schema: { $ref: '#/components/schemas/Order' } } } },
          404: { description: 'Not found' },
        },
      },
    },
    '/api/users/me': {
      get: {
        tags: ['Users'],
        summary: 'Get current user profile',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'User', content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } } } },
      },
      put: {
        tags: ['Users'],
        summary: 'Update profile — VULN: Mass Assignment (isAdmin accepted)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', description: 'Any field including isAdmin' } } },
        },
        responses: { 200: { description: 'Updated user' } },
      },
    },
    '/api/users': {
      get: {
        tags: ['Users'],
        summary: 'List all users — VULN: Excessive Data Exposure (returns password hashes)',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'All users including password hashes' } },
      },
    },
    '/api/search': {
      get: {
        tags: ['Search'],
        summary: 'Search products — VULN: SQL Injection',
        parameters: [
          {
            name: 'q',
            in: 'query',
            required: true,
            schema: { type: 'string' },
            description: "Intentionally injected into SQL. Try: `' OR '1'='1`",
          },
        ],
        responses: {
          200: { description: 'Matching products' },
          500: { description: 'SQL error (VULN: verbose)', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
  },
}

module.exports = swaggerSpec
