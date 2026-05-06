import { useState, useEffect } from 'react'

const JUICE_SHOP_URL = 'https://user1plwor.appsec-akaed.com'
const PRODUCTS_URL = `${JUICE_SHOP_URL}/api/Products`

function ProductCard({ product }) {
  const [imgLoaded, setImgLoaded] = useState(false)
  const imageUrl = product.image?.startsWith('http')
    ? product.image
    : `${JUICE_SHOP_URL}/${product.image}`

  return (
    <div className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col">
      <div className="relative aspect-[4/3] bg-[#F0F4F8] overflow-hidden">
        <img
          src={imageUrl}
          alt={product.name}
          onLoad={() => setImgLoaded(true)}
          onError={() => setImgLoaded(true)}
          className={`w-full h-full object-cover transition-opacity duration-500 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
        />
        {!imgLoaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 rounded-full border-2 border-[#6B9E3F] border-t-transparent animate-spin" />
          </div>
        )}
        {product.quantity === 0 && (
          <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-red-500 text-white text-[10px] font-bold uppercase tracking-wider">
            Out of Stock
          </div>
        )}
      </div>
      <div className="p-5 flex flex-col flex-1">
        <h3 className="font-display text-base font-semibold text-[#1C2A1E] leading-tight mb-1">{product.name}</h3>
        <p className="text-xs text-[#5A7A5E] mb-3 line-clamp-2 flex-1">{product.description}</p>
        <div className="flex items-center justify-between mt-auto">
          <span className="font-semibold text-[#1C2A1E]">${product.price?.toFixed(2)}</span>
          {product.deluxePrice && product.deluxePrice !== product.price && (
            <span className="text-xs text-[#6B9E3F] font-medium">Deluxe: ${product.deluxePrice?.toFixed(2)}</span>
          )}
        </div>
      </div>
    </div>
  )
}

function CorsErrorPanel({ error, onRetry }) {
  return (
    <div className="max-w-2xl mx-auto py-16 px-6 text-center">
      <div className="w-16 h-16 rounded-full bg-amber-50 border-2 border-amber-200 flex items-center justify-center mx-auto mb-6">
        <svg className="w-8 h-8 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        </svg>
      </div>
      <h2 className="font-display text-2xl font-semibold text-[#1C2A1E] mb-3">CORS Policy Blocked</h2>
      <p className="text-[#5A7A5E] text-sm leading-relaxed mb-2">
        The browser blocked this cross-origin request to <code className="bg-[#F0F4F0] px-1.5 py-0.5 rounded text-xs font-mono text-[#1C2A1E]">{JUICE_SHOP_URL}</code> because the response did not include the required <code className="bg-[#F0F4F0] px-1.5 py-0.5 rounded text-xs font-mono text-[#1C2A1E]">Access-Control-Allow-Origin</code> header.
      </p>
      <p className="text-[#5A7A5E] text-sm leading-relaxed mb-8">
        Configure CORS response headers on the Akamai CDN to allow requests from this origin, then retry.
      </p>
      <div className="bg-[#F8F9F8] rounded-2xl border border-[#DDE8DD] p-5 text-left mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#5A7A5E] mb-3">Required Akamai CDN Headers</p>
        <div className="space-y-2 font-mono text-xs">
          {[
            ['Access-Control-Allow-Origin', window.location.origin],
            ['Access-Control-Allow-Methods', 'GET, OPTIONS'],
            ['Access-Control-Allow-Headers', 'Content-Type'],
          ].map(([k, v]) => (
            <div key={k} className="flex gap-2 flex-wrap">
              <span className="text-[#6B9E3F] font-semibold shrink-0">{k}:</span>
              <span className="text-[#1C2A1E]">{v}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <button
          onClick={onRetry}
          className="px-6 py-2.5 rounded-full bg-[#6B9E3F] hover:bg-[#557F30] text-white text-sm font-medium transition-colors"
        >
          Retry Request
        </button>
        <a
          href={JUICE_SHOP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="px-6 py-2.5 rounded-full border border-[#DDE8DD] text-sm font-medium text-[#5A7A5E] hover:border-[#6B9E3F] hover:text-[#1C2A1E] transition-colors"
        >
          Open Directly ↗
        </a>
      </div>
      {error && (
        <p className="mt-6 text-xs text-red-400 font-mono bg-red-50 rounded-xl px-4 py-2">{error}</p>
      )}
    </div>
  )
}

export default function PartnerJuiceShop() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [corsError, setCorsError] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [search, setSearch] = useState('')
  const [fetchCount, setFetchCount] = useState(0)

  useEffect(() => {
    setLoading(true)
    setCorsError(false)
    setErrorMsg('')

    fetch(PRODUCTS_URL, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      mode: 'cors',
    })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then(json => {
        const data = json?.data ?? json
        setProducts(Array.isArray(data) ? data : [])
      })
      .catch(err => {
        setCorsError(true)
        setErrorMsg(err.message || 'Network error')
      })
      .finally(() => setLoading(false))
  }, [fetchCount])

  const filtered = products.filter(p =>
    !search || p.name?.toLowerCase().includes(search.toLowerCase()) || p.description?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="pt-16 min-h-screen bg-[#F4F8F4]">
      <div className="bg-[#1C2A1E] text-white py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-[#6B9E3F] flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </div>
            <span className="text-xs font-semibold uppercase tracking-widest text-[#6B9E3F]">Cross-Origin Partner Integration</span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-semibold mb-2">Partner Juice Shop</h1>
          <p className="text-white/60 text-sm">
            Products fetched live from{' '}
            <a href={JUICE_SHOP_URL} target="_blank" rel="noopener noreferrer" className="text-[#6B9E3F] hover:underline font-mono text-xs">
              {JUICE_SHOP_URL}
            </a>
            {' '}via browser CORS request
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-12 h-12 rounded-full border-2 border-[#6B9E3F] border-t-transparent animate-spin" />
            <p className="text-sm text-[#5A7A5E]">Sending CORS request to partner…</p>
          </div>
        ) : corsError ? (
          <CorsErrorPanel error={errorMsg} onRetry={() => setFetchCount(n => n + 1)} />
        ) : (
          <>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
              <p className="text-sm text-[#5A7A5E]">{filtered.length} products loaded via CORS</p>
              <div className="relative w-full sm:w-72">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5A7A5E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search partner products…"
                  className="w-full pl-9 pr-4 py-2.5 rounded-full border border-[#DDE8DD] bg-white text-sm focus:outline-none focus:border-[#6B9E3F] transition-colors"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filtered.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
            {filtered.length === 0 && (
              <div className="text-center py-16 text-[#5A7A5E] text-sm">No products match your search.</div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
