import { openDb } from '../../db/users/initDb.js';
import { plans } from '../../shared/planes.js';

/**
 * Obtiene el total de usuarios por cada plan activo.
 * @returns {Promise<Array<Object>>} Un array con los planes y el número de usuarios.
 */
export async function obtenerUsuariosPorPlan() {
  const db = await openDb();
  const filas = await db.all(`
    SELECT
      JSON_EXTRACT(plan, '$[0]') as plan_id,
      COUNT(*) as total
    FROM users
    GROUP BY plan_id
  `);

  // Transformamos el resultado para que el frontend lo pueda usar fácilmente.
  const resultado = filas.map(fila => ({
    plan: fila.plan_id,
    total: fila.total
  }));

  return resultado;
}

/**
 * Obtiene el conteo de tickets de facturación facturados vs. pendientes.
 * @returns {Promise<Object>} Un objeto con las cuentas de facturados y pendientes.
 */
export async function obtenerTicketsFacturadosVsPendientes() {
  const db = await openDb();
  const { facturados, pendientes } = await db.get(`
    SELECT
      SUM(CASE WHEN ya_facturado = 1 THEN 1 ELSE 0 END) AS facturados,
      SUM(CASE WHEN ya_facturado = 0 THEN 1 ELSE 0 END) AS pendientes
    FROM gastos
    WHERE es_facturable = 1
  `);
  return { facturados: facturados || 0, pendientes: pendientes || 0 };
}

/**
 * Obtiene una lista de facturas de servicio pendientes.
 * @returns {Promise<Array<Object>>} Un array de facturas pendientes.
 */
export async function obtenerFacturasServicioPendientes() {
  const db = await openDb();
  return db.all(`
    SELECT
      facturas_servicio.id,
      facturas_servicio.monto,
      facturas_servicio.fecha_emision,
      users.nombre AS nombre_usuario
    FROM facturas_servicio
    JOIN users ON facturas_servicio.user_id = users.id
    WHERE facturas_servicio.estatus = 'Pendiente'
    ORDER BY facturas_servicio.fecha_emision ASC
    LIMIT 5
  `);
}

/**
 * Obtiene el número de nuevos usuarios desde una fecha específica.
 * @param {string} fecha La fecha en formato ISO.
 * @returns {Promise<number>} El número total de nuevos usuarios.
 */
export async function obtenerNuevosUsuariosDesde(fecha) {
  const db = await openDb();
  const { total } = await db.get(`
    SELECT COUNT(*) as total FROM users WHERE trial_start_date >= ?
  `, [fecha]);
  return total || 0;
}

/**
 * Obtiene el número de cancelaciones desde una fecha específica.
 * @param {string} fecha La fecha en formato ISO.
 * @returns {Promise<number>} El número total de cancelaciones.
 */
export async function obtenerCancelacionesDesde(fecha) {
  const db = await openDb();
  const { total } = await db.get(`
    SELECT COUNT(*) as total FROM users WHERE cancelado = 1 AND cancelacion_efectiva >= ?
  `, [fecha]);
  return total || 0;
}
