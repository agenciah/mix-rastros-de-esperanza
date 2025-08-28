// backend/controllers/fichas/fichasController.js

import { openDb } from '../../db/users/initDb.js';
import logger from '../../utils/logger.js';
import { findMatchesForFicha } from './matchingService.js';
import { getFichaCompletaById } from '../../db/queries/fichasAndHallazgosQueries.js';

/**
 * @fileoverview Controlador para la gestión de Fichas de Desaparición.
 * Permite a los usuarios crear, actualizar, eliminar y consultar fichas.
 */

// --- Funciones del CRUD de Fichas ---

/**
 * Crea una nueva ficha de desaparición, incluyendo sus rasgos y vestimenta,
 * y busca automáticamente coincidencias con hallazgos.
 */
export const createFichaDesaparicion = async (req, res) => {
    const db = await openDb();
    await db.exec('BEGIN TRANSACTION');

    try {
        const {
            nombre,
            segundo_nombre,
            apellido_paterno,
            apellido_materno,
            fecha_desaparicion,
            ubicacion_desaparicion,
            id_tipo_lugar_desaparicion,
            foto_perfil,
            rasgos_fisicos,
            vestimenta,
        } = req.body;

        const id_usuario_creador = req.user.id;

        // 1. Insertar la ubicación
        const ubicacionResult = await db.run(
            `INSERT INTO ubicaciones (estado, municipio, localidad, calle, referencias, latitud, longitud, codigo_postal)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                ubicacion_desaparicion.estado,
                ubicacion_desaparicion.municipio,
                ubicacion_desaparicion.localidad,
                ubicacion_desaparicion.calle,
                ubicacion_desaparicion.referencias,
                ubicacion_desaparicion.latitud,
                ubicacion_desaparicion.longitud,
                ubicacion_desaparicion.codigo_postal,
            ]
        );

        const id_ubicacion_desaparicion = ubicacionResult.lastID;

        // 2. Insertar la ficha principal
        const fichaResult = await db.run(
            `INSERT INTO fichas_desaparicion (
                id_usuario_creador, nombre, segundo_nombre, apellido_paterno, apellido_materno,
                fecha_desaparicion, id_ubicacion_desaparicion, id_tipo_lugar_desaparicion,
                foto_perfil
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                id_usuario_creador,
                nombre,
                segundo_nombre,
                apellido_paterno,
                apellido_materno,
                fecha_desaparicion,
                id_ubicacion_desaparicion,
                id_tipo_lugar_desaparicion,
                foto_perfil,
            ]
        );

        const idFicha = fichaResult.lastID;

        // 3. Insertar rasgos físicos
        if (rasgos_fisicos && rasgos_fisicos.length > 0) {
            const rasgosPromises = rasgos_fisicos.map(rasgo =>
                db.run(
                    `INSERT INTO ficha_rasgos_fisicos (id_ficha, id_parte_cuerpo, tipo_rasgo, descripcion_detalle)
                     VALUES (?, ?, ?, ?)`,
                    [idFicha, rasgo.id_parte_cuerpo, rasgo.tipo_rasgo, rasgo.descripcion_detalle]
                )
            );
            await Promise.all(rasgosPromises);
        }

        // 4. Insertar vestimenta
        if (vestimenta && vestimenta.length > 0) {
            const vestimentaPromises = vestimenta.map(prenda =>
                db.run(
                    `INSERT INTO ficha_vestimenta (id_ficha, id_prenda, color, marca, caracteristica_especial)
                     VALUES (?, ?, ?, ?, ?)`,
                    [idFicha, prenda.id_prenda, prenda.color, prenda.marca, prenda.caracteristica_especial]
                )
            );
            await Promise.all(vestimentaPromises);
        }

        await db.exec('COMMIT');

        // 5. Búsqueda de coincidencias
        const matches = await findMatchesForFicha({
            id_ficha: idFicha,
            ubicacion_desaparicion,
            rasgos_fisicos,
            vestimenta,
        });

        // 6. Responder al cliente
        if (matches && matches.length > 0) {
            res.status(201).json({
                success: true,
                message: 'Ficha creada con éxito. Se encontraron posibles coincidencias.',
                id_ficha: idFicha,
                matches,
            });
        } else {
            res.status(201).json({
                success: true,
                message: 'Ficha creada con éxito. No se encontraron coincidencias inmediatas.',
                id_ficha: idFicha,
            });
        }
    } catch (error) {
        await db.exec('ROLLBACK');
        logger.error(`❌ Error al crear ficha: ${error.message}`);
        res.status(500).json({ success: false, message: 'Error interno del servidor al crear ficha' });
    }
};

