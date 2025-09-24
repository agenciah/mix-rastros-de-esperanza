// backend/controllers/hallazgos/hallazgosController.js

import { query, pool } from '../../db/users/initDb.js'; // ✅ Corregido: Importamos 'pool'
import logger from '../../utils/logger.js';
// Asume que este archivo existe y contiene la lógica de matching
import { findMatchesForHallazgo } from './matchController.js';
import { sendHEMatchNotification } from '../../utils/hastaEncontrarteEmailService.js';
import { createNotification } from '../../db/queries/notificationsQueries.js';
import * as hallazgosDB from '../../db/queries/hallazgosQueries.js';

/**
 * @fileoverview Controlador para la gestión de Hallazgos.
 * Permite a los usuarios crear, actualizar, eliminar y consultar hallazgos.
 */

// --- INICIO: Nueva Función Auxiliar para Notificaciones ---
async function notificarUsuariosDeFichas(req, matches, hallazgo) {
    if (!matches || matches.length === 0) return;

    const { sendNotificationToUser } = req.app.locals;

    for (const match of matches) {
        // ✅ Corregido: Se reescribió esta sección para usar 'query' de forma segura.
        const usuarioResult = await query(`SELECT id, nombre, email FROM users WHERE id = $1`, [match.id_usuario_creador]);
        const usuarioFicha = usuarioResult.rows[0];

        if (usuarioFicha) {
            const subject = `🚨 ¡Posible coincidencia para tu ficha de búsqueda!`;
            const message = `Hola ${usuarioFicha.nombre},\n\nUn nuevo hallazgo reportado podría ser una coincidencia para una de tus fichas de búsqueda. Por favor, inicia sesión para revisar los detalles.\n\nHallazgo ID: #${hallazgo.id_hallazgo}\n\nSaludos,\nEl equipo de Rastros de Esperanza.`;

            // 1. Enviar Email
            await sendHEMatchNotification(usuarioFicha.email, subject, message);
            logger.info(`📧 Email de coincidencia enviado a ${usuarioFicha.email}`);

            // 2. Guardar Notificación en la BD
            const notificationContent = `¡Un nuevo hallazgo coincide con tu ficha! Revisa el Hallazgo #${hallazgo.id_hallazgo}.`;
            const urlDestino = `/dashboard/hallazgos-list/${hallazgo.id_hallazgo}`;
            await createNotification(usuarioFicha.id, 'nueva_coincidencia', notificationContent, urlDestino);
            logger.info(`💾 Notificación de coincidencia guardada para el usuario ${usuarioFicha.id}`);

            // 3. Enviar Notificación por WebSocket
            if (sendNotificationToUser) {
                sendNotificationToUser(usuarioFicha.id, {
                    type: 'NEW_MATCH',
                    payload: { contenido: notificationContent, url: urlDestino }
                });
                logger.info(`🔌 Notificación de coincidencia enviada por WebSocket al usuario ${usuarioFicha.id}`);
            }
        }
    }
}

// --- Funciones del CRUD de Hallazgos ---

/**
 * Crea un nuevo hallazgo. VERSIÓN COMPLETA Y CORREGIDA para PostgreSQL.
 */
