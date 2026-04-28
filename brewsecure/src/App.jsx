import { useState, useEffect, useRef } from 'react'
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import { CartProvider } from './context/CartContext'
import { AuthProvider } from './context/AuthContext'
import Header from './components/Header'
import CartDrawer from './components/CartDrawer'
import LoginModal from './components/LoginModal'
import RequireAuth from './components/RequireAuth'
import HomePage from './pages/HomePage'
import ShopPage from './pages/ShopPage'
import ProductDetail from './pages/ProductDetail'
import CheckoutPage from './pages/CheckoutPage'
import APIExplorer from './pages/APIExplorer'
import ProfilePage from './pages/ProfilePage'

function Layout() {
  const location = useLocation()
  const navigate = useNavigate()
  const isApiPage = location.pathname === '/api'
  const [loginOpen, setLoginOpen] = useState(false)
  const [loginTab, setLoginTab] = useState('login')
  // returnTo is set when RequireAuth redirects an unauthenticated user
  const returnTo = useRef(null)

  useEffect(() => {
    if (location.state?.openLogin) {
      returnTo.current = location.state.returnTo ?? null
      setLoginTab('login')
      setLoginOpen(true)
      // Clear the state so a page refresh doesn't re-open the modal
      navigate(location.pathname, { replace: true, state: {} })
    }
  }, [location.state?.openLogin])

  function openLogin(tab) {
    setLoginTab(tab)
    setLoginOpen(true)
  }

  function handleLoginSuccess() {
    setLoginOpen(false)
    if (returnTo.current) {
      navigate(returnTo.current)
      returnTo.current = null
    }
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] font-body">
      {!isApiPage && <Header onLoginOpen={openLogin} />}
      <CartDrawer />
      <LoginModal
        open={loginOpen}
        initialTab={loginTab}
        onClose={() => setLoginOpen(false)}
        onSuccess={handleLoginSuccess}
      />

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/shop" element={<ShopPage />} />
        <Route path="/shop/:id" element={<ProductDetail />} />
        <Route path="/checkout" element={<RequireAuth><CheckoutPage /></RequireAuth>} />
        <Route path="/profile" element={<RequireAuth><ProfilePage /></RequireAuth>} />
        <Route path="/api" element={<APIExplorer />} />
      </Routes>

      {!isApiPage && (
        <footer className="bg-[#1C0F0A] text-white/60 py-14 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
              <div className="md:col-span-2">
                <p className="font-display text-2xl font-semibold text-white mb-2">BrewSecure<span className="text-[#C4602A]">.</span></p>
                <p className="text-sm leading-relaxed max-w-xs">Specialty coffee roasted with intention. Sourced directly from farmers we know by name.</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-white/30 mb-3">Shop</p>
                <div className="space-y-2 text-sm">
                  {['Light Roasts', 'Medium Roasts', 'Dark Roasts', 'Blends'].map(l => (
                    <a key={l} href="/shop" className="block hover:text-white transition-colors">{l}</a>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-white/30 mb-3">Company</p>
                <div className="space-y-2 text-sm">
                  {['Our Story', 'Sustainability', 'Wholesale'].map(l => (
                    <a key={l} href="#" className="block hover:text-white transition-colors">{l}</a>
                  ))}
                  <button onClick={() => openLogin('register')} className="block hover:text-white transition-colors">Create Account</button>
                </div>
              </div>
            </div>
            <div className="border-t border-white/10 pt-6 flex flex-wrap items-center justify-between gap-4 text-xs">
              <p>© 2026 BrewSecure. All rights reserved.</p>
              <a href="/api" className="flex items-center gap-1.5 text-white/30 hover:text-[#C4602A] transition-colors font-mono">
                <span>⚡</span> API
              </a>
            </div>
          </div>
        </footer>
      )}
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <Layout />
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