/**
 * Actualiza una ficha existente, verificando la propiedad del usuario.
 */
export const actualizarFicha = async (req, res) => {
    const db = await openDb();
    await db.exec('BEGIN TRANSACTION');

    try {
        const { id } = req.params;
        const {
            nombre, segundo_nombre, apellido_paterno, apellido_materno,
            fecha_desaparicion, id_tipo_lugar_desaparicion, foto_perfil,
            estado_ficha, fecha_registro_encontrado,
            ubicacion_desaparicion, rasgos_fisicos, vestimenta,
        } = req.body;

        const id_usuario_creador = req.user.id;

        const ficha = await db.get(
            `SELECT id_ficha, id_ubicacion_desaparicion FROM fichas_desaparicion WHERE id_ficha = ? AND id_usuario_creador = ?`,
            [id, id_usuario_creador]
        );

        if (!ficha) {
            await db.exec('ROLLBACK');
            return res.status(404).json({ success: false, message: 'Ficha no encontrada o no autorizado' });
        }

        // 2. Actualizar la ubicación asociada a la ficha
        await db.run(
            `UPDATE ubicaciones SET
                estado = ?, municipio = ?, localidad = ?, calle = ?, referencias = ?,
                latitud = ?, longitud = ?, codigo_postal = ?
             WHERE id_ubicacion = ?`,
            [
                ubicacion_desaparicion.estado,
                ubicacion_desaparicion.municipio,
                ubicacion_desaparicion.localidad,
                ubicacion_desaparicion.calle,
                ubicacion_desaparicion.referencias,
                ubicacion_desaparicion.latitud,
                ubicacion_desaparicion.longitud,
                ubicacion_desaparicion.codigo_postal,
                ficha.id_ubicacion_desaparicion,
            ]
        );

        // 3. Actualizar la ficha de desaparición
        await db.run(
            `UPDATE fichas_desaparicion SET
                nombre = ?, segundo_nombre = ?, apellido_paterno = ?, apellido_materno = ?,
                fecha_desaparicion = ?, id_tipo_lugar_desaparicion = ?, foto_perfil = ?,
                estado_ficha = ?, fecha_registro_encontrado = ?
             WHERE id_ficha = ?`,
            [
                nombre, segundo_nombre, apellido_paterno, apellido_materno,
                fecha_desaparicion, id_tipo_lugar_desaparicion, foto_perfil,
                estado_ficha, fecha_registro_encontrado, id,
            ]
        );

        // 4. Eliminar y reinsertar rasgos y vestimenta
        await db.run(`DELETE FROM ficha_rasgos_fisicos WHERE id_ficha = ?`, [id]);
        await db.run(`DELETE FROM ficha_vestimenta WHERE id_ficha = ?`, [id]);

        if (rasgos_fisicos && rasgos_fisicos.length > 0) {
            const rasgosPromises = rasgos_fisicos.map(rasgo =>
                db.run(
                    `INSERT INTO ficha_rasgos_fisicos (id_ficha, id_parte_cuerpo, tipo_rasgo, descripcion_detalle)
                     VALUES (?, ?, ?, ?)`,
                    [id, rasgo.id_parte_cuerpo, rasgo.tipo_rasgo, rasgo.descripcion_detalle]
                )
            );
            await Promise.all(rasgosPromises);
        }

        if (vestimenta && vestimenta.length > 0) {
            const vestimentaPromises = vestimenta.map(prenda =>
                db.run(
                    `INSERT INTO ficha_vestimenta (id_ficha, id_prenda, color, marca, caracteristica_especial)
                     VALUES (?, ?, ?, ?, ?)`,
                    [id, prenda.id_prenda, prenda.color, prenda.marca, prenda.caracteristica_especial]
                )
            );
            await Promise.all(vestimentaPromises);
        }

        await db.exec('COMMIT');
        res.json({ success: true, message: 'Ficha actualizada correctamente' });
    } catch (error) {
        await db.exec('ROLLBACK');
        logger.error(`❌ Error al actualizar ficha: ${error.message}`);
        res.status(500).json({ success: false, message: 'Error interno del servidor al actualizar ficha' });
    }
};

/**
 * Obtiene todas las fichas de desaparición con sus detalles.
 * Versión optimizada para el feed principal.
 */
