// backend/controllers/hallazgos/hallazgosController.js

import { openDb } from '../../db/users/initDb.js';
import logger from '../../utils/logger.js';
// Asume que este archivo existe y contiene la lógica de matching
import { findMatchesForHallazgo } from './matchController.js'; 
import { sendMatchNotification } from '../../utils/emailService.js'; // Asume que este archivo existe
import { searchHallazgosByKeyword } from '../../db/queries/fichasAndHallazgosQueries.js';
import { createNotification } from '../../db/queries/notificationsQueries.js';

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
 * Crea un nuevo hallazgo, incluyendo sus características y vestimenta,
 * y busca automáticamente coincidencias con fichas de desaparición.
 */
export const createHallazgo = async (req, res) => {
    console.log("📥 Datos recibidos en el backend (crear):", req.body);

    const db = await openDb();
    await db.exec('BEGIN TRANSACTION');

    try {
        const {
            nombre,
            segundo_nombre,
            apellido_paterno,
            apellido_materno,
            fecha_hallazgo,
            descripcion_general_hallazgo,
            ubicacion_hallazgo,
            id_tipo_lugar_hallazgo,
            // Nuevos campos
            edad_estimada,
            genero,
            estatura,
            complexion,
            peso,
            // Fin de nuevos campos
            caracteristicas,
            vestimenta,
        } = req.body;

        const id_usuario_buscador = req.user.id;

        // 1. Insertar la ubicación
        const estado = ubicacion_hallazgo.estado || null;
        const municipio = ubicacion_hallazgo.municipio || null;
        const localidad = ubicacion_hallazgo.localidad || null;
        const calle = ubicacion_hallazgo.calle || null;
        const referencias = ubicacion_hallazgo.referencias || null;
        const latitud = ubicacion_hallazgo.latitud || null;
        const longitud = ubicacion_hallazgo.longitud || null;
        const codigo_postal = ubicacion_hallazgo.codigo_postal || null;

        console.log("🛠️  Valores para insertar en 'ubicaciones':", [estado, municipio, localidad, calle, referencias, latitud, longitud, codigo_postal]);

        const ubicacionResult = await db.run(
            `INSERT INTO ubicaciones (estado, municipio, localidad, calle, referencias, latitud, longitud, codigo_postal)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [estado, municipio, localidad, calle, referencias, latitud, longitud, codigo_postal]
        );
        console.log("🟢 Resultado de la inserción de 'ubicaciones':", { lastID: ubicacionResult.lastID, changes: ubicacionResult.changes });
        
        const id_ubicacion_hallazgo = ubicacionResult.lastID;

        // 2. Insertar el hallazgo principal con los nuevos campos
        const hallazgoResult = await db.run(
            `INSERT INTO hallazgos (
                id_usuario_buscador, nombre, segundo_nombre, apellido_paterno, apellido_materno,
                id_ubicacion_hallazgo, id_tipo_lugar_hallazgo, fecha_hallazgo,
                descripcion_general_hallazgo, edad_estimada, genero, estatura, complexion, peso
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                id_usuario_buscador,
                nombre,
                segundo_nombre,
                apellido_paterno,
                apellido_materno,
                id_ubicacion_hallazgo,
                id_tipo_lugar_hallazgo,
                fecha_hallazgo,
                descripcion_general_hallazgo,
                edad_estimada,
                genero,
                estatura,
                complexion,
                peso,
            ]
        );
        console.log("🟢 Resultado de la inserción de 'hallazgos':", { lastID: hallazgoResult.lastID, changes: hallazgoResult.changes });

        const idHallazgo = hallazgoResult.lastID;

        // 3. Insertar características (rasgos)
        if (caracteristicas && caracteristicas.length > 0) {
            console.log("🛠️  Valores para insertar en 'hallazgo_caracteristicas':", caracteristicas.map(c => [
                idHallazgo, 
                c.id_parte_cuerpo, 
                c.tipo_caracteristica, 
                c.descripcion
            ]));
            const caracteristicasPromises = caracteristicas.map(caracteristica =>
                db.run(
                    `INSERT INTO hallazgo_caracteristicas (id_hallazgo, id_parte_cuerpo, tipo_caracteristica, descripcion)
                     VALUES (?, ?, ?, ?)`,
                    [idHallazgo, caracteristica.id_parte_cuerpo, caracteristica.tipo_caracteristica, caracteristica.descripcion]
                )
            );
            const results = await Promise.all(caracteristicasPromises);
            console.log("🟢 Resultados de inserción de 'caracteristicas':", results.map(r => ({ lastID: r.lastID, changes: r.changes })));
        }

        // 4. Insertar vestimenta
        if (vestimenta && vestimenta.length > 0) {
            console.log("🛠️  Valores para insertar en 'hallazgo_vestimenta':", vestimenta.map(v => [
                idHallazgo, 
                v.id_prenda, 
                v.color, 
                v.marca, 
                v.caracteristica_especial
            ]));
            const vestimentaPromises = vestimenta.map(prenda =>
                db.run(
                    `INSERT INTO hallazgo_vestimenta (id_hallazgo, id_prenda, color, marca, caracteristica_especial)
                     VALUES (?, ?, ?, ?, ?)`,
                    [idHallazgo, prenda.id_prenda, prenda.color, prenda.marca, prenda.caracteristica_especial]
                )
            );
            const results = await Promise.all(vestimentaPromises);
            console.log("🟢 Resultados de inserción de 'vestimenta':", results.map(r => ({ lastID: r.lastID, changes: r.changes })));
        }

        await db.exec('COMMIT');

        // 5. Búsqueda de coincidencias y envío de notificaciones
        const matches = await findMatchesForHallazgo({
            id_hallazgo: idHallazgo,
            ubicacion_hallazgo,
            edad_estimada,
            genero,
            estatura,
            complexion,
            peso,
            caracteristicas,
            vestimenta,
        });

        if (matches?.length) {
            for (const match of matches) {
                const userEmail = await db.get(`SELECT email FROM users WHERE id = ?`, [match.id_usuario_creador]);
                if (userEmail) {
                    await sendMatchNotification(userEmail.email, 'Posible Coincidencia de Hallazgo', 'Hemos encontrado una posible coincidencia para la persona que reportaste.');
                    logger.info(`📧 Correo enviado a ${userEmail.email} por coincidencia en hallazgo.`);
                }
            }
        }

        // ✅ Lógica de notificación AÑADIDA
        await notificarUsuariosDeFichas(req, matches, hallazgoData);

        // 6. Responder al cliente
        if (matches && matches.length > 0) {
            res.status(201).json({
                success: true,
                message: 'Hallazgo creado con éxito. Se encontraron posibles coincidencias.',
                id_hallazgo: idHallazgo,
                matches,
            });
        } else {
            res.status(201).json({
                success: true,
                message: 'Hallazgo creado con éxito. No se encontraron coincidencias inmediatas.',
                id_hallazgo: idHallazgo,
            });
        }
    } catch (error) {
        await db.exec('ROLLBACK');
        logger.error(`❌ Error al crear hallazgo: ${error.message}`);
        res.status(500).json({ success: false, message: 'Error interno del servidor al crear hallazgo' });
    }
};