export const createHallazgo = async (req, res) => {
    const client = await pool.connect(); // ✅ Corregido
    try {
        await client.query('BEGIN');

        const {
            nombre, segundo_nombre, apellido_paterno, apellido_materno,
            fecha_hallazgo, descripcion_general_hallazgo, ubicacion_hallazgo,
            id_tipo_lugar_hallazgo, foto_hallazgo,
            edad_estimada, genero, estatura, complexion, peso,
            caracteristicas, vestimenta
        } = req.body;

        const id_usuario_buscador = req.user.id;

        // 1. Insertar ubicación
        const u = ubicacion_hallazgo;
        const ubicacionResult = await client.query(
            `INSERT INTO ubicaciones (estado, municipio, localidad, calle, referencias, latitud, longitud, codigo_postal)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id_ubicacion`,
            [u.estado, u.municipio, u.localidad, u.calle, u.referencias, u.latitud, u.longitud, u.codigo_postal]
        );
        const id_ubicacion_hallazgo = ubicacionResult.rows[0].id_ubicacion;

        // 2. Insertar hallazgo principal
        const hallazgoResult = await client.query(
            `INSERT INTO hallazgos (
                id_usuario_buscador, nombre, segundo_nombre, apellido_paterno, apellido_materno,
                id_ubicacion_hallazgo, id_tipo_lugar_hallazgo, fecha_hallazgo,
                descripcion_general_hallazgo, edad_estimada, genero, estatura, complexion, peso, foto_hallazgo
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
            RETURNING id_hallazgo`,
            [
                id_usuario_buscador, nombre, segundo_nombre, apellido_paterno, apellido_materno,
                id_ubicacion_hallazgo, id_tipo_lugar_hallazgo, fecha_hallazgo,
                descripcion_general_hallazgo, edad_estimada, genero, estatura, complexion, peso, foto_hallazgo
            ]
        );
        const idHallazgo = hallazgoResult.rows[0].id_hallazgo;

        // 3. Insertar características y vestimenta
        if (caracteristicas && caracteristicas.length > 0) {
            const caracteristicasPromises = caracteristicas.map(c =>
                client.query(`INSERT INTO hallazgo_caracteristicas (id_hallazgo, id_parte_cuerpo, tipo_caracteristica, descripcion) VALUES ($1, $2, $3, $4)`,
                    [idHallazgo, c.id_parte_cuerpo, c.tipo_caracteristica, c.descripcion])
            );
            await Promise.all(caracteristicasPromises);
        }
        if (vestimenta && vestimenta.length > 0) {
            const vestimentaPromises = vestimenta.map(prenda =>
                client.query(`INSERT INTO hallazgo_vestimenta (id_hallazgo, id_prenda, color, marca, caracteristica_especial) VALUES ($1, $2, $3, $4, $5)`,
                    [idHallazgo, prenda.id_prenda, prenda.color, prenda.marca, prenda.caracteristica_especial])
            );
            await Promise.all(vestimentaPromises);
        }

        // 4. Buscamos coincidencias
        const hallazgoDataCompleta = { id_hallazgo: idHallazgo, ...req.body };
        const matches = await findMatchesForHallazgo(hallazgoDataCompleta);

        // 5. Guardamos los cambios
        await client.query('COMMIT');

        // 6. Notificamos a los usuarios (fuera de la transacción)
        if (matches?.length > 0) {
            await notificarUsuariosDeFichas(req, matches, hallazgoDataCompleta);
        }

        // 7. Responder al cliente
        res.status(201).json({
            success: true,
            message: `Hallazgo creado con éxito. ${matches.length > 0 ? `Se encontraron ${matches.length} posibles coincidencias.` : 'No se encontraron coincidencias inmediatas.'}`,
            id_hallazgo: idHallazgo,
            matches,
        });

    } catch (error) {
        await client.query('ROLLBACK');
        logger.error(`❌ Error al crear hallazgo: ${error.message}`);
        res.status(500).json({ success: false, message: 'Error interno del servidor al crear el hallazgo.' });
    } finally {
        client.release();
    }
};

/**
 * Obtiene todos los hallazgos con sus detalles completos (Versión PostgreSQL).
 */
