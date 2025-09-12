// Crea backend/db/queries/notificationsQueries.js
import { openDb } from '../users/initDb.js';

export async function createNotification(userId, type, content, url) {
    const db = await openDb();
    await db.run(
        `INSERT INTO notificaciones (id_usuario_destinatario, tipo, contenido, url_destino) VALUES (?, ?, ?, ?)`,
        [userId, type, content, url]
    );
}
/**
 * Obtiene las notificaciones más recientes para un usuario.
 * @param {number} userId - El ID del usuario.
 * @returns {Promise<Array<object>>} - Una lista de notificaciones.
 */
export async function getNotificationsByUserId(userId) {
    const db = await openDb();
    const sql = `
        SELECT * FROM notificaciones 
        WHERE id_usuario_destinatario = ? 
        ORDER BY fecha_creacion DESC 
        LIMIT 20; -- Traemos solo las últimas 20 para no sobrecargar
    `;
    try {
        return await db.all(sql, [userId]);
    } catch (error) {
        logger.error(`❌ Error al obtener notificaciones para el usuario ${userId}: ${error.message}`);
        throw error;
    }
}

/**
 * Marca todas las notificaciones no leídas de un usuario como 'leidas'.
 * @param {number} userId - El ID del usuario.
 */
export async function markNotificationsAsRead(userId) {
    const db = await openDb();
    const sql = `
        UPDATE notificaciones 
        SET estado = 'leido' 
        WHERE id_usuario_destinatario = ? AND estado = 'no_leido';
    `;
    try {
        await db.run(sql, [userId]);
        return { success: true };
    } catch (error) {
        logger.error(`❌ Error al marcar notificaciones como leídas para el usuario ${userId}: ${error.message}`);
        throw error;
    }
}