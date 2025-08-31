import { openDb } from '../../db/users/initDb.js';
import logger from '../../utils/logger.js';
// Asume que este archivo existe y contiene la lógica de matching
import { findMatchesForHallazgo } from './matchController.js'; 
import { sendMatchNotification } from '../../utils/emailService.js'; // Asume que este archivo existe

/**
 * @fileoverview Controlador para la gestión de Hallazgos.
 * Permite a los usuarios crear, actualizar, eliminar y consultar hallazgos.
 */

// --- Funciones del CRUD de Hallazgos ---

/**
 * Crea un nuevo hallazgo, incluyendo sus características y vestimenta,
 * y busca automáticamente coincidencias con fichas de desaparición.
 */
export const createHallazgo = async (req, res) => {
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
            caracteristicas,
            vestimenta,
        } = req.body;

        const id_usuario_buscador = req.user.id;

        // 1. Insertar la ubicación
        const ubicacionResult = await db.run(
            `INSERT INTO ubicaciones (estado, municipio, localidad, calle, referencias, latitud, longitud, codigo_postal)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                ubicacion_hallazgo.estado,
                ubicacion_hallazgo.municipio,
                ubicacion_hallazgo.localidad,
                ubicacion_hallazgo.calle,
                ubicacion_hallazgo.referencias,
                ubicacion_hallazgo.latitud,
                ubicacion_hallazgo.longitud,
                ubicacion_hallazgo.codigo_postal,
            ]
        );

        const id_ubicacion_hallazgo = ubicacionResult.lastID;

        // 2. Insertar el hallazgo principal
        const hallazgoResult = await db.run(
            `INSERT INTO hallazgos (
                id_usuario_buscador, nombre, segundo_nombre, apellido_paterno, apellido_materno,
                id_ubicacion_hallazgo, id_tipo_lugar_hallazgo, fecha_hallazgo,
                descripcion_general_hallazgo
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
            ]
        );

        const idHallazgo = hallazgoResult.lastID;

        // 3. Insertar características (rasgos)
        if (caracteristicas && caracteristicas.length > 0) {
            const caracteristicasPromises = caracteristicas.map(caracteristica =>
                db.run(
                    `INSERT INTO hallazgo_caracteristicas (id_hallazgo, id_parte_cuerpo, tipo_caracteristica, descripcion)
                     VALUES (?, ?, ?, ?)`,
                    [idHallazgo, caracteristica.id_parte_cuerpo, caracteristica.tipo_caracteristica, caracteristica.descripcion]
                )
            );
            await Promise.all(caracteristicasPromises);
        }

        // 4. Insertar vestimenta
        if (vestimenta && vestimenta.length > 0) {
            const vestimentaPromises = vestimenta.map(prenda =>
                db.run(
                    `INSERT INTO hallazgo_vestimenta (id_hallazgo, id_prenda, color, marca, caracteristica_especial)
                     VALUES (?, ?, ?, ?, ?)`,
                    [idHallazgo, prenda.id_prenda, prenda.color, prenda.marca, prenda.caracteristica_especial]
                )
            );
            await Promise.all(vestimentaPromises);
        }

        await db.exec('COMMIT');

        // 5. Búsqueda de coincidencias y envío de notificaciones
        const matches = await findMatchesForHallazgo({
            id_hallazgo: idHallazgo,
            ubicacion_hallazgo,
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
                u.id_ubicacion AS id_ubicacion_hallazgo,
                u.estado, u.municipio, u.localidad, u.calle, u.referencias, u.latitud, u.longitud, u.codigo_postal,
                ctl.nombre_tipo AS tipo_lugar,
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
            WHERE h.id_hallazgo = ?
            GROUP BY h.id_hallazgo;
        `;
        const hallazgoCompleto = await db.get(sql, [id]);

        if (!hallazgoCompleto) {
            return res.status(404).json({ success: false, message: 'Hallazgo no encontrado.' });
        }
        
        const caracteristicas = JSON.parse(hallazgoCompleto.caracteristicas_json);
        const vestimenta = JSON.parse(hallazgoCompleto.vestimenta_json);
        
        delete hallazgoCompleto.caracteristicas_json;
        delete hallazgoCompleto.vestimenta_json;

        res.json({ 
            success: true, 
            data: {
                ...hallazgoCompleto,
                caracteristicas: caracteristicas[0] === null ? [] : caracteristicas,
                vestimenta: vestimenta[0] === null ? [] : vestimenta
            }
        });
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
        const {
            nombre, segundo_nombre, apellido_paterno, apellido_materno,
            fecha_hallazgo, descripcion_general_hallazgo,
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

        // 2. Construye y ejecuta la actualización de la ubicación de forma dinámica
        const ubicacionUpdateData = {};
        for (const key in ubicacion_hallazgo) {
            if (ubicacion_hallazgo[key] !== undefined && ubicacion_hallazgo[key] !== null) {
                ubicacionUpdateData[key] = ubicacion_hallazgo[key];
            }
        }

        if (Object.keys(ubicacionUpdateData).length > 0) {
            const ubicacionSetClause = Object.keys(ubicacionUpdateData).map(key => `${key} = ?`).join(', ');
            const ubicacionValues = Object.values(ubicacionUpdateData);

            await db.run(
                `UPDATE ubicaciones SET ${ubicacionSetClause} WHERE id_ubicacion = ?`,
                [...ubicacionValues, hallazgo.id_ubicacion_hallazgo]
            );
        }

        // 3. Construye y ejecuta la actualización del hallazgo de forma dinámica
        const hallazgoUpdateData = {};
        const mainFields = {
            nombre, segundo_nombre, apellido_paterno, apellido_materno,
            fecha_hallazgo, descripcion_general_hallazgo
        };
        for (const key in mainFields) {
            if (mainFields[key] !== undefined && mainFields[key] !== null) {
                hallazgoUpdateData[key] = mainFields[key];
            }
        }

        if (Object.keys(hallazgoUpdateData).length > 0) {
            const hallazgoSetClause = Object.keys(hallazgoUpdateData).map(key => `${key} = ?`).join(', ');
            const hallazgoValues = Object.values(hallazgoUpdateData);

            await db.run(
                `UPDATE hallazgos SET ${hallazgoSetClause} WHERE id_hallazgo = ?`,
                [...hallazgoValues, id]
            );
        }

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
            ? 'h.id_hallazgo, h.nombre, h.segundo_nombre, h.apellido_paterno, h.apellido_materno, h.fecha_hallazgo, u.estado, u.municipio'
            : `h.id_hallazgo, h.id_usuario_buscador, h.nombre, h.segundo_nombre, h.apellido_paterno, h.apellido_materno, h.fecha_hallazgo, h.descripcion_general_hallazgo, h.estado_hallazgo, u.estado, u.municipio, u.localidad, u.calle, u.referencias, u.latitud, u.longitud, u.codigo_postal, ctl.nombre_tipo AS tipo_lugar,
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
