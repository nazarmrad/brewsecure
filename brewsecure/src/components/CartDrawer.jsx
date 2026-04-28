import { useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'

export default function CartDrawer() {
  const { cart, cartOpen, setCartOpen, removeFromCart, changeQty } = useCart()
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()

  function handleCheckout() {
    setCartOpen(false)
    if (isAuthenticated) {
      navigate('/checkout')
    } else {
      navigate('/', { state: { openLogin: true, returnTo: '/checkout' } })
    }
  }
  const subtotal = cart.reduce((s, i) => s + i.product.price * i.qty, 0)
  const shipping = subtotal >= 50 ? 0 : 4.99

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/40 z-[60] transition-opacity duration-300 ${cartOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setCartOpen(false)}
      />
      <div className={`fixed top-0 right-0 h-full w-full max-w-md bg-[#FAF7F2] z-[70] flex flex-col shadow-2xl transition-transform duration-300 ease-out ${cartOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#E8DDD5]">
          <div>
            <h2 className="font-display text-2xl font-semibold text-[#1C0F0A]">Your Basket</h2>
            <p className="text-sm text-[#8B5E3C] mt-0.5">{cart.length === 0 ? 'Nothing here yet' : `${cart.length} item${cart.length > 1 ? 's' : ''}`}</p>
          </div>
          <button onClick={() => setCartOpen(false)} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-[#F0EAE0] transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {cart.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center gap-4 py-16">
              <div className="w-16 h-16 rounded-full bg-[#F0EAE0] flex items-center justify-center">
                <svg className="w-8 h-8 text-[#C4602A]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
              </div>
              <p className="font-display text-xl text-[#3D2314]">Your basket is empty</p>
              <p className="text-sm text-[#8B5E3C]">Find something you'll love in the shop.</p>
            </div>
          )}
          {cart.map((item, idx) => (
            <div key={idx} className="flex gap-4 p-4 bg-white rounded-2xl shadow-sm">
              <img src={item.product.imageUrl} alt={item.product.name} className="w-16 h-16 object-cover rounded-xl flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-[#1C0F0A] truncate">{item.product.name}</p>
                <p className="text-xs text-[#8B5E3C] mt-0.5">{item.size}</p>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-2">
                    <button onClick={() => changeQty(idx, item.qty - 1)} className="w-6 h-6 rounded-full border border-[#E8DDD5] flex items-center justify-center text-sm hover:border-[#C4602A] transition-colors">−</button>
                    <span className="text-sm font-medium w-4 text-center">{item.qty}</span>
                    <button onClick={() => changeQty(idx, item.qty + 1)} className="w-6 h-6 rounded-full border border-[#E8DDD5] flex items-center justify-center text-sm hover:border-[#C4602A] transition-colors">+</button>
                  </div>
                  <p className="font-semibold text-sm text-[#1C0F0A]">${(item.product.price * item.qty).toFixed(2)}</p>
                </div>
              </div>
              <button onClick={() => removeFromCart(idx)} className="self-start p-1 text-gray-300 hover:text-[#C4602A] transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          ))}
        </div>

        {cart.length > 0 && (
          <div className="px-6 py-5 border-t border-[#E8DDD5] space-y-3">
            <div className="flex justify-between text-sm text-[#8B5E3C]">
              <span>Subtotal</span><span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-[#8B5E3C]">
              <span>Shipping</span>
              <span>{shipping === 0 ? <span className="text-[#2C5F2E] font-medium">Free</span> : `$${shipping.toFixed(2)}`}</span>
            </div>
            {shipping > 0 && (
              <p className="text-xs text-[#8B5E3C] bg-[#F0EAE0] rounded-xl px-3 py-2">
                Add ${(50 - subtotal).toFixed(2)} more for free shipping 🚀
              </p>
            )}
            <div className="flex justify-between font-semibold text-[#1C0F0A] text-base pt-1">
              <span>Total</span><span>${(subtotal + shipping).toFixed(2)}</span>
            </div>
            <button onClick={handleCheckout} className="w-full py-3.5 rounded-full bg-[#C4602A] hover:bg-[#A04E22] text-white font-semibold text-sm transition-all duration-200 active:scale-95 shadow-md mt-2">
              {isAuthenticated ? 'Checkout →' : 'Sign in to Checkout →'}
            </button>
          </div>
        )}
      </div>
    </>
  )
}
