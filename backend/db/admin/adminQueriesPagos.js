// RUTA: backend/db/admin/adminQueriesPagos.js

import { query } from "../users/initDb.js";
import logger from '../../utils/logger.js';

/**
 * Encuentra usuarios cuyo servicio ha expirado.
 * @returns {Promise<Array<object>>} - Array de usuarios con servicio vencido.
 */
export const findUsersWithExpiredService = async () => {
    
    // Usamos CURRENT_DATE para obtener la fecha actual en PostgreSQL.
    const sql = `
        SELECT
            u.id,
            u.nombre,
            u.telefono,
            u.numero_referencia_unico,
            es.fecha_fin
        FROM users AS u
        JOIN estado_servicio AS es ON u.id = es.user_id
        WHERE es.fecha_fin < CURRENT_DATE;
    `;
    try {
        const result = await db.query(sql);
        return result.rows;
    } catch (error) {
        logger.error(`❌ Error al encontrar usuarios con servicio expirado (PostgreSQL): ${error.message}`);
        throw error;
    }
};

/**
 * Registra un pago y actualiza la suscripción del usuario.
 * @param {number} userId - ID del usuario que pagó.
 * @param {number} monto - Monto del pago.
 * @returns {Promise<object>} - El resultado de la inserción.
 */
export const marcarPagoComoRecibido = async (userId, monto) => {
    
    const client = await db.connect();
    try {
        await client.query('BEGIN');
        
        // 1. Inserta el registro del pago usando RETURNING para obtener el ID
        const pagoResult = await client.query(
            `INSERT INTO pagos (id_ficha, monto, estado_pago, fecha_pago, metodo_pago) 
             VALUES ($1, $2, 'completado', CURRENT_DATE, 'manual')
             RETURNING id_pago`,
            [userId, monto] 
        );

        // 2. Actualiza la fecha de fin de servicio a un mes en el futuro
        await client.query(
            `UPDATE estado_servicio SET fecha_fin = NOW() + INTERVAL '1 month' WHERE user_id = $1`,
            [userId]
        );

        await client.query('COMMIT');
        return { success: true, pagoId: pagoResult.rows[0].id_pago };

    } catch (error) {
        await client.query('ROLLBACK');
        logger.error(`❌ Error al marcar pago para usuario ${userId} (PostgreSQL): ${error.message}`);
        throw error;
    } finally {
        client.release();
    }
};

/**
 * Obtiene los pagos que han sido validados en las últimas 24 horas.
 * @returns {Promise<Array<object>>} - Lista de pagos recientes.
 */
export const getPagosRecientes = async () => {
    
    const sql = `
        SELECT p.id_pago, p.fecha_pago, p.monto, u.id as userId, u.nombre
        FROM pagos p
        JOIN users u ON p.id_ficha = u.id -- Asume que id_ficha es userId
        WHERE p.metodo_pago = 'manual' AND p.fecha_pago >= NOW() - INTERVAL '1 day'
        ORDER BY p.fecha_pago DESC;
    `;
    try {
        const result = await db.query(sql);
        return result.rows;
    } catch (error) {
        logger.error(`❌ Error al obtener pagos recientes (PostgreSQL): ${error.message}`);
        throw error;
    }
};

/**
 * Revierte un pago validado: elimina el registro y retrocede la suscripción.
 * @param {number} pagoId - ID del pago a revertir.
 * @returns {Promise<object>} - El resultado de la operación.
 */
export const revertirPagoValidado = async (pagoId) => {
    
    const client = await db.connect();
    try {
        await client.query('BEGIN');
        
        const pagoResult = await client.query('SELECT id_ficha FROM pagos WHERE id_pago = $1', [pagoId]);
        if (pagoResult.rowCount === 0) throw new Error('Pago no encontrado');
        const userId = pagoResult.rows[0].id_ficha;

        // 1. Elimina el registro del pago
        await client.query('DELETE FROM pagos WHERE id_pago = $1', [pagoId]);

        // 2. Retrocede la fecha de fin de servicio
        await client.query(
            `UPDATE estado_servicio SET fecha_fin = NOW() - INTERVAL '1 month' WHERE user_id = $1`,
            [userId]
        );
        
        await client.query('COMMIT');
        return { success: true };

    } catch (error) {
        await client.query('ROLLBACK');
        logger.error(`❌ Error al revertir el pago ${pagoId} (PostgreSQL): ${error.message}`);
        throw error;
    } finally {
        client.release();
    }
};
