// backend/controllers/hallazgos/hallazgosController.js
import { openDb } from '../../db/users/initDb.js';
import { findMatchesForHallazgo } from './matchController.js'; 
import { sendMatchNotification } from '../../utils/emailService.js';
import logger from '../../utils/logger.js';

/**
 * Crea un nuevo hallazgo en la base de datos y luego busca coincidencias.
 * El flujo se ha cambiado para asegurar que cada hallazgo es registrado,
 * independientemente de si se encuentra una coincidencia inmediata.
 * * @param {Object} data - Datos del hallazgo.
 * @param {number} data.id_usuario_buscador - ID del usuario que reporta.
 * @param {number} [data.id_ubicacion_hallazgo] - ID de la ubicación.
 * @param {number} [data.id_tipo_lugar_hallazgo] - ID del tipo de lugar.
 * @param {string} data.fecha_hallazgo - Fecha del hallazgo.
 * @param {string} [data.descripcion_general_hallazgo] - Descripción.
 * @param {Array<Object>} [data.caracteristicas_hallazgo] - Lista de características.
 * @param {Array<Object>} [data.vestimenta_hallazgo] - Lista de prendas.
 * @returns {Promise<Object>} Promesa que resuelve con el ID del nuevo hallazgo y posibles coincidencias.
 */
export const createHallazgo = async (data) => {
    let db;
    try {
        db = await openDb();
        await db.run('BEGIN TRANSACTION');

        // Paso 1: Insertar el nuevo hallazgo en la tabla principal
        const hallazgoSql = `
            INSERT INTO hallazgos (id_usuario_buscador, id_ubicacion_hallazgo, id_tipo_lugar_hallazgo, fecha_hallazgo, descripcion_general_hallazgo)
            VALUES (?, ?, ?, ?, ?)
        `;
        const result = await db.run(
            hallazgoSql,
            [data.id_usuario_buscador, data.id_ubicacion_hallazgo || null, data.id_tipo_lugar_hallazgo || null, data.fecha_hallazgo, data.descripcion_general_hallazgo || null]
        );
        const idHallazgo = result.lastID;

        // Paso 2: Insertar características (antes rasgos) asociadas al hallazgo
        if (data.caracteristicas_hallazgo && data.caracteristicas_hallazgo.length > 0) {
            const stmtCaracteristicas = await db.prepare(`INSERT INTO hallazgo_caracteristicas (id_hallazgo, id_parte_cuerpo, tipo_caracteristica, descripcion_detalle, foto_evidencia) VALUES (?, ?, ?, ?, ?)`);
            for (const caracteristica of data.caracteristicas_hallazgo) {
                await stmtCaracteristicas.run(
                    [idHallazgo, caracteristica.id_parte_cuerpo, caracteristica.tipo_caracteristica || 'N/A', caracteristica.descripcion_detalle || null, caracteristica.foto_evidencia || null]
                );
            }
            await stmtCaracteristicas.finalize();
        }

        // Paso 3: Insertar vestimenta asociada al hallazgo
        if (data.vestimenta_hallazgo && data.vestimenta_hallazgo.length > 0) {
            const stmtVestimenta = await db.prepare(`INSERT INTO hallazgo_vestimenta (id_hallazgo, id_prenda, color, marca, caracteristica_especial, foto_evidencia) VALUES (?, ?, ?, ?, ?, ?)`);
            for (const prenda of data.vestimenta_hallazgo) {
                await stmtVestimenta.run(
                    [idHallazgo, prenda.id_prenda || null, prenda.color || null, prenda.marca || null, prenda.caracteristica_especial || null, prenda.foto_evidencia || null]
                );
            }
            await stmtVestimenta.finalize();
        }

        await db.run('COMMIT');

        logger.info(`✅ Hallazgo con ID ${idHallazgo} creado exitosamente.`);

        // Paso 4: Buscar coincidencias después de la creación
        // Le pasamos el ID del nuevo hallazgo para que la función de matching lo utilice
        const matches = await findMatchesForHallazgo({ ...data, id_hallazgo: idHallazgo });

        // Paso 5: Enviar notificaciones si se encontraron coincidencias
        if (matches && matches.length > 0) {
            for (const match of matches) {
                // Obtenemos el email del usuario para enviar la notificación
                const userEmail = await db.get(`SELECT email FROM usuarios WHERE id_usuario = ?`, [match.id_usuario_reporta]);
                if (userEmail) {
                    await sendMatchNotification(userEmail.email, 'Posible Coincidencia de Hallazgo', 'Hemos encontrado una posible coincidencia para la persona que reportaste. Por favor, revisa los detalles.');
                    logger.info(`📧 Correo de notificación enviado a ${userEmail.email} por la coincidencia en el hallazgo.`);
                }
            }
        }

        return { 
            success: true, 
            message: 'Hallazgo creado y procesado exitosamente.', 
            id_hallazgo: idHallazgo,
            matches: matches || []
        };

    } catch (error) {
        if (db) {
            await db.run('ROLLBACK');
        }
        logger.error(`❌ Error al crear hallazgo: ${error.message}`);
        throw new Error('Error interno del servidor al crear el hallazgo.');
    }
};

