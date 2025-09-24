// RUTA: backend/db/admin/dashboard.js

import { query } from '../users/initDb.js';
import logger from '../../utils/logger.js';

/**
 * Obtiene el total de usuarios por cada plan activo.
 * @returns {Promise<Array<Object>>} Un array con los planes y el número de usuarios.
 */
export async function obtenerUsuariosPorPlan() {
    // Nota: PostgreSQL usa ->> 0 para extraer el primer elemento de un array JSON como texto.
    const sql = `
        SELECT
            plan ->> 0 as plan_id,
            COUNT(*) as total
        FROM users
        WHERE plan IS NOT NULL
        GROUP BY plan_id;
    `;
    try {
        const result = await query(sql); // ✅ Corregido
        // El mapeo se mantiene igual, ya que la consulta devuelve los mismos alias.
        return result.rows.map(row => ({
            plan: row.plan_id,
            total: parseInt(row.total, 10)
        }));
    } catch (error) {
        logger.error(`❌ Error al obtener usuarios por plan (PostgreSQL): ${error.message}`);
        throw error;
    }
}

/**
 * Obtiene el conteo de tickets de facturación facturados vs. pendientes.
 * NOTA: Esta función parece ser del proyecto "Simplika" y puede que no aplique.
 * @returns {Promise<Object>} Un objeto con las cuentas de facturados y pendientes.
 */
export async function obtenerTicketsFacturadosVsPendientes() {
    // Usamos la sintaxis FILTER de PostgreSQL, que es más eficiente.
    const sql = `
        SELECT
            COUNT(*) FILTER (WHERE ya_facturado = true) AS facturados,
            COUNT(*) FILTER (WHERE ya_facturado = false) AS pendientes
        FROM gastos
        WHERE es_facturable = true;
    `;
    try {
        const result = await query(sql); // ✅ Corregido
        const data = result.rows[0];
        return {
            facturados: parseInt(data.facturados, 10) || 0,
            pendientes: parseInt(data.pendientes, 10) || 0
        };
    } catch (error) {
        logger.error(`❌ Error al obtener tickets facturados vs pendientes (PostgreSQL): ${error.message}`);
        // Devuelve 0 si la tabla 'gastos' no existe en la nueva DB.
        return { facturados: 0, pendientes: 0 };
    }
}

/**
 * Obtiene una lista de facturas de servicio pendientes.
 * NOTA: Esta función parece ser del proyecto "Simplika" y puede que no aplique.
 * @returns {Promise<Array<Object>>} Un array de facturas pendientes.
 */
export async function obtenerFacturasServicioPendientes() {
    const sql = `
        SELECT
            fs.id,
            fs.monto,
            fs.fecha_emision,
            u.nombre AS nombre_usuario
        FROM facturas_servicio fs
        JOIN users u ON fs.user_id = u.id
        WHERE fs.estatus = 'Pendiente'
        ORDER BY fs.fecha_emision ASC
        LIMIT 5;
    `;
    try {
        const result = await query(sql); // ✅ Corregido
        return result.rows;
    } catch (error) {
        logger.error(`❌ Error al obtener facturas pendientes (PostgreSQL): ${error.message}`);
        return [];
    }
}

/**
 * Obtiene el número de nuevos usuarios desde una fecha específica.
 * @param {string} fecha La fecha en formato ISO.
 * @returns {Promise<number>} El número total de nuevos usuarios.
 */
export async function obtenerNuevosUsuariosDesde(fecha) {
    const sql = `SELECT COUNT(*) as total FROM users WHERE trial_start_date >= $1;`;
    try {
        const result = await query(sql, [fecha]); // ✅ Corregido
        return parseInt(result.rows[0].total, 10) || 0;
    } catch (error) {
        logger.error(`❌ Error al obtener nuevos usuarios (PostgreSQL): ${error.message}`);
        throw error;
    }
}

/**
 * Obtiene el número de cancelaciones desde una fecha específica.
 * @param {string} fecha La fecha en formato ISO.
 * @returns {Promise<number>} El número total de cancelaciones.
 */
export async function obtenerCancelacionesDesde(fecha) {
    const sql = `SELECT COUNT(*) as total FROM users WHERE cancelado = 1 AND cancelacion_efectiva >= $1;`;
    try {
        const result = await query(sql, [fecha]); // ✅ Corregido
        return parseInt(result.rows[0].total, 10) || 0;
    } catch (error) {
        logger.error(`❌ Error al obtener cancelaciones (PostgreSQL): ${error.message}`);
        throw error;
    }
}