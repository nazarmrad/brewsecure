import { createContext, useContext, useState, useEffect } from 'react'

const CartContext = createContext(null)

export function CartProvider({ children }) {
  const [cart, setCart] = useState(() => {
    try { return JSON.parse(localStorage.getItem('bs_cart') || '[]') } catch { return [] }
  })
  const [cartOpen, setCartOpen] = useState(false)

  useEffect(() => {
    localStorage.setItem('bs_cart', JSON.stringify(cart))
  }, [cart])

  function addToCart(product, qty = 1, size = product.sizes?.[1] || product.sizes?.[0] || '250g') {
    setCart(prev => {
      const idx = prev.findIndex(i => i.product.id === product.id && i.size === size)
      if (idx > -1) {
        const updated = [...prev]
        updated[idx] = { ...updated[idx], qty: updated[idx].qty + qty }
        return updated
      }
      return [...prev, { product, qty, size }]
    })
    setCartOpen(true)
  }

  function removeFromCart(idx) {
    setCart(prev => prev.filter((_, i) => i !== idx))
  }

  function changeQty(idx, newQty) {
    if (newQty < 1) { removeFromCart(idx); return }
    setCart(prev => {
      const updated = [...prev]
      updated[idx] = { ...updated[idx], qty: newQty }
      return updated
    })
  }

  function clearCart() {
    setCart([])
    setCartOpen(false)
  }

  const cartCount = cart.reduce((s, i) => s + i.qty, 0)

  return (
    <CartContext.Provider value={{ cart, cartOpen, setCartOpen, addToCart, removeFromCart, changeQty, clearCart, cartCount }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  return useContext(CartContext)
}
