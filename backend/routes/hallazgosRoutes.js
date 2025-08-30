// backend/routes/hallazgos/hallazgosRoutes.js

import express from 'express';
import {
    createHallazgoHandler,
    getAllHallazgos,
    getHallazgoById,
    updateHallazgo,
    deleteHallazgo,
    searchHallazgos
} from '../controllers/hallazgos/hallazgosController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import logger from '../utils/logger.js';

const router = express.Router();

// Middleware para loggear las solicitudes a estas rutas
router.use((req, res, next) => {
    logger.info(`🚨 Solicitud en la ruta de hallazgos: ${req.method} ${req.originalUrl}`);
    next();
});

// Ruta para crear un nuevo hallazgo
// POST /api/hallazgos/
router.post('/', authenticateToken, createHallazgoHandler);

// Ruta para obtener todos los hallazgos
// GET /api/hallazgos/
router.get('/', authenticateToken, getAllHallazgos);

// Ruta para buscar hallazgos por varios criterios
// GET /api/hallazgos/buscar?id_usuario_buscador=...&...
router.get('/buscar', authenticateToken, searchHallazgos);

// Ruta para obtener un hallazgo por ID
// GET /api/hallazgos/:id
router.get('/:id', authenticateToken, getHallazgoById);

// Ruta para actualizar un hallazgo por ID
// PUT /api/hallazgos/:id
router.put('/:id', authenticateToken, updateHallazgo);

// Ruta para eliminar un hallazgo por ID
// DELETE /api/hallazgos/:id
router.delete('/:id', authenticateToken, deleteHallazgo);

export default router;