/**
 * Obtiene todos los hallazgos con sus detalles completos.
 * @returns {Promise<Object>} Promesa que resuelve con una lista de hallazgos.
 */
export const getAllHallazgos = async () => {
    try {
        const db = await openDb();
        const hallazgos = await db.all(`SELECT * FROM hallazgos`);

        const hallazgosCompletos = await Promise.all(hallazgos.map(async (hallazgo) => {
            const caracteristicas = await db.all(`
                SELECT h.tipo_caracteristica, h.descripcion_detalle, cpc.nombre_parte 
                FROM hallazgo_caracteristicas h 
                JOIN catalogo_partes_cuerpo cpc ON h.id_parte_cuerpo = cpc.id_parte_cuerpo 
                WHERE h.id_hallazgo = ?`, [hallazgo.id_hallazgo]);
            
            const vestimenta = await db.all(`
                SELECT hv.color, hv.marca, hv.caracteristica_especial, cp.tipo_prenda 
                FROM hallazgo_vestimenta hv 
                JOIN catalogo_prendas cp ON hv.id_prenda = cp.id_prenda 
                WHERE hv.id_hallazgo = ?`, [hallazgo.id_hallazgo]);

            return { ...hallazgo, caracteristicas: caracteristicas, vestimenta: vestimenta };
        }));

        return { success: true, data: hallazgosCompletos };
    } catch (error) {
        logger.error(`❌ Error al obtener todos los hallazgos: ${error.message}`);
        throw new Error('Error al obtener los hallazgos.');
    }
};


/**
 * Obtiene un hallazgo específico por su ID.
 * @param {number} idHallazgo - El ID del hallazgo a buscar.
 * @returns {Promise<Object>} Promesa que resuelve con el hallazgo completo o un error.
 */
export const getHallazgoById = async (idHallazgo) => {
    try {
        const db = await openDb();
        const hallazgo = await db.get(`SELECT * FROM hallazgos WHERE id_hallazgo = ?`, [idHallazgo]);

        if (!hallazgo) {
            return { success: false, message: 'Hallazgo no encontrado.' };
        }

        const caracteristicas = await db.all(`
            SELECT h.tipo_caracteristica, h.descripcion_detalle, cpc.nombre_parte 
            FROM hallazgo_caracteristicas h 
            JOIN catalogo_partes_cuerpo cpc ON h.id_parte_cuerpo = cpc.id_parte_cuerpo 
            WHERE h.id_hallazgo = ?`, [hallazgo.id_hallazgo]);
        
        const vestimenta = await db.all(`
            SELECT hv.color, hv.marca, hv.caracteristica_especial, cp.tipo_prenda 
            FROM hallazgo_vestimenta hv 
            JOIN catalogo_prendas cp ON hv.id_prenda = cp.id_prenda 
            WHERE hv.id_hallazgo = ?`, [hallazgo.id_hallazgo]);

        return { success: true, data: { ...hallazgo, caracteristicas, vestimenta } };
    } catch (error) {
        logger.error(`❌ Error al obtener hallazgo por ID: ${error.message}`);
        throw new Error('Error al obtener el hallazgo.');
    }
};

