// feedStatsController.js

import { query } from '../../db/users/initDb.js';
import logger from '../../utils/logger.js';

/**
 * Obtiene todas las estadísticas para el dashboard principal y DEVUELVE los datos.
 * Esta función ya no maneja req y res, solo obtiene y retorna.
 */
export const getStatsData = async () => {
    try {
        const [
            totalFichasResult,
            totalHallazgosResult,
            totalCoincidenciasResult,
            casosEncontradosResult,
            actividadRecienteResult,
            mensajesAdminResult
        ] = await Promise.all([
            // ✅ Todas las llamadas corregidas para usar 'query'
            query(`SELECT COUNT(*) as count FROM fichas_desaparicion WHERE estado_ficha = 'activa'`),
            query(`SELECT COUNT(*) as count FROM hallazgos WHERE estado_hallazgo = 'encontrado'`),
            query(`SELECT COUNT(*) as count FROM coincidencias_confirmadas`),
            query(`SELECT id_ficha, nombre, apellido_paterno FROM fichas_desaparicion WHERE estado_ficha = 'encontrado' ORDER BY fecha_registro_encontrado DESC LIMIT 5`),
            query(`
                SELECT h.id_hallazgo, h.nombre, h.apellido_paterno, h.fecha_hallazgo, u.estado, u.municipio, h.foto_hallazgo
                FROM hallazgos h
                LEFT JOIN ubicaciones u ON h.id_ubicacion_hallazgo = u.id_ubicacion
                ORDER BY h.fecha_hallazgo DESC LIMIT 5
            `),
            query(`SELECT id_mensaje, titulo, contenido, fecha_creacion FROM mensajes_administrador WHERE estado = 'activo' ORDER BY fecha_creacion DESC LIMIT 3`)
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