import { cambiarEstadoServicio } from '../../db/estadoServicio.js'
import { z } from 'zod'
import logger from '../../utils/logger.js'

export async function putCambiarEstadoServicio(req, res) {
  const userId = req.user?.id
  if (!userId) return res.status(401).json({ error: 'Usuario no autenticado' })

  const schema = z.object({ activo: z.boolean() })

  const parsed = schema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: 'Valor de estado inválido' })
  }

  try {
    await cambiarEstadoServicio(userId, parsed.data.activo)
    return res.json({ mensaje: 'Estado del servicio actualizado correctamente' })
  } catch (error) {
    logger.error('[estadoServicio] Error al cambiar estado activo:', error)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}
