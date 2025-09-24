// RUTA: backend/db/admin/adminQueriesReports.js

import { query } from '../users/initDb.js';
import logger from '../../utils/logger.js';

/**
 * Obtiene todos los reportes de mensajes que están en estado 'pendiente'.
 * Incluye los nombres de los usuarios involucrados para dar contexto.
 * @returns {Promise<Array<object>>} - Lista de reportes pendientes.
 */
export const getPendingReports = async () => {
    
    const sql = `
        SELECT
            mr.id_reporte,
            mr.conversation_id,
            mr.motivo,
            mr.fecha_creacion,
            reporter.nombre AS reportador_nombre,
            reported.nombre AS reportado_nombre,
            mr.id_reportado,
            mr.id_reportador
        FROM mensajes_reporte AS mr
        JOIN users AS reporter ON mr.id_reportador = reporter.id
        JOIN users AS reported ON mr.id_reportado = reported.id
        WHERE mr.estado = 'pendiente'
        ORDER BY mr.fecha_creacion ASC;
    `;
    try {
        const result = await db.query(sql);
        return result.rows;
    } catch (error) {
        logger.error(`❌ Error al obtener los reportes pendientes (PostgreSQL): ${error.message}`);
        throw error;
    }
};
