import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
  timeout: 10000,
})

api.interceptors.request.use(config => {
  const token = localStorage.getItem('bs_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Auto-clear stale token on 401 so auth state stays consistent
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('bs_token')
      localStorage.removeItem('bs_user')
    }
    return Promise.reject(err)
  }
)

// Auth endpoints live at /api/login and /api/register (no /v1 prefix)
const authBase = axios.create({ baseURL: import.meta.env.VITE_API_URL ?? '/api', timeout: 10000 })

export const productsApi = {
  list: (params) => api.get('/products', { params }),
  get: (id) => api.get(`/products/${id}`),
}

export const authApi = {
  login: (data) => authBase.post('/login', data),
  register: (data) => authBase.post('/register', data),
}

export const cartApi = {
  get: () => api.get('/cart'),
  add: (data) => api.post('/cart', data),
  remove: (itemId) => api.delete(`/cart/${itemId}`),
}

export const ordersApi = {
  create: (data) => api.post('/orders', data),
  list: () => api.get('/orders'),
  get: (id) => api.get(`/orders/${id}`),
}

export const usersApi = {
  me: () => api.get('/users/me'),
  update: (data) => api.put('/users/me', data),
}

export default api
