import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Badge from './Badge'
import Stars from './Stars'
import AddToBasketBtn from './AddToBasketBtn'
import { useCart } from '../context/CartContext'

export default function ProductCard({ product }) {
  const [imgLoaded, setImgLoaded] = useState(false)
  const navigate = useNavigate()
  const { addToCart } = useCart()

  return (
    <div
      onClick={() => navigate(`/shop/${product.id}`, { state: { product } })}
      className="group bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col hover:-translate-y-1"
    >
      <div className="relative aspect-[4/3] bg-[#F0EAE0] overflow-hidden">
        {product.badge && <Badge label={product.badge} />}
        <img
          src={product.imageUrl}
          alt={product.name}
          onLoad={() => setImgLoaded(true)}
          className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-105 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
        />
        {!imgLoaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 rounded-full border-2 border-[#C4602A] border-t-transparent animate-spin" />
          </div>
        )}
        <div className="absolute bottom-3 right-3 text-[10px] font-semibold uppercase tracking-widest px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-sm text-white">
          {product.category}
        </div>
      </div>
      <div className="flex flex-col flex-1 p-5">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-display text-lg font-semibold text-[#1C0F0A] leading-tight">{product.name}</h3>
          <span className="font-semibold text-[#1C0F0A] text-sm whitespace-nowrap mt-0.5">${product.price.toFixed(2)}</span>
        </div>
        <p className="text-xs text-[#8B5E3C] mb-2">{product.origin} · {product.region}</p>
        <div className="flex items-center gap-1.5 mb-3">
          <Stars rating={product.rating} />
          <span className="text-xs text-[#8B5E3C]">({product.reviews})</span>
        </div>
        <div className="flex flex-wrap gap-1.5 mb-4">
          {(typeof product.notes === 'string' ? product.notes.split(',') : product.notes ?? []).map(n => (
            <span key={n} className="text-[10px] px-2.5 py-0.5 rounded-full bg-[#FAF7F2] border border-[#E8DDD5] text-[#8B5E3C]">{n}</span>
          ))}
        </div>
        <div className="mt-auto">
          <AddToBasketBtn product={product} onAdd={addToCart} small />
        </div>
      </div>
    </div>
  )
}
