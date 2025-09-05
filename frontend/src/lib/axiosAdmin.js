// src/lib/axiosAdmin.js
import axios from 'axios'

const apiAdmin = axios.create({
  baseURL: import.meta.env.VITE_ADMIN_API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Middleware que agrega el token del ADMIN a cada petición
apiAdmin.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
}, (error) => {
  return Promise.reject(error)
})

export default apiAdmin