import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import api from '@/lib/axios'

const ConfirmarToken = () => {
  const { token } = useParams()
  const navigate = useNavigate()

  useEffect(() => {
    const confirmarCuenta = async () => {
      try {
        await api.post('/api/auth/confirmar', { token })
        toast.success('Cuenta confirmada correctamente')
        localStorage.removeItem('correoRegistrado')
        navigate('/login')
      } catch (error) {
        toast.error('Token inválido o expirado')
        navigate('/error-token')
      }
    }

    confirmarCuenta()
  }, [token, navigate])

  return null // no muestra nada, redirige automáticamente
}

export default ConfirmarToken
