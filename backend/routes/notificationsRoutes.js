// RUTA: backend/routes/notificationsRoutes.js

import express from 'express';
import { getNotifications, markAllAsRead } from '../controllers/notificationsController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// GET /api/notifications - Obtener las notificaciones del usuario
router.get('/', authenticateToken, getNotifications);

// PUT /api/notifications/read - Marcar todas las notificaciones como leídas
router.put('/read', authenticateToken, markAllAsRead);

export default router;