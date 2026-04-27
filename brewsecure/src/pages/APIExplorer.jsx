import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Spinner from '../components/Spinner'

const endpoints = [
  { method: 'GET', path: '/api/v1/products', description: 'List all products with optional filters', tag: 'Products', params: [{ name: 'roast', type: 'string', desc: 'Filter by roast level: light, medium, dark, blend' }, { name: 'limit', type: 'integer', desc: 'Number of results (default: 20)' }, { name: 'offset', type: 'integer', desc: 'Pagination offset' }], response: '{\n  "products": [ ... ],\n  "total": 6,\n  "page": 1\n}' },
  { method: 'GET', path: '/api/v1/products/:id', description: 'Get a single product by ID', tag: 'Products', params: [{ name: 'id', type: 'integer', desc: 'Product ID (required)' }], response: '{\n  "id": 1,\n  "name": "Ethiopia Yirgacheffe",\n  "price": 19.50,\n  "roast": "Light"\n}' },
  { method: 'POST', path: '/api/v1/auth/login', description: 'Authenticate and receive a signed JWT token', tag: 'Auth', params: [{ name: 'email', type: 'string', desc: 'User email address' }, { name: 'password', type: 'string', desc: 'User password' }], response: '{\n  "token": "eyJhbGciOiJIUzI1NiJ9...",\n  "user": { "id": 42, "email": "..." }\n}' },
  { method: 'POST', path: '/api/v1/auth/register', description: 'Create a new customer account', tag: 'Auth', params: [{ name: 'name', type: 'string', desc: 'Full name' }, { name: 'email', type: 'string', desc: 'Email address' }, { name: 'password', type: 'string', desc: 'Min 8 characters' }], response: '{\n  "user": { "id": 43, "name": "..." },\n  "token": "eyJ..."\n}' },
  { method: 'GET', path: '/api/v1/cart', description: "Retrieve the current user's cart", tag: 'Cart', params: [{ name: 'Authorization', type: 'header', desc: 'Bearer <token>' }], response: '{\n  "items": [ ... ],\n  "subtotal": 37.50,\n  "count": 2\n}' },
  { method: 'POST', path: '/api/v1/cart/add', description: 'Add an item to the cart', tag: 'Cart', params: [{ name: 'productId', type: 'integer', desc: 'Product ID' }, { name: 'quantity', type: 'integer', desc: 'Number of units' }, { name: 'size', type: 'string', desc: '250g | 500g | 1kg' }], response: '{\n  "cart": { "items": [...], "subtotal": 55.00 }\n}' },
  { method: 'DELETE', path: '/api/v1/cart/:itemId', description: 'Remove a specific item from the cart', tag: 'Cart', params: [{ name: 'itemId', type: 'integer', desc: 'Cart item ID' }, { name: 'Authorization', type: 'header', desc: 'Bearer <token>' }], response: '{\n  "success": true,\n  "cart": { ... }\n}' },
  { method: 'POST', path: '/api/v1/orders', description: 'Place a new order from the current cart', tag: 'Orders', params: [{ name: 'cartId', type: 'string', desc: 'Cart identifier' }, { name: 'shippingAddress', type: 'object', desc: 'Address object' }, { name: 'paymentMethod', type: 'string', desc: 'stripe | paypal' }], response: '{\n  "orderId": "ORD-2847",\n  "status": "confirmed",\n  "eta": "2–4 business days"\n}' },
  { method: 'GET', path: '/api/v1/orders/:id', description: 'Get order status and tracking info', tag: 'Orders', params: [{ name: 'id', type: 'string', desc: 'Order ID e.g. ORD-2847' }], response: '{\n  "orderId": "ORD-2847",\n  "status": "shipped",\n  "tracking": "1Z999AA..."\n}' },
]

const methodColor = {
  GET: 'bg-[#2C5F2E]/10 text-[#2C5F2E] border-[#2C5F2E]/20',
  POST: 'bg-[#C4602A]/10 text-[#C4602A] border-[#C4602A]/20',
  DELETE: 'bg-red-500/10 text-red-600 border-red-200',
  PATCH: 'bg-purple-500/10 text-purple-700 border-purple-200',
}

