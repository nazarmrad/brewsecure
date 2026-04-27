import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import ProductCard from '../components/ProductCard'
import Stars from '../components/Stars'
import ErrorBanner from '../components/ErrorBanner'
import { productsApi } from '../services/api'

export default function HomePage() {
  const navigate = useNavigate()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchFeatured = useCallback(() => {
    setLoading(true)
    setError(null)
    productsApi.list({ limit: 3 })
      .then(({ data }) => setProducts(data.products ?? data))
      .catch(err => setError(err?.response?.data?.message || err?.message || 'Failed to load products'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { fetchFeatured() }, [fetchFeatured])

  return (
    <div className="pt-16">
      {/* Hero */}
      <section className="hero-grain relative min-h-[85vh] flex items-center overflow-hidden bg-[#2C1810]">
        <img src="https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1600&q=80" alt="Coffee hero" className="absolute inset-0 w-full h-full object-cover opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#2C1810]/20 via-transparent to-[#2C1810]/60" />
        <div className="relative z-10 max-w-7xl mx-auto px-6 py-24">
          <div className="max-w-xl">
            <p className="text-[#D4A574] text-sm font-semibold uppercase tracking-[0.2em] mb-4">Specialty Coffee Roasters</p>
            <h1 className="font-display text-6xl md:text-7xl font-semibold text-white leading-[1.05] mb-6">
              Coffee worth<br /><em>waking up for.</em>
            </h1>
            <p className="text-white/70 text-lg leading-relaxed mb-8 font-light">
              Single-origin beans, sourced ethically, roasted with obsession. From the farm to your cup — nothing in between.
            </p>
            <div className="flex flex-wrap gap-3">
              <button onClick={() => navigate('/shop')} className="px-8 py-4 rounded-full bg-[#C4602A] hover:bg-[#D4784A] text-white font-semibold text-sm transition-all duration-200 shadow-lg hover:shadow-xl active:scale-95">
                Shop Our Roasts →
              </button>
              <button className="px-8 py-4 rounded-full border border-white/30 text-white font-medium text-sm hover:bg-white/10 transition-all duration-200">
                Our Story
              </button>
            </div>
          </div>
        </div>
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/40">
          <div className="w-px h-10 bg-white/30 animate-pulse" />
        </div>
      </section>

      {/* Trust bar */}
      <section className="bg-[#F0EAE0] border-y border-[#E8DDD5]">
        <div className="max-w-7xl mx-auto px-6 py-5 flex flex-wrap justify-center gap-8 md:gap-16">
          {[
            { icon: '🌱', label: 'Ethically sourced' },
            { icon: '☕', label: 'Freshly roasted' },
            { icon: '📦', label: 'Free shipping over $50' },
            { icon: '♻️', label: 'Compostable packaging' },
          ].map(item => (
            <div key={item.label} className="flex items-center gap-2 text-sm font-medium text-[#3D2314]">
              <span>{item.icon}</span>{item.label}
            </div>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-[#C4602A] text-xs font-semibold uppercase tracking-[0.2em] mb-2">Current Favorites</p>
            <h2 className="font-display text-4xl font-semibold text-[#1C0F0A]">Featured Roasts</h2>
          </div>
          <button onClick={() => navigate('/shop')} className="hidden md:block text-sm font-medium text-[#C4602A] hover:underline">View all →</button>
        </div>
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-10 h-10 rounded-full border-2 border-[#C4602A] border-t-transparent animate-spin" />
          </div>
        ) : error ? (
          <ErrorBanner message={error} onRetry={fetchFeatured} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
        <div className="text-center mt-8 md:hidden">
          <button onClick={() => navigate('/shop')} className="text-sm font-medium text-[#C4602A] hover:underline">View all roasts →</button>
        </div>
      </section>

      {/* Why BrewSecure */}
      <section className="bg-[#2C1810] text-white py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <p className="text-[#D4A574] text-xs font-semibold uppercase tracking-[0.2em] mb-3">Why We're Different</p>
            <h2 className="font-display text-4xl md:text-5xl font-semibold">Why BrewSecure?</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: 'Direct Trade',
                body: "We work directly with farmers in Ethiopia, Colombia, Guatemala, and beyond. No middlemen. Better prices for growers, better coffee for you.",
                icon: <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" /></svg>,
              },
              {
                title: 'Small-Batch Roasting',
                body: "Every batch is roasted to order in 5kg batches. Your coffee ships within 24 hours of roasting — never stale, always vibrant.",
                icon: <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0" /></svg>,
              },
              {
                title: 'Cupped, Not Guessed',
                body: "Every lot is professionally cupped and scored before it makes the cut. If it doesn't hit 84+ on the SCA scale, it doesn't ship.",
                icon: <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
              },
            ].map(item => (
              <div key={item.title} className="p-8 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/[0.08] transition-colors">
                <div className="w-12 h-12 rounded-2xl bg-[#C4602A]/20 flex items-center justify-center mb-5 text-[#D4A574]">
                  {item.icon}
                </div>
                <h3 className="font-display text-xl font-semibold mb-3">{item.title}</h3>
                <p className="text-white/60 text-sm leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="max-w-7xl mx-auto px-6 py-20 text-center">
        <p className="text-[#C4602A] text-xs font-semibold uppercase tracking-[0.2em] mb-3">Happy Brewers</p>
        <h2 className="font-display text-3xl font-semibold text-[#1C0F0A] mb-10">What our customers say</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { name: 'Sarah K.', quote: "The Ethiopia Yirgacheffe changed how I think about coffee. I'll never go back to supermarket beans.", rating: 5 },
            { name: 'Marcus T.', quote: "Incredibly fast shipping and the coffee is always impeccably fresh. BrewSecure is the real deal.", rating: 5 },
            { name: 'Lena R.', quote: "The House Blend is my daily driver. Smooth, complex, and perfect through my Chemex every single morning.", rating: 5 },
          ].map(t => (
            <div key={t.name} className="p-6 rounded-3xl bg-white border border-[#E8DDD5] text-left shadow-sm">
              <Stars rating={t.rating} />
              <p className="text-sm text-[#3D2314] leading-relaxed mt-3 mb-4 font-light italic">"{t.quote}"</p>
              <p className="text-xs font-semibold text-[#8B5E3C]">— {t.name}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-6 mb-16 rounded-3xl overflow-hidden relative bg-[#C4602A]">
        <div className="px-8 py-14 md:py-16 text-center relative z-10">
          <h2 className="font-display text-4xl md:text-5xl font-semibold text-white mb-4">Ready to upgrade your morning?</h2>
          <p className="text-white/80 text-base mb-8 max-w-md mx-auto">Join 12,000+ coffee lovers who get fresh-roasted beans delivered to their door.</p>
          <button onClick={() => navigate('/shop')} className="px-8 py-4 rounded-full bg-white text-[#C4602A] font-semibold text-sm hover:bg-[#FAF7F2] transition-colors shadow-md active:scale-95">
            Browse all roasts →
          </button>
        </div>
      </section>
    </div>
  )
}