export const getAllHallazgos = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 20;
        const offset = parseInt(req.query.offset) || 0;

        const hallazgosPrincipalesSql = `
            SELECT
                h.*,
                u.estado, u.municipio,
                ctl.nombre_tipo AS tipo_lugar
            FROM hallazgos AS h
            LEFT JOIN ubicaciones AS u ON h.id_ubicacion_hallazgo = u.id_ubicacion
            LEFT JOIN catalogo_tipo_lugar AS ctl ON h.id_tipo_lugar_hallazgo = ctl.id_tipo_lugar
            ORDER BY h.fecha_hallazgo DESC
            LIMIT $1 OFFSET $2;
        `;
        const hallazgosPrincipalesResult = await query(hallazgosPrincipalesSql, [limit, offset]); // ✅ Corregido
        const hallazgosPrincipales = hallazgosPrincipalesResult.rows;

        if (hallazgosPrincipales.length === 0) {
            return res.json({ success: true, data: [] });
        }

        const todosLasCaracteristicasResult = await query(`SELECT * FROM hallazgo_caracteristicas`); // ✅ Corregido
        const todaLaVestimentaResult = await query(`SELECT * FROM hallazgo_vestimenta`); // ✅ Corregido
        const todosLasCaracteristicas = todosLasCaracteristicasResult.rows;
        const todaLaVestimenta = todaLaVestimentaResult.rows;

        const hallazgosCompletos = hallazgosPrincipales.map(hallazgo => {
            const caracteristicas = todosLasCaracteristicas.filter(c => c.id_hallazgo === hallazgo.id_hallazgo);
            const vestimenta = todaLaVestimenta.filter(v => v.id_hallazgo === hallazgo.id_hallazgo);
            const { estado, municipio, ...restOfHallazgo } = hallazgo;
            return {
                ...restOfHallazgo,
                ubicacion_hallazgo: { estado, municipio },
                caracteristicas,
                vestimenta
            };
        });
        res.json({ success: true, data: hallazgosCompletos });
    } catch (error) {
        logger.error(`❌ Error al obtener todos los hallazgos: ${error.message}`);
        res.status(500).json({ success: false, message: 'Error al obtener los hallazgos.' });
    }
};

// ... (El bloque de código comentado se mantiene intacto)
// export const getHallazgoById = async (req, res) => { ... };

/**
 * Obtiene un hallazgo específico por su ID (Versión PostgreSQL).
 */
export const getHallazgoById = async (req, res) => {
    try {
        const { id } = req.params;
        const hallazgoSql = `
            SELECT
                h.*,
                u.estado, u.municipio, u.localidad, u.calle, u.referencias, u.codigo_postal, u.latitud, u.longitud,
                ctl.nombre_tipo AS tipo_lugar,
                creator.nombre AS nombre_usuario_buscador
            FROM hallazgos AS h
            LEFT JOIN users AS creator ON h.id_usuario_buscador = creator.id
            LEFT JOIN ubicaciones AS u ON h.id_ubicacion_hallazgo = u.id_ubicacion
            LEFT JOIN catalogo_tipo_lugar AS ctl ON h.id_tipo_lugar_hallazgo = ctl.id_tipo_lugar
            WHERE h.id_hallazgo = $1;
        `;
        const caracteristicasSql = `
            SELECT hc.*, cpc.nombre_parte
            FROM hallazgo_caracteristicas AS hc
            LEFT JOIN catalogo_partes_cuerpo AS cpc ON hc.id_parte_cuerpo = cpc.id_parte_cuerpo
            WHERE hc.id_hallazgo = $1;
        `;
        const vestimentaSql = `
            SELECT hv.*, cp.tipo_prenda
            FROM hallazgo_vestimenta AS hv
            LEFT JOIN catalogo_prendas AS cp ON hv.id_prenda = cp.id_prenda
            WHERE hv.id_hallazgo = $1;
        `;
        const [hallazgoResult, caracteristicasResult, vestimentaResult] = await Promise.all([
            query(hallazgoSql, [id]),        // ✅ Corregido
            query(caracteristicasSql, [id]), // ✅ Corregido
            query(vestimentaSql, [id])       // ✅ Corregido
        ]);

        if (hallazgoResult.rowCount === 0) {
            return res.status(404).json({ success: false, message: 'Hallazgo no encontrado.' });
        }

        const hallazgo = hallazgoResult.rows[0];
        const { estado, municipio, localidad, calle, referencias, codigo_postal, latitud, longitud, ...restOfHallazgo } = hallazgo;
        const hallazgoCompleto = {
            ...restOfHallazgo,
            ubicacion_hallazgo: { estado, municipio, localidad, calle, referencias, codigo_postal, latitud, longitud },
            caracteristicas: caracteristicasResult.rows || [],
            vestimenta: vestimentaResult.rows || []
        };
        res.json({ success: true, data: hallazgoCompleto });
    } catch (error) {
        logger.error(`❌ Error al obtener el hallazgo por ID: ${error.message}`);
        res.status(500).json({ success: false, message: 'Error al obtener el hallazgo.' });
    }
};

