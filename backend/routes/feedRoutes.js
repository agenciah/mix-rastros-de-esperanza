import express from 'express';
import { getStatsData } from '../controllers/feed/feedStatsController.js';
// ✅ Se elimina la importación de getAdminMessagesData, ya que ahora está dentro de getStatsData.
import { getHallazgosList } from '../controllers/hallazgos/hallazgosListController.js';
import { getAdminMessagesData } from '../controllers/feed/feedAdminMessagesController.js';
import logger from '../utils/logger.js'; // ✅ Se importa el logger que faltaba

const router = express.Router();

// --- Ruta para el Dashboard Principal del Feed ---
// Llama directamente al controlador que se encargará de toda la lógica.
router.get('/dashboard', getStatsData);

// --- Ruta para la Lista Pública Paginada de Hallazgos ---
// Llama directamente al controlador que se encargará de la paginación.
router.get('/hallazgos', getHallazgosList);

router.get('/admin-messages', async (req, res) => {
    try {
        const messages = await getAdminMessagesData();
        res.json({ success: true, data: messages });
    } catch (error) {
        logger.error(`❌ Error al obtener mensajes del administrador: ${error.message}`);
        res.status(500).json({ success: false, message: 'Error al obtener los mensajes del administrador.' });
    }
});

export default router;

