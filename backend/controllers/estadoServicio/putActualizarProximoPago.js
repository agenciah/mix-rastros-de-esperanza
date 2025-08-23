import { actualizarProximoPago } from '../../db/estadoServicio.js'
import { parseISO, isValid } from 'date-fns'
import logger from '../../utils/logger.js'

export async function putActualizarProximoPago(req, res) {
  const userId = req.user?.id
  const { proximo_pago } = req.body

  if (!userId) return res.status(401).json({ error: 'Usuario no autenticado' })

  const fecha = parseISO(proximo_pago)
  if (!isValid(fecha)) {
    return res.status(400).json({ error: 'Fecha de próximo pago inválida' })
  }

  try {
    await actualizarProximoPago(userId, fecha.toISOString())
    return res.json({ mensaje: 'Próxima fecha de pago actualizada correctamente' })
  } catch (error) {
    logger.error('[estadoServicio] Error al actualizar próximo pago:', error)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}