/**
 * Actualiza un hallazgo existente (Versión PostgreSQL).
 */
export const actualizarHallazgo = async (req, res) => {
    const client = await pool.connect(); // ✅ Corregido
    try {
        await client.query('BEGIN');
        const { id } = req.params;
        const id_usuario_buscador = req.user.id;
        const {
            ubicacion_hallazgo, caracteristicas, vestimenta,
            id_hallazgo, tipo_lugar, nombre_usuario_buscador,
            ...hallazgoPrincipal
        } = req.body;
        const hallazgoResult = await client.query(
            `SELECT id_ubicacion_hallazgo FROM hallazgos WHERE id_hallazgo = $1 AND id_usuario_buscador = $2`,
            [id, id_usuario_buscador]
        );

        if (hallazgoResult.rowCount === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ success: false, message: 'Hallazgo no encontrado o no autorizado' });
        }
        const hallazgo = hallazgoResult.rows[0];

        if (Object.keys(hallazgoPrincipal).length > 0) {
            const hallazgoFields = Object.keys(hallazgoPrincipal);
            const hallazgoValues = Object.values(hallazgoPrincipal);
            const hallazgoSetClause = hallazgoFields.map((field, index) => `${field} = $${index + 1}`).join(', ');
            await client.query(
                `UPDATE hallazgos SET ${hallazgoSetClause} WHERE id_hallazgo = $${hallazgoFields.length + 1}`,
                [...hallazgoValues, id]
            );
        }

        if (ubicacion_hallazgo && Object.keys(ubicacion_hallazgo).length > 0) {
            const ubicacionFields = Object.keys(ubicacion_hallazgo);
            const ubicacionValues = Object.values(ubicacion_hallazgo);
            const ubicacionSetClause = ubicacionFields.map((field, index) => `${field} = $${index + 1}`).join(', ');
            await client.query(
                `UPDATE ubicaciones SET ${ubicacionSetClause} WHERE id_ubicacion = $${ubicacionFields.length + 1}`,
                [...ubicacionValues, hallazgo.id_ubicacion_hallazgo]
            );
        }

        await client.query(`DELETE FROM hallazgo_caracteristicas WHERE id_hallazgo = $1`, [id]);
        if (caracteristicas && caracteristicas.length > 0) {
            const promises = caracteristicas.map(c => client.query(`INSERT INTO hallazgo_caracteristicas (id_hallazgo, id_parte_cuerpo, tipo_caracteristica, descripcion) VALUES ($1, $2, $3, $4)`, [id, c.id_parte_cuerpo, c.tipo_caracteristica, c.descripcion]));
            await Promise.all(promises);
        }

        await client.query(`DELETE FROM hallazgo_vestimenta WHERE id_hallazgo = $1`, [id]);
        if (vestimenta && vestimenta.length > 0) {
            const promises = vestimenta.map(p => client.query(`INSERT INTO hallazgo_vestimenta (id_hallazgo, id_prenda, color, marca, caracteristica_especial) VALUES ($1, $2, $3, $4, $5)`, [id, p.id_prenda, p.color, p.marca, p.caracteristica_especial]));
            await Promise.all(promises);
        }

        await client.query('COMMIT');
        res.json({ success: true, message: 'Hallazgo actualizado correctamente' });
    } catch (error) {
        await client.query('ROLLBACK');
        logger.error(`❌ Error al actualizar hallazgo: ${error.message}`);
        res.status(500).json({ success: false, message: 'Error interno del servidor al actualizar hallazgo' });
    } finally {
        client.release();
    }
};

/**
 * Elimina el hallazgo y los registros asociados (Versión PostgreSQL).
 */
