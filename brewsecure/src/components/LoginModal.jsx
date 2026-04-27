import { useState, useEffect } from 'react'
import Spinner from './Spinner'
import { authApi } from '../services/api'
import { useAuth } from '../context/AuthContext'

export default function LoginModal({ open, initialTab, onClose, onSuccess }) {
  const { login } = useAuth()
  const [tab, setTab] = useState(initialTab || 'login')
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [errors, setErrors] = useState({})

  useEffect(() => { setTab(initialTab || 'login') }, [initialTab])
  useEffect(() => { if (!open) { setSuccess(false); setErrors({}) } }, [open])

  function validate() {
    const e = {}
    if (tab === 'register' && !form.name.trim()) e.name = 'Name is required'
    if (!form.email.includes('@')) e.email = 'Enter a valid email'
    if (form.password.length < 6) e.password = 'At least 6 characters'
    return e
  }

  async function handleSubmit(ev) {
    ev.preventDefault()
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }
    setLoading(true)
    try {
      const fn = tab === 'login' ? authApi.login : authApi.register
      const payload = { email: form.email, password: form.password }
      if (tab === 'register') payload.name = form.name
      const { data } = await fn(payload)
      if (data.token) login(data.token, data.user ?? null)
      setSuccess(true)
      onSuccess?.()
    } catch (err) {
      const msg = err?.response?.data?.message || err?.response?.data?.error
      setErrors({ submit: msg || 'Something went wrong. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#FAF7F2] rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-[#C4602A] via-[#D4784A] to-[#8B5E3C]" />
        <div className="px-8 pt-8 pb-8">
          {success ? (
            <div className="text-center py-6">
              <div className="w-16 h-16 rounded-full bg-[#2C5F2E]/10 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-[#2C5F2E]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              </div>
              <h2 className="font-display text-2xl font-semibold text-[#1C0F0A] mb-2">
                {tab === 'login' ? 'Welcome back!' : 'Account created!'}
              </h2>
              <p className="text-sm text-[#8B5E3C]">You're all set. Happy brewing.</p>
              <button onClick={() => { onClose(); onSuccess?.() }} className="mt-6 px-8 py-3 rounded-full bg-[#C4602A] text-white font-semibold text-sm hover:bg-[#A04E22] transition-colors">
                Continue
              </button>
            </div>
          ) : (
            <>
              <div className="flex gap-1 p-1 bg-[#F0EAE0] rounded-full mb-6">
                {['login', 'register'].map(t => (
                  <button key={t} onClick={() => { setTab(t); setErrors({}) }} className={`flex-1 py-2 rounded-full text-sm font-medium transition-all duration-200 ${tab === t ? 'bg-white shadow-sm text-[#1C0F0A]' : 'text-[#8B5E3C] hover:text-[#1C0F0A]'}`}>
                    {t === 'login' ? 'Sign In' : 'Register'}
                  </button>
                ))}
              </div>
              <h2 className="font-display text-2xl font-semibold text-[#1C0F0A] mb-1">
                {tab === 'login' ? 'Welcome back' : 'Create your account'}
              </h2>
              <p className="text-sm text-[#8B5E3C] mb-6">
                {tab === 'login' ? 'Sign in to your BrewSecure account.' : 'Join thousands of coffee lovers.'}
              </p>
              <form onSubmit={handleSubmit} className="space-y-4">
                {tab === 'register' && (
                  <div>
                    <input type="text" placeholder="Full name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className={`w-full px-4 py-3 rounded-2xl border text-sm bg-white outline-none focus:border-[#C4602A] transition-colors ${errors.name ? 'border-red-400' : 'border-[#E8DDD5]'}`} />
                    {errors.name && <p className="text-xs text-red-500 mt-1 ml-1">{errors.name}</p>}
                  </div>
                )}
                <div>
                  <input type="email" placeholder="Email address" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className={`w-full px-4 py-3 rounded-2xl border text-sm bg-white outline-none focus:border-[#C4602A] transition-colors ${errors.email ? 'border-red-400' : 'border-[#E8DDD5]'}`} />
                  {errors.email && <p className="text-xs text-red-500 mt-1 ml-1">{errors.email}</p>}
                </div>
                <div>
                  <input type="password" placeholder="Password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} className={`w-full px-4 py-3 rounded-2xl border text-sm bg-white outline-none focus:border-[#C4602A] transition-colors ${errors.password ? 'border-red-400' : 'border-[#E8DDD5]'}`} />
                  {errors.password && <p className="text-xs text-red-500 mt-1 ml-1">{errors.password}</p>}
                </div>
                {errors.submit && <p className="text-xs text-red-500 text-center">{errors.submit}</p>}
                <button type="submit" className="w-full py-3.5 rounded-full bg-[#C4602A] hover:bg-[#A04E22] text-white font-semibold text-sm transition-all duration-200 active:scale-95 flex items-center justify-center gap-2 mt-2">
                  {loading ? <Spinner /> : null}
                  {tab === 'login' ? 'Sign In' : 'Create Account'}
                </button>
              </form>
              <p className="text-xs text-center text-[#8B5E3C] mt-4">
                {tab === 'login' ? 'No account? ' : 'Already have one? '}
                <button onClick={() => setTab(tab === 'login' ? 'register' : 'login')} className="text-[#C4602A] hover:underline">
                  {tab === 'login' ? 'Register free' : 'Sign in'}
                </button>
              </p>
            </>
          )}
        </div>
        <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#F0EAE0] transition-colors text-[#8B5E3C]">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>
    </div>
  )
}
