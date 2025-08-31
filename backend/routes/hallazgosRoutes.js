import express from 'express';
import {
    createHallazgo,
    getAllHallazgos,
    getHallazgoById,
    actualizarHallazgo,
    deleteHallazgo,
    searchHallazgos,
    obtenerCatalogoTiposLugar,
    obtenerCatalogoPartesCuerpo,
    obtenerCatalogoPrendas,
} from '../controllers/hallazgos/hallazgosController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import logger from '../utils/logger.js';

const router = express.Router();

// Middleware para loggear las solicitudes a estas rutas
router.use((req, res, next) => {
    logger.info(`🚨 Solicitud en la ruta de hallazgos: ${req.method} ${req.originalUrl}`);
    next();
});

// Rutas para Hallazgos
// POST /api/hallazgos/
router.post('/', authenticateToken, createHallazgo);

// GET /api/hallazgos/
router.get('/', authenticateToken, getAllHallazgos);

// GET /api/hallazgos/buscar
router.get('/buscar', authenticateToken, searchHallazgos);

// GET /api/hallazgos/:id
router.get('/:id', authenticateToken, getHallazgoById);

// PUT /api/hallazgos/:id
router.put('/:id', authenticateToken, actualizarHallazgo);

// DELETE /api/hallazgos/:id
router.delete('/:id', authenticateToken, deleteHallazgo);

// Rutas para catálogos
// GET /api/hallazgos/catalogos/tipos-lugar
router.get('/catalogos/tipos-lugar', obtenerCatalogoTiposLugar);

// GET /api/hallazgos/catalogos/partes-cuerpo
router.get('/catalogos/partes-cuerpo', obtenerCatalogoPartesCuerpo);

// GET /api/hallazgos/catalogos/prendas
router.get('/catalogos/prendas', obtenerCatalogoPrendas);

export default router;
