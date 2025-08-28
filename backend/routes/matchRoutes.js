// backend/routes/hallazgos/matchRoutes.js
import express from 'express';
import { findMatchesForHallazgo } from '../controllers/hallazgos/matchController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import logger from '../utils/logger.js';
import { getHallazgoById } from '../controllers/hallazgos/hallazgosController.js';

const router = express.Router();

// Middleware para loggear las solicitudes a estas rutas
router.use((req, res, next) => {
    logger.info(`🚨 Solicitud en la ruta de coincidencias: ${req.method} ${req.originalUrl}`);
    next();
});

// Ruta para buscar coincidencias para un hallazgo específico por su ID
// GET /api/matches/forHallazgo/:id
router.get('/forHallazgo/:id', authenticateToken, async (req, res) => {
    try {
        const idHallazgo = req.params.id;
        // Primero obtenemos los datos completos del hallazgo
        const hallazgoResult = await getHallazgoById(idHallazgo);

        if (!hallazgoResult.success) {
            return res.status(404).json(hallazgoResult);
        }

        // Luego usamos esos datos para buscar coincidencias
        const matches = await findMatchesForHallazgo(hallazgoResult.data);
        
        res.status(200).json({
            success: true,
            message: 'Búsqueda de coincidencias completada.',
            id_hallazgo: idHallazgo,
            matches: matches || []
        });
    } catch (error) {
        logger.error(`❌ Error en la ruta de búsqueda de coincidencias: ${error.message}`);
        res.status(500).json({ success: false, message: error.message });
    }
});

export default router;
