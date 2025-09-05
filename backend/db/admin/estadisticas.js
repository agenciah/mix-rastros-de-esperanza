import { openDb } from '../users/initDb.js';
import { plans } from '../../shared/planes.js'; // Importamos el listado de planes con precios

/**
 * Obtiene el total de usuarios registrados.
 * @returns {Promise<number>} El total de usuarios.
 */
export async function getTotalUsuarios() {
  const db = await openDb();
  const { total } = await db.get(`SELECT COUNT(*) as total FROM users`);
  return total || 0;
}

/**
 * Obtiene el total de fichas de búsqueda.
 * @returns {Promise<number>} El total de fichas.
 */
export async function getTotalFichas() {
  const db = await openDb();
  const { total } = await db.get(`SELECT COUNT(*) as total FROM fichas_desaparicion`);
  return total || 0;
}

/**
 * Obtiene el total de hallazgos.
 * @returns {Promise<number>} El total de hallazgos.
 */
export async function getTotalHallazgos() {
  const db = await openDb();
  const { total } = await db.get(`SELECT COUNT(*) as total FROM hallazgos`);
  return total || 0;
}

/**
 * Obtiene el total de ingresos confirmados.
 * @returns {Promise<number>} El total de ingresos.
 */
export async function getTotalIngresosConfirmados() {
  const db = await openDb();
  const { total } = await db.get(`SELECT SUM(monto) as total FROM pagos WHERE estado_pago = 'confirmado'`);
  return total || 0;
}

/**
 * Obtiene el total de ingresos pendientes.
 * @returns {Promise<number>} El total de ingresos pendientes.
 */
export async function getTotalIngresosPendientes() {
  const db = await openDb();
  const { total } = await db.get(`SELECT SUM(monto) as total FROM pagos WHERE estado_pago = 'pendiente'`);
  return total || 0;
}

/**
 * Obtiene el total de ingresos por mes (pagos confirmados).
 * @returns {Promise<Array<Object>>} Un array con el ingreso total por mes y año.
 */
export async function getIngresosConfirmadosPorMes() {
  const db = await openDb();
  return db.all(`
    SELECT
      strftime('%Y-%m', fecha_pago) as mes,
      SUM(monto) as total
    FROM pagos
    WHERE estado_pago = 'confirmado'
    GROUP BY mes
    ORDER BY mes ASC
  `);
}

/**
 * Obtiene el total de ingresos pendientes por mes.
 * @returns {Promise<Array<Object>>} Un array con los ingresos totales pendientes por mes.
 */
export async function getIngresosPendientesPorMes() {
  const db = await openDb();
  return db.all(`
    SELECT
      strftime('%Y-%m', fecha_pago) as mes,
      SUM(monto) as total
    FROM pagos
    WHERE estado_pago = 'pendiente'
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
 * Obtiene el total de coincidencias confirmadas.
 * @returns {Promise<number>} El total de coincidencias.
 */
export async function getTotalCoincidencias() {
  const db = await openDb();
  const { total } = await db.get(`SELECT COUNT(*) as total FROM coincidencias_confirmadas`);
  return total || 0;
}

/**
 * Obtiene el total de usuarios dados de baja.
 * @returns {Promise<number>} El total de cancelaciones.
 */
export async function getTotalCancelaciones() {
  const db = await openDb();
  const { total } = await db.get(`SELECT COUNT(*) as total FROM users WHERE cancelado = 1`);
  return total || 0;
}
