// backend/controllers/feed/feedStatsController.js

import { openDb } from '../../db/users/initDb.js';
import logger from '../../utils/logger.js';

export const getStatsData = async () => {
    let db;
    try {
        db = await openDb();

        // 1. Estadísticas globales (sin cambios, esto ya funciona)
        const totalFichas = await db.get(`SELECT COUNT(*) as count FROM fichas_desaparicion`);
        const totalHallazgos = await db.get(`SELECT COUNT(*) as count FROM hallazgos`);
        const totalCoincidencias = await db.get(`SELECT COUNT(*) as count FROM coincidencias_confirmadas`);
        
        // 2. Últimos casos de éxito (sin cambios, esto ya funciona)
        const casosEncontrados = await db.all(`
            SELECT 
                id_ficha,
                nombre,
                apellido_paterno
            FROM fichas_desaparicion
            WHERE estado_ficha = 'encontrado'
            ORDER BY fecha_registro_encontrado DESC
            LIMIT 5;
        `);

        // ✅ CORRECCIÓN AQUÍ: Obtener los últimos 3 hallazgos
        const actividadReciente = await db.all(`
            SELECT
                'hallazgo' AS tipo,
                id_hallazgo AS id,
                nombre,
                apellido_paterno,
                fecha_hallazgo AS fecha
            FROM hallazgos
            ORDER BY fecha_hallazgo DESC
            LIMIT 3;
        `);

        const statsData = {
            globalStats: {
                totalFichas: totalFichas.count,
                totalHallazgos: totalHallazgos.count,
                casosResueltos: totalCoincidencias.count
            },
            casosEncontrados,
            actividadReciente
        };

        return statsData;

    } catch (error) {
        logger.error(`❌ Error al obtener estadísticas del feed: ${error.message}`);
        return {
            globalStats: {},
            casosEncontrados: [],
            actividadReciente: []
        };
    }
};