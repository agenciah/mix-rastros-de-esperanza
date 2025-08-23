import React, { useEffect, useState } from 'react'
import api from '../../lib/axios'
import { useAuth } from '@/context/AuthContext'

function EstadoServicioCard() {
  const [estado, setEstado] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { user, loading: authLoading } = useAuth()

  useEffect(() => {
    // ⚠️ Solo hacer la petición si el usuario ya está cargado
    if (authLoading || !user) return

    async function fetchEstado() {
      try {
        const { data } = await api.get('/estado-servicio')
        console.log('✅ Datos recibidos del backend:', data)
        setEstado(data) // Asegúrate aquí de si necesitas data o data.estado
      } catch (err) {
        console.error('⚠️ Error al obtener estado del servicio:', err)
        setError('No se pudo cargar el estado del servicio')
      } finally {
        setLoading(false)
      }
    }

    fetchEstado()
  }, [authLoading, user])

  function formatDate(dateStr) {
    if (!dateStr) return '-'
    const d = new Date(dateStr)
    if (isNaN(d)) return '-'
    return d.toLocaleDateString()
  }

  if (loading) return <div className="text-sm text-gray-500">Cargando...</div>
  if (error) return <div className="text-xs text-red-600">{error}</div>
  if (!estado) return <div className="text-sm text-gray-400">Sin información</div>

  return (
    <section
      aria-live="polite"
      className="bg-gray-100 rounded-md p-3 text-xs font-sans max-w-[250px] shadow-sm"
    >
      <h3 className="text-sm font-semibold mb-1 text-gray-700">Estado del servicio</h3>
      <dl className="space-y-0.5 text-gray-600">
        <div className="flex justify-between">
          <dt>Trial termina:</dt>
          <dd>{formatDate(estado.trial_end_date)}</dd>
        </div>
        <div className="flex justify-between">
          <dt>Próximo pago:</dt>
          <dd>{formatDate(estado.proximo_pago)}</dd>
        </div>
        <div className="flex justify-between">
          <dt>Facturas restantes:</dt>
          <dd>{estado.facturas_restantes ?? '-'}</dd>
        </div>
        <div className="flex justify-between">
          <dt>Servicio:</dt>
          <dd>{estado.servicio_activo ? 'Activo' : 'Inactivo'}</dd>
        </div>
        {estado.cancelacion_programada && (
          <div className="flex justify-between text-red-600 font-medium">
            <dt>Cancelación:</dt>
            <dd>{formatDate(estado.cancelacion_programada)}</dd>
          </div>
        )}
      </dl>
    </section>
  )
}

export default EstadoServicioCard
