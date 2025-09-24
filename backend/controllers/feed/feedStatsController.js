import { openDb } from '../../db/users/initDb.js';
import logger from '../../utils/logger.js';

/**
 * Obtiene todas las estadísticas para el dashboard principal y envía la respuesta HTTP.
 */
export const getStatsData = async (req, res) => {
    try {
        const db = openDb();

        // Ejecutamos todas las consultas en paralelo para máxima eficiencia
        const [
            totalFichasResult,
            totalHallazgosResult,
            totalCoincidenciasResult,
            casosEncontradosResult,
            // La actividad reciente ahora se obtiene aquí también para el dashboard
            actividadRecienteResult, 
            mensajesAdminResult
        ] = await Promise.all([
            db.query(`SELECT COUNT(*) as count FROM fichas_desaparicion WHERE estado_ficha = 'activa'`),
            db.query(`SELECT COUNT(*) as count FROM hallazgos WHERE estado_hallazgo = 'encontrado'`),
            db.query(`SELECT COUNT(*) as count FROM coincidencias_confirmadas`),
            db.query(`SELECT id_ficha, nombre, apellido_paterno FROM fichas_desaparicion WHERE estado_ficha = 'encontrado' ORDER BY fecha_registro_encontrado DESC LIMIT 5`),
            db.query(`
                SELECT h.id_hallazgo, h.nombre, h.apellido_paterno, h.fecha_hallazgo, u.estado, u.municipio, h.foto_hallazgo 
                FROM hallazgos h 
                LEFT JOIN ubicaciones u ON h.id_ubicacion_hallazgo = u.id_ubicacion 
                ORDER BY h.fecha_hallazgo DESC LIMIT 5
            `),
            db.query(`SELECT id_mensaje, titulo, contenido, fecha_creacion FROM mensajes_administrador WHERE estado = 'activo' ORDER BY fecha_creacion DESC LIMIT 3`)
        ]);

        // Construimos el objeto de datos final
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

        // Enviamos la respuesta JSON directamente desde el controlador
        res.json({ success: true, data: statsData });

    } catch (error) {
        logger.error(`❌ Error al obtener estadísticas del feed (PostgreSQL): ${error.message}`);
        res.status(500).json({ success: false, message: 'Error al obtener las estadísticas.' });
    }
};