/**
 * Actualiza un hallazgo existente, incluyendo sus características y vestimenta.
 * @param {number} idHallazgo - ID del hallazgo a actualizar.
 * @param {Object} data - Datos actualizados del hallazgo.
 * @param {number} data.id_usuario_buscador - ID del usuario que intenta actualizar el hallazgo.
 * @param {number} [data.id_ubicacion_hallazgo] - ID de la ubicación.
 * @param {number} [data.id_tipo_lugar_hallazgo] - ID del tipo de lugar.
 * @param {string} [data.fecha_hallazgo] - Fecha del hallazgo.
 * @param {string} [data.descripcion_general_hallazgo] - Descripción.
 * @param {Array<Object>} [data.caracteristicas_hallazgo] - Lista de características.
 * @param {Array<Object>} [data.vestimenta_hallazgo] - Lista de prendas.
 * @returns {Promise<Object>} Promesa que resuelve con un mensaje de éxito o un error.
 */
export const updateHallazgo = async (idHallazgo, data) => {
    let db;
    try {
        db = await openDb();

        const row = await db.get('SELECT id_usuario_buscador FROM hallazgos WHERE id_hallazgo = ?', [idHallazgo]);
        if (!row) {
            return { success: false, message: 'Hallazgo no encontrado.' };
        }
        if (row.id_usuario_buscador !== data.id_usuario_buscador) {
            return { success: false, message: 'Acceso denegado. No eres el propietario de este hallazgo.' };
        }

        await db.run('BEGIN TRANSACTION');

        const updateSql = `
            UPDATE hallazgos
            SET 
                id_ubicacion_hallazgo = ?, 
                id_tipo_lugar_hallazgo = ?, 
                fecha_hallazgo = ?, 
                descripcion_general_hallazgo = ?
            WHERE id_hallazgo = ?
        `;
        await db.run(
            updateSql,
            [data.id_ubicacion_hallazgo || null, data.id_tipo_lugar_hallazgo || null, data.fecha_hallazgo, data.descripcion_general_hallazgo || null, idHallazgo]
        );

        // Actualizar características (borrar y reinsertar)
        await db.run('DELETE FROM hallazgo_caracteristicas WHERE id_hallazgo = ?', [idHallazgo]);
        if (data.caracteristicas_hallazgo && data.caracteristicas_hallazgo.length > 0) {
            const stmtCaracteristicas = await db.prepare(`INSERT INTO hallazgo_caracteristicas (id_hallazgo, id_parte_cuerpo, tipo_caracteristica, descripcion_detalle, foto_evidencia) VALUES (?, ?, ?, ?, ?)`);
            for (const caracteristica of data.caracteristicas_hallazgo) {
                await stmtCaracteristicas.run([idHallazgo, caracteristica.id_parte_cuerpo, caracteristica.tipo_caracteristica, caracteristica.descripcion_detalle, caracteristica.foto_evidencia]);
            }
            await stmtCaracteristicas.finalize();
        }

        // Actualizar vestimenta (borrar y reinsertar)
        await db.run('DELETE FROM hallazgo_vestimenta WHERE id_hallazgo = ?', [idHallazgo]);
        if (data.vestimenta_hallazgo && data.vestimenta_hallazgo.length > 0) {
            const stmtVestimenta = await db.prepare(`INSERT INTO hallazgo_vestimenta (id_hallazgo, id_prenda, color, marca, caracteristica_especial, foto_evidencia) VALUES (?, ?, ?, ?, ?, ?)`);
            for (const prenda of data.vestimenta_hallazgo) {
                await stmtVestimenta.run([idHallazgo, prenda.id_prenda, prenda.color, prenda.marca, prenda.caracteristica_especial, prenda.foto_evidencia]);
            }
            await stmtVestimenta.finalize();
        }

        await db.run('COMMIT');

        return { success: true, message: 'Hallazgo actualizado exitosamente.', id_hallazgo: idHallazgo };

    } catch (error) {
        if (db) {
            await db.run('ROLLBACK');
        }
        logger.error(`❌ Error al actualizar hallazgo: ${error.message}`);
        throw new Error('Error al actualizar el hallazgo.');
    }
};

