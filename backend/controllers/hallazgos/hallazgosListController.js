// backend/controllers/hallazgos/hallazgosListController.js

import { openDb } from '../../db/users/initDb.js';
import logger from '../../utils/logger.js';

export const getHallazgosList = async (limit, offset) => {
    let db;
    try {
        db = await openDb();
        const hallazgos = await db.all(`
            SELECT
                h.id_hallazgo, 
                h.nombre, 
                h.apellido_paterno, 
                h.fecha_hallazgo,
                h.genero,
                h.edad_estimada,
                u.estado, 
                u.municipio
            FROM hallazgos AS h
            JOIN ubicaciones AS u ON h.id_ubicacion_hallazgo = u.id_ubicacion
            ORDER BY h.fecha_hallazgo DESC
            LIMIT ? OFFSET ?;
        `, [limit, offset]);
        
        return hallazgos;
    } catch (error) {
        logger.error(`❌ Error al obtener el listado de hallazgos: ${error.message}`);
        return [];
    }
};