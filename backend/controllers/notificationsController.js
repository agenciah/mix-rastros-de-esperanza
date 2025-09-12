// RUTA: backend/controllers/notificationsController.js

import { getNotificationsByUserId, markNotificationsAsRead } from '../db/queries/notificationsQueries.js';
import logger from '../utils/logger.js';

/**
 * Obtiene las notificaciones para el usuario autenticado.
 */
export const getNotifications = async (req, res) => {
    try {
        const userId = req.user.id;
        const notifications = await getNotificationsByUserId(userId);
        res.json({ success: true, data: notifications });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al obtener las notificaciones.' });
    }
};

/**
 * Marca todas las notificaciones del usuario como leídas.
 */
export const markAllAsRead = async (req, res) => {
    try {
        const userId = req.user.id;
        await markNotificationsAsRead(userId);
        res.json({ success: true, message: 'Notificaciones marcadas como leídas.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al actualizar las notificaciones.' });
    }
};