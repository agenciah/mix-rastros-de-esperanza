// backend/controllers/feed/feedAdminMessagesController.js

import { openDb } from '../../db/users/initDb.js';
import logger from '../../utils/logger.js';

/**
 * Obtiene todos los mensajes públicos del administrador.
 * No maneja la respuesta HTTP. Solo devuelve los datos.
 */
export const getAdminMessagesData = async () => {
    let db;
    try {
        db = await openDb();

        const messages = await db.all(`
            SELECT 
                id_mensaje, 
                titulo, 
                contenido, 
                fecha_creacion
            FROM mensajes_administrador
            ORDER BY fecha_creacion DESC
            LIMIT 5;
        `);

        // La función ahora solo retorna los datos.
        return messages;

    } catch (error) {
        logger.error(`❌ Error al obtener mensajes del administrador: ${error.message}`);
        // Retorna un array vacío en caso de error para que la aplicación no falle.
        return [];
    }
};