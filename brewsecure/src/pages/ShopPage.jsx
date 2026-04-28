import { useState, useEffect, useCallback } from 'react'
import ProductCard from '../components/ProductCard'
import ErrorBanner from '../components/ErrorBanner'
import { productsApi } from '../services/api'

export default function ShopPage() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeRoasts, setActiveRoasts] = useState([])
  const [sort, setSort] = useState('featured')
  const [search, setSearch] = useState('')

  const fetchProducts = useCallback(() => {
    setLoading(true)
    setError(null)
    productsApi.list()
      .then(({ data }) => setProducts(data.products ?? data))
      .catch(err => setError(err?.response?.data?.message || err?.message || 'Failed to load products'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { fetchProducts() }, [fetchProducts])

  const roastTypes = ['Light', 'Medium', 'Dark', 'Blends']
  const toggleRoast = r => setActiveRoasts(prev => prev.includes(r) ? prev.filter(x => x !== r) : [...prev, r])

  const filtered = products
    .filter(p => activeRoasts.length === 0 || activeRoasts.includes(p.category))
    .filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.origin.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sort === 'price-asc') return a.price - b.price
      if (sort === 'price-desc') return b.price - a.price
      if (sort === 'rating') return b.rating - a.rating
      return 0
    })

  return (
    <div className="pt-16 min-h-screen">
      <div className="bg-[#F0EAE0] border-b border-[#E8DDD5] px-6 py-12">
        <div className="max-w-7xl mx-auto">
          <p className="text-[#C4602A] text-xs font-semibold uppercase tracking-[0.2em] mb-2">Our Collection</p>
          <h1 className="font-display text-5xl font-semibold text-[#1C0F0A]">Shop All Roasts</h1>
          <p className="text-[#8B5E3C] mt-2 text-sm">
            {filtered.length} of {products.length} coffees
            {activeRoasts.length > 0 && ` · Filtered: ${activeRoasts.join(', ')}`}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10 flex gap-8">
        <aside className="hidden lg:block w-52 flex-shrink-0 space-y-8">
          <div>
            <label className="text-xs font-semibold uppercase tracking-widest text-[#8B5E3C] block mb-3">Search</label>
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8B5E3C]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <input type="text" placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-9 pr-3 py-2.5 text-sm rounded-2xl border border-[#E8DDD5] bg-white focus:outline-none focus:border-[#C4602A] transition-colors" />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-widest text-[#8B5E3C] block mb-3">Roast Level</label>
            <div className="space-y-2">
              {roastTypes.map(r => (
                <button key={r} onClick={() => toggleRoast(r)} className={`w-full flex items-center justify-between px-4 py-2.5 rounded-2xl text-sm transition-all duration-150 ${activeRoasts.includes(r) ? 'bg-[#C4602A] text-white' : 'bg-white border border-[#E8DDD5] text-[#3D2314] hover:border-[#C4602A]'}`}>
                  <span>{r}</span>
                  <span className="text-xs opacity-60">{products.filter(p => p.category === r).length}</span>
                </button>
              ))}
              {activeRoasts.length > 0 && (
                <button onClick={() => setActiveRoasts([])} className="text-xs text-[#C4602A] hover:underline mt-1">Clear filters</button>
              )}
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-[#F0EAE0] border border-[#E8DDD5]">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#8B5E3C] mb-1">Price Range</p>
            <p className="text-sm text-[#3D2314] font-medium">$15 – $21 / 250g</p>
            <p className="text-xs text-[#8B5E3C] mt-1">Free shipping over $50</p>
          </div>
        </aside>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-6 gap-4">
            <div className="flex gap-2 overflow-x-auto lg:hidden pb-1">
              {roastTypes.map(r => (
                <button key={r} onClick={() => toggleRoast(r)} className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-medium transition-all ${activeRoasts.includes(r) ? 'bg-[#C4602A] text-white' : 'bg-white border border-[#E8DDD5] text-[#3D2314]'}`}>
                  {r}
                </button>
              ))}
            </div>
            <select value={sort} onChange={e => setSort(e.target.value)} className="ml-auto text-sm border border-[#E8DDD5] rounded-2xl px-4 py-2 bg-white focus:outline-none focus:border-[#C4602A] text-[#3D2314] cursor-pointer">
              <option value="featured">Featured</option>
              <option value="rating">Top Rated</option>
              <option value="price-asc">Price: Low → High</option>
              <option value="price-desc">Price: High → Low</option>
            </select>
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <div className="w-10 h-10 rounded-full border-2 border-[#C4602A] border-t-transparent animate-spin" />
            </div>
          ) : error ? (
            <ErrorBanner message={error} onRetry={fetchProducts} />
          ) : filtered.length === 0 ? (
            <div className="text-center py-20">
              <p className="font-display text-2xl text-[#3D2314] mb-2">No coffees found</p>
              <p className="text-sm text-[#8B5E3C]">Try adjusting your filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {filtered.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
