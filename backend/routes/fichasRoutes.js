// backend/routes/fichas/fichasRoutes.js

import express from 'express';
import {
    createFichaDesaparicion,
    getAllFichas,
    getFichaById,
    actualizarFicha,
    deleteFichaDesaparicion,
    searchFichas,
    obtenerCatalogoTiposLugar,
    obtenerCatalogoPartesCuerpo,
    obtenerCatalogoPrendas,
} from '../controllers/fichas/fichasController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import logger from '../utils/logger.js';

const router = express.Router();

// Middleware para loggear las solicitudes a estas rutas
router.use((req, res, next) => {
    logger.info(`🚨 Solicitud en la ruta de fichas: ${req.method} ${req.originalUrl}`);
    next();
});

// Rutas para Fichas de Desaparición
// POST /api/fichas/
router.post('/', authenticateToken, async (req, res) => {
    try {
        const result = await createFichaDesaparicion(req.body);
        if (!result.success && result.matches) {
            return res.status(200).json(result); // Devolver coincidencias al cliente
        }
        res.status(201).json(result);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET /api/fichas/
router.get('/', authenticateToken, async (req, res) => {
    try {
        const result = await getAllFichas();
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET /api/fichas/buscar
router.get('/buscar', authenticateToken, async (req, res) => {
    try {
        const result = await searchFichas(req.query);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET /api/fichas/:id
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const result = await getFichaById(req.params.id);
        if (!result.success) {
            return res.status(404).json(result);
        }
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// PUT /api/fichas/:id
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        // Se cambió el nombre de la función a 'actualizarFicha' para uniformidad.
        const result = await actualizarFicha(req.params.id, req.body);
        if (!result.success) {
            const statusCode = result.message.includes('encontrado') ? 404 : 403;
            return res.status(statusCode).json(result);
        }
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// DELETE /api/fichas/:id
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const result = await deleteFichaDesaparicion(req.params.id, req.user.id_usuario);
        if (!result.success) {
            const statusCode = result.message.includes('encontrado') ? 404 : 403;
            return res.status(statusCode).json(result);
        }
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});


// Rutas para Catálogos (sin autenticación, ya que son datos públicos)
// GET /api/fichas/catalogos/tipos-lugar
router.get('/catalogos/tipos-lugar', async (req, res) => {
    try {
        const result = await obtenerCatalogoTiposLugar();
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET /api/fichas/catalogos/partes-cuerpo
router.get('/catalogos/partes-cuerpo', async (req, res) => {
    try {
        const result = await obtenerCatalogoPartesCuerpo();
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET /api/fichas/catalogos/prendas
router.get('/catalogos/prendas', async (req, res) => {
    try {
        const result = await obtenerCatalogoPrendas();
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

export default router;