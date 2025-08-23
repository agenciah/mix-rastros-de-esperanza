import { actualizarFacturasRestantes } from '../../db/estadoServicio.js'
import { z } from 'zod'
import logger from '../../utils/logger.js'

export async function putActualizarFacturasRestantes(req, res) {
  const userId = req.user?.id
  if (!userId) return res.status(401).json({ error: 'Usuario no autenticado' })

  const schema = z.object({
    facturas_restantes: z.number().int().min(0)
  })

  const parsed = schema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: 'Número de facturas inválido' })
  }

  try {
    await actualizarFacturasRestantes(userId, parsed.data.facturas_restantes)
    return res.json({ mensaje: 'Facturas restantes actualizadas correctamente' })
  } catch (error) {
    logger.error('[estadoServicio] Error al actualizar facturas restantes:', error)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}
