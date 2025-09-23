import { openDb } from '../../db/users/initDb.js';
import logger from '../../utils/logger.js';

/**
 * Obtiene una lista paginada de todos los hallazgos para el feed público (Versión PostgreSQL).
 */
export const getHallazgosList = async (req, res) => {
    try {
        const db = openDb();
        const limit = parseInt(req.query.limit) || 10;
        const offset = parseInt(req.query.offset) || 0;

        const sql = `
            SELECT
                h.id_hallazgo, h.nombre, h.apellido_paterno, h.fecha_hallazgo,
                h.genero, h.edad_estimada, h.foto_hallazgo,
                u.estado, u.municipio
            FROM hallazgos AS h
            JOIN ubicaciones AS u ON h.id_ubicacion_hallazgo = u.id_ubicacion
            ORDER BY h.fecha_hallazgo DESC
            LIMIT $1 OFFSET $2;
        `;
        
        const result = await db.query(sql, [limit, offset]);
        
        // La respuesta ahora incluye el success: true para consistencia.
        res.status(200).json({ success: true, data: result.rows });

    } catch (error) {
        logger.error(`❌ Error al obtener el listado de hallazgos (PostgreSQL): ${error.message}`);
        res.status(500).json({ success: false, message: 'Error interno del servidor.' });
    }
};