export const getAllFichas = async (req, res) => {
    try {
        const db = await openDb();

        const fichasSql = `
            SELECT 
                fd.id_ficha,
                fd.id_usuario_creador,
                fd.nombre,
                fd.segundo_nombre,
                fd.apellido_paterno,
                fd.apellido_materno,
                fd.fecha_desaparicion,
                fd.foto_perfil,
                fd.estado_ficha,
                u.estado,
                u.municipio,
                ctl.nombre_tipo AS tipo_lugar,
                -- Agregamos los rasgos y vestimenta como JSON
                json_group_array(DISTINCT json_object(
                    'tipo_rasgo', frf.tipo_rasgo, 
                    'descripcion_detalle', frf.descripcion_detalle,
                    'nombre_parte', cpc.nombre_parte
                )) FILTER (WHERE frf.id_rasgo IS NOT NULL) AS rasgos_fisicos_json,
                json_group_array(DISTINCT json_object(
                    'color', fv.color, 
                    'marca', fv.marca, 
                    'caracteristica_especial', fv.caracteristica_especial,
                    'tipo_prenda', cp.tipo_prenda
                )) FILTER (WHERE fv.id_vestimenta IS NOT NULL) AS vestimenta_json
            FROM fichas_desaparicion AS fd
            LEFT JOIN ubicaciones AS u ON fd.id_ubicacion_desaparicion = u.id_ubicacion
            LEFT JOIN catalogo_tipo_lugar AS ctl ON fd.id_tipo_lugar_desaparicion = ctl.id_tipo_lugar
            LEFT JOIN ficha_rasgos_fisicos AS frf ON fd.id_ficha = frf.id_ficha
            LEFT JOIN catalogo_partes_cuerpo AS cpc ON frf.id_parte_cuerpo = cpc.id_parte_cuerpo
            LEFT JOIN ficha_vestimenta AS fv ON fd.id_ficha = fv.id_ficha
            LEFT JOIN catalogo_prendas AS cp ON fv.id_prenda = cp.id_prenda
            GROUP BY fd.id_ficha
            ORDER BY fd.fecha_desaparicion DESC
            LIMIT 20;
        `;
        
        const fichasResult = await db.all(fichasSql);

        // Parsear los resultados JSON
        const fichasCompletas = fichasResult.map(ficha => {
            const rasgos_fisicos = JSON.parse(ficha.rasgos_fisicos_json);
            const vestimenta = JSON.parse(ficha.vestimenta_json);
            
            // Eliminar los campos JSON crudos
            delete ficha.rasgos_fisicos_json;
            delete ficha.vestimenta_json;

            return {
                ...ficha,
                rasgos_fisicos: rasgos_fisicos[0] === null ? [] : rasgos_fisicos,
                vestimenta: vestimenta[0] === null ? [] : vestimenta
            };
        });

        res.json({ success: true, data: fichasCompletas });
    } catch (error) {
        logger.error(`❌ Error al obtener todas las fichas: ${error.message}`);
        res.status(500).json({ success: false, message: 'Error al obtener las fichas.' });
    }
};


/**
 * Obtiene una ficha de desaparición específica por su ID.
 * Versión actualizada para usar el módulo de queries.
 */
export const getFichaById = async (req, res) => {
    try {
        const { id } = req.params;
        const fichaCompleta = await getFichaCompletaById(id);

        if (!fichaCompleta) {
            return res.status(404).json({ success: false, message: 'Ficha no encontrada.' });
        }
        
        res.json({ success: true, data: fichaCompleta });
    } catch (error) {
        logger.error(`❌ Error al obtener la ficha por ID: ${error.message}`);
        res.status(500).json({ success: false, message: 'Error al obtener la ficha.' });
    }
};

/**
 * Elimina la ficha de desaparición y los registros asociados
 * (La eliminación en cascada es manejada por la DB)
 */
export const deleteFichaDesaparicion = async (req, res) => {
    const db = await openDb();
    await db.exec('BEGIN TRANSACTION');

    try {
        const { id } = req.params;
        const id_usuario_creador = req.user.id;

        const ficha = await db.get(
            `SELECT id_ficha, id_ubicacion_desaparicion FROM fichas_desaparicion WHERE id_ficha = ? AND id_usuario_creador = ?`,
            [id, id_usuario_creador]
        );

        if (!ficha) {
            await db.exec('ROLLBACK');
            return res.status(404).json({ success: false, message: 'Ficha no encontrada o no autorizado' });
        }

        // La eliminación de rasgos y vestimenta se hará en cascada gracias a la FOREIGN KEY
        await db.run(`DELETE FROM fichas_desaparicion WHERE id_ficha = ?`, [id]);
        await db.run(`DELETE FROM ubicaciones WHERE id_ubicacion = ?`, [ficha.id_ubicacion_desaparicion]);

        await db.exec('COMMIT');
        res.json({ success: true, message: 'Ficha y registros asociados eliminados correctamente' });
    } catch (error) {
        await db.exec('ROLLBACK');
        logger.error(`❌ Error al eliminar ficha: ${error.message}`);
        res.status(500).json({ success: false, message: 'Error interno del servidor al eliminar ficha' });
    }
};

