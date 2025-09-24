// feedStatsController.js

import { openDb } from '../../db/users/initDb.js';
import logger from '../../utils/logger.js';

/**
 * Obtiene todas las estadísticas para el dashboard principal y DEVUELVE los datos.
 * Esta función ya no maneja req y res, solo obtiene y retorna.
 */
export const getStatsData = async () => { // ❗️ Eliminamos req y res
    try {
        const db = openDb();

        const [
            totalFichasResult,
            totalHallazgosResult,
            totalCoincidenciasResult,
            casosEncontradosResult,
            actividadRecienteResult,
            mensajesAdminResult
        ] = await Promise.all([
            db.query(`SELECT COUNT(*) as count FROM fichas_desaparicion WHERE estado_ficha = 'activa'`),
            // ... (resto de las queries)
        ]);

        const statsData = {
            globalStats: {
                totalFichas: parseInt(totalFichasResult.rows[0].count, 10),
                totalHallazgos: parseInt(totalHallazgosResult.rows[0].count, 10),
                casosResueltos: parseInt(totalCoincidenciasResult.rows[0].count, 10)
            },
            casosEncontrados: casosEncontradosResult.rows,
            actividadReciente: actividadRecienteResult.rows,
            mensajesAdministrador: mensajesAdminResult.rows
        };

        return statsData; // ✅ Retornamos el objeto con los datos

    } catch (error) {
        logger.error(`❌ Error al obtener estadísticas del feed (PostgreSQL): ${error.message}`);
        // Lanzamos el error para que el controlador que la llama lo capture
        throw new Error('Error al obtener las estadísticas.'); 
    }
};