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
router.post('/', authenticateToken, createFichaDesaparicion);

// GET /api/fichas/
// GET /api/fichas/
// GET /api/fichas/ - Obtener todas las fichas
router.get('/', authenticateToken, getAllFichas);

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
router.get('/:id', authenticateToken, getFichaById)

// PUT /api/fichas/:id
router.put('/:id', authenticateToken, actualizarFicha);

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

// GET /api/fichas/catalogos/tipos-lugar
router.get('/catalogos/tipos-lugar', async (req, res) => {
  try {
    await obtenerCatalogoTiposLugar(req, res);
  } catch (err) {
    console.error("Error en ruta /tipos-lugar:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/fichas/catalogos/partes-cuerpo
router.get('/catalogos/partes-cuerpo', async (req, res) => {
  try {
    await obtenerCatalogoPartesCuerpo(req, res);
  } catch (err) {
    console.error("Error en ruta /partes-cuerpo:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/fichas/catalogos/prendas
router.get('/catalogos/prendas', async (req, res) => {
  try {
    await obtenerCatalogoPrendas(req, res);
  } catch (err) {
    console.error("Error en ruta /prendas:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;