export default function APIExplorer() {
  const navigate = useNavigate()
  const [activeTag, setActiveTag] = useState('All')
  const [expanded, setExpanded] = useState(null)
  // { [endpointIndex]: { loading, status, body, error, real } }
  const [tryResults, setTryResults] = useState({})

  const tags = ['All', ...Array.from(new Set(endpoints.map(e => e.tag)))]
  const filtered = activeTag === 'All' ? endpoints : endpoints.filter(e => e.tag === activeTag)

  async function tryEndpoint(ep, idx) {
    setTryResults(prev => ({ ...prev, [idx]: { loading: true } }))

    if (ep.method === 'GET') {
      const t0 = Date.now()
      try {
        // Substitute path params with safe example values
        const path = ep.path.replace(':id', '1').replace(':itemId', '1')
        const token = localStorage.getItem('bs_token')
        const headers = token ? { Authorization: `Bearer ${token}` } : {}
        const resp = await fetch(`http://localhost:3001${path}`, { headers })
        const ms = Date.now() - t0
        let body
        try { body = await resp.json() } catch { body = await resp.text() }
        setTryResults(prev => ({
          ...prev,
          [idx]: { loading: false, status: resp.status, ms, body, real: true },
        }))
      } catch (err) {
        setTryResults(prev => ({
          ...prev,
          [idx]: { loading: false, error: err.message || 'Network error — is the server running?', real: true },
        }))
      }
    } else {
      // Simulate non-GET methods — can't safely call without auth/body
      setTimeout(() => {
        setTryResults(prev => ({
          ...prev,
          [idx]: { loading: false, status: 200, body: ep.response, real: false },
        }))
      }, 600)
    }
  }

  return (
    <div className="min-h-screen bg-[#0F0F0F]">
      <div className="border-b border-white/10 px-6 py-10">
        <div className="max-w-5xl mx-auto flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">⚡</span>
              <span className="text-xs font-mono font-semibold uppercase tracking-widest text-[#C4602A] bg-[#C4602A]/10 px-3 py-1 rounded-full border border-[#C4602A]/20">Developer Mode</span>
            </div>
            <h1 className="font-mono text-3xl font-bold text-white mb-2">BrewSecure API</h1>
            <p className="text-white/50 text-sm font-mono">v1.0 · REST · Base URL: <span className="text-[#C4602A]">http://localhost:3001</span></p>
          </div>
          <button onClick={() => navigate('/')} className="mt-1 flex items-center gap-2 text-sm text-white/40 hover:text-white/70 transition-colors font-mono">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            Exit
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-[#C4602A]/10 border border-[#C4602A]/20 mb-8">
          <svg className="w-4 h-4 text-[#C4602A] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
          <p className="text-xs font-mono text-[#D4A574]">Authenticated endpoints require <code className="bg-white/10 px-1.5 py-0.5 rounded text-white">Authorization: Bearer &lt;token&gt;</code> in the request header.</p>
        </div>

        <div className="flex gap-2 mb-8 flex-wrap">
          {tags.map(t => (
            <button key={t} onClick={() => setActiveTag(t)} className={`px-4 py-1.5 rounded-full text-xs font-mono font-medium border transition-all ${activeTag === t ? 'bg-white text-[#0F0F0F] border-white' : 'border-white/20 text-white/50 hover:text-white hover:border-white/50'}`}>
              {t}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {filtered.map((ep, i) => {
            const tr = tryResults[i]
            const isSuccess = tr && !tr.loading && !tr.error && tr.status >= 200 && tr.status < 300
            const isError = tr && !tr.loading && (tr.error || tr.status >= 400)
            return (
              <div key={i} className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden hover:border-white/20 transition-colors">
                <button className="w-full flex items-center gap-4 px-5 py-4 text-left" onClick={() => setExpanded(expanded === i ? null : i)}>
                  <span className={`text-[11px] font-mono font-bold px-2.5 py-1 rounded-lg border ${methodColor[ep.method] || 'bg-gray-500/10 text-gray-400 border-gray-400/20'} flex-shrink-0 w-16 text-center`}>
                    {ep.method}
                  </span>
                  <code className="text-sm font-mono text-white flex-1 truncate">{ep.path}</code>
                  <span className="text-xs text-white/40 font-mono hidden md:block flex-1">{ep.description}</span>
                  <span className="text-xs font-mono px-2.5 py-0.5 rounded-full border border-white/10 text-white/30">{ep.tag}</span>
                  <svg className={`w-4 h-4 text-white/30 flex-shrink-0 transition-transform duration-200 ${expanded === i ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </button>

                {expanded === i && (
                  <div className="px-5 pb-5 border-t border-white/10 pt-5 space-y-5">
                    <p className="text-sm text-white/60 font-mono">{ep.description}</p>
                    <div>
                      <p className="text-xs font-mono font-semibold uppercase tracking-widest text-white/30 mb-3">Parameters</p>
                      <div className="space-y-2">
                        {ep.params.map((p, pi) => (
                          <div key={pi} className="flex items-start gap-3 text-xs font-mono">
                            <code className="text-[#C4602A] w-32 flex-shrink-0">{p.name}</code>
                            <span className="text-white/30 w-16 flex-shrink-0">{p.type}</span>
                            <span className="text-white/50">{p.desc}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-mono font-semibold uppercase tracking-widest text-white/30 mb-3">Example Response</p>
                      <pre className="bg-black/50 rounded-xl p-4 text-xs font-mono text-[#7EC8A4] overflow-x-auto border border-white/5">{ep.response}</pre>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => tryEndpoint(ep, i)}
                        disabled={tr?.loading}
                        className="flex items-center gap-2 px-5 py-2 rounded-full bg-[#C4602A] hover:bg-[#D4784A] disabled:opacity-50 text-white text-xs font-mono font-semibold transition-colors active:scale-95"
                      >
                        {tr?.loading ? <Spinner /> : null}
                        ▶ Try it
                      </button>
                      <span className="text-xs font-mono text-white/30">
                        {ep.method === 'GET' ? 'Sends a real request to localhost:3001' : 'Shows example response (requires auth/body)'}
                      </span>
                    </div>

                    {tr && !tr.loading && (
                      isError ? (
                        <div className="bg-[#1A0A0A] border border-red-500/30 rounded-xl p-4 space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-red-500" />
                            <span className="text-xs font-mono text-red-400 font-semibold">
                              {tr.status ? `${tr.status} Error` : 'Network Error'}
                            </span>
                          </div>
                          <pre className="text-xs font-mono text-red-300/80 overflow-x-auto whitespace-pre-wrap">
                            {tr.error || JSON.stringify(tr.body, null, 2)}
                          </pre>
                        </div>
                      ) : (
                        <div className="bg-[#0A1A0A] border border-[#2C5F2E]/40 rounded-xl p-4 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-[#2C5F2E] animate-pulse" />
                              <span className="text-xs font-mono text-[#7EC8A4] font-semibold">
                                {tr.status} OK{tr.ms != null ? ` · ${tr.ms}ms` : ''}
                              </span>
                            </div>
                            {!tr.real && (
                              <span className="text-[10px] font-mono text-white/20 border border-white/10 px-2 py-0.5 rounded-full">example</span>
                            )}
                          </div>
                          <pre className="text-xs font-mono text-[#7EC8A4] overflow-x-auto">
                            {typeof tr.body === 'string' ? tr.body : JSON.stringify(tr.body, null, 2)}
                          </pre>
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div className="mt-12 text-center text-xs font-mono text-white/20">
          BrewSecure REST API · OpenAPI 3.0 · Questions? <span className="text-[#C4602A]">dev@brewsecure.com</span>
        </div>
      </div>
    </div>
  )
}
