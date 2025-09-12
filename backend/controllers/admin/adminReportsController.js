// RUTA: backend/controllers/admin/adminReportsController.js

import { getPendingReports } from '../../db/admin/adminQueriesReports.js';
import { getMessagesByConversationId } from '../../db/queries/messagingQueries.js';
import logger from '../../utils/logger.js';

/**
 * Maneja la solicitud para obtener la lista de reportes pendientes.
 */
export const getReports = async (req, res) => {
    try {
        const reports = await getPendingReports();
        res.json({ success: true, data: reports });
    } catch (error) {
        logger.error(`❌ Error en el controlador getReports: ${error.message}`);
        res.status(500).json({ success: false, message: 'Error al obtener los reportes.' });
    }
};

/**
 * Obtiene el historial completo de mensajes de una conversación específica
 * para que el administrador pueda revisarla.
 */
export const getReportedConversation = async (req, res) => {
    try {
        const { conversationId } = req.params;

        if (!conversationId) {
            return res.status(400).json({ success: false, message: 'Se requiere el ID de la conversación.' });
        }

        // 2. Reutilizamos la función que ya tenías para obtener mensajes.
        // La diferencia es que aquí no validamos si el admin es parte del chat.
        const messages = await getMessagesByConversationId(conversationId);
        
        res.json({ success: true, data: messages });

    } catch (error) {
        logger.error(`❌ Error en el controlador getReportedConversation: ${error.message}`);
        res.status(500).json({ success: false, message: 'Error al obtener los mensajes de la conversación.' });
    }
};