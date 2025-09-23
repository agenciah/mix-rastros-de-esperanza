// RUTA: backend/db/admin/adminQueriesMessages.js

import { openDb } from '../users/initDb.js';
import logger from '../../utils/logger.js';

/**
 * Inserta un nuevo mensaje del administrador en la base de datos.
 * @param {object} messageData - Datos del mensaje.
 * @returns {Promise<object>} - Resultado de la inserción.
 */
export const createAdminMessage = async ({ titulo, contenido, tipo_mensaje, id_admin }) => {
    const db = openDb();
    const sql = `
        INSERT INTO mensajes_administrador (titulo, contenido, tipo_mensaje, id_admin)
        VALUES ($1, $2, $3, $4)
        RETURNING id_mensaje;
    `;
    try {
        const result = await db.query(sql, [titulo, contenido, tipo_mensaje, id_admin]);
        return { success: true, id_mensaje: result.rows[0].id_mensaje };
    } catch (error) {
        logger.error(`❌ Error al crear mensaje de admin (PostgreSQL): ${error.message}`);
        throw error;
    }
};

/**
 * Obtiene todos los mensajes del administrador para el panel de gestión.
 * @returns {Promise<Array<object>>} - Lista de todos los mensajes.
 */
export const getAllAdminMessages = async () => {
    const db = openDb();
    const sql = `SELECT * FROM mensajes_administrador ORDER BY fecha_creacion DESC;`;
    try {
        const result = await db.query(sql);
        return result.rows;
    } catch (error) {
        logger.error(`❌ Error al obtener todos los mensajes de admin (PostgreSQL): ${error.message}`);
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
    const db = openDb();
    const sql = `UPDATE mensajes_administrador SET titulo = $1, contenido = $2 WHERE id_mensaje = $3;`;
    try {
        await db.query(sql, [titulo, contenido, id_mensaje]);
        return { success: true };
    } catch (error) {
        logger.error(`❌ Error al actualizar mensaje de admin ${id_mensaje} (PostgreSQL): ${error.message}`);
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
    const db = openDb();
    const sql = `UPDATE mensajes_administrador SET estado = $1 WHERE id_mensaje = $2;`;
    try {
        await db.query(sql, [estado, id_mensaje]);
        return { success: true };
    } catch (error) {
        logger.error(`❌ Error al cambiar estado del mensaje ${id_mensaje} (PostgreSQL): ${error.message}`);
        throw error;
    }
};
