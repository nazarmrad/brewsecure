import { createContext, useContext, useState, useCallback } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('bs_token'))
  const [user, setUser] = useState(() => {
    try {
      const s = localStorage.getItem('bs_user')
      return s ? JSON.parse(s) : null
    } catch { return null }
  })

  const login = useCallback((newToken, newUser) => {
    localStorage.setItem('bs_token', newToken)
    if (newUser) localStorage.setItem('bs_user', JSON.stringify(newUser))
    setToken(newToken)
    setUser(newUser ?? null)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('bs_token')
    localStorage.removeItem('bs_user')
    setToken(null)
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ isAuthenticated: !!token, token, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
