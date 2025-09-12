// RUTA: backend/controllers/admin/adminActionsController.js

import { updateReportStatus, updateUserStatus } from '../../db/admin/adminQueriesActions.js';
import logger from '../../utils/logger.js';

/**
 * Controlador para cambiar el estado de un reporte.
 */
export const resolveReport = async (req, res) => {
    const { reportId } = req.params;
    const { newStatus } = req.body;

    if (!newStatus || !['resuelto', 'desestimado'].includes(newStatus)) {
        return res.status(400).json({ success: false, message: "El estado debe ser 'resuelto' o 'desestimado'." });
    }

    try {
        await updateReportStatus(reportId, newStatus);
        res.json({ success: true, message: `Reporte marcado como ${newStatus}.` });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al actualizar el reporte.' });
    }
};

/**
 * Controlador para aplicar una acción a un usuario (advertir, suspender, etc.).
 */
export const moderateUser = async (req, res) => {
    const { userId } = req.params;
    const { action } = req.body; // ej. 'advertir', 'suspender_mensajes', 'banear'

    // Aquí puedes definir las acciones permitidas
    const allowedActions = ['activo', 'advertido', 'suspendido'];
    if (!action || !allowedActions.includes(action)) {
        return res.status(400).json({ success: false, message: 'Acción no válida.' });
    }

    try {
        await updateUserStatus(userId, action);
        res.json({ success: true, message: `Usuario ${userId} ha sido marcado como ${action}.` });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al moderar el usuario.' });
    }
};