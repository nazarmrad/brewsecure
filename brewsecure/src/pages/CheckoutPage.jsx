import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Spinner from '../components/Spinner'
import { useCart } from '../context/CartContext'
import { ordersApi } from '../services/api'

export default function CheckoutPage() {
  const navigate = useNavigate()
  const { cart, clearCart } = useCart()
  const [form, setForm] = useState({ name: '', address: '', city: '', zip: '', payment: 'stripe' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [order, setOrder] = useState(null)
  const [apiError, setApiError] = useState(null)

  const subtotal = cart.reduce((s, i) => s + i.product.price * i.qty, 0)
  const shipping = subtotal >= 50 ? 0 : 4.99
  const total = subtotal + shipping

  function validate() {
    const e = {}
    if (!form.name.trim()) e.name = 'Required'
    if (!form.address.trim()) e.address = 'Required'
    if (!form.city.trim()) e.city = 'Required'
    if (!/^\d{4,10}$/.test(form.zip.trim())) e.zip = 'Enter a valid postal code'
    return e
  }

  async function handleSubmit(ev) {
    ev.preventDefault()
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }
    setLoading(true)
    setApiError(null)
    try {
      const { data } = await ordersApi.create({
        items: cart.map(i => ({ productId: i.product.id, quantity: i.qty, size: i.size })),
        shippingAddress: { name: form.name, address: form.address, city: form.city, zip: form.zip },
        paymentMethod: form.payment,
      })
      setOrder(data)
      clearCart()
    } catch (err) {
      setApiError(err?.response?.data?.message || err?.message || 'Order failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function field(key, placeholder, type = 'text') {
    return (
      <div>
        <input
          type={type}
          placeholder={placeholder}
          value={form[key]}
          onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
          className={`w-full px-4 py-3 rounded-2xl border text-sm bg-white outline-none focus:border-[#C4602A] transition-colors ${errors[key] ? 'border-red-400' : 'border-[#E8DDD5]'}`}
        />
        {errors[key] && <p className="text-xs text-red-500 mt-1 ml-1">{errors[key]}</p>}
      </div>
    )
  }

  if (order) return (
    <div className="pt-24 min-h-screen flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center">
        <div className="w-20 h-20 rounded-full bg-[#2C5F2E]/10 flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-[#2C5F2E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="font-display text-4xl font-semibold text-[#1C0F0A] mb-2">Order placed!</h1>
        <p className="text-[#8B5E3C] mb-2">
          Order <span className="font-semibold text-[#1C0F0A]">{order.orderId}</span>
        </p>
        <p className="text-sm text-[#8B5E3C] mb-8">Estimated delivery: {order.eta ?? '2–4 business days'}</p>
        <button
          onClick={() => navigate('/shop')}
          className="px-8 py-3.5 rounded-full bg-[#C4602A] text-white font-semibold text-sm hover:bg-[#A04E22] transition-colors"
        >
          Keep shopping
        </button>
      </div>
    </div>
  )

  return (
    <div className="pt-16 min-h-screen">
      <div className="bg-[#F0EAE0] border-b border-[#E8DDD5] px-6 py-10">
        <div className="max-w-4xl mx-auto">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-[#8B5E3C] hover:text-[#C4602A] transition-colors mb-4">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            Back
          </button>
          <h1 className="font-display text-4xl font-semibold text-[#1C0F0A]">Checkout</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[#8B5E3C] mb-4">Shipping Address</p>
            <div className="space-y-3">
              {field('name', 'Full name')}
              {field('address', 'Street address')}
              <div className="grid grid-cols-2 gap-3">
                {field('city', 'City')}
                {field('zip', 'Postal code')}
              </div>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[#8B5E3C] mb-4">Payment Method</p>
            <div className="space-y-2">
              {[{ id: 'stripe', label: 'Credit / Debit Card (Stripe)' }, { id: 'paypal', label: 'PayPal' }].map(opt => (
                <label key={opt.id} className={`flex items-center gap-3 px-4 py-3 rounded-2xl border cursor-pointer transition-all ${form.payment === opt.id ? 'border-[#C4602A] bg-[#C4602A]/5' : 'border-[#E8DDD5] bg-white hover:border-[#C4602A]/50'}`}>
                  <input type="radio" name="payment" value={opt.id} checked={form.payment === opt.id} onChange={e => setForm(f => ({ ...f, payment: e.target.value }))} className="accent-[#C4602A]" />
                  <span className="text-sm text-[#1C0F0A] font-medium">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          {apiError && (
            <p className="text-sm text-red-500 bg-red-50 rounded-2xl px-4 py-3">{apiError}</p>
          )}

          <button
            type="submit"
            disabled={loading || cart.length === 0}
            className="w-full py-4 rounded-full bg-[#C4602A] hover:bg-[#A04E22] disabled:opacity-50 text-white font-semibold text-base transition-all duration-200 active:scale-95 flex items-center justify-center gap-2 shadow-md"
          >
            {loading ? <Spinner /> : null}
            Place Order — ${total.toFixed(2)}
          </button>
        </form>

        {/* Order summary */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[#8B5E3C] mb-4">Order Summary</p>
          <div className="space-y-3">
            {cart.map((item, idx) => (
              <div key={idx} className="flex gap-3 p-3 bg-white rounded-2xl border border-[#E8DDD5]">
                <img src={item.product.imageUrl} alt={item.product.name} className="w-14 h-14 object-cover rounded-xl flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#1C0F0A] truncate">{item.product.name}</p>
                  <p className="text-xs text-[#8B5E3C]">{item.size} · qty {item.qty}</p>
                </div>
                <p className="text-sm font-semibold text-[#1C0F0A] whitespace-nowrap">${(item.product.price * item.qty).toFixed(2)}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 space-y-2 border-t border-[#E8DDD5] pt-4">
            <div className="flex justify-between text-sm text-[#8B5E3C]"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
            <div className="flex justify-between text-sm text-[#8B5E3C]">
              <span>Shipping</span>
              <span>{shipping === 0 ? <span className="text-[#2C5F2E] font-medium">Free</span> : `$${shipping.toFixed(2)}`}</span>
            </div>
            <div className="flex justify-between font-semibold text-[#1C0F0A] text-base pt-2 border-t border-[#E8DDD5]">
              <span>Total</span><span>${total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
