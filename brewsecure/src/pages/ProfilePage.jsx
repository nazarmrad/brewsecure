import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { usersApi, ordersApi } from '../services/api'

const TABS = ['Profile', 'Orders']

const STATUS_STYLE = {
  confirmed: 'bg-blue-50 text-blue-700',
  shipped:   'bg-amber-50 text-amber-700',
  delivered: 'bg-green-50 text-green-700',
  cancelled: 'bg-red-50 text-red-500',
}

export default function ProfilePage() {
  const { user, login, logout } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState('Profile')

  // Profile state
  const [profile, setProfile] = useState(null)
  const [form, setForm] = useState({ name: '', email: '' })
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState(null)
  const [profileError, setProfileError] = useState(null)

  // Orders state
  const [orders, setOrders] = useState([])
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [ordersError, setOrdersError] = useState(null)
  const [expandedOrder, setExpandedOrder] = useState(null)

  useEffect(() => {
    usersApi.me()
      .then(({ data }) => {
        setProfile(data)
        setForm({ name: data.name, email: data.email })
      })
      .catch(() => setProfileError('Could not load profile'))
  }, [])

  useEffect(() => {
    if (tab !== 'Orders') return
    setOrdersLoading(true)
    ordersApi.list()
      .then(({ data }) => setOrders(data))
      .catch(() => setOrdersError('Could not load orders'))
      .finally(() => setOrdersLoading(false))
  }, [tab])

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    setSaveMsg(null)
    try {
      const { data } = await usersApi.update(form)
      setProfile(data)
      login(localStorage.getItem('bs_token'), data)
      setSaveMsg('Saved')
      setTimeout(() => setSaveMsg(null), 2500)
    } catch {
      setSaveMsg('error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="pt-16 min-h-screen">
      {/* Header bar */}
      <div className="bg-[#F0EAE0] border-b border-[#E8DDD5] px-4 sm:px-6 py-10">
        <div className="max-w-3xl mx-auto flex items-center gap-5">
          <div className="w-14 h-14 rounded-full bg-[#C4602A] flex items-center justify-center flex-shrink-0">
            <span className="text-white font-display text-xl font-semibold">
              {(profile?.name ?? user?.name ?? '?')[0].toUpperCase()}
            </span>
          </div>
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-semibold text-[#1C0F0A]">
              {profile?.name ?? user?.name ?? 'My Account'}
            </h1>
            <p className="text-sm text-[#8B5E3C] mt-0.5">{profile?.email ?? user?.email}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-[#E8DDD5] bg-white px-4 sm:px-6">
        <div className="max-w-3xl mx-auto flex gap-6">
          {TABS.map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`py-3.5 text-sm font-medium border-b-2 transition-colors ${tab === t ? 'border-[#C4602A] text-[#C4602A]' : 'border-transparent text-[#8B5E3C] hover:text-[#1C0F0A]'}`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">

        {/* ── Profile Tab ─────────────────────────────────────────── */}
        {tab === 'Profile' && (
          <div className="space-y-6">
            {profileError ? (
              <p className="text-sm text-red-500">{profileError}</p>
            ) : (
              <form onSubmit={handleSave} className="bg-white rounded-3xl border border-[#E8DDD5] p-6 space-y-5">
                <p className="text-xs font-semibold uppercase tracking-widest text-[#8B5E3C]">Account Details</p>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-[#8B5E3C] block mb-1.5">Full Name</label>
                    <input
                      value={form.name}
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      className="w-full px-4 py-3 rounded-2xl border border-[#E8DDD5] text-sm bg-white outline-none focus:border-[#C4602A] transition-colors text-[#1C0F0A]"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-[#8B5E3C] block mb-1.5">Email</label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                      className="w-full px-4 py-3 rounded-2xl border border-[#E8DDD5] text-sm bg-white outline-none focus:border-[#C4602A] transition-colors text-[#1C0F0A]"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-1">
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-2.5 rounded-full bg-[#C4602A] hover:bg-[#A04E22] disabled:opacity-50 text-white text-sm font-semibold transition-colors"
                  >
                    {saving ? 'Saving…' : 'Save Changes'}
                  </button>
                  {saveMsg === 'Saved' && (
                    <span className="text-sm text-[#2C5F2E] font-medium flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                      Saved
                    </span>
                  )}
                  {saveMsg === 'error' && <span className="text-sm text-red-500">Failed to save</span>}
                </div>
              </form>
            )}

            {/* Account info */}
            {profile && (
              <div className="bg-white rounded-3xl border border-[#E8DDD5] p-6 space-y-3">
                <p className="text-xs font-semibold uppercase tracking-widest text-[#8B5E3C]">Account Info</p>
                <div className="flex justify-between text-sm">
                  <span className="text-[#8B5E3C]">Member since</span>
                  <span className="font-medium text-[#1C0F0A]">
                    {new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#8B5E3C]">Account type</span>
                  <span className={`font-medium ${profile.isAdmin ? 'text-[#C4602A]' : 'text-[#1C0F0A]'}`}>
                    {profile.isAdmin ? 'Administrator' : 'Customer'}
                  </span>
                </div>
              </div>
            )}

            {/* Sign out */}
            <div className="bg-white rounded-3xl border border-[#E8DDD5] p-6">
              <p className="text-xs font-semibold uppercase tracking-widest text-[#8B5E3C] mb-4">Session</p>
              <button
                onClick={() => { logout(); navigate('/') }}
                className="px-6 py-2.5 rounded-full border border-red-200 text-red-500 hover:bg-red-50 text-sm font-medium transition-colors"
              >
                Sign out
              </button>
            </div>
          </div>
        )}

        {/* ── Orders Tab ──────────────────────────────────────────── */}
        {tab === 'Orders' && (
          <div className="space-y-4">
            {ordersLoading ? (
              <div className="flex justify-center py-16">
                <div className="w-8 h-8 rounded-full border-2 border-[#C4602A] border-t-transparent animate-spin" />
              </div>
            ) : ordersError ? (
              <p className="text-sm text-red-500">{ordersError}</p>
            ) : orders.length === 0 ? (
              <div className="text-center py-20">
                <div className="w-16 h-16 rounded-full bg-[#F0EAE0] flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-[#C4602A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                </div>
                <p className="font-display text-xl text-[#3D2314] mb-2">No orders yet</p>
                <p className="text-sm text-[#8B5E3C] mb-6">Your order history will appear here.</p>
                <button onClick={() => navigate('/shop')} className="px-6 py-2.5 rounded-full bg-[#C4602A] text-white text-sm font-semibold hover:bg-[#A04E22] transition-colors">
                  Browse coffee
                </button>
              </div>
            ) : (
              orders.map(order => {
                const items = typeof order.items === 'string' ? JSON.parse(order.items) : (order.items ?? [])
                const isOpen = expandedOrder === order.id
                return (
                  <div key={order.id} className="bg-white rounded-3xl border border-[#E8DDD5] overflow-hidden">
                    <button
                      onClick={() => setExpandedOrder(isOpen ? null : order.id)}
                      className="w-full flex items-center justify-between px-5 py-4 hover:bg-[#FAF7F2] transition-colors"
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="text-left min-w-0">
                          <p className="text-sm font-semibold text-[#1C0F0A]">Order #{order.id}</p>
                          <p className="text-xs text-[#8B5E3C] mt-0.5">
                            {new Date(order.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                            {' · '}{items.length} item{items.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${STATUS_STYLE[order.status] ?? 'bg-gray-100 text-gray-600'}`}>
                          {order.status}
                        </span>
                        <span className="font-semibold text-sm text-[#1C0F0A]">${Number(order.total).toFixed(2)}</span>
                        <svg className={`w-4 h-4 text-[#8B5E3C] transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </button>

                    {isOpen && (
                      <div className="border-t border-[#E8DDD5] px-5 py-4 space-y-3">
                        {items.filter(i => i.id !== null).map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-8 h-8 rounded-full bg-[#F0EAE0] flex items-center justify-center flex-shrink-0 text-[10px] font-bold text-[#C4602A]">
                                {item.quantity}×
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-[#1C0F0A] truncate">{item.name}</p>
                                {item.size && <p className="text-xs text-[#8B5E3C]">{item.size}</p>}
                              </div>
                            </div>
                            <p className="text-sm font-semibold text-[#1C0F0A] whitespace-nowrap">
                              ${(item.price * item.quantity).toFixed(2)}
                            </p>
                          </div>
                        ))}
                        {order.shippingAddress && (() => {
                          const addr = typeof order.shippingAddress === 'string'
                            ? JSON.parse(order.shippingAddress)
                            : order.shippingAddress
                          return (
                            <div className="pt-3 border-t border-[#E8DDD5]">
                              <p className="text-xs font-semibold uppercase tracking-widest text-[#8B5E3C] mb-1">Shipped to</p>
                              <p className="text-sm text-[#3D2314]">{addr.name} · {addr.address}, {addr.city} {addr.zip}</p>
                            </div>
                          )
                        })()}
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        )}
      </div>
    </div>
  )
}