export const deleteHallazgo = async (req, res) => {
    const client = await pool.connect(); // ✅ Corregido
    try {
        await client.query('BEGIN');
        const { id } = req.params;
        const id_usuario_buscador = req.user.id;
        const hallazgoResult = await client.query(
            `SELECT id_hallazgo, id_ubicacion_hallazgo FROM hallazgos WHERE id_hallazgo = $1 AND id_usuario_buscador = $2`,
            [id, id_usuario_buscador]
        );
        const hallazgo = hallazgoResult.rows[0];

        if (!hallazgo) {
            await client.query('ROLLBACK');
            return res.status(404).json({ success: false, message: 'Hallazgo no encontrado o no autorizado' });
        }

        await client.query(`DELETE FROM hallazgo_caracteristicas WHERE id_hallazgo = $1`, [id]);
        await client.query(`DELETE FROM hallazgo_vestimenta WHERE id_hallazgo = $1`, [id]);
        await client.query(`DELETE FROM hallazgos WHERE id_hallazgo = $1`, [id]);
        await client.query(`DELETE FROM ubicaciones WHERE id_ubicacion = $1`, [hallazgo.id_ubicacion_hallazgo]);

        await client.query('COMMIT');
        res.json({ success: true, message: 'Hallazgo y registros asociados fueron eliminados correctamente' });
    } catch (error) {
        await client.query('ROLLBACK');
        logger.error(`❌ Error al eliminar hallazgo: ${error.message}`);
        res.status(500).json({ success: false, message: 'Error interno del servidor al eliminar el hallazgo' });
    } finally {
        client.release();
    }
};

/**
 * Busca hallazgos por un término de búsqueda en múltiples campos (Versión PostgreSQL).
 */
export const searchHallazgos = async (req, res) => {
    try {
        const { searchTerm = '', limit = 20, offset = 0 } = req.query;
        const sqlTerm = `%${searchTerm.toLowerCase()}%`;
        const hallazgosSql = `
            SELECT DISTINCT
                h.id_hallazgo, h.nombre, h.segundo_nombre, h.apellido_paterno, h.foto_hallazgo,
                h.fecha_hallazgo, h.edad_estimada, h.genero, u.estado, u.municipio
            FROM hallazgos AS h
            LEFT JOIN ubicaciones AS u ON h.id_ubicacion_hallazgo = u.id_ubicacion
            LEFT JOIN hallazgo_caracteristicas AS hc ON h.id_hallazgo = hc.id_hallazgo
            LEFT JOIN catalogo_partes_cuerpo AS cpc ON hc.id_parte_cuerpo = cpc.id_parte_cuerpo
            LEFT JOIN hallazgo_vestimenta AS hv ON h.id_hallazgo = hv.id_hallazgo
            LEFT JOIN catalogo_prendas AS cp ON hv.id_prenda = cp.id_prenda
            LEFT JOIN catalogo_tipo_lugar AS ctl ON h.id_tipo_lugar_hallazgo = ctl.id_tipo_lugar
            WHERE (
                h.nombre ILIKE $1 OR
                h.apellido_paterno ILIKE $2 OR
                h.descripcion_general_hallazgo ILIKE $3 OR
                h.genero ILIKE $4 OR
                u.estado ILIKE $5 OR
                u.municipio ILIKE $6 OR
                hc.descripcion ILIKE $7 OR
                cpc.nombre_parte ILIKE $8 OR
                hv.color ILIKE $9 OR
                hv.marca ILIKE $10 OR
                cp.tipo_prenda ILIKE $11 OR
                ctl.nombre_tipo ILIKE $12
            )
            ORDER BY h.fecha_hallazgo DESC
            LIMIT $13 OFFSET $14;
        `;
        const params = Array(12).fill(sqlTerm).concat([limit, offset]);
        const hallazgosResult = await query(hallazgosSql, params); // ✅ Corregido
        res.json({ success: true, data: hallazgosResult.rows });
    } catch (error) {
        logger.error(`❌ Error al buscar hallazgos: ${error.message}`);
        res.status(500).json({ success: false, message: 'Error al realizar la búsqueda de hallazgos.' });
    }
};

/**
 * Obtiene el catálogo de tipos de lugar (Versión PostgreSQL).
 */
