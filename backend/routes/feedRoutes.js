import express from 'express';
import { getStatsData } from '../controllers/feed/feedStatsController.js';
import { getAdminMessagesData } from '../controllers/feed/feedAdminMessagesController.js';
import { getHallazgosList } from '../controllers/hallazgos/hallazgosListController.js'; // ✅ Importa el nuevo controlador

const router = express.Router();

// ... (tus otras rutas)

// ✅ Nueva ruta para el listado de todos los hallazgos
router.get('/list', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        const hallazgos = await getHallazgosList(limit, offset);
        res.status(200).json(hallazgos);
    } catch (error) {
        logger.error(`Error al obtener la lista de hallazgos: ${error.message}`);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
});

router.get('/dashboard', async (req, res) => {
    try {
        const stats = await getStatsData();
        const messages = await getAdminMessagesData();
        res.status(200).json({ stats, messages });
    } catch (error) {
        logger.error(`Error al obtener datos del dashboard: ${error.message}`);
        res.status(500).json({ error: 'Error al cargar el panel de control.' });
    }
});

export default router;