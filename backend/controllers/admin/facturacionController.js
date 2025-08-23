import { getGastosFacturablesConUsuario } from '../../db/gastos.js'
import { actualizarYaFacturado } from '../../db/gastos.js'

export async function getTicketsFacturables(req, res) {
  try {
    const tickets = await getGastosFacturablesConUsuario()

    // Agregar lógica de semáforo (verde, amarillo, rojo)
    const enrichedTickets = tickets.map(ticket => {
      const creado = new Date(ticket.fecha_creacion)
      const ahora = new Date()
      const diffHoras = (ahora - creado) / (1000 * 60 * 60)

      let color = 'verde'
      if (diffHoras > 20 && diffHoras <= 24) color = 'amarillo'
      else if (diffHoras > 24) color = 'rojo'

      return { ...ticket, semaforo: color }
    })

    res.json(enrichedTickets)
  } catch (error) {
    console.error('Error al obtener tickets facturables:', error)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}

export async function marcarGastoComoFacturado(req, res) {
  const gastoId = req.params.id
  const { yaFacturado } = req.body

  try {
    await actualizarYaFacturado(gastoId, yaFacturado)
    res.status(200).json({ success: true })
  } catch (error) {
    console.error('Error al actualizar ya_facturado:', error)
    res.status(500).json({ error: 'No se pudo actualizar el estado' })
  }
}
