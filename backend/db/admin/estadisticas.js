// RUTA: backend/db/admin/estadisticas.js

import { openDb } from '../users/initDb.js';
import logger from '../../utils/logger.js';
import { plans } from '../../shared/planes.js'; // Asumimos que este archivo sigue siendo relevante

/**
 * Obtiene el total de usuarios registrados.
 * @returns {Promise<number>} El total de usuarios.
 */
export async function getTotalUsuarios() {
    const db = openDb();
    try {
        const result = await db.query(`SELECT COUNT(*) as total FROM users`);
        return parseInt(result.rows[0].total, 10) || 0;
    } catch (error) {
        logger.error(`❌ Error en getTotalUsuarios (PostgreSQL): ${error.message}`);
        throw error;
    }
}

/**
 * Obtiene el total de fichas de búsqueda.
 * @returns {Promise<number>} El total de fichas.
 */
export async function getTotalFichas() {
    const db = await openDb();
    try {
        const result = await db.query(`SELECT COUNT(*) as total FROM fichas_desaparicion`);
        return parseInt(result.rows[0].total, 10) || 0;
    } catch (error) {
        logger.error(`❌ Error en getTotalFichas (PostgreSQL): ${error.message}`);
        throw error;
    }
}

/**
 * Obtiene el total de hallazgos.
 * @returns {Promise<number>} El total de hallazgos.
 */
export async function getTotalHallazgos() {
    const db = await openDb();
    try {
        const result = await db.query(`SELECT COUNT(*) as total FROM hallazgos`);
        return parseInt(result.rows[0].total, 10) || 0;
    } catch (error) {
        logger.error(`❌ Error en getTotalHallazgos (PostgreSQL): ${error.message}`);
        throw error;
    }
}

/**
 * Obtiene el total de ingresos confirmados.
 * @returns {Promise<number>} El total de ingresos.
 */
export async function getTotalIngresosConfirmados() {
    const db = await openDb();
    try {
        const result = await db.query(`SELECT SUM(monto) as total FROM pagos WHERE estado_pago = 'confirmado'`);
        return parseFloat(result.rows[0].total) || 0;
    } catch (error) {
        logger.error(`❌ Error en getTotalIngresosConfirmados (PostgreSQL): ${error.message}`);
        throw error;
    }
}

/**
 * Obtiene el total de ingresos pendientes.
 * @returns {Promise<number>} El total de ingresos pendientes.
 */
export async function getTotalIngresosPendientes() {
    const db = await openDb();
    try {
        const result = await db.query(`SELECT SUM(monto) as total FROM pagos WHERE estado_pago = 'pendiente'`);
        return parseFloat(result.rows[0].total) || 0;
    } catch (error) {
        logger.error(`❌ Error en getTotalIngresosPendientes (PostgreSQL): ${error.message}`);
        throw error;
    }
}

/**
 * Obtiene el total de ingresos por mes (pagos confirmados).
 * @returns {Promise<Array<Object>>} Un array con el ingreso total por mes y año.
 */
export async function getIngresosConfirmadosPorMes() {
    const db = await openDb();
    const sql = `
        SELECT
            TO_CHAR(fecha_pago, 'YYYY-MM') as mes,
            SUM(monto) as total
        FROM pagos
        WHERE estado_pago = 'confirmado'
        GROUP BY mes
        ORDER BY mes ASC;
    `;
    try {
        const result = await db.query(sql);
        return result.rows.map(row => ({
            ...row,
            total: parseFloat(row.total)
        }));
    } catch (error) {
        logger.error(`❌ Error en getIngresosConfirmadosPorMes (PostgreSQL): ${error.message}`);
        throw error;
    }
}

/**
 * Obtiene el total de ingresos pendientes por mes.
 * @returns {Promise<Array<Object>>} Un array con los ingresos totales pendientes por mes.
 */
export async function getIngresosPendientesPorMes() {
    const db = await openDb();
    const sql = `
        SELECT
            TO_CHAR(fecha_pago, 'YYYY-MM') as mes,
            SUM(monto) as total
        FROM pagos
        WHERE estado_pago = 'pendiente'
        GROUP BY mes
        ORDER BY mes ASC;
    `;
    try {
        const result = await db.query(sql);
        return result.rows.map(row => ({
            ...row,
            total: parseFloat(row.total)
        }));
    } catch (error) {
        logger.error(`❌ Error en getIngresosPendientesPorMes (PostgreSQL): ${error.message}`);
        throw error;
    }
}

/**
 * Obtiene el número de usuarios por cada plan.
 * @returns {Promise<Array<Object>>} Un array con los planes y el número de usuarios.
 */
export async function getUsuariosPorPlan() {
    const db = await openDb();
    // Usamos ->> 0 para extraer el primer elemento del array JSON como texto.
    const sql = `
        SELECT
            plan ->> 0 as plan_id,
            COUNT(*) as total
        FROM users
        WHERE plan IS NOT NULL AND jsonb_array_length(plan::jsonb) > 0
        GROUP BY plan_id;
    `;
    try {
        const result = await db.query(sql);
        return result.rows.map(row => ({
            plan: row.plan_id,
            total: parseInt(row.total, 10)
        }));
    } catch (error) {
        logger.error(`❌ Error en getUsuariosPorPlan (PostgreSQL): ${error.message}`);
        throw error;
    }
}

/**
 * Obtiene el total de ingresos recurrentes de suscripciones activas.
 */
export async function getTotalIngresosSuscripciones() {
    // Esta función no tiene llamadas directas a la DB, por lo que su lógica no cambia.
    const usuariosPorPlan = await getUsuariosPorPlan();
    let totalIngresos = 0;
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
    try {
        const result = await db.query(`SELECT COUNT(*) as total FROM coincidencias_confirmadas`);
        return parseInt(result.rows[0].total, 10) || 0;
    } catch (error) {
        logger.error(`❌ Error en getTotalCoincidencias (PostgreSQL): ${error.message}`);
        throw error;
    }
}

/**
 * Obtiene el total de usuarios dados de baja.
 * @returns {Promise<number>} El total de cancelaciones.
 */
export async function getTotalCancelaciones() {
    const db = await openDb();
    try {
        const result = await db.query(`SELECT COUNT(*) as total FROM users WHERE cancelado = 1`);
        return parseInt(result.rows[0].total, 10) || 0;
    } catch (error) {
        logger.error(`❌ Error en getTotalCancelaciones (PostgreSQL): ${error.message}`);
        throw error;
    }
}