/**
 * Obtiene todos los hallazgos con sus detalles.
 */
export const getAllHallazgos = async (req, res) => {
    try {
        const db = await openDb();

        const hallazgosSql = `
            SELECT 
                h.id_hallazgo,
                h.id_usuario_buscador,
                h.nombre,
                h.segundo_nombre,
                h.apellido_paterno,
                h.apellido_materno,
                h.fecha_hallazgo,
                h.descripcion_general_hallazgo,
                -- Nuevos campos agregados
                h.edad_estimada,
                h.genero,
                h.estatura,
                h.complexion,
                h.peso,
                -- Fin de nuevos campos
                u.estado,
                u.municipio,
                ctl.nombre_tipo AS tipo_lugar,
                -- Agregamos las caracteristicas y vestimenta como JSON
                json_group_array(DISTINCT json_object(
                    'tipo_caracteristica', hc.tipo_caracteristica, 
                    'descripcion', hc.descripcion,
                    'nombre_parte', cpc.nombre_parte
                )) FILTER (WHERE hc.id_hallazgo_caracteristica IS NOT NULL) AS caracteristicas_json,
                json_group_array(DISTINCT json_object(
                    'color', hv.color, 
                    'marca', hv.marca, 
                    'caracteristica_especial', hv.caracteristica_especial,
                    'tipo_prenda', cp.tipo_prenda
                )) FILTER (WHERE hv.id_hallazgo_vestimenta IS NOT NULL) AS vestimenta_json
            FROM hallazgos AS h
            LEFT JOIN ubicaciones AS u ON h.id_ubicacion_hallazgo = u.id_ubicacion
            LEFT JOIN catalogo_tipo_lugar AS ctl ON h.id_tipo_lugar_hallazgo = ctl.id_tipo_lugar
            LEFT JOIN hallazgo_caracteristicas AS hc ON h.id_hallazgo = hc.id_hallazgo
            LEFT JOIN catalogo_partes_cuerpo AS cpc ON hc.id_parte_cuerpo = cpc.id_parte_cuerpo
            LEFT JOIN hallazgo_vestimenta AS hv ON h.id_hallazgo = hv.id_hallazgo
            LEFT JOIN catalogo_prendas AS cp ON hv.id_prenda = cp.id_prenda
            GROUP BY h.id_hallazgo
            ORDER BY h.fecha_hallazgo DESC
            LIMIT 20;
        `;
        
        const hallazgosResult = await db.all(hallazgosSql);

        // Parsear los resultados JSON
        const hallazgosCompletos = hallazgosResult.map(hallazgo => {
            const caracteristicas = JSON.parse(hallazgo.caracteristicas_json);
            const vestimenta = JSON.parse(hallazgo.vestimenta_json);
            
            // Eliminar los campos JSON crudos
            delete hallazgo.caracteristicas_json;
            delete hallazgo.vestimenta_json;

            return {
                ...hallazgo,
                caracteristicas: caracteristicas[0] === null ? [] : caracteristicas,
                vestimenta: vestimenta[0] === null ? [] : vestimenta
            };
        });

        res.json({ success: true, data: hallazgosCompletos });
    } catch (error) {
        logger.error(`❌ Error al obtener todos los hallazgos: ${error.message}`);
        res.status(500).json({ success: false, message: 'Error al obtener los hallazgos.' });
    }
};


