// RUTA: backend/controllers/feed/feedStatsController.js

import { openDb } from '../../db/users/initDb.js';
import logger from '../../utils/logger.js';

export const getStatsData = async (req, res) => {
    try {
        const db = openDb(); // Obtiene el pool de PostgreSQL

        // Ejecutamos todas las consultas en paralelo para mayor eficiencia
        const [
            totalFichasResult,
            totalHallazgosResult,
            totalCoincidenciasResult,
            casosEncontradosResult,
            actividadRecienteResult
        ] = await Promise.all([
            db.query(`SELECT COUNT(*) as count FROM fichas_desaparicion`),
            db.query(`SELECT COUNT(*) as count FROM hallazgos`),
            db.query(`SELECT COUNT(*) as count FROM coincidencias_confirmadas`),
            db.query(`
                SELECT id_ficha, nombre, apellido_paterno
                FROM fichas_desaparicion
                WHERE estado_ficha = 'encontrado'
                ORDER BY fecha_registro_encontrado DESC
                LIMIT 5;
            `),
            db.query(`
                SELECT
                    'hallazgo' AS tipo,
                    id_hallazgo AS id,
                    nombre,
                    apellido_paterno,
                    fecha_hallazgo AS fecha
                FROM hallazgos
                ORDER BY fecha_hallazgo DESC
                LIMIT 3;
            `)
        ]);

        // Procesamos los resultados de las consultas
        const statsData = {
            globalStats: {
                totalFichas: parseInt(totalFichasResult.rows[0].count, 10),
                totalHallazgos: parseInt(totalHallazgosResult.rows[0].count, 10),
                casosResueltos: parseInt(totalCoincidenciasResult.rows[0].count, 10)
            },
            casosEncontrados: casosEncontradosResult.rows,
            actividadReciente: actividadRecienteResult.rows
        };

        // Envolvemos la respuesta en un objeto `data` para consistencia
        res.json({ success: true, data: statsData });

    } catch (error) {
        logger.error(`❌ Error al obtener estadísticas del feed (PostgreSQL): ${error.message}`);
        res.status(500).json({ success: false, message: 'Error al obtener las estadísticas.' });
    }
};
