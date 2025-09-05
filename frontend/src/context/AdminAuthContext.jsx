// src/context/AdminAuthContext.jsx
import { createContext, useContext, useState, useEffect } from 'react'
import apiAdmin from '../lib/axiosAdmin'

const AdminAuthContext = createContext()

export const AdminAuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null)

  useEffect(() => {
    const storedAdmin = localStorage.getItem('adminData')
    if (storedAdmin) {
      setAdmin(JSON.parse(storedAdmin))
    }
  }, [])

  const loginAdmin = async (email, password) => {
    try {
        console.log('URL de la petición:', apiAdmin.defaults.baseURL + '/login');
        const res = await apiAdmin.post('/login', { email, password })
        const { token, admin } = res.data

        localStorage.setItem('adminToken', token)
        localStorage.setItem('adminData', JSON.stringify(admin))

        setAdmin(admin)
        } catch (err) {
            console.error('Error en loginAdmin:', err)
            throw err  // Ahora ya no es inútil porque haces algo en el catch
        }
    }

  const logoutAdmin = () => {
    setAdmin(null)
    localStorage.removeItem('adminToken')
    localStorage.removeItem('adminData')
  }

  return (
    <AdminAuthContext.Provider value={{ admin, loginAdmin, logoutAdmin }}>
      {children}
    </AdminAuthContext.Provider>
  )
}

export const useAdminAuth = () => useContext(AdminAuthContext)
