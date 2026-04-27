import { useState } from 'react'
import Spinner from './Spinner'

export default function AddToBasketBtn({ product, onAdd, small }) {
  const [loading, setLoading] = useState(false)
  const [added, setAdded] = useState(false)

  function handleClick(e) {
    e.stopPropagation()
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      setAdded(true)
      onAdd(product)
      setTimeout(() => setAdded(false), 1800)
    }, 600)
  }

  const base = small
    ? 'flex items-center justify-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 select-none'
    : 'flex items-center justify-center gap-2 px-6 py-3 rounded-full text-sm font-semibold transition-all duration-200 select-none'

  if (added) return (
    <button className={`${base} bg-[#2C5F2E] text-white`}>
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
      Added!
    </button>
  )

  return (
    <button onClick={handleClick} className={`${base} bg-[#C4602A] hover:bg-[#A04E22] active:scale-95 text-white shadow-sm hover:shadow-md`}>
      {loading ? <Spinner /> : (
        <>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
          Add to Basket
        </>
      )}
    </button>
  )
}
