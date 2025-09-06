// backend/controllers/feed/feedMainController.js

import { openDb } from '../../db/users/initDb.js';
import logger from '../../utils/logger.js';

// Importa las funciones que devuelven datos
import { getMatchesData } from './feedMatchesController.js'; 
import { getStatsData } from './feedStatsController.js';
import { getAdminMessagesData } from './feedAdminMessagesController.js'
import { getAllPublicFichas } from '../../db/queries/fichasAndHallazgosQueries.js';

/**
 * Obtiene todos los datos para el panel de control del usuario.
 * @param {object} req - Objeto de solicitud de Express.
 * @param {object} res - Objeto de respuesta de Express.
 */
export const getDashboardData = async (req, res) => {
    try {
        const userId = req.user.id; // Asume que el ID del usuario está en el token JWT

        // Llama a las funciones que devuelven datos
        const matches = await getMatchesData(userId);
        const stats = await getStatsData(userId); // Pasamos el ID para obtener datos locales si los implementamos
        const adminMessages = await getAdminMessagesData();
        const fichasRecientes = await getAllPublicFichas(5, 0);

        // Combina los datos y envía la respuesta final
        res.status(200).json({
            success: true,
            data: {
                matches,
                stats,
                adminMessages,
                fichasRecientes
            }
        });

    } catch (error) {
        logger.error(`❌ Error al obtener datos del dashboard: ${error.message}`);
        res.status(500).json({ success: false, message: 'Error al cargar el panel de control.' });
    }
};