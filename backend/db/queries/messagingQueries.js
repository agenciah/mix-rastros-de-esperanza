// backend/db/queries/messagingQueries.js

import { openDb } from '../users/initDb.js';
import logger from '../../utils/logger.js';

/**
 * Inserta una notificación del sistema en la base de datos como un mensaje.
 */
export async function insertSystemNotification(receiverId, content, type, fichaId, hallazgoId) {
    const db = openDb();
    const systemUserId = 1; // ID del usuario "Sistema"

    try {
        let conversationResult = await db.query(`
            SELECT id FROM conversations
            WHERE (user1_id = $1 AND user2_id = $2) AND type = $3
        `, [systemUserId, receiverId, type]);

        let conversationId;

        if (conversationResult.rowCount > 0) {
            conversationId = conversationResult.rows[0].id;
        } else {
            const newConvResult = await db.query(`
                INSERT INTO conversations (user1_id, user2_id, type, last_message_at)
                VALUES ($1, $2, $3, NOW())
                RETURNING id
            `, [systemUserId, receiverId, type]);
            conversationId = newConvResult.rows[0].id;
        }

        await db.query(`
            INSERT INTO mensajes (conversation_id, id_remitente, id_destinatario, contenido, id_ficha, id_coincidencia)
            VALUES ($1, $2, $3, $4, $5, $6)
        `, [conversationId, systemUserId, receiverId, content, fichaId, hallazgoId]);
        
        logger.info(`Notificación de match insertada en la conversación ${conversationId}.`);
        return conversationId;
    } catch (error) {
        logger.error(`Error en insertSystemNotification (PostgreSQL): ${error.message}`);
        throw error;
    }
}

/**
 * Obtiene todas las conversaciones de un usuario.
 */
export async function getConversations(userId) {
    const db = openDb();
    const sql = `
        SELECT 
            c.id AS conversation_id,
            CASE
                WHEN c.user1_id = $1 THEN u2.nombre
                ELSE u1.nombre
            END AS other_user_name,
            CASE
                WHEN c.user1_id = $1 THEN u2.id
                ELSE u1.id
            END AS other_user_id,
            (SELECT contenido FROM mensajes WHERE conversation_id = c.id ORDER BY fecha_envio DESC LIMIT 1) AS last_message,
            c.last_message_at,
            (SELECT COUNT(*) FROM mensajes WHERE conversation_id = c.id AND estado_leido = 0 AND id_remitente != $1) AS unread_count
        FROM conversations c
        JOIN users u1 ON c.user1_id = u1.id
        JOIN users u2 ON c.user2_id = u2.id
        WHERE c.user1_id = $1 OR c.user2_id = $1
        ORDER BY c.last_message_at DESC
    `;
    try {
        const result = await db.query(sql, [userId]);
        return result.rows;
    } catch (error) {
        logger.error(`Error en getConversations (PostgreSQL): ${error.message}`);
        throw error;
    }
}

/**
 * Obtiene todos los mensajes de una conversación específica.
 */
export async function getMessagesByConversationId(conversationId) {
    const db = openDb();
    const sql = `
        SELECT m.*, u.nombre AS sender_name
        FROM mensajes m
        JOIN users u ON m.id_remitente = u.id
        WHERE m.conversation_id = $1
        ORDER BY m.fecha_envio ASC
    `;
    try {
        const result = await db.query(sql, [conversationId]);
        return result.rows;
    } catch (error) {
        logger.error(`Error en getMessagesByConversationId (PostgreSQL): ${error.message}`);
        throw error;
    }
}

/**
 * Marca todos los mensajes de una conversación como leídos para un usuario.
 */
export async function markMessagesAsRead(conversationId, userId) {
    const db = openDb();
    const sql = `
        UPDATE mensajes
        SET estado_leido = 1
        WHERE conversation_id = $1 AND id_remitente != $2
    `;
    try {
        await db.query(sql, [conversationId, userId]);
    } catch (error) {
        logger.error(`Error en markMessagesAsRead (PostgreSQL): ${error.message}`);
        throw error;
    }
}

/**
 * Inserta un nuevo mensaje en una conversación y actualiza el timestamp.
 */
export async function insertNewMessage(conversationId, senderId, receiverId, content) {
    const db = openDb();
    try {
        const result = await db.query(`
            INSERT INTO mensajes (conversation_id, id_remitente, id_destinatario, contenido)
            VALUES ($1, $2, $3, $4)
            RETURNING *
        `, [conversationId, senderId, receiverId, content]);
        
        await db.query(`
            UPDATE conversations
            SET last_message_at = NOW()
            WHERE id = $1
        `, [conversationId]);

        return result.rows[0];
    } catch (error) {
        logger.error(`Error en insertNewMessage (PostgreSQL): ${error.message}`);
        throw error;
    }
}

/**
 * Busca una conversación entre dos usuarios. Si no existe, crea una nueva.
 */
export async function getOrCreateConversation(user1Id, user2Id) {
    const db = openDb();
    const sortedIds = [user1Id, user2Id].sort((a, b) => a - b);
    const [normalizedUser1Id, normalizedUser2Id] = sortedIds;

    try {
        let conversationResult = await db.query(
            `SELECT id FROM conversations WHERE user1_id = $1 AND user2_id = $2`,
            [normalizedUser1Id, normalizedUser2Id]
        );

        if (conversationResult.rowCount > 0) {
            return conversationResult.rows[0].id;
        } else {
            const newConvResult = await db.query(
                `INSERT INTO conversations (user1_id, user2_id, created_at) VALUES ($1, $2, NOW()) RETURNING id`,
                [normalizedUser1Id, normalizedUser2Id]
            );
            return newConvResult.rows[0].id;
        }
    } catch (error) {
        logger.error('Error en getOrCreateConversation (PostgreSQL):', error);
        throw error;
    }
}

/**
 * Inserta una posible coincidencia en la base de datos para auditoría.
 */
export async function insertPossibleMatch(db, id_ficha, id_hallazgo, puntaje, criterios_match) {
    try {
        const result = await db.query(`
            INSERT INTO posibles_coincidencias (id_ficha, id_hallazgo, puntaje, criterios_match)
            VALUES ($1, $2, $3, $4)
            RETURNING id_posible_coincidencia
        `, [id_ficha, id_hallazgo, puntaje, JSON.stringify(criterios_match)]);
        
        return result.rows[0].id_posible_coincidencia;
    } catch (error) {
        logger.error(`Error al insertar posible coincidencia (PostgreSQL): ${error.message}`);
        throw error;
    }
}

/**
 * Crea un nuevo reporte de mal uso para una conversación.
 */
export async function createReport(conversationId, reportadorId, reportadoId, motivo) {
    const db = openDb();
    const sql = `
        INSERT INTO mensajes_reporte (conversation_id, id_reportador, id_reportado, motivo)
        VALUES ($1, $2, $3, $4)
        RETURNING id_reporte;
    `;
    try {
        const result = await db.query(sql, [conversationId, reportadorId, reportadoId, motivo]);
        return result.rows[0].id_reporte;
    } catch (error) {
        logger.error(`Error al crear reporte (PostgreSQL): ${error.message}`);
        throw error;
    }
}
