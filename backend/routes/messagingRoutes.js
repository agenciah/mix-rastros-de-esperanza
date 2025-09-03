// backend/routes/messagingRoutes.js

import express from 'express';
import { getConversations, getMessages, sendMessage, startOrGetConversation, markMessagesAsRead } from '../controllers/messagingController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Ruta para obtener todas las conversaciones del usuario
router.get('/conversations', authenticateToken, getConversations);

// Ruta para obtener los mensajes de una conversación específica
router.get('/conversations/:conversationId/messages', authenticateToken, getMessages);

// Ruta para marcar mensajes como leídos
router.put('/conversations/:conversationId/read', authenticateToken, markMessagesAsRead); // <-- ¡La nueva ruta que falta!

// Ruta para enviar un nuevo mensaje
router.post('/messages', authenticateToken, sendMessage);

// Ruta para iniciar una nueva conversación
router.post('/conversations', authenticateToken, startOrGetConversation);

export default router;