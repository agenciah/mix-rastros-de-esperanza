// RUTA: backend/db/admin/adminQueriesMessages.js

import { openDb } from '../users/initDb.js';
import logger from '../../utils/logger.js';

/**
 * Inserta un nuevo mensaje del administrador en la base de datos.
 * @param {object} messageData - Datos del mensaje.
 * @param {string} messageData.titulo - Título del mensaje.
 * @param {string} messageData.contenido - Cuerpo del mensaje.
 * @param {string} messageData.tipo_mensaje - Tipo (ej. 'info', 'alerta').
 * @param {number} messageData.id_admin - ID del admin que lo crea.
 * @returns {Promise<object>} - Resultado de la inserción.
 */
export const createAdminMessage = async ({ titulo, contenido, tipo_mensaje, id_admin }) => {
    const db = await openDb();
    const sql = `
        INSERT INTO mensajes_administrador (titulo, contenido, tipo_mensaje, id_admin)
        VALUES (?, ?, ?, ?);
    `;
    try {
        const result = await db.run(sql, [titulo, contenido, tipo_mensaje, id_admin]);
        return { success: true, id_mensaje: result.lastID };
    } catch (error) {
        logger.error(`❌ Error al crear mensaje de admin: ${error.message}`);
        throw error;
    }
};

// --- AÑADE ESTAS TRES NUEVAS FUNCIONES ---

/**
 * Obtiene todos los mensajes del administrador para el panel de gestión.
 * @returns {Promise<Array<object>>} - Lista de todos los mensajes.
 */
export const getAllAdminMessages = async () => {
    const db = await openDb();
    const sql = `SELECT * FROM mensajes_administrador ORDER BY fecha_creacion DESC;`;
    try {
        return await db.all(sql);
    } catch (error) {
        logger.error(`❌ Error al obtener todos los mensajes de admin: ${error.message}`);
        throw error;
    }
};

/**
 * Actualiza el contenido de un mensaje existente.
 * @param {number} id_mensaje - ID del mensaje a editar.
 * @param {string} titulo - Nuevo título.
 * @param {string} contenido - Nuevo contenido.
 * @returns {Promise<object>} - Resultado de la actualización.
 */
export const updateAdminMessage = async (id_mensaje, { titulo, contenido }) => {
    const db = await openDb();
    const sql = `UPDATE mensajes_administrador SET titulo = ?, contenido = ? WHERE id_mensaje = ?;`;
    try {
        return await db.run(sql, [titulo, contenido, id_mensaje]);
    } catch (error) {
        logger.error(`❌ Error al actualizar mensaje de admin ${id_mensaje}: ${error.message}`);
        throw error;
    }
};

/**
 * Cambia el estado de un mensaje (ej. 'activo' a 'archivado').
 * @param {number} id_mensaje - ID del mensaje.
 * @param {string} estado - Nuevo estado.
 * @returns {Promise<object>} - Resultado de la actualización.
 */
export const updateAdminMessageStatus = async (id_mensaje, estado) => {
    const db = await openDb();
    const sql = `UPDATE mensajes_administrador SET estado = ? WHERE id_mensaje = ?;`;
    try {
        return await db.run(sql, [estado, id_mensaje]);
    } catch (error) {
        logger.error(`❌ Error al cambiar estado del mensaje ${id_mensaje}: ${error.message}`);
        throw error;
    }
};