import { obtenerEstadoServicioPorUserId } from '../../db/estadoServicio.js'
import logger from '../../utils/logger.js'

export async function getEstadoServicio(req, res) {
  const userId = req.user?.id
  if (!userId) return res.status(401).json({ error: 'Usuario no autenticado' })

  try {
    let estado = await obtenerEstadoServicioPorUserId(userId)

    if (!estado) {
      estado = {
        servicioActivo: false,
        facturasRestantes: 0,
        mensaje: 'Estado de servicio no encontrado, usuario sin registro inicial'
      }
    }

    console.log('[getEstadoServicio] Estado obtenido:', estado)

    return res.json(estado)
  } catch (error) {
    logger.error('[estadoServicio] Error al obtener estado:', error)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}