/**
 * Obtiene un hallazgo específico por su ID.
 */
export const getHallazgoById = async (req, res) => {
    const db = await openDb();
    try {
        const { id } = req.params;
        const sql = `
            SELECT 
                h.id_hallazgo,
                h.id_usuario_buscador,
                h.nombre,
                h.segundo_nombre,
                h.apellido_paterno,
                h.apellido_materno,
                h.fecha_hallazgo,
                h.descripcion_general_hallazgo,
                h.estado_hallazgo,
                h.id_tipo_lugar_hallazgo,
                -- Nuevos campos agregados
                h.edad_estimada,
                h.genero,
                h.estatura,
                h.complexion,
                h.peso,
                -- Fin de nuevos campos
                u.id_ubicacion AS id_ubicacion_hallazgo,
                u.estado, u.municipio, u.localidad, u.calle, u.referencias, u.latitud, u.longitud, u.codigo_postal,
                ctl.nombre_tipo AS tipo_lugar,
                json_group_array(DISTINCT json_object(
                    'id_parte_cuerpo', hc.id_parte_cuerpo,
                    'tipo_caracteristica', hc.tipo_caracteristica, 
                    'descripcion', hc.descripcion,
                    'nombre_parte', cpc.nombre_parte
                )) FILTER (WHERE hc.id_hallazgo_caracteristica IS NOT NULL) AS caracteristicas_json,
                json_group_array(DISTINCT json_object(
                    'id_prenda', hv.id_prenda,
                    'color', hv.color, 
                    'marca', hv.marca, 
                    'caracteristica_especial', hv.caracteristica_especial,
                    'tipo_prenda', cp.tipo_prenda
                )) FILTER (WHERE hv.id_hallazgo_vestimenta IS NOT NULL) AS vestimenta_json
            FROM hallazgos AS h
            LEFT JOIN ubicaciones AS u ON h.id_ubicacion_hallazgo = u.id_ubicacion
            LEFT JOIN catalogo_tipo_lugar AS ctl ON h.id_tipo_lugar_hallazgo = ctl.id_tipo_lugar
            LEFT JOIN hallazgo_caracteristicas AS hc ON h.id_hallazgo = hc.id_hallazgo
            LEFT JOIN catalogo_partes_cuerpo AS cpc ON hc.id_parte_cuerpo = cpc.id_parte_cuerpo
            LEFT JOIN hallazgo_vestimenta AS hv ON h.id_hallazgo = hv.id_hallazgo
            LEFT JOIN catalogo_prendas AS cp ON hv.id_prenda = cp.id_prenda
            WHERE h.id_hallazgo = ?
            GROUP BY h.id_hallazgo;
        `;
        const hallazgoCompleto = await db.get(sql, [id]);

        if (!hallazgoCompleto) {
            return res.status(404).json({ success: false, message: 'Hallazgo no encontrado.' });
        }
        
        console.log('SQL Raw Result:', hallazgoCompleto);

        const { 
            id_ubicacion_hallazgo, estado, municipio, localidad, calle, referencias, latitud, longitud, codigo_postal,
            caracteristicas_json, vestimenta_json,
            id_tipo_lugar_hallazgo, 
            ...restOfData // Aquí se capturan todos los demás campos (nombre, fecha, etc.)
        } = hallazgoCompleto;

        const caracteristicas = JSON.parse(hallazgoCompleto.caracteristicas_json);
        const vestimenta = JSON.parse(hallazgoCompleto.vestimenta_json);
        
          // Formatear la respuesta para que coincida con el formato del formulario en el frontend
        const formattedData = {
            ...restOfData, // Usamos los campos restantes
            ubicacion_hallazgo: {
                id_ubicacion_hallazgo,
                estado,
                municipio,
                localidad,
                calle,
                referencias,
                latitud,
                longitud,
                codigo_postal,
            },
            id_tipo_lugar_hallazgo,
            caracteristicas: caracteristicas[0] === null ? [] : caracteristicas,
            vestimenta: vestimenta[0] === null ? [] : vestimenta
        };

        res.json({ success: true, data: formattedData });
        
    } catch (error) {
        logger.error(`❌ Error al obtener el hallazgo por ID: ${error.message}`);
        res.status(500).json({ success: false, message: 'Error al obtener el hallazgo.' });
    }
};

