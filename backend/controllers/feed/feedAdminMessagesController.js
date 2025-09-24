// backend/controllers/feed/feedAdminMessagesController.js
import { query } from '../../db/users/initDb.js';
import logger from '../../utils/logger.js';

/**
 * Obtiene todos los mensajes públicos del administrador y envía la respuesta HTTP.
 */
export const getAdminMessagesData = async (req, res) => {
    try {
        const sql = `
            SELECT id_mensaje, titulo, contenido, fecha_creacion
            FROM mensajes_administrador
            WHERE estado = 'activo'
            ORDER BY fecha_creacion DESC
            LIMIT 5;
        `;
        const result = await query(sql); // ✅ Corregido

        res.json({ success: true, data: result.rows });

    } catch (error) {
        logger.error(`❌ Error al obtener mensajes del administrador (PostgreSQL): ${error.message}`);
        res.status(500).json({ success: false, message: 'Error al obtener los mensajes del administrador.' });
    }
};