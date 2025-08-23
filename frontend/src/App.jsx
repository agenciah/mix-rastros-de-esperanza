import { AuthProvider } from './context/AuthContext'
import RoutesApp from './routes'
import { initGA } from './lib/analytics'
import { useEffect } from 'react'
import { Toaster } from 'sonner'
import { AdminAuthProvider } from './context/AdminAuthContext'

function App() {
  useEffect(() => {
    initGA("G-W60P9DPPKP") // ← Pega aquí tu ID real
  }, [])

  return (
    
    <AuthProvider>
      <AdminAuthProvider>
        <Toaster position="top-right" richColors /> {/* ← DEBE ESTAR AQUÍ */}
        <RoutesApp />
      </AdminAuthProvider>
    </AuthProvider>
  )
}

export default App
