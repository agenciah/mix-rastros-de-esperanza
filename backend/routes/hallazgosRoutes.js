// backend/routes/hallazgos/hallazgosRoutes.js

import express from 'express';
import {
    createHallazgo,
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
router.post('/', authenticateToken, async (req, res) => {
    try {
        // La lógica de coincidencia y notificación se maneja ahora dentro del controlador.
        // La respuesta del controlador siempre incluirá el hallazgo creado y, si las hay, las coincidencias.
        const result = await createHallazgo(req.body);
        res.status(201).json(result);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Ruta para obtener todos los hallazgos
// GET /api/hallazgos/
router.get('/', async (req, res) => {
    try {
        const result = await getAllHallazgos();
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Ruta para buscar hallazgos por varios criterios
// GET /api/hallazgos/buscar?id_usuario_buscador=...&...
router.get('/buscar', async (req, res) => {
    try {
        const result = await searchHallazgos(req.query);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Ruta para obtener un hallazgo por ID
// GET /api/hallazgos/:id
router.get('/:id', async (req, res) => {
    try {
        const result = await getHallazgoById(req.params.id);
        if (!result.success) {
            return res.status(404).json(result);
        }
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Ruta para actualizar un hallazgo por ID
// PUT /api/hallazgos/:id
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const result = await updateHallazgo(req.params.id, req.body);
        if (!result.success) {
            const statusCode = result.message.includes('encontrado') ? 404 : 403;
            return res.status(statusCode).json(result);
        }
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Ruta para eliminar un hallazgo por ID
// DELETE /api/hallazgos/:id
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const result = await deleteHallazgo(req.params.id, req.user.id_usuario);
        if (!result.success) {
            const statusCode = result.message.includes('encontrado') ? 404 : 403;
            return res.status(statusCode).json(result);
        }
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

export default router;