/**
 * Actualiza un hallazgo existente, verificando la propiedad del usuario.
 */
export const actualizarHallazgo = async (req, res) => {
    const db = await openDb();
    await db.exec('BEGIN TRANSACTION');

    try {
        const { id } = req.params;
        console.log("📥 Datos recibidos en el backend (editar):", req.body);
        const {
            nombre, segundo_nombre, apellido_paterno, apellido_materno,
            fecha_hallazgo, descripcion_general_hallazgo, id_tipo_lugar_hallazgo,
            // Nuevos campos
            edad_estimada, genero, estatura, complexion, peso,
            // Fin de nuevos campos
            ubicacion_hallazgo, caracteristicas, vestimenta,
        } = req.body;

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

        // 2. Actualiza la ubicación con los datos que se reciben
        await db.run(
            `UPDATE ubicaciones SET 
             estado = ?, municipio = ?, localidad = ?, calle = ?, referencias = ?, 
             latitud = ?, longitud = ?, codigo_postal = ?
             WHERE id_ubicacion = ?`,
            [
                ubicacion_hallazgo.estado,
                ubicacion_hallazgo.municipio,
                ubicacion_hallazgo.localidad,
                ubicacion_hallazgo.calle,
                ubicacion_hallazgo.referencias,
                ubicacion_hallazgo.latitud,
                ubicacion_hallazgo.longitud,
                ubicacion_hallazgo.codigo_postal,
                hallazgo.id_ubicacion_hallazgo,
            ]
        );

        // 3. Actualiza el hallazgo principal
        const hallazgoUpdateData = {
            nombre, segundo_nombre, apellido_paterno, apellido_materno,
            fecha_hallazgo, descripcion_general_hallazgo, id_tipo_lugar_hallazgo,
            edad_estimada, genero, estatura, complexion, peso,
        };
        
        const hallazgoSetClause = Object.keys(hallazgoUpdateData).map(key => `${key} = ?`).join(', ');
        const hallazgoValues = Object.values(hallazgoUpdateData);
        
        await db.run(
            `UPDATE hallazgos SET ${hallazgoSetClause} WHERE id_hallazgo = ?`,
            [...hallazgoValues, id]
        );

        // 4. Eliminar y reinsertar caracteristicas y vestimenta
        await db.run(`DELETE FROM hallazgo_caracteristicas WHERE id_hallazgo = ?`, [id]);
        await db.run(`DELETE FROM hallazgo_vestimenta WHERE id_hallazgo = ?`, [id]);

        if (caracteristicas && caracteristicas.length > 0) {
            const caracteristicasPromises = caracteristicas.map(caracteristica =>
                db.run(
                    `INSERT INTO hallazgo_caracteristicas (id_hallazgo, id_parte_cuerpo, tipo_caracteristica, descripcion)
                     VALUES (?, ?, ?, ?)`,
                    [id, caracteristica.id_parte_cuerpo, caracteristica.tipo_caracteristica, caracteristica.descripcion]
                )
            );
            await Promise.all(caracteristicasPromises);
        }

        if (vestimenta && vestimenta.length > 0) {
            const vestimentaPromises = vestimenta.map(prenda =>
                db.run(
                    `INSERT INTO hallazgo_vestimenta (id_hallazgo, id_prenda, color, marca, caracteristica_especial)
                     VALUES (?, ?, ?, ?, ?)`,
                    [id, prenda.id_prenda, prenda.color, prenda.marca, prenda.caracteristica_especial]
                )
            );
            await Promise.all(vestimentaPromises);
        }

        await db.exec('COMMIT');

        // --- INICIO DE LA NUEVA LÓGICA ---
        logger.info(`✅ Hallazgo ${id} actualizado. Re-ejecutando búsqueda de coincidencias...`);
        const hallazgoData = { id_hallazgo: id, ...req.body };
        const matches = await findMatchesForHallazgo(hallazgoData);
        
        await notificarUsuariosDeFichas(req, matches, hallazgoData);
        // --- FIN DE LA NUEVA LÓGICA ---
        
        res.json({ success: true, message: 'Hallazgo actualizado correctamente' });
    } catch (error) {
        await db.exec('ROLLBACK');
        console.error(`❌ Error al actualizar hallazgo: ${error.message}`);
        res.status(500).json({ success: false, message: 'Error interno del servidor al actualizar hallazgo' });
    }
};
/**
 * Elimina el hallazgo y los registros asociados
 */
