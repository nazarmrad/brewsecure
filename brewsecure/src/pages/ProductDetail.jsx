import { useState, useEffect } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import Badge from '../components/Badge'
import Stars from '../components/Stars'
import RoastBar from '../components/RoastBar'
import Spinner from '../components/Spinner'
import ProductCard from '../components/ProductCard'
import { useCart } from '../context/CartContext'
import { productsApi } from '../services/api'

export default function ProductDetail() {
  const { id } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const { addToCart } = useCart()

  const [product, setProduct] = useState(location.state?.product ?? null)
  const [allProducts, setAllProducts] = useState([])
  const [selectedSize, setSelectedSize] = useState(null)
  const [qty, setQty] = useState(1)
  const [imgLoaded, setImgLoaded] = useState(false)
  const [addedMain, setAddedMain] = useState(false)
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(!location.state?.product)
  const [fetchError, setFetchError] = useState(null)

  useEffect(() => {
    if (!location.state?.product) {
      setFetching(true)
      setFetchError(null)
      productsApi.get(id)
        .then(({ data }) => setProduct(data))
        .catch(err => setFetchError(err?.response?.data?.message || err?.message || 'Product not found'))
        .finally(() => setFetching(false))
    }
    productsApi.list()
      .then(({ data }) => setAllProducts(data.products ?? data))
      .catch(() => {})
  }, [id])

  useEffect(() => {
    if (product) {
      setSelectedSize('500g')
      setQty(1)
      setImgLoaded(false)
      setAddedMain(false)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [product?.id])

  if (fetching) return (
    <div className="pt-32 flex justify-center">
      <div className="w-10 h-10 rounded-full border-2 border-[#C4602A] border-t-transparent animate-spin" />
    </div>
  )

  if (fetchError) return (
    <div className="pt-24 max-w-7xl mx-auto px-6 flex flex-col items-center gap-4 text-center">
      <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center">
        <svg className="w-7 h-7 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        </svg>
      </div>
      <p className="font-display text-2xl text-[#1C0F0A]">Product not found</p>
      <p className="text-sm text-[#8B5E3C]">{fetchError}</p>
      <button onClick={() => navigate('/shop')} className="px-6 py-2.5 rounded-full bg-[#C4602A] text-white text-sm font-medium hover:bg-[#A04E22] transition-colors">
        Back to shop
      </button>
    </div>
  )

  if (!product) return null

  const priceMultiplier = { '250g': 1, '500g': 1.8, '1kg': 3.2 }
  const finalPrice = (product.price * (priceMultiplier[selectedSize] || 1)).toFixed(2)

  function handleAdd() {
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      setAddedMain(true)
      addToCart({ ...product, displaySize: selectedSize, displayPrice: parseFloat(finalPrice) }, qty, selectedSize)
      setTimeout(() => setAddedMain(false), 2000)
    }, 700)
  }

  const related = allProducts.filter(p => p.id !== product.id && (p.category === product.category || p.origin === product.origin)).slice(0, 3)

  return (
    <div className="pt-16 min-h-screen">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-2 text-sm text-[#8B5E3C]">
        <button onClick={() => navigate('/shop')} className="hover:text-[#C4602A] transition-colors flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Shop
        </button>
        <span>/</span>
        <span className="text-[#1C0F0A] font-medium truncate">{product.name}</span>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
          <div className="relative">
            <div className="aspect-square rounded-3xl overflow-hidden bg-[#F0EAE0] lg:sticky lg:top-24">
              {product.badge && <Badge label={product.badge} />}
              <img src={product.imageUrl} alt={product.name} onLoad={() => setImgLoaded(true)} onError={() => setImgLoaded(true)} className={`w-full h-full object-cover transition-opacity duration-500 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`} />
              {!imgLoaded && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-10 h-10 rounded-full border-2 border-[#C4602A] border-t-transparent animate-spin" />
                </div>
              )}
            </div>
          </div>

          <div className="py-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-semibold uppercase tracking-widest text-[#C4602A] bg-[#C4602A]/10 px-3 py-1 rounded-full">{product.category} Roast</span>
              <span className="text-xs text-[#8B5E3C]">{product.process}</span>
            </div>
            <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-semibold text-[#1C0F0A] mb-2 leading-tight">{product.name}</h1>
            <p className="text-[#8B5E3C] mb-4">{product.origin} · {product.region} · {product.altitude}</p>
            <div className="flex items-center gap-2 mb-6">
              <Stars rating={product.rating} />
              <span className="text-sm font-semibold text-[#1C0F0A]">{product.rating}</span>
              <span className="text-sm text-[#8B5E3C]">({product.reviews} reviews)</span>
            </div>
            <div className="flex items-baseline gap-2 mb-6">
              <span className="font-display text-4xl font-semibold text-[#1C0F0A]">${finalPrice}</span>
              <span className="text-[#8B5E3C] text-sm">/ {selectedSize}</span>
            </div>
            <div className="mb-6">
              <p className="text-xs font-semibold uppercase tracking-widest text-[#8B5E3C] mb-2">Tasting Notes</p>
              <div className="flex flex-wrap gap-2">
                {(typeof product.notes === 'string' ? product.notes.split(',') : product.notes ?? []).map(n => (
                  <span key={n} className="px-4 py-1.5 rounded-full bg-[#FAF7F2] border border-[#E8DDD5] text-sm text-[#3D2314] font-medium">{n.trim()}</span>
                ))}
              </div>
            </div>
            <div className="mb-6">
              <p className="text-xs font-semibold uppercase tracking-widest text-[#8B5E3C] mb-3">Roast Level</p>
              <RoastBar level={product.roastLevel} />
            </div>
            <p className="text-[#3D2314] text-sm leading-relaxed mb-8">{product.description}</p>
            <div className="mb-5">
              <p className="text-xs font-semibold uppercase tracking-widest text-[#8B5E3C] mb-3">Size</p>
              <div className="flex gap-2 flex-wrap">
                {['250g', '500g', '1kg'].map(s => (
                  <button key={s} onClick={() => setSelectedSize(s)} className={`px-5 py-2.5 rounded-2xl text-sm font-medium border transition-all duration-150 ${selectedSize === s ? 'bg-[#1C0F0A] text-white border-[#1C0F0A]' : 'bg-white border-[#E8DDD5] text-[#3D2314] hover:border-[#C4602A]'}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div className="mb-7">
              <p className="text-xs font-semibold uppercase tracking-widest text-[#8B5E3C] mb-3">Quantity</p>
              <div className="flex items-center gap-3">
                <button onClick={() => setQty(q => Math.max(1, q - 1))} className="w-10 h-10 rounded-full border border-[#E8DDD5] flex items-center justify-center text-lg hover:border-[#C4602A] transition-colors">−</button>
                <span className="w-8 text-center font-semibold text-[#1C0F0A]">{qty}</span>
                <button onClick={() => setQty(q => q + 1)} className="w-10 h-10 rounded-full border border-[#E8DDD5] flex items-center justify-center text-lg hover:border-[#C4602A] transition-colors">+</button>
              </div>
            </div>
            <button onClick={handleAdd} className={`w-full py-4 rounded-full font-semibold text-base transition-all duration-200 active:scale-95 flex items-center justify-center gap-2 shadow-md ${addedMain ? 'bg-[#2C5F2E] text-white' : 'bg-[#C4602A] hover:bg-[#A04E22] text-white hover:shadow-lg'}`}>
              {loading ? <Spinner /> : addedMain ? (
                <><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>Added to basket!</>
              ) : (
                <><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>Add {qty > 1 ? `${qty}×` : ''} to Basket — ${(parseFloat(finalPrice) * qty).toFixed(2)}</>
              )}
            </button>
            <div className="mt-8 grid grid-cols-2 gap-4">
              {[
                { label: 'Process', value: product.process },
                { label: 'Altitude', value: product.altitude },
                { label: 'Origin', value: product.origin },
                { label: 'Region', value: product.region },
              ].map(m => (
                <div key={m.label} className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E8DDD5]">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-[#8B5E3C] mb-1">{m.label}</p>
                  <p className="text-sm font-medium text-[#1C0F0A]">{m.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {related.length > 0 && (
          <div className="mt-20">
            <h2 className="font-display text-3xl font-semibold text-[#1C0F0A] mb-8">You might also like</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {related.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
