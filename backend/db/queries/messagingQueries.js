// backend/db/queries/messagingQueries.js

import { openDb } from '../users/initDb.js';
import logger from '../../utils/logger.js';

/**
 * Inserta una notificación del sistema en la base de datos como un mensaje.
 * @param {number} receiverId - El ID del usuario que recibirá la notificación.
 * @param {string} content - El contenido del mensaje de la notificación.
 * @param {string} type - El tipo de notificación (ej. 'match_found').
 * @param {number} fichaId - El ID de la ficha de desaparición.
 * @param {number} hallazgoId - El ID del hallazgo.
 */
export async function insertSystemNotification(receiverId, content, type, fichaId, hallazgoId) {
    const db = await openDb();
    const systemUserId = 1; // ID del usuario "Sistema"

    // Buscamos si ya existe una conversación de este tipo para no crear una nueva
    let conversation = await db.get(`
        SELECT id FROM conversations
        WHERE (user1_id = ? AND user2_id = ?) AND type = ?
    `, [systemUserId, receiverId, type]);

    if (!conversation) {
        const result = await db.run(`
            INSERT INTO conversations (user1_id, user2_id, type, last_message_at)
            VALUES (?, ?, ?, datetime('now'))
        `, [systemUserId, receiverId, type]);
        conversation = { id: result.lastID };
    }

    await db.run(`
        INSERT INTO mensajes (conversation_id, id_remitente, id_destinatario, contenido, id_ficha, id_coincidencia)
        VALUES (?, ?, ?, ?, ?, ?)
    `, [conversation.id, systemUserId, receiverId, content, fichaId, hallazgoId]);
    
    // Aquí puedes agregar un log para depuración si es necesario
    logger.info(`Notificación de match insertada en la conversación ${conversation.id}.`);

    return conversation.id;
}

/**
 * Obtiene todas las conversaciones de un usuario, ordenadas por el último mensaje.
 * @param {number} userId - El ID del usuario.
 */
export async function getConversations(userId) {
    const db = await openDb();

    // Consulta simplificada para evitar errores de orden de parámetros
    return db.all(`
        SELECT 
            c.id AS conversation_id,
            CASE
                WHEN c.user1_id = ? THEN u2.nombre
                ELSE u1.nombre
            END AS other_user_name,
            CASE
                WHEN c.user1_id = ? THEN u2.id
                ELSE u1.id
            END AS other_user_id,
            (SELECT contenido FROM mensajes WHERE conversation_id = c.id ORDER BY fecha_envio DESC LIMIT 1) AS last_message,
            c.last_message_at,
            (SELECT COUNT(*) FROM mensajes WHERE conversation_id = c.id AND estado_leido = 0 AND id_remitente != ?) AS unread_count
        FROM conversations c
        JOIN users u1 ON c.user1_id = u1.id
        JOIN users u2 ON c.user2_id = u2.id
        WHERE c.user1_id = ? OR c.user2_id = ?
        ORDER BY c.last_message_at DESC
    `, [userId, userId, userId, userId, userId]);
}

/**
 * Obtiene todos los mensajes de una conversación específica.
 * @param {number} conversationId - El ID de la conversación.
 */
export async function getMessagesByConversationId(conversationId) {
    const db = await openDb();
    return db.all(`
        SELECT m.*, u.nombre AS sender_name
        FROM mensajes m
        JOIN users u ON m.id_remitente = u.id
        WHERE m.conversation_id = ?
        ORDER BY m.fecha_envio ASC
    `, [conversationId]);
}

/**
 * Marca todos los mensajes de una conversación como leídos para un usuario.
 * @param {number} conversationId - El ID de la conversación.
 * @param {number} userId - El ID del usuario.
 */
export async function markMessagesAsRead(conversationId, userId) {
    const db = await openDb();
    await db.run(`
        UPDATE mensajes
        SET estado_leido = 1
        WHERE conversation_id = ? AND id_remitente != ?
    `, [conversationId, userId]);
}

/**
 * Inserta un nuevo mensaje en una conversación y actualiza el timestamp.
 * * CORRECCIÓN: Ahora recibe el receiverId y lo incluye en la consulta.
 * Esto asegura que todos los campos NOT NULL de la tabla 'mensajes'
 * tengan un valor válido.
 * * @param {number} conversationId - El ID de la conversación.
 * @param {number} senderId - El ID del usuario que envía el mensaje.
 * @param {number} receiverId - El ID del usuario que recibe el mensaje.
 * @param {string} content - El contenido del mensaje.
 */
export async function insertNewMessage(conversationId, senderId, receiverId, content) {
    const db = await openDb();
    await db.run(`
        INSERT INTO mensajes (conversation_id, id_remitente, id_destinatario, contenido)
        VALUES (?, ?, ?, ?)
    `, [conversationId, senderId, receiverId, content]);
    
    await db.run(`
        UPDATE conversations
        SET last_message_at = datetime('now')
        WHERE id = ?
    `, [conversationId]);
}

/**
 * Busca una conversación entre dos usuarios. Si no existe, crea una nueva.
 * @param {number} user1Id - El ID del primer usuario.
 * @param {number} user2Id - El ID del segundo usuario.
 * @returns {Promise<number>} - El ID de la conversación.
 */
export async function getOrCreateConversation(user1Id, user2Id) {
    const db = await openDb();

    // Normaliza los IDs para que el orden no importe
    const sortedIds = [user1Id, user2Id].sort((a, b) => a - b);
    const normalizedUser1Id = sortedIds[0];
    const normalizedUser2Id = sortedIds[1];

    try {
        // 1. Busca una conversación existente
        const conversation = await db.get(
            `SELECT id FROM conversations WHERE user1_id = ? AND user2_id = ?`,
            [normalizedUser1Id, normalizedUser2Id]
        );

        if (conversation) {
            console.log(`Conversación existente encontrada: ${conversation.id}`);
            return conversation.id;
        }

        // 2. Si no existe, crea una nueva conversación
        console.log(`Creando nueva conversación entre los usuarios ${user1Id} y ${user2Id}`);
        const result = await db.run(
            `INSERT INTO conversations (user1_id, user2_id, created_at) VALUES (?, ?, datetime('now'))`,
            [normalizedUser1Id, normalizedUser2Id]
        );

        const newConversationId = result.lastID;
        console.log(`Conversación creada con el ID: ${newConversationId}`);
        return newConversationId;

    } catch (error) {
        console.error('Error en getOrCreateConversation:', error);
        throw error;
    }
}

// ===========================================
// 🚨 NUEVA FUNCIÓN: INSERTAR POSIBLE COINCIDENCIA
// ===========================================

/**
 * Inserta una posible coincidencia en la base de datos para auditoría.
 * @param {object} db - Instancia de la base de datos.
 * @param {number} id_ficha - ID de la ficha de desaparición.
 * @param {number} id_hallazgo - ID del hallazgo.
 * @param {number} puntaje - Puntuación de la coincidencia.
 * @param {Array<string>} criterios_match - Lista de criterios que coincidieron.
 */
export async function insertPossibleMatch(db, id_ficha, id_hallazgo, puntaje, criterios_match) {
    try {
        const result = await db.run(`
            INSERT INTO posibles_coincidencias (id_ficha, id_hallazgo, puntaje, criterios_match)
            VALUES (?, ?, ?, ?)
        `, [id_ficha, id_hallazgo, puntaje, JSON.stringify(criterios_match)]);
        
        return result.lastID;
    } catch (error) {
        logger.error(`Error al insertar posible coincidencia: ${error.message}`);
        throw error;
    }
}