export const deleteHallazgo = async (req, res) => {
    const db = await openDb();
    await db.exec('BEGIN TRANSACTION');

    try {
        const { id } = req.params;
        const id_usuario_buscador = req.user.id;

        const hallazgo = await db.get(
            `SELECT id_hallazgo, id_ubicacion_hallazgo FROM hallazgos WHERE id_hallazgo = ? AND id_usuario_buscador = ?`,
            [id, id_usuario_buscador]
        );

        if (!hallazgo) {
            await db.exec('ROLLBACK');
            return res.status(404).json({ success: false, message: 'Hallazgo no encontrado o no autorizado' });
        }

        await db.run(`DELETE FROM hallazgos WHERE id_hallazgo = ?`, [id]);
        await db.run(`DELETE FROM ubicaciones WHERE id_ubicacion = ?`, [hallazgo.id_ubicacion_hallazgo]);

        await db.exec('COMMIT');
        res.json({ success: true, message: 'Hallazgo y registros asociados eliminados correctamente' });
    } catch (error) {
        await db.exec('ROLLBACK');
        logger.error(`❌ Error al eliminar hallazgo: ${error.message}`);
        res.status(500).json({ success: false, message: 'Error interno del servidor al eliminar hallazgo' });
    }
};

/**
 * Busca hallazgos por un término de búsqueda.
 */