/**
 * Busca fichas de desaparición por un término de búsqueda.
 * Versión optimizada.
 */
export const searchFichas = async (req, res) => {
    try {
        const db = await openDb();
        const { searchTerm = '', limit = 20, offset = 0, orderBy = 'fecha_desaparicion', orderDir = 'DESC', resumen = false } = req.query;

        const allowedOrderBy = ['nombre', 'apellido_paterno', 'fecha_desaparicion'];
        const allowedOrderDir = ['ASC', 'DESC'];
        const safeOrderBy = allowedOrderBy.includes(orderBy) ? orderBy : 'fecha_desaparicion';
        const safeOrderDir = allowedOrderDir.includes(orderDir.toUpperCase()) ? orderDir.toUpperCase() : 'DESC';

        const queryTerm = `%${searchTerm.toLowerCase()}%`;
        const selectFields = resumen
            ? 'fd.id_ficha, fd.nombre, fd.segundo_nombre, fd.apellido_paterno, fd.apellido_materno, fd.fecha_desaparicion, fd.foto_perfil, u.estado, u.municipio'
            : `fd.id_ficha, fd.id_usuario_creador, fd.nombre, fd.segundo_nombre, fd.apellido_paterno, fd.apellido_materno, fd.fecha_desaparicion, fd.foto_perfil, fd.estado_ficha, u.estado, u.municipio, u.localidad, u.calle, u.referencias, u.latitud, u.longitud, u.codigo_postal, ctl.nombre_tipo AS tipo_lugar,
                json_group_array(DISTINCT json_object('tipo_rasgo', frf.tipo_rasgo, 'descripcion_detalle', frf.descripcion_detalle, 'nombre_parte', cpc.nombre_parte)) FILTER (WHERE frf.id_rasgo IS NOT NULL) AS rasgos_fisicos_json,
                json_group_array(DISTINCT json_object('color', fv.color, 'marca', fv.marca, 'caracteristica_especial', fv.caracteristica_especial, 'tipo_prenda', cp.tipo_prenda)) FILTER (WHERE fv.id_vestimenta IS NOT NULL) AS vestimenta_json
            `;

        const fichasSql = `
            SELECT ${selectFields}
            FROM fichas_desaparicion AS fd
            LEFT JOIN ubicaciones AS u ON fd.id_ubicacion_desaparicion = u.id_ubicacion
            LEFT JOIN catalogo_tipo_lugar AS ctl ON fd.id_tipo_lugar_desaparicion = ctl.id_tipo_lugar
            LEFT JOIN ficha_rasgos_fisicos AS frf ON fd.id_ficha = frf.id_ficha
            LEFT JOIN catalogo_partes_cuerpo AS cpc ON frf.id_parte_cuerpo = cpc.id_parte_cuerpo
            LEFT JOIN ficha_vestimenta AS fv ON fd.id_ficha = fv.id_ficha
            LEFT JOIN catalogo_prendas AS cp ON fv.id_prenda = cp.id_prenda
            WHERE LOWER(fd.nombre || ' ' || IFNULL(fd.segundo_nombre, '') || ' ' || fd.apellido_paterno || ' ' || IFNULL(fd.apellido_materno, '')) LIKE LOWER(?)
            GROUP BY fd.id_ficha
            ORDER BY ${safeOrderBy} ${safeOrderDir}
            LIMIT ? OFFSET ?
        `;

        const fichasResult = await db.all(fichasSql, [queryTerm, limit, offset]);

        if (resumen) {
             return res.json({ success: true, data: fichasResult });
        }

        const fichasCompletas = fichasResult.map(ficha => {
            const rasgos_fisicos = JSON.parse(ficha.rasgos_fisicos_json);
            const vestimenta = JSON.parse(ficha.vestimenta_json);
            
            delete ficha.rasgos_fisicos_json;
            delete ficha.vestimenta_json;

            return {
                ...ficha,
                rasgos_fisicos: rasgos_fisicos[0] === null ? [] : rasgos_fisicos,
                vestimenta: vestimenta[0] === null ? [] : vestimenta
            };
        });

        res.json({ success: true, data: fichasCompletas });
    } catch (error) {
        logger.error(`❌ Error al buscar fichas: ${error.message}`);
        res.status(500).json({ success: false, message: 'Error al realizar la búsqueda de fichas.' });
    }
};

/**
 * Obtiene el catálogo de tipos de lugar.
 */
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

/**
 * Obtiene el catálogo de partes del cuerpo.
 */
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


/**
 * Obtiene el catálogo de prendas.
 */
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
