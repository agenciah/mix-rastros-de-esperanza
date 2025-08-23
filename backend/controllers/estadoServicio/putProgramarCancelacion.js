import { marcarCancelacionProgramada } from '../../db/estadoServicio.js'
import { parseISO, isValid } from 'date-fns'
import logger from '../../utils/logger.js'

export async function putProgramarCancelacion(req, res) {
  const userId = req.user?.id
  const { fechaCancelacion } = req.body

  if (!userId) return res.status(401).json({ error: 'Usuario no autenticado' })

  const fecha = parseISO(fechaCancelacion)
  if (!isValid(fecha)) {
    return res.status(400).json({ error: 'Fecha de cancelación inválida' })
  }

  try {
    await marcarCancelacionProgramada(userId, fecha.toISOString())
    return res.json({ mensaje: 'Cancelación programada correctamente' })
  } catch (error) {
    logger.error('[estadoServicio] Error al programar cancelación:', error)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}
