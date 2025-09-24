// RUTA: backend/controllers/feed/feedAdminMessagesController.js
import { query } from '../../db/users/initDb.js';
import logger from '../../utils/logger.js';

/**
 * Obtiene todos los mensajes públicos del administrador y DEVUELVE los datos.
 * Ya no maneja req y res.
 */
export const getAdminMessagesData = async () => { // ✅ Se eliminan req y res
    try {
        const sql = `
            SELECT id_mensaje, titulo, contenido, fecha_creacion
            FROM mensajes_administrador
            WHERE estado = 'activo'
            ORDER BY fecha_creacion DESC
            LIMIT 5;
        `;
        const result = await query(sql);

        return result.rows; // ✅ Retorna los datos

    } catch (error) {
        logger.error(`❌ Error al obtener mensajes del administrador (PostgreSQL): ${error.message}`);
        // ✅ Lanza el error para que el controlador que la llama lo gestione
        throw new Error('Error al obtener los mensajes del administrador.');
    }
};