// RUTA: backend/db/admin/adminQueriesActions.js

import { query } from '../users/initDb.js';
import logger from '../../utils/logger.js';

/**
 * Actualiza el estado de un reporte de mensaje.
 * @param {number} reportId - El ID del reporte a actualizar.
 * @param {string} newStatus - El nuevo estado (ej. 'resuelto', 'desestimado').
 */
export const updateReportStatus = async (reportId, newStatus) => {
    
    const sql = `UPDATE mensajes_reporte SET estado = $1 WHERE id_reporte = $2;`;
    try {
        await db.query(sql, [newStatus, reportId]);
        return { success: true };
    } catch (error) {
        logger.error(`❌ Error al actualizar estado del reporte ${reportId} (PostgreSQL): ${error.message}`);
        throw error;
    }
};

/**
 * Actualiza el estado de la suscripción o permisos de un usuario.
 * @param {number} userId - El ID del usuario a modificar.
 * @param {string} newStatus - El nuevo estado de suscripción (ej. 'advertido', 'suspendido').
 */
export const updateUserStatus = async (userId, newStatus) => {
    
    const sql = `UPDATE users SET estado_suscripcion = $1 WHERE id = $2;`;
    try {
        await db.query(sql, [newStatus, userId]);
        return { success: true };
    } catch (error) {
        logger.error(`❌ Error al actualizar estado del usuario ${userId} (PostgreSQL): ${error.message}`);
        throw error;
    }
};