/**
 * Elimina un hallazgo y todos sus datos relacionados.
 * @param {number} idHallazgo - ID del hallazgo a eliminar.
 * @param {number} idUsuarioBuscador - ID del usuario que intenta eliminar el hallazgo.
 * @returns {Promise<Object>} Promesa que resuelve con un mensaje de éxito o un error.
 */
export const deleteHallazgo = async (idHallazgo, idUsuarioBuscador) => {
    let db;
    try {
        db = await openDb();

        const row = await db.get('SELECT id_usuario_buscador FROM hallazgos WHERE id_hallazgo = ?', [idHallazgo]);
        if (!row) {
            return { success: false, message: 'Hallazgo no encontrado.' };
        }
        if (row.id_usuario_buscador !== idUsuarioBuscador) {
            return { success: false, message: 'Acceso denegado. No eres el propietario de este hallazgo.' };
        }

        await db.run('BEGIN TRANSACTION');

        await db.run('DELETE FROM hallazgo_vestimenta WHERE id_hallazgo = ?', [idHallazgo]);
        await db.run('DELETE FROM hallazgo_caracteristicas WHERE id_hallazgo = ?', [idHallazgo]);
        const result = await db.run('DELETE FROM hallazgos WHERE id_hallazgo = ?', [idHallazgo]);

        await db.run('COMMIT');

        if (result.changes === 0) {
            return { success: false, message: 'No se eliminó ningún hallazgo.' };
        }

        return { success: true, message: 'Hallazgo eliminado exitosamente.' };

    } catch (error) {
        if (db) {
            await db.run('ROLLBACK');
        }
        logger.error(`❌ Error al eliminar hallazgo: ${error.message}`);
        throw new Error('Error al eliminar el hallazgo.');
    }
};

/**
 * @param {Object} query - Objeto de consulta de la URL (req.query) con los parámetros de búsqueda.
 * @returns {Promise<Object>} Una promesa que resuelve con los hallazgos que coinciden con la búsqueda.
 */
export const searchHallazgos = async (query) => {
    try {
        const db = await openDb();
        let sql = `SELECT * FROM hallazgos WHERE 1=1`;
        const params = [];

        if (query.id_usuario_buscador) {
            sql += ` AND id_usuario_buscador = ?`;
            params.push(query.id_usuario_buscador);
        }
        if (query.id_ubicacion_hallazgo) {
            sql += ` AND id_ubicacion_hallazgo = ?`;
            params.push(query.id_ubicacion_hallazgo);
        }
        if (query.id_tipo_lugar_hallazgo) {
            sql += ` AND id_tipo_lugar_hallazgo = ?`;
            params.push(query.id_tipo_lugar_hallazgo);
        }
        if (query.fecha_hallazgo) {
            sql += ` AND fecha_hallazgo = ?`;
            params.push(query.fecha_hallazgo);
        }
        if (query.descripcion_general_hallazgo) {
            sql += ` AND descripcion_general_hallazgo LIKE ?`;
            params.push(`%${query.descripcion_general_hallazgo}%`);
        }

        const hallazgos = await db.all(sql, params);

        const hallazgosCompletos = await Promise.all(hallazgos.map(async (hallazgo) => {
            const caracteristicas = await db.all(`
                SELECT h.tipo_caracteristica, h.descripcion_detalle, cpc.nombre_parte 
                FROM hallazgo_caracteristicas h 
                JOIN catalogo_partes_cuerpo cpc ON h.id_parte_cuerpo = cpc.id_parte_cuerpo 
                WHERE h.id_hallazgo = ?`, [hallazgo.id_hallazgo]);
            
            const vestimenta = await db.all(`
                SELECT hv.color, hv.marca, hv.caracteristica_especial, cp.tipo_prenda 
                FROM hallazgo_vestimenta hv 
                JOIN catalogo_prendas cp ON hv.id_prenda = cp.id_prenda 
                WHERE hv.id_hallazgo = ?`, [hallazgo.id_hallazgo]);

            return { ...hallazgo, caracteristicas, vestimenta };
        }));

        return { success: true, data: hallazgosCompletos };
    } catch (error) {
        logger.error(`❌ Error al realizar la búsqueda de hallazgos: ${error.message}`);
        throw new Error('Error al realizar la búsqueda de hallazgos.');
    }
};