export const obtenerCatalogoTiposLugar = async (req, res) => {
    try {
        const result = await query(`SELECT * FROM catalogo_tipo_lugar`); // ✅ Corregido
        res.json({ success: true, catalogo_tipo_lugar: result.rows });
    } catch (error) {
        logger.error(`❌ Error al obtener catálogo de tipos de lugar: ${error.message}`);
        res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
};

/**
 * Obtiene el catálogo de partes del cuerpo (Versión PostgreSQL).
 */
export const obtenerCatalogoPartesCuerpo = async (req, res) => {
    try {
        const result = await query(`SELECT * FROM catalogo_partes_cuerpo`); // ✅ Corregido
        const partesNormalizadas = result.rows.map(p => ({
            id: p.id_parte_cuerpo,
            nombre: p.nombre_parte,
            categoria: p.categoria_principal
        }));
        res.json({ success: true, catalogo_partes_cuerpo: partesNormalizadas });
    } catch (error) {
        logger.error(`❌ Error al obtener catálogo de partes del cuerpo: ${error.message}`);
        res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
};

/**
 * Obtiene el catálogo de prendas (Versión PostgreSQL).
 */
export const obtenerCatalogoPrendas = async (req, res) => {
    try {
        const result = await query(`SELECT * FROM catalogo_prendas`); // ✅ Corregido
        res.json({ success: true, catalogo_prendas: result.rows });
    } catch (error) {
        logger.error(`❌ Error al obtener catálogo de prendas: ${error.message}`);
        res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
};

/**
 * Obtiene los hallazgos creados por un usuario específico (Versión PostgreSQL).
 */
export const getHallazgosByUserId = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(403).json({ success: false, message: 'Identidad de usuario no encontrada.' });
        }
        const hallazgos = await hallazgosDB.getHallazgosCompletosByUserId(userId);
        res.json({ success: true, data: hallazgos });
    } catch (error) {
        logger.error(`❌ Error al obtener los hallazgos del usuario: ${error.message}`);
        res.status(500).json({ success: false, message: 'Error al obtener tus hallazgos.' });
    }
};

/**
 * Busca hallazgos para el feed público por un término de búsqueda (Versión PostgreSQL).
 */
export const searchHallazgosFeed = async (req, res) => {
    try {
        const { searchTerm = '', limit = 10, offset = 0 } = req.query;
        const sqlTerm = `%${searchTerm.toLowerCase()}%`;

        const hallazgosSql = `
            SELECT DISTINCT
                h.id_hallazgo, h.nombre, h.segundo_nombre, h.apellido_paterno, h.foto_hallazgo,
                h.fecha_hallazgo, h.edad_estimada, h.genero, u.estado, u.municipio
            FROM hallazgos AS h
            LEFT JOIN ubicaciones AS u ON h.id_ubicacion_hallazgo = u.id_ubicacion
            LEFT JOIN hallazgo_caracteristicas AS hc ON h.id_hallazgo = hc.id_hallazgo
            LEFT JOIN catalogo_partes_cuerpo AS cpc ON hc.id_parte_cuerpo = cpc.id_parte_cuerpo
            LEFT JOIN hallazgo_vestimenta AS hv ON h.id_hallazgo = hv.id_hallazgo
            LEFT JOIN catalogo_prendas AS cp ON hv.id_prenda = cp.id_prenda
            LEFT JOIN catalogo_tipo_lugar AS ctl ON h.id_tipo_lugar_hallazgo = ctl.id_tipo_lugar
            WHERE (
                h.nombre ILIKE $1 OR
                h.apellido_paterno ILIKE $2 OR
                h.descripcion_general_hallazgo ILIKE $3 OR
                h.genero ILIKE $4 OR
                u.estado ILIKE $5 OR
                u.municipio ILIKE $6 OR
                hc.descripcion ILIKE $7 OR
                cpc.nombre_parte ILIKE $8 OR
                hv.color ILIKE $9 OR
                hv.marca ILIKE $10 OR
                cp.tipo_prenda ILIKE $11 OR
                ctl.nombre_tipo ILIKE $12
            )
            ORDER BY h.fecha_hallazgo DESC
            LIMIT $13 OFFSET $14;
        `;

        const params = Array(12).fill(sqlTerm).concat([parseInt(limit), parseInt(offset)]);
        const result = await query(hallazgosSql, params); // ✅ Corregido

        res.json({ success: true, data: result.rows });
    } catch (error) {
        logger.error(`❌ Error al buscar hallazgos para el feed: ${error.message}`);
        res.status(500).json({ success: false, message: 'Error al realizar la búsqueda de hallazgos.' });
    }
};