import { openDb } from '../../db/users/initDb.js'

export async function createFacturaServicio({
  user_id,
  descripcion,
  monto,
  fecha_emision,
  fecha_pago,
  metodo_pago,
  estatus,
}) {
  const db = await openDb()
  const result = await db.run(
    `INSERT INTO facturas_servicio (
      user_id,
      descripcion,
      monto,
      fecha_emision,
      fecha_pago,
      metodo_pago,
      estatus
    ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      user_id,
      descripcion,
      monto,
      fecha_emision,
      fecha_pago,
      metodo_pago,
      estatus,
    ]
  )
  return { id: result.lastID }
}

export async function getAllFacturasServicio() {
  const db = await openDb()
  const rows = await db.all(
    `SELECT f.*, u.nombre, u.email, u.razon_social_servicio
     FROM facturas_servicio f
     JOIN users u ON f.user_id = u.id
     ORDER BY fecha_emision DESC`
  )
  return rows
}

export async function getFacturasServicioByUser(user_id) {
  const db = await openDb()
  const rows = await db.all(
    `SELECT * FROM facturas_servicio
     WHERE user_id = ?
     ORDER BY fecha_emision DESC`,
    [user_id]
  )
  return rows
}

export async function updateFacturaServicio(id, fields) {
  const db = await openDb()

  const keys = Object.keys(fields)
  const values = Object.values(fields)

  const setClause = keys.map(key => `${key} = ?`).join(', ')
  const query = `UPDATE facturas_servicio SET ${setClause} WHERE id = ?`

  await db.run(query, [...values, id])
  return { id }
}

export async function deleteFacturaServicio(id) {
  const db = await openDb()
  await db.run(`DELETE FROM facturas_servicio WHERE id = ?`, [id])
  return { deleted: true }
}

export async function yaTieneFacturaEnPeriodo(user_id, periodo) {
  const db = await openDb()
  const row = await db.get(
    `SELECT id FROM facturas_servicio WHERE user_id = ? AND periodo = ?`,
    [user_id, periodo]
  )
  return !!row
}

// --- NUEVA FUNCIÓN ---
export async function getUsuariosPendientesDeFacturar() {
  const db = await openDb();
  const currentDate = new Date();
  const year = currentDate.getFullYear();
  const month = (currentDate.getMonth() + 1).toString().padStart(2, '0');

  const rows = await db.all(`
    SELECT u.id, u.nombre, u.email, u.plan,
           u.razon_social_servicio, u.rfc_servicio, u.uso_cfdi_servicio, 
           u.cp_fiscal_servicio, u.email_fiscal_servicio
    FROM users u
    LEFT JOIN facturas_servicio fs ON u.id = fs.user_id 
      AND STRFTIME('%Y-%m', fs.fecha_emision) = ?
    WHERE
      u.razon_social_servicio IS NOT NULL AND u.razon_social_servicio != '' AND
      u.rfc_servicio IS NOT NULL AND u.rfc_servicio != '' AND
      fs.id IS NULL
    GROUP BY u.id
    ORDER BY u.nombre ASC
  `, [`${year}-${month}`]);

  return rows;
}

/**
 * Obtiene facturas emitidas en los últimos 2 días.
 ** @returns {Promise<Array<Object>>} Lista de facturas recientes.
 */
export async function getFacturasRecientes() {
  const db = await openDb();
  const twoDaysAgo = new Date();
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
  const twoDaysAgoISO = twoDaysAgo.toISOString().split('T')[0];
  
  const query = `
    SELECT fs.*, u.nombre, u.email, u.razon_social_servicio
    FROM facturas_servicio fs
    JOIN users u ON fs.user_id = u.id
    WHERE fs.fecha_emision >= ?
    ORDER BY fs.fecha_emision DESC;
  `;
  
  return db.all(query, twoDaysAgoISO);
}
