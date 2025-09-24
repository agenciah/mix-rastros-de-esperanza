// RUTA: backend/db/admin/estadisticas.js

import { query } from '../users/initDb.js';
import logger from '../../utils/logger.js';
import { plans } from '../../shared/planes.js'; // Asumimos que este archivo sigue siendo relevante

/**
 * Obtiene el total de usuarios registrados.
 * @returns {Promise<number>} El total de usuarios.
 */
export async function getTotalUsuarios() {
    try {
        const result = await query(`SELECT COUNT(*) as total FROM users`); // ✅ Corregido
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
    try {
        const result = await query(`SELECT COUNT(*) as total FROM fichas_desaparicion`); // ✅ Corregido
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
    try {
        const result = await query(`SELECT COUNT(*) as total FROM hallazgos`); // ✅ Corregido
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
    try {
        const result = await query(`SELECT SUM(monto) as total FROM pagos WHERE estado_pago = 'confirmado'`); // ✅ Corregido
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
    try {
        const result = await query(`SELECT SUM(monto) as total FROM pagos WHERE estado_pago = 'pendiente'`); // ✅ Corregido
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
        const result = await query(sql); // ✅ Corregido
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
        const result = await query(sql); // ✅ Corregido
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
        const result = await query(sql); // ✅ Corregido
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
    try {
        const result = await query(`SELECT COUNT(*) as total FROM coincidencias_confirmadas`); // ✅ Corregido
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
    try {
        const result = await query(`SELECT COUNT(*) as total FROM users WHERE cancelado = 1`); // ✅ Corregido
        return parseInt(result.rows[0].total, 10) || 0;
    } catch (error) {
        logger.error(`❌ Error en getTotalCancelaciones (PostgreSQL): ${error.message}`);
        throw error;
    }
}