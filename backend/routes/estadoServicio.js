import express from 'express';
import { authenticateToken } from '../middleware/authMiddleware.js';

// Importaciones de controladores individuales
import { getEstadoServicio, putProgramarCancelacion, putCambiarEstadoServicio, putActualizarProximoPago } from '../controllers/estadoServicio/index.js';

const router = express.Router();

// ✅ Middleware de autenticación para todas las rutas
router.use(authenticateToken);

/**
 * GET /api/estado-servicio
 * - Devuelve el estado actual del servicio del usuario autenticado.
 */
router.get('/', (req, res, next) => {
  console.log('[estadoServicioRoutes] GET / - petición recibida');
  console.log('→ Usuario autenticado:', req.user); // gracias a authenticateToken
  next();
}, getEstadoServicio);

/**
 * PUT /api/estado-servicio/cancelacion
 * - Programa una cancelación del servicio para el próximo corte.
 */
router.put('/cancelacion', putProgramarCancelacion);

/**
 * PUT /api/estado-servicio/estado
 * - Cambia el estado del servicio (activo/inactivo manualmente).
 */
router.put('/estado', putCambiarEstadoServicio);

/**
 * PUT /api/estado-servicio/proximo-pago
 * - Actualiza la fecha del próximo cobro automático (útil si se reprograma el ciclo).
 */
router.put('/proximo-pago', putActualizarProximoPago);

export default router;
