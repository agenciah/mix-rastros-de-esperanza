import { openDb } from '../users/initDb.js';
import { plans } from '../../shared/planes.js'; // Importamos el listado de planes con precios

/**
 * Obtiene el ingreso total acumulado de todas las facturas de servicio.
 * @returns {Promise<number>} El total de ingresos.
 */
export async function getTotalIngresos() {
  const db = await openDb();
  // Sumamos el monto de todas las facturas que no están pendientes
  const { total } = await db.get(`SELECT SUM(monto) as total FROM facturas_servicio WHERE estatus != 'Pendiente'`);
  return total || 0;
}

/**
 * Obtiene el total de ingresos por mes.
 * @returns {Promise<Array<Object>>} Un array con el ingreso total por mes y año.
 */
export async function getIngresosPorMes() {
  const db = await openDb();
  return db.all(`
    SELECT
      strftime('%Y-%m', fecha_emision) as mes,
      SUM(monto) as total
    FROM facturas_servicio
    WHERE estatus != 'Pendiente'
    GROUP BY mes
    ORDER BY mes ASC
  `);
}

/**
 * Obtiene el número de nuevos usuarios registrados por mes.
 * @returns {Promise<Array<Object>>} Un array con el número de usuarios nuevos por mes y año.
 */
export async function getNuevosUsuariosPorMes() {
  const db = await openDb();
  return db.all(`
    SELECT
      strftime('%Y-%m', trial_start_date) as mes,
      COUNT(*) as total
    FROM users
    GROUP BY mes
    ORDER BY mes ASC
  `);
}

/**
 * Obtiene el número de usuarios por cada plan.
 * @returns {Promise<Array<Object>>} Un array con los planes y el número de usuarios.
 */
export async function getUsuariosPorPlan() {
  const db = await openDb();
  const filas = await db.all(`
    SELECT
      JSON_EXTRACT(plan, '$[0]') as plan_id,
      COUNT(*) as total
    FROM users
    GROUP BY plan_id
  `);

  const resultado = filas.map(fila => ({
    plan: fila.plan_id,
    total: fila.total
  }));

  return resultado;
}

/**
 * Obtiene el total de ingresos recurrentes de suscripciones activas.
 * @returns {Promise<number>} El total de ingresos por suscripciones.
 */
export async function getTotalIngresosSuscripciones() {
  const usuariosPorPlan = await getUsuariosPorPlan();
  let totalIngresos = 0;

  // Calculamos el ingreso total multiplicando el número de usuarios por el precio del plan
  usuariosPorPlan.forEach(usuarioPlan => {
    const planInfo = plans.find(p => p.id === usuarioPlan.plan);
    if (planInfo) {
      totalIngresos += planInfo.precio * usuarioPlan.total;
    }
  });

  return totalIngresos;
}

/**
 * Obtiene el número de usuarios dados de baja por mes.
 * @returns {Promise<Array<Object>>} Un array con la cuenta de cancelaciones por mes.
 */
export async function getCancelacionesPorMes() {
  const db = await openDb();
  return db.all(`
    SELECT
      strftime('%Y-%m', cancelacion_efectiva) as mes,
      COUNT(*) as total
    FROM users
    WHERE cancelado = 1
    GROUP BY mes
    ORDER BY mes ASC
  `);
}

/**
 * Obtiene el número total de usuarios dados de baja.
 * @returns {Promise<number>} El total de cancelaciones.
 */
export async function getTotalCancelaciones() {
  const db = await openDb();
  const { total } = await db.get(`SELECT COUNT(*) as total FROM users WHERE cancelado = 1`);
  return total || 0;
}