export const searchHallazgos = async (req, res) => {
    try {
        const db = await openDb();
        const { searchTerm = '', limit = 20, offset = 0, orderBy = 'fecha_hallazgo', orderDir = 'DESC', resumen = false } = req.query;

        const allowedOrderBy = ['nombre', 'apellido_paterno', 'fecha_hallazgo'];
        const allowedOrderDir = ['ASC', 'DESC'];
        const safeOrderBy = allowedOrderBy.includes(orderBy) ? orderBy : 'fecha_hallazgo';
        const safeOrderDir = allowedOrderDir.includes(orderDir.toUpperCase()) ? orderDir.toUpperCase() : 'DESC';

        const queryTerm = `%${searchTerm.toLowerCase()}%`;
        const selectFields = resumen
            ? `h.id_hallazgo, h.nombre, h.segundo_nombre, h.apellido_paterno, h.apellido_materno, h.fecha_hallazgo, h.genero, h.edad_estimada, u.estado, u.municipio`
            : `h.id_hallazgo, h.id_usuario_buscador, h.nombre, h.segundo_nombre, h.apellido_paterno, h.apellido_materno, h.fecha_hallazgo, h.descripcion_general_hallazgo, h.estado_hallazgo, 
               h.edad_estimada, h.genero, h.estatura, h.complexion, h.peso,
               u.estado, u.municipio, u.localidad, u.calle, u.referencias, u.latitud, u.longitud, u.codigo_postal, ctl.nombre_tipo AS tipo_lugar,
                json_group_array(DISTINCT json_object('tipo_caracteristica', hc.tipo_caracteristica, 'descripcion', hc.descripcion, 'nombre_parte', cpc.nombre_parte)) FILTER (WHERE hc.id_hallazgo_caracteristica IS NOT NULL) AS caracteristicas_json,
                json_group_array(DISTINCT json_object('color', hv.color, 'marca', hv.marca, 'caracteristica_especial', hv.caracteristica_especial, 'tipo_prenda', cp.tipo_prenda)) FILTER (WHERE hv.id_hallazgo_vestimenta IS NOT NULL) AS vestimenta_json
            `;

        const hallazgosSql = `
            SELECT ${selectFields}
            FROM hallazgos AS h
            LEFT JOIN ubicaciones AS u ON h.id_ubicacion_hallazgo = u.id_ubicacion
            LEFT JOIN catalogo_tipo_lugar AS ctl ON h.id_tipo_lugar_hallazgo = ctl.id_tipo_lugar
            LEFT JOIN hallazgo_caracteristicas AS hc ON h.id_hallazgo = hc.id_hallazgo
            LEFT JOIN catalogo_partes_cuerpo AS cpc ON hc.id_parte_cuerpo = cpc.id_parte_cuerpo
            LEFT JOIN hallazgo_vestimenta AS hv ON h.id_hallazgo = hv.id_hallazgo
            LEFT JOIN catalogo_prendas AS cp ON hv.id_prenda = cp.id_prenda
            WHERE LOWER(h.nombre || ' ' || IFNULL(h.segundo_nombre, '') || ' ' || h.apellido_paterno || ' ' || IFNULL(h.apellido_materno, '')) LIKE LOWER(?)
            GROUP BY h.id_hallazgo
            ORDER BY ${safeOrderBy} ${safeOrderDir}
            LIMIT ? OFFSET ?
        `;

        const hallazgosResult = await db.all(hallazgosSql, [queryTerm, limit, offset]);

        if (resumen) {
            return res.json({ success: true, data: hallazgosResult });
        }

        const hallazgosCompletos = hallazgosResult.map(hallazgo => {
            const caracteristicas = JSON.parse(hallazgo.caracteristicas_json);
            const vestimenta = JSON.parse(hallazgo.vestimenta_json);
            
            delete hallazgo.caracteristicas_json;
            delete hallazgo.vestimenta_json;

            return {
                ...hallazgo,
                caracteristicas: caracteristicas[0] === null ? [] : caracteristicas,
                vestimenta: vestimenta[0] === null ? [] : vestimenta
            };
        });

        res.json({ success: true, data: hallazgosCompletos });
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

/**
 * Obtiene los hallazgos creados por un usuario específico.
 */
export const getHallazgosByUserId = async (req, res) => {
    // LOG #1: Confirma que la función fue invocada
    console.log('--- 🚀 [BACKEND] Controlador getHallazgosByUserId INVOCADO ---');

    try {
        const db = await openDb();
        
        // LOG #2: Inspeccionar el objeto 'user' que adjunta el middleware de autenticación
        console.log('1. Contenido de req.user:', JSON.stringify(req.user, null, 2));

        // El ID del usuario viene del token. Usamos optional chaining (?.) por seguridad.
        const id_usuario_buscador = req.user?.id; 

        // LOG #3: Verificar el ID de usuario que se extrajo
        console.log('2. ID de usuario extraído para la consulta:', id_usuario_buscador);

        if (!id_usuario_buscador) {
            console.error('❌ Error Crítico: No se pudo extraer el ID del usuario desde req.user. El middleware puede estar fallando.');
            return res.status(403).json({ success: false, message: 'Acceso denegado: Identidad de usuario no encontrada.' });
        }

        const hallazgosSql = `
            SELECT 
                h.id_hallazgo, h.id_usuario_buscador, h.nombre, h.segundo_nombre, h.apellido_paterno,
                h.apellido_materno, h.fecha_hallazgo, h.descripcion_general_hallazgo, h.edad_estimada,
                h.genero, h.estatura, h.complexion, h.peso, u.estado, u.municipio, ctl.nombre_tipo AS tipo_lugar,
                json_group_array(DISTINCT json_object('tipo_caracteristica', hc.tipo_caracteristica, 'descripcion', hc.descripcion, 'nombre_parte', cpc.nombre_parte)) FILTER (WHERE hc.id_hallazgo_caracteristica IS NOT NULL) AS caracteristicas_json,
                json_group_array(DISTINCT json_object('color', hv.color, 'marca', hv.marca, 'caracteristica_especial', hv.caracteristica_especial, 'tipo_prenda', cp.tipo_prenda)) FILTER (WHERE hv.id_hallazgo_vestimenta IS NOT NULL) AS vestimenta_json
            FROM hallazgos AS h
            LEFT JOIN ubicaciones AS u ON h.id_ubicacion_hallazgo = u.id_ubicacion
            LEFT JOIN catalogo_tipo_lugar AS ctl ON h.id_tipo_lugar_hallazgo = ctl.id_tipo_lugar
            LEFT JOIN hallazgo_caracteristicas AS hc ON h.id_hallazgo = hc.id_hallazgo
            LEFT JOIN catalogo_partes_cuerpo AS cpc ON hc.id_parte_cuerpo = cpc.id_parte_cuerpo
            LEFT JOIN hallazgo_vestimenta AS hv ON h.id_hallazgo = hv.id_hallazgo
            LEFT JOIN catalogo_prendas AS cp ON hv.id_prenda = cp.id_prenda
            WHERE h.id_usuario_buscador = ? -- Esta línea filtra por el ID del usuario
            GROUP BY h.id_hallazgo
            ORDER BY h.fecha_hallazgo DESC
            LIMIT 20;
        `;
        
        const hallazgosResult = await db.all(hallazgosSql, [id_usuario_buscador]);

        // LOG #4: Ver el resultado crudo que devuelve la base de datos
        console.log('3. Resultado crudo de la BD (hallazgosResult):', hallazgosResult);

        const hallazgosCompletos = hallazgosResult.map(hallazgo => {
            const caracteristicas = JSON.parse(hallazgo.caracteristicas_json);
            const vestimenta = JSON.parse(hallazgo.vestimenta_json);
            
            delete hallazgo.caracteristicas_json;
            delete hallazgo.vestimenta_json;

            return {
                ...hallazgo,
                caracteristicas: caracteristicas && caracteristicas[0] === null ? [] : caracteristicas,
                vestimenta: vestimenta && vestimenta[0] === null ? [] : vestimenta
            };
        });

        // LOG #5: Ver los datos finales justo antes de enviarlos al frontend
        console.log('4. Datos procesados listos para enviar (hallazgosCompletos):', hallazgosCompletos);
        console.log('--- ✅ [BACKEND] Petición procesada con éxito ---');

        res.json({ success: true, data: hallazgosCompletos });
    } catch (error) {
        // LOG #6: Asegurarnos de que si hay un error, lo veamos claramente
        console.error('--- ❌ [BACKEND] ERROR CAPTURADO EN EL CONTROLADOR ---');
        console.error(error);
        logger.error(`❌ Error al obtener los hallazgos del usuario: ${error.message}`);
        res.status(500).json({ success: false, message: 'Error al obtener tus hallazgos.' });
    }
};

export const searchHallazgosFeed = async (req, res) => {
    try {
        // Extraemos todos los parámetros necesarios de la URL
        const { searchTerm = '', limit = 10, offset = 0 } = req.query; 

        console.log(`[Backend Controller] Término: "${searchTerm}", Límite: ${limit}, Offset: ${offset}`);

        // Pasamos TODOS los parámetros a la función de la base de datos
        const hallazgos = await searchHallazgosByKeyword(searchTerm, parseInt(limit), parseInt(offset));

        console.log(`[Backend Controller] Datos a enviar:`, hallazgos);

        res.json({ success: true, data: hallazgos });
    } catch (error) {
        logger.error(`❌ Error al buscar hallazgos para el feed: ${error.message}`);
        res.status(500).json({ success: false, message: 'Error al realizar la búsqueda de hallazgos.' });
    }
};