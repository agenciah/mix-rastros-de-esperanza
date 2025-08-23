import { useMemo } from 'react'
import { useAuth } from '@/context/AuthContext'

export default function usePlanIncluyeFacturacion() {
  const { user, loading } = useAuth()

  const incluyeFacturacion = useMemo(() => {
    if (loading || !user || !user.plan) return false

    let planes = []

    try {
      planes = typeof user.plan === 'string' ? JSON.parse(user.plan) : user.plan
    } catch (error) {
      console.error('❌ Error al parsear plan del usuario:', error)
      return false
    }

    const planesConFacturacion = [
      'plan_250',
      'plan_450',
      'plan_250_chatbot',
      'plan_450_chatbot'
    ]

    return Array.isArray(planes) && planes.some(p => planesConFacturacion.includes(p))
  }, [user, loading])

  return incluyeFacturacion
}
