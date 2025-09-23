// RUTA: backend/controllers/feed/feedAdminMessagesController.js

import { openDb } from '../../db/users/initDb.js';
import logger from '../../utils/logger.js';

/**
 * Obtiene todos los mensajes públicos del administrador (Versión PostgreSQL).
 * Ahora funciona como un controlador de Express, manejando la respuesta HTTP.
 */
export const getAdminMessagesData = async (req, res) => {
    try {
        const db = openDb(); // Obtiene el pool de PostgreSQL

        const sql = `
            SELECT 
                id_mensaje, 
                titulo, 
                contenido, 
                fecha_creacion
            FROM mensajes_administrador
            WHERE estado = 'activo'
            ORDER BY fecha_creacion DESC
            LIMIT 5;
        `;

        const result = await db.query(sql);
        
        // Enviamos los resultados (que están en la propiedad .rows) como una respuesta JSON
        res.json({ success: true, data: result.rows });

    } catch (error) {
        logger.error(`❌ Error al obtener mensajes del administrador (PostgreSQL): ${error.message}`);
        // En caso de error, enviamos una respuesta de error 500
        res.status(500).json({ success: false, message: 'Error al obtener los mensajes del administrador.' });
    }
};
