import { query } from './users/initDb.js';
import { format } from 'date-fns';

/**
 * Registra la solicitud de cancelación en la base de datos.
 * @param {number} userId - El ID del usuario.
 * @param {string} motivo - El motivo de la cancelación.
 */
export async function registrarCancelacion(userId, motivo) {
     // Obtiene el pool de PostgreSQL
    const fechaSolicitud = new Date(); // PostgreSQL maneja objetos Date directamente

    // 1. Guardar solicitud
    await db.query(
        `INSERT INTO cancelaciones (user_id, motivo, fecha_solicitud) VALUES ($1, $2, $3)`,
        [userId, motivo, fechaSolicitud]
    );

    // 2. Marcar que hay una cancelación programada
    const estadoResult = await db.query(
        `SELECT fecha_fin FROM estado_servicio WHERE user_id = $1`,
        [userId]
    );
    const estado = estadoResult.rows[0];

    if (estado?.fecha_fin) {
        await db.query(
            `UPDATE estado_servicio SET cancelacion_programada = $1 WHERE user_id = $2`,
            [estado.fecha_fin, userId]
        );
    }
}

/**
 * Obtiene datos del usuario y su servicio activo.
 * @param {number} userId - El ID del usuario.
 * @returns {Promise<object|null>}
 */
export async function obtenerUsuarioPorId(userId) {
    
    const res = await db.query(
        `SELECT 
            u.id, u.nombre, u.email, u.plan, u.trial_start_date,
            es.fecha_inicio, es.fecha_fin
        FROM users u
        LEFT JOIN estado_servicio es ON u.id = es.user_id
        WHERE u.id = $1`,
        [userId]
    );
    // Nota: 'facturacion_tickets' no está en la tabla users, se omite.
    return res.rows[0];
}

/**
 * Marca al usuario como cancelado y registra la fecha efectiva.
 * @param {number} userId - El ID del usuario.
 * @param {Date} fechaFin - La fecha en que la cancelación se hace efectiva.
 */
export async function marcarUsuarioComoCancelado(userId, fechaFin) {
    
    await db.query(
        `UPDATE users
         SET cancelado = 1,
             cancelacion_efectiva = $1
         WHERE id = $2`,
        [fechaFin, userId]
    );
}

/**
 * Revierte una solicitud de cancelación.
 * @param {number} userId - El ID del usuario.
 * @returns {Promise<boolean>}
 */
export async function revertirCancelacion(userId) {
    
    const result1 = await db.query(
        `UPDATE users SET cancelado = 0, cancelacion_efectiva = NULL WHERE id = $1`,
        [userId]
    );
    const result2 = await db.query(
        `UPDATE estado_servicio SET cancelacion_programada = NULL WHERE user_id = $1`,
        [userId]
    );
    // rowCount es el equivalente a 'changes' en pg
    return result1.rowCount > 0 || result2.rowCount > 0;
}

/**
 * Obtiene la última solicitud de cancelación pendiente de un usuario.
 * @param {number} userId - El ID del usuario.
 * @returns {Promise<object|null>}
 */
export async function obtenerCancelacionActiva(userId) {
    
    const res = await db.query(`
        SELECT * FROM cancelaciones
        WHERE user_id = $1 AND estado = 'pendiente'
        ORDER BY fecha_solicitud DESC
        LIMIT 1
    `, [userId]);
    return res.rows[0];
}
