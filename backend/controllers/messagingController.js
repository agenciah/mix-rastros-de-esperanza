// backend/controllers/messagingController.js

import { 
    getConversations as dbGetConversations, 
    getMessagesByConversationId, 
    markMessagesAsRead as dbMarkMessagesAsRead, // CORRECCIÓN: Renombra la importación para evitar conflictos
    getOrCreateConversation, 
    insertNewMessage,
    createReport
} from '../db/queries/messagingQueries.js';
import { openDb } from '../db/users/initDb.js';

// Obtiene la lista de conversaciones
export const getConversations = async (req, res) => {
    try {
        const userId = req.user.id;
        
        console.log(`Intentando obtener conversaciones para el usuario con ID: ${userId}`);

        const conversations = await dbGetConversations(userId);
        
        console.log('Conversaciones obtenidas exitosamente:', conversations);

        res.json(conversations);
    } catch (error) {
        console.error('Error en getConversations:', error.message);
        res.status(500).json({ message: 'Error al obtener conversaciones', error: error.message });
    }
};

// Obtiene los mensajes de una conversación y los marca como leídos
export const getMessages = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const userId = req.user.id;

        const messages = await getMessagesByConversationId(conversationId);
        
        // Marcar mensajes como leídos
        await dbMarkMessagesAsRead(conversationId, userId); // CORRECCIÓN: Usa la función renombrada

        res.json(messages);
    } catch (error) {
        console.error('Error al obtener mensajes:', error.message);
        res.status(500).json({ message: 'Error al obtener mensajes', error: error.message });
    }
};

// Envía un nuevo mensaje
export const sendMessage = async (req, res) => {
    const { receiverId, content } = req.body;
    const senderId = req.user.id;

    if (senderId === receiverId) {
        return res.status(400).json({ message: "No puedes enviarte mensajes a ti mismo." });
    }

    try {
        const conversationId = await getOrCreateConversation(senderId, receiverId);
        // CORRECCIÓN: Ahora pasamos el receiverId a insertNewMessage
        await insertNewMessage(conversationId, senderId, receiverId, content);

        res.status(201).json({ message: "Mensaje enviado." });
    } catch (error) {
        console.error('Error al enviar mensaje:', error.message);
        res.status(500).json({ message: 'Error al enviar mensaje', error: error.message });
    }
};

/**
 * Inicia o recupera una conversación con otro usuario.
 */
export const startOrGetConversation = async (req, res) => {
    try {
        const userId = req.user.id;
        const { otherUserId } = req.body;

        if (!otherUserId) {
            return res.status(400).json({ message: 'El ID del otro usuario es requerido.' });
        }

        console.log(`Intentando iniciar o recuperar conversación para el usuario ${userId} con el usuario ${otherUserId}`);
        const conversationId = await getOrCreateConversation(userId, otherUserId);

        res.status(200).json({ conversationId });
    } catch (error) {
        console.error('Error en startOrGetConversation:', error.message);
        res.status(500).json({ message: 'Error al iniciar o recuperar la conversación.', error: error.message });
    }
};

// Nuevo controlador para marcar mensajes como leídos
export const markMessagesAsRead = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const userId = req.user.id;

        await dbMarkMessagesAsRead(conversationId, userId);

        res.status(200).json({ message: 'Mensajes marcados como leídos.' });
    } catch (error) {
        console.error('Error en markMessagesAsRead:', error.message);
        res.status(500).json({ message: 'Error al marcar mensajes como leídos.', error: error.message });
    }
};

/**
 * Permite a un usuario reportar una conversación por mal uso.
 */
export const reportConversation = async (req, res) => {
    try {
        const { conversationId, reportedUserId, reason } = req.body;
        const reporterId = req.user.id;

        if (!conversationId || !reportedUserId || !reason) {
            return res.status(400).json({ message: 'Faltan datos para crear el reporte.' });
        }

        const reportId = await createReport(conversationId, reporterId, reportedUserId, reason);

        res.status(201).json({ success: true, message: 'Reporte enviado con éxito. Un administrador lo revisará pronto.', reportId });

    } catch (error) {
        console.error('Error en reportConversation:', error.message);
        res.status(500).json({ message: 'Error al enviar el reporte.' });
    }
};