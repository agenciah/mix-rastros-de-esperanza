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
    getHallazgosByUserId,
    searchHallazgosFeed
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

// Rutas de búsqueda y específicas
// GET /api/hallazgos/feed/search -> ¡NUEVA RUTA para la barra de búsqueda del feed!
router.get('/feed/search', authenticateToken, searchHallazgosFeed);

// GET /api/hallazgos/by-user -> ¡Esta debe ir primero!
router.get('/by-user', authenticateToken, getHallazgosByUserId);

// GET /api/hallazgos/buscar -> También es una ruta específica, debe ir antes de :id
router.get('/buscar', authenticateToken, searchHallazgos);

// GET /api/hallazgos/:id -> Esta es la más genérica y debe ir después de las anteriores
router.get('/:id', authenticateToken, getHallazgoById);

// GET /api/hallazgos/
router.get('/', authenticateToken, getAllHallazgos);

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