import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'

export default function Header({ onLoginOpen }) {
  const { isAuthenticated, user, logout } = useAuth()
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { cartCount, setCartOpen } = useCart()

  useEffect(() => {
    function onScroll() { setScrolled(window.scrollY > 10) }
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const navLinks = [
    { label: 'Shop', path: '/shop' },
    { label: 'Our Story', path: '/' },
  ]

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-[#FAF7F2]/95 backdrop-blur-sm shadow-sm' : 'bg-[#FAF7F2]'}`}>
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <button onClick={() => navigate('/')} className="font-display text-xl font-semibold tracking-tight text-[#1C0F0A] hover:text-[#C4602A] transition-colors">
          BrewSecure<span className="text-[#C4602A]">.</span>
        </button>

        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map(l => (
            <button
              key={l.path}
              onClick={() => navigate(l.path)}
              className={`text-sm font-medium transition-colors ${location.pathname === l.path ? 'text-[#C4602A]' : 'text-[#3D2314]/70 hover:text-[#1C0F0A]'}`}
            >
              {l.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <div className="hidden md:flex items-center gap-3">
              <span className="text-sm text-[#3D2314]/70 font-medium">
                {user?.name ?? user?.email ?? 'Account'}
              </span>
              <button
                onClick={logout}
                className="text-sm font-medium text-[#8B5E3C] hover:text-[#C4602A] transition-colors"
              >
                Sign out
              </button>
            </div>
          ) : (
            <button onClick={() => onLoginOpen('login')} className="hidden md:block text-sm font-medium text-[#3D2314]/70 hover:text-[#1C0F0A] transition-colors">
              Sign in
            </button>
          )}
          <button onClick={() => navigate('/shop')} className="hidden md:block text-sm font-medium px-4 py-2 rounded-full border border-[#C4602A] text-[#C4602A] hover:bg-[#C4602A] hover:text-white transition-all duration-200">
            Shop
          </button>
          <button onClick={() => setCartOpen(true)} className="relative flex items-center justify-center w-10 h-10 rounded-full hover:bg-[#F0EAE0] transition-colors">
            <svg className="w-5 h-5 text-[#1C0F0A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            {cartCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-[#C4602A] text-white text-[10px] font-bold flex items-center justify-center">
                {cartCount > 9 ? '9+' : cartCount}
              </span>
            )}
          </button>
          <button className="md:hidden w-10 h-10 flex items-center justify-center rounded-full hover:bg-[#F0EAE0] transition-colors" onClick={() => setMobileMenuOpen(v => !v)}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
            </svg>
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden bg-[#FAF7F2] border-t border-[#E8DDD5] px-6 py-4 flex flex-col gap-4">
          {navLinks.map(l => (
            <button key={l.path} onClick={() => { navigate(l.path); setMobileMenuOpen(false) }} className="text-left text-base font-medium text-[#3D2314]">{l.label}</button>
          ))}
          {isAuthenticated ? (
            <button onClick={() => { logout(); setMobileMenuOpen(false) }} className="text-left text-base font-medium text-[#C4602A]">Sign out</button>
          ) : (
            <button onClick={() => { onLoginOpen('login'); setMobileMenuOpen(false) }} className="text-left text-base font-medium text-[#C4602A]">Sign in</button>
          )}
        </div>
      )}
    </header>
  )
}
