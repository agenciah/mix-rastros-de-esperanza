import { useEffect, useState } from 'react'
import api from '@/lib/axios'
import { RUTAS } from '@/routes/apiRoutes'

export default function Dashboard() {
  const [resumen, setResumen] = useState({
    total: 0,
    facturados: 0,
    noFacturados: 0,
    ultimoMes: 0,
    recientes: [],
  })

  const [gastos, setGastos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDatos = async () => {
      try {
        // Petición al resumen
        const resumenResponse = await api.get(RUTAS.RESUMEN);
        setResumen(resumenResponse.data)

        // Petición a gastos facturables
        const facturablesResponse = await api.get(RUTAS.GASTOS_FACTURABLES_USUARIO);
        setGastos(facturablesResponse.data)
      } catch (error) {
        console.error('Error al obtener los datos:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchDatos()
  }, [])

  const totalMontoFacturable = gastos.reduce(
    (acc, gasto) => acc + (parseFloat(gasto.monto) || 0),
    0
  )

  if (loading) return <p>Cargando...</p>

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Resumen de gastos</h2>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded shadow">
          <p className="text-gray-500">Gastos totales</p>
          <p className="text-xl font-semibold">{resumen.total}</p>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <p className="text-gray-500">Facturados</p>
          <p className="text-xl font-semibold">{resumen.facturados}</p>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <p className="text-gray-500">No facturados</p>
          <p className="text-xl font-semibold">{resumen.noFacturados}</p>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <p className="text-gray-500">Este mes</p>
          <p className="text-xl font-semibold">${resumen.ultimoMes.toFixed(2)}</p>
        </div>
      </div>
      <h3 className="text-xl font-bold mt-8 mb-2">Últimos gastos ingresados</h3>
        <div className="overflow-x-auto mt-4">
          <table className="min-w-full bg-white rounded shadow">
            <thead>
              <tr>
                <th className="text-left p-2 border-b">Descripción</th>
                <th className="text-left p-2 border-b">Monto</th>
                <th className="text-left p-2 border-b">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {resumen.recientes.map((gasto) => (
                <tr key={gasto.id} className="border-b hover:bg-gray-50">
                  <td className="p-2">{gasto.descripcion}</td>
                  <td className="p-2">${parseFloat(gasto.monto).toFixed(2)}</td>
                  <td className="p-2">{gasto.fecha}</td>
                  <td className="p-2">
                    {gasto.imagen_url ? (
                      <img src={gasto.imagen_url} alt="Ticket" className="w-20" />
                    ) : (
                      '-'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

  </div>
  )
}
