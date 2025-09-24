import { query } from '../users/initDb.js';
import logger from '../../utils/logger.js'; // Asumimos que tienes logger aquí

export async function createNotification(userId, type, content, url) {
    
    const sql = `
        INSERT INTO notificaciones (id_usuario_destinatario, tipo, contenido, url_destino) 
        VALUES ($1, $2, $3, $4)
    `;
    try {
        await db.query(sql, [userId, type, content, url]);
    } catch (error) {
        logger.error(`❌ Error al crear notificación (PostgreSQL): ${error.message}`);
        throw error;
    }
}

/**
 * Obtiene las notificaciones más recientes para un usuario.
 * @param {number} userId - El ID del usuario.
 * @returns {Promise<Array<object>>} - Una lista de notificaciones.
 */
export async function getNotificationsByUserId(userId) {
    
    const sql = `
        SELECT * FROM notificaciones 
        WHERE id_usuario_destinatario = $1 
        ORDER BY fecha_creacion DESC 
        LIMIT 20;
    `;
    try {
        const result = await db.query(sql, [userId]);
        return result.rows;
    } catch (error) {
        logger.error(`❌ Error al obtener notificaciones para el usuario ${userId} (PostgreSQL): ${error.message}`);
        throw error;
    }
}

/**
 * Marca todas las notificaciones no leídas de un usuario como 'leidas'.
 * @param {number} userId - El ID del usuario.
 */
export async function markNotificationsAsRead(userId) {
    
    const sql = `
        UPDATE notificaciones 
        SET estado = 'leido' 
        WHERE id_usuario_destinatario = $1 AND estado = 'no_leido';
    `;
    try {
        await db.query(sql, [userId]);
        return { success: true };
    } catch (error) {
        logger.error(`❌ Error al marcar notificaciones como leídas para el usuario ${userId} (PostgreSQL): ${error.message}`);
        throw error;
    }
}
