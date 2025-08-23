// backend/db/admin/usuarios.js
import { openDb } from '../../db/users/initDb.js'

export async function getAllUsuariosAdmin() {
  const db = await openDb()

  // 1. Traer todos los campos relevantes de users + estado_servicio
  const usuarios = await db.all(`
    SELECT 
      u.id,
      u.nombre,
      u.telefono,
      u.email,
      u.plan,
      u.trial_start_date,
      u.tickets_facturados,
      u.facturacion_tickets,
      u.gastos_registrados,
      u.razon_social_tickets,
      u.rfc_tickets,
      u.uso_cfdi_tickets,
      u.cp_fiscal_tickets,
      u.email_fiscal_tickets,
      u.razon_social_servicio,
      u.rfc_servicio,
      u.uso_cfdi_servicio,
      u.cp_fiscal_servicio,
      u.email_fiscal_servicio,
      u.email_confirmed,
      u.cancelado,
      u.cancelacion_efectiva,
      u.role,

      es.trial_end_date,
      es.proximo_pago,
      es.facturas_restantes,
      es.servicio_activo,
      es.cancelacion_programada,
      es.fecha_inicio,
      es.fecha_fin

    FROM users u
    LEFT JOIN estado_servicio es ON es.user_id = u.id
  `)

  // 2. Para cada usuario, contar tickets pendientes (no facturados y es_facturable)
  for (const user of usuarios) {
    const { total } = await db.get(`
      SELECT COUNT(*) as total 
      FROM gastos 
      WHERE user_id = ? AND es_facturable = 1 AND (ya_facturado IS NULL OR ya_facturado = 0)
    `, [user.id])

    user.tickets_pendientes = total
  }

  return usuarios
}

export async function getUsuariosConDatosServicio() {
  const db = await openDb()
  const rows = await db.all(`
    SELECT id, nombre, razon_social_servicio, rfc_servicio
    FROM users
    WHERE razon_social_servicio IS NOT NULL
      AND rfc_servicio IS NOT NULL
      AND razon_social_servicio != ''
      AND rfc_servicio != ''
  `)
  return rows
}
