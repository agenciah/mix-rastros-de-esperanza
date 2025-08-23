// routes/cancelaciones.js
import express from 'express';
import {
  solicitarCancelacion,
  cancelarReversion,
  obtenerCancelacionActivaController
} from '../controllers/cancelacionesController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', authenticateToken, solicitarCancelacion);
router.post('/revertir', authenticateToken, cancelarReversion);
router.get('/', authenticateToken, obtenerCancelacionActivaController); // Deja solo esta

export default router;
