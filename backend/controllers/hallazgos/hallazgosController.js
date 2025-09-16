// backend/controllers/hallazgos/hallazgosController.js

import { openDb } from '../../db/users/initDb.js';
import logger from '../../utils/logger.js';
// Asume que este archivo existe y contiene la lógica de matching
import { findMatchesForHallazgo } from './matchController.js'; 
import { sendMatchNotification } from '../../utils/emailService.js'; // Asume que este archivo existe
import { searchHallazgosByKeyword } from '../../db/queries/fichasAndHallazgosQueries.js';
import { createNotification } from '../../db/queries/notificationsQueries.js';
import { getHallazgoCompletoById } from '../../db/queries/hallazgosQueries.js';
import * as hallazgosDB from '../../db/queries/hallazgosQueries.js';

/**
 * @fileoverview Controlador para la gestión de Hallazgos.
 * Permite a los usuarios crear, actualizar, eliminar y consultar hallazgos.
 */

// --- INICIO: Nueva Función Auxiliar para Notificaciones ---
// La creamos para no repetir el mismo código en 'create' y 'update'.
async function notificarUsuariosDeFichas(req, matches, hallazgo) {
    if (!matches || matches.length === 0) return;

    const db = await openDb();
    const { sendNotificationToUser } = req.app.locals;

    for (const match of matches) {
        const usuarioFicha = await db.get(`SELECT id, nombre, email FROM users WHERE id = ?`, [match.id_usuario_creador]);
        
        if (usuarioFicha) {
            const subject = `🚨 ¡Posible coincidencia para tu ficha de búsqueda!`;
            const message = `Hola ${usuarioFicha.nombre},\n\nUn nuevo hallazgo reportado podría ser una coincidencia para una de tus fichas de búsqueda. Por favor, inicia sesión para revisar los detalles.\n\nHallazgo ID: #${hallazgo.id_hallazgo}\n\nSaludos,\nEl equipo de Rastros de Esperanza.`;
            
            // 1. Enviar Email
            await sendMatchNotification(usuarioFicha.email, subject, message);
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
 * Crea un nuevo hallazgo. VERSIÓN COMPLETA Y CORREGIDA.
 */
export const createHallazgo = async (req, res) => {
    const db = await openDb();
    await db.exec('BEGIN TRANSACTION');

    try {
        // ✅ 1. Desestructuramos foto_hallazgo junto con los demás campos.
        const {
            nombre, segundo_nombre, apellido_paterno, apellido_materno,
            fecha_hallazgo, descripcion_general_hallazgo, ubicacion_hallazgo,
            id_tipo_lugar_hallazgo, foto_hallazgo, // <-- Campo de foto AÑADIDO
            edad_estimada, genero, estatura, complexion, peso,
            caracteristicas, vestimenta
        } = req.body;

        const id_usuario_buscador = req.user.id;

        // 2. Insertar la ubicación (esta parte estaba bien)
        const u = ubicacion_hallazgo;
        const ubicacionResult = await db.run(
            `INSERT INTO ubicaciones (estado, municipio, localidad, calle, referencias, latitud, longitud, codigo_postal)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [u.estado, u.municipio, u.localidad, u.calle, u.referencias, u.latitud, u.longitud, u.codigo_postal]
        );
        const id_ubicacion_hallazgo = ubicacionResult.lastID;

        // ✅ 3. Insertar el hallazgo principal, AHORA INCLUYENDO la foto.
        const hallazgoResult = await db.run(
            `INSERT INTO hallazgos (
                id_usuario_buscador, nombre, segundo_nombre, apellido_paterno, apellido_materno,
                id_ubicacion_hallazgo, id_tipo_lugar_hallazgo, fecha_hallazgo,
                descripcion_general_hallazgo, edad_estimada, genero, estatura, complexion, peso, foto_hallazgo
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                id_usuario_buscador, nombre, segundo_nombre, apellido_paterno, apellido_materno,
                id_ubicacion_hallazgo, id_tipo_lugar_hallazgo, fecha_hallazgo,
                descripcion_general_hallazgo, edad_estimada, genero, estatura, complexion, peso, foto_hallazgo
            ]
        );
        const idHallazgo = hallazgoResult.lastID;

        // 4. Insertar características y vestimenta (esta parte estaba bien)
        if (caracteristicas && caracteristicas.length > 0) {
            const caracteristicasPromises = caracteristicas.map(c =>
                db.run(`INSERT INTO hallazgo_caracteristicas (id_hallazgo, id_parte_cuerpo, tipo_caracteristica, descripcion) VALUES (?, ?, ?, ?)`,
                    [idHallazgo, c.id_parte_cuerpo, c.tipo_caracteristica, c.descripcion])
            );
            await Promise.all(caracteristicasPromises);
        }
        if (vestimenta && vestimenta.length > 0) {
            const vestimentaPromises = vestimenta.map(prenda =>
                db.run(`INSERT INTO hallazgo_vestimenta (id_hallazgo, id_prenda, color, marca, caracteristica_especial) VALUES (?, ?, ?, ?, ?)`,
                    [idHallazgo, prenda.id_prenda, prenda.color, prenda.marca, prenda.caracteristica_especial])
            );
            await Promise.all(vestimentaPromises);
        }
        
        // ✅ 5. Buscamos coincidencias ANTES de cerrar la transacción.
        const hallazgoDataCompleta = { id_hallazgo: idHallazgo, ...req.body };
        const matches = await findMatchesForHallazgo(hallazgoDataCompleta);

        // ✅ 6. Guardamos los cambios de forma definitiva SÓLO si todo lo anterior tuvo éxito.
        await db.exec('COMMIT');

        // ✅ 7. Notificamos a los usuarios DESPUÉS de confirmar que todo se guardó.
        if (matches?.length > 0) {
            // Reutilizamos la lógica de notificación que ya tienes
            await notificarUsuariosDeFichas(req, matches, hallazgoDataCompleta);
        }

        // 8. Responder al cliente
        res.status(201).json({
            success: true,
            message: `Hallazgo creado con éxito. ${matches.length > 0 ? `Se encontraron ${matches.length} posibles coincidencias.` : 'No se encontraron coincidencias inmediatas.'}`,
            id_hallazgo: idHallazgo,
            matches,
        });

    } catch (error) {
        // Si algo falla en CUALQUIER paso, revertimos todo.
        await db.exec('ROLLBACK');
        logger.error(`❌ Error al crear hallazgo: ${error.message}`);
        res.status(500).json({ success: false, message: 'Error interno del servidor al crear el hallazgo.' });
    }
};

/**
 * Obtiene todos los hallazgos con sus detalles completos. VERSIÓN AUTOCONTENIDA Y ROBUSTA.
 */
export const getAllHallazgos = async (req, res) => {
    try {
        const db = await openDb();
        const limit = parseInt(req.query.limit) || 20;
        const offset = parseInt(req.query.offset) || 0;

        // 1. Obtenemos los datos principales de TODOS los hallazgos, con paginación.
        const hallazgosPrincipalesSql = `
            SELECT 
                h.*, -- Traemos todos los campos del hallazgo, incluyendo foto, edad, etc.
                u.estado, u.municipio,
                ctl.nombre_tipo AS tipo_lugar
            FROM hallazgos AS h
            LEFT JOIN ubicaciones AS u ON h.id_ubicacion_hallazgo = u.id_ubicacion
            LEFT JOIN catalogo_tipo_lugar AS ctl ON h.id_tipo_lugar_hallazgo = ctl.id_tipo_lugar
            ORDER BY h.fecha_hallazgo DESC
            LIMIT ? OFFSET ?;
        `;
        const hallazgosPrincipales = await db.all(hallazgosPrincipalesSql, [limit, offset]);

        if (hallazgosPrincipales.length === 0) {
            return res.json({ success: true, data: [] });
        }

        // 2. Obtenemos TODOS los rasgos y vestimentas en dos consultas masivas.
        const todosLasCaracteristicas = await db.all(`SELECT * FROM hallazgo_caracteristicas`);
        const todaLaVestimenta = await db.all(`SELECT * FROM hallazgo_vestimenta`);

        // 3. Unimos todo en JavaScript. Es más rápido y seguro.
        const hallazgosCompletos = hallazgosPrincipales.map(hallazgo => {
            // Filtramos las características que pertenecen a este hallazgo
            const caracteristicas = todosLasCaracteristicas.filter(c => c.id_hallazgo === hallazgo.id_hallazgo);
            // Filtramos la vestimenta que pertenece a este hallazgo
            const vestimenta = todaLaVestimenta.filter(v => v.id_hallazgo === hallazgo.id_hallazgo);
            
            // Formateamos el objeto final para anidar la ubicación
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

/**
 * Obtiene un hallazgo específico por su ID. VERSIÓN COMPLETA Y ROBUSTA.
 */
export const getHallazgoById = async (req, res) => {
    try {
        const { id } = req.params;
        const db = await openDb();

        // 1. Consulta principal con TODOS los campos, incluyendo foto y datos del usuario
        const hallazgoSql = `
            SELECT 
                h.*, -- Selecciona todos los campos de la tabla hallazgos
                u.estado, u.municipio, u.localidad, u.calle, u.referencias, u.codigo_postal, u.latitud, u.longitud,
                ctl.nombre_tipo AS tipo_lugar,
                creator.nombre AS nombre_usuario_buscador -- Nombre del usuario que lo reportó
            FROM hallazgos AS h
            LEFT JOIN users AS creator ON h.id_usuario_buscador = creator.id
            LEFT JOIN ubicaciones AS u ON h.id_ubicacion_hallazgo = u.id_ubicacion
            LEFT JOIN catalogo_tipo_lugar AS ctl ON h.id_tipo_lugar_hallazgo = ctl.id_tipo_lugar
            WHERE h.id_hallazgo = ?;
        `;
        const hallazgo = await db.get(hallazgoSql, [id]);

        if (!hallazgo) {
            return res.status(404).json({ success: false, message: 'Hallazgo no encontrado.' });
        }

        // 2. Consultas separadas para características y vestimenta
        const caracteristicasSql = `SELECT * FROM hallazgo_caracteristicas WHERE id_hallazgo = ?;`;
        const vestimentaSql = `SELECT * FROM hallazgo_vestimenta WHERE id_hallazgo = ?;`;

        const [caracteristicas, vestimenta] = await Promise.all([
            db.all(caracteristicasSql, [id]),
            db.all(vestimentaSql, [id])
        ]);

        // 3. Formateamos el objeto final, anidando la ubicación
        const { estado, municipio, localidad, calle, referencias, codigo_postal, latitud, longitud, ...restOfHallazgo } = hallazgo;
        
        const hallazgoCompleto = {
            ...restOfHallazgo,
            ubicacion_hallazgo: { estado, municipio, localidad, calle, referencias, codigo_postal, latitud, longitud },
            caracteristicas: caracteristicas || [],
            vestimenta: vestimenta || []
        };

        res.json({ success: true, data: hallazgoCompleto });
        
    } catch (error) {
        logger.error(`❌ Error al obtener el hallazgo por ID: ${error.message}`);
        res.status(500).json({ success: false, message: 'Error al obtener el hallazgo.' });
    }
};

/**
 * Actualiza un hallazgo existente, verificando la propiedad del usuario. VERSIÓN COMPLETA.
 */
export const actualizarHallazgo = async (req, res) => {
    const db = await openDb();
    await db.exec('BEGIN TRANSACTION');

    try {
        const { id } = req.params;
        const {
            // Desestructuramos para separar los datos que van a tablas diferentes
            ubicacion_hallazgo,
            caracteristicas,
            vestimenta,
            ...hallazgoPrincipal // El resto de campos (nombre, foto_hallazgo, etc.) se agrupan aquí
        } = req.body;

        const id_usuario_buscador = req.user.id;

        // 1. Verifica la propiedad del hallazgo y obtiene el ID de la ubicación
        const hallazgo = await db.get(
            `SELECT id_ubicacion_hallazgo FROM hallazgos WHERE id_hallazgo = ? AND id_usuario_buscador = ?`,
            [id, id_usuario_buscador]
        );

        if (!hallazgo) {
            await db.exec('ROLLBACK');
            return res.status(404).json({ success: false, message: 'Hallazgo no encontrado o no autorizado' });
        }

        // 2. Actualiza la tabla principal 'hallazgos' de forma dinámica
        const hallazgoFields = Object.keys(hallazgoPrincipal);
        if (hallazgoFields.length > 0) {
            const hallazgoSetClause = hallazgoFields.map(key => `${key} = ?`).join(', ');
            await db.run(
                `UPDATE hallazgos SET ${hallazgoSetClause} WHERE id_hallazgo = ?`,
                [...Object.values(hallazgoPrincipal), id]
            );
        }

        // 3. Actualiza la ubicación de forma dinámica
        if (ubicacion_hallazgo && Object.keys(ubicacion_hallazgo).length > 0) {
            const ubicacionSetClause = Object.keys(ubicacion_hallazgo).map(key => `${key} = ?`).join(', ');
            await db.run(
                `UPDATE ubicaciones SET ${ubicacionSetClause} WHERE id_ubicacion = ?`,
                [...Object.values(ubicacion_hallazgo), hallazgo.id_ubicacion_hallazgo]
            );
        }

        // 4. Reemplaza las características y la vestimenta
        await db.run(`DELETE FROM hallazgo_caracteristicas WHERE id_hallazgo = ?`, [id]);
        if (caracteristicas && caracteristicas.length > 0) {
            const caracteristicasPromises = caracteristicas.map(c =>
                db.run(`INSERT INTO hallazgo_caracteristicas (id_hallazgo, id_parte_cuerpo, tipo_caracteristica, descripcion) VALUES (?, ?, ?, ?)`,
                    [id, c.id_parte_cuerpo, c.tipo_caracteristica, c.descripcion])
            );
            await Promise.all(caracteristicasPromises);
        }

        await db.run(`DELETE FROM hallazgo_vestimenta WHERE id_hallazgo = ?`, [id]);
        if (vestimenta && vestimenta.length > 0) {
            const vestimentaPromises = vestimenta.map(prenda =>
                db.run(`INSERT INTO hallazgo_vestimenta (id_hallazgo, id_prenda, color, marca, caracteristica_especial) VALUES (?, ?, ?, ?, ?)`,
                    [id, prenda.id_prenda, prenda.color, prenda.marca, prenda.caracteristica_especial])
            );
            await Promise.all(vestimentaPromises);
        }

        await db.exec('COMMIT');

        // 5. Opcional: Re-ejecutar búsqueda de coincidencias y notificar
        logger.info(`✅ Hallazgo ${id} actualizado. Re-ejecutando búsqueda de coincidencias...`);
        const hallazgoDataCompleta = await getHallazgoById({ params: { id } }, { json: () => {} }); // Simulación para obtener datos
        if (hallazgoDataCompleta) {
            const matches = await findMatchesForHallazgo(hallazgoDataCompleta.data);
            await notificarUsuariosDeFichas(req, matches, hallazgoDataCompleta.data);
        }
        
        res.json({ success: true, message: 'Hallazgo actualizado correctamente' });
    } catch (error) {
        await db.exec('ROLLBACK');
        logger.error(`❌ Error al actualizar hallazgo: ${error.message}`);
        res.status(500).json({ success: false, message: 'Error interno del servidor al actualizar hallazgo' });
    }
};

/**
 * Elimina el hallazgo y todos sus registros asociados. VERSIÓN FINAL Y ROBUSTA.
 */
export const deleteHallazgo = async (req, res) => {
    const db = await openDb();
    await db.exec('BEGIN TRANSACTION');

    try {
        const { id } = req.params;
        const id_usuario_buscador = req.user.id;

        // 1. Verifica la propiedad del hallazgo y obtiene el ID de la ubicación
        const hallazgo = await db.get(
            `SELECT id_hallazgo, id_ubicacion_hallazgo FROM hallazgos WHERE id_hallazgo = ? AND id_usuario_buscador = ?`,
            [id, id_usuario_buscador]
        );

        if (!hallazgo) {
            await db.exec('ROLLBACK');
            return res.status(404).json({ success: false, message: 'Hallazgo no encontrado o no autorizado' });
        }

        // ✅ 2. Añadimos la eliminación explícita de datos relacionados para máxima seguridad
        await db.run(`DELETE FROM hallazgo_caracteristicas WHERE id_hallazgo = ?`, [id]);
        await db.run(`DELETE FROM hallazgo_vestimenta WHERE id_hallazgo = ?`, [id]);

        // 3. Eliminamos el hallazgo principal y su ubicación
        await db.run(`DELETE FROM hallazgos WHERE id_hallazgo = ?`, [id]);
        await db.run(`DELETE FROM ubicaciones WHERE id_ubicacion = ?`, [hallazgo.id_ubicacion_hallazgo]);

        await db.exec('COMMIT');
        res.json({ success: true, message: 'Hallazgo y todos sus registros asociados fueron eliminados correctamente' });
        
    } catch (error) {
        await db.exec('ROLLBACK');
        logger.error(`❌ Error al eliminar hallazgo: ${error.message}`);
        res.status(500).json({ success: false, message: 'Error interno del servidor al eliminar el hallazgo' });
    }
};

/**
 * Busca hallazgos por un término de búsqueda en múltiples campos. VERSIÓN COMPLETA.
 */
export const searchHallazgos = async (req, res) => {
    try {
        const db = await openDb();
        const { searchTerm = '', limit = 20, offset = 0 } = req.query;
        const sqlTerm = `%${searchTerm.toLowerCase()}%`;

        // La consulta une todas las tablas relevantes para una búsqueda exhaustiva.
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
                LOWER(h.nombre) LIKE ? OR
                LOWER(h.apellido_paterno) LIKE ? OR
                LOWER(h.descripcion_general_hallazgo) LIKE ? OR
                LOWER(h.genero) LIKE ? OR
                LOWER(u.estado) LIKE ? OR
                LOWER(u.municipio) LIKE ? OR
                LOWER(hc.descripcion) LIKE ? OR
                LOWER(cpc.nombre_parte) LIKE ? OR
                LOWER(hv.color) LIKE ? OR
                LOWER(hv.marca) LIKE ? OR
                LOWER(cp.tipo_prenda) LIKE ? OR
                LOWER(ctl.nombre_tipo) LIKE ?
            )
            ORDER BY h.fecha_hallazgo DESC
            LIMIT ? OFFSET ?;
        `;
        
        // Creamos un array con el término de búsqueda para cada '?' en la consulta.
        const params = Array(12).fill(sqlTerm).concat([limit, offset]);

        const hallazgos = await db.all(hallazgosSql, params);
        
        res.json({ success: true, data: hallazgos });

    } catch (error) {
        logger.error(`❌ Error al buscar hallazgos: ${error.message}`);
        res.status(500).json({ success: false, message: 'Error al realizar la búsqueda de hallazgos.' });
    }
};

export const obtenerCatalogoTiposLugar = async (req, res) => {
    try {
        const db = await openDb();
        const tipos = await db.all(`SELECT * FROM catalogo_tipo_lugar`);
        res.json({ success: true, catalogo_tipo_lugar: tipos });
    } catch (error) {
        logger.error(`❌ Error al obtener catálogo de tipos de lugar: ${error.message}`);
        res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
};

export const obtenerCatalogoPartesCuerpo = async (req, res) => {
    try {
        const db = await openDb();
        const partes = await db.all(`SELECT * FROM catalogo_partes_cuerpo`);
        const partesNormalizadas = partes.map(p => ({
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

export const obtenerCatalogoPrendas = async (req, res) => {
    try {
        const db = await openDb();
        const prendas = await db.all(`SELECT * FROM catalogo_prendas`);
        res.json({ success: true, catalogo_prendas: prendas });
    } catch (error) {
        logger.error(`❌ Error al obtener catálogo de prendas: ${error.message}`);
        res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
};

// 2. Reemplaza la función `getHallazgosByUserId` con esta:
export const getHallazgosByUserId = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(403).json({ success: false, message: 'Identidad de usuario no encontrada.' });
        }

        // ✅ Llama a la nueva función de queries, que hace todo el trabajo pesado.
        const hallazgos = await hallazgosDB.getHallazgosCompletosByUserId(userId);

        res.json({ success: true, data: hallazgos });

    } catch (error) {
        logger.error(`❌ Error al obtener los hallazgos del usuario: ${error.message}`);
        res.status(500).json({ success: false, message: 'Error al obtener tus hallazgos.' });
    }
};

/**
 * Busca hallazgos para el feed público por un término de búsqueda. VERSIÓN FINAL Y AUTOCONTENIDA.
 */
export const searchHallazgosFeed = async (req, res) => {
    try {
        const db = await openDb();
        const { searchTerm = '', limit = 10, offset = 0 } = req.query; 
        const sqlTerm = `%${searchTerm.toLowerCase()}%`;

        // Consulta exhaustiva que busca en todos los campos relevantes
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
                LOWER(h.nombre) LIKE ? OR
                LOWER(h.apellido_paterno) LIKE ? OR
                LOWER(h.descripcion_general_hallazgo) LIKE ? OR
                LOWER(h.genero) LIKE ? OR
                LOWER(u.estado) LIKE ? OR
                LOWER(u.municipio) LIKE ? OR
                LOWER(hc.descripcion) LIKE ? OR
                LOWER(cpc.nombre_parte) LIKE ? OR
                LOWER(hv.color) LIKE ? OR
                LOWER(hv.marca) LIKE ? OR
                LOWER(cp.tipo_prenda) LIKE ? OR
                LOWER(ctl.nombre_tipo) LIKE ?
            )
            ORDER BY h.fecha_hallazgo DESC
            LIMIT ? OFFSET ?;
        `;
        
        const params = Array(12).fill(sqlTerm).concat([parseInt(limit), parseInt(offset)]);
        const hallazgos = await db.all(hallazgosSql, params);

        res.json({ success: true, data: hallazgos });

    } catch (error) {
        logger.error(`❌ Error al buscar hallazgos para el feed: ${error.message}`);
        res.status(500).json({ success: false, message: 'Error al realizar la búsqueda de hallazgos.' });
    }
};