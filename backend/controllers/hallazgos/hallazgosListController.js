// backend/controllers/hallazgos/hallazgosListController.js

import { openDb } from '../../db/users/initDb.js';
import logger from '../../utils/logger.js';

/**
 * Obtiene una lista paginada de hallazgos.
 * @param {number} limit - El número de resultados a devolver.
 * @param {number} offset - El punto de inicio para la paginación.
 * @returns {Promise<Array>} - Un array de objetos de hallazgo.
 */
export const getHallazgosList = async (req, res) => {
    // Extraemos los parámetros de la query, con valores por defecto
    const limit = parseInt(req.query.limit) || 10;
    const offset = parseInt(req.query.offset) || 0;
    
    try {
        const db = openDb(); // Obtiene el pool de PostgreSQL
        const sql = `
            SELECT
                h.id_hallazgo, 
                h.nombre, 
                h.apellido_paterno, 
                h.fecha_hallazgo,
                h.genero,
                h.edad_estimada,
                h.foto_hallazgo, -- Se añade el campo de la foto para las tarjetas
                u.estado, 
                u.municipio
            FROM hallazgos AS h
            LEFT JOIN ubicaciones AS u ON h.id_ubicacion_hallazgo = u.id_ubicacion
            ORDER BY h.fecha_hallazgo DESC
            LIMIT $1 OFFSET $2;
        `;
        
        const result = await db.query(sql, [limit, offset]);
        
        res.json({ success: true, data: result.rows });
        
    } catch (error) {
        logger.error(`❌ Error al obtener el listado de hallazgos: ${error.message}`);
        res.status(500).json({ success: false, message: 'Error interno del servidor.' });
    }
};
