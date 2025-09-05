// 📁 backend/controllers/admin/hallazgos/adminHallazgosController.js

import { openDb } from '../../../db/users/initDb.js';
import logger from '../../../utils/logger.js';
import { getAllHallazgosCatalogos } from '../../../db/queries/fichasAndHallazgosQueries.js';

/**
 * Obtiene todos los hallazgos para el dashboard de administrador.
 * Incluye datos del usuario creador y detalles de los hallazgos.
 */
export const getAllHallazgosAdmin = async (req, res) => {
    try {
        const db = await openDb();
        const { searchTerm = '' } = req.query;

        const queryTerm = `%${searchTerm.toLowerCase()}%`;

        const sql = `
            SELECT
                h.id_hallazgo,
                h.nombre,
                h.segundo_nombre,
                h.apellido_paterno,
                h.apellido_materno,
                h.fecha_hallazgo,
                h.estado_hallazgo,
                h.descripcion_general_hallazgo,
                u.nombre AS nombre_usuario_buscador,
                u.email AS email_usuario_buscador,
                lugar.estado AS ubicacion_estado,
                lugar.municipio AS ubicacion_municipio
            FROM hallazgos AS h
            LEFT JOIN users AS u ON h.id_usuario_buscador = u.id
            LEFT JOIN ubicaciones AS lugar ON h.id_ubicacion_hallazgo = lugar.id_ubicacion
            WHERE LOWER(h.nombre || ' ' || h.apellido_paterno) LIKE ?
            ORDER BY h.fecha_hallazgo DESC;
        `;

        const hallazgos = await db.all(sql, [queryTerm]);
        res.json({ success: true, data: hallazgos });

    } catch (error) {
        logger.error(`❌ Error al obtener hallazgos para administrador: ${error.message}`);
        res.status(500).json({ success: false, message: 'Error interno del servidor al obtener hallazgos.' });
    }
};

/**
 * Obtiene un hallazgo completo por ID para el administrador.
 * Incluye todos los datos anidados de características, vestimenta y usuario.
 */
export const getHallazgoByIdAdmin = async (req, res) => {
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
                u.nombre AS nombre_usuario_buscador,
                u.email AS email_usuario_buscador,
                ubicacion.id_ubicacion AS id_ubicacion_hallazgo,
                ubicacion.estado, ubicacion.municipio, ubicacion.localidad, ubicacion.calle,
                ubicacion.referencias, ubicacion.latitud, ubicacion.longitud, ubicacion.codigo_postal
            FROM hallazgos AS h
            LEFT JOIN users AS u ON h.id_usuario_buscador = u.id
            LEFT JOIN ubicaciones AS ubicacion ON h.id_ubicacion_hallazgo = ubicacion.id_ubicacion
            WHERE h.id_hallazgo = ?;
        `;

        const caracteristicasSql = `
            SELECT id_hallazgo_caracteristica, id_parte_cuerpo, tipo_caracteristica, descripcion
            FROM hallazgo_caracteristicas
            WHERE id_hallazgo = ?;
        `;

        const vestimentaSql = `
            SELECT id_hallazgo_vestimenta, id_prenda, color, marca, caracteristica_especial
            FROM hallazgo_vestimenta
            WHERE id_hallazgo = ?;
        `;

        const hallazgo = await db.get(sql, [id]);
        if (!hallazgo) {
            return res.status(404).json({ success: false, message: 'Hallazgo no encontrado.' });
        }

        const caracteristicas = await db.all(caracteristicasSql, [id]);
        const vestimenta = await db.all(vestimentaSql, [id]);

        res.json({ 
            success: true, 
            data: {
                ...hallazgo,
                caracteristicas,
                vestimenta
            }
        });
        
    } catch (error) {
        logger.error(`❌ Error al obtener hallazgo por ID (admin): ${error.message}`);
        res.status(500).json({ success: false, message: 'Error interno del servidor al obtener el hallazgo.' });
    }
};

/**
 * Actualiza un hallazgo existente por ID.
 * NO verifica la propiedad del usuario (para el admin).
 */
export const updateHallazgoAdmin = async (req, res) => {
    const db = await openDb();
    await db.exec('BEGIN TRANSACTION');

    try {
        const { id } = req.params;
        const {
            nombre, segundo_nombre, apellido_paterno, apellido_materno,
            fecha_hallazgo, descripcion_general_hallazgo, id_tipo_lugar_hallazgo,
            estado_hallazgo,
            ubicacion_hallazgo, caracteristicas, vestimenta,
        } = req.body;

        const hallazgo = await db.get(`SELECT id_ubicacion_hallazgo FROM hallazgos WHERE id_hallazgo = ?`, [id]);
        if (!hallazgo) {
            await db.exec('ROLLBACK');
            return res.status(404).json({ success: false, message: 'Hallazgo no encontrado.' });
        }

        // Actualizar tabla principal 'hallazgos'
        const hallazgoUpdateData = {
            nombre, segundo_nombre, apellido_paterno, apellido_materno,
            fecha_hallazgo, descripcion_general_hallazgo, id_tipo_lugar_hallazgo, estado_hallazgo
        };
        const hallazgoSetClause = Object.keys(hallazgoUpdateData).map(key => `${key} = ?`).join(', ');
        const hallazgoValues = Object.values(hallazgoUpdateData);
        await db.run(
            `UPDATE hallazgos SET ${hallazgoSetClause} WHERE id_hallazgo = ?`,
            [...hallazgoValues, id]
        );

        // Actualizar tabla 'ubicaciones'
        await db.run(
            `UPDATE ubicaciones SET
                estado = ?, municipio = ?, localidad = ?, calle = ?, referencias = ?,
                latitud = ?, longitud = ?, codigo_postal = ?
            WHERE id_ubicacion = ?`,
            [
                ubicacion_hallazgo.estado, ubicacion_hallazgo.municipio, ubicacion_hallazgo.localidad,
                ubicacion_hallazgo.calle, ubicacion_hallazgo.referencias, ubicacion_hallazgo.latitud,
                ubicacion_hallazgo.longitud, ubicacion_hallazgo.codigo_postal,
                hallazgo.id_ubicacion_hallazgo,
            ]
        );

        // Eliminar y reinsertar características y vestimenta
        await db.run(`DELETE FROM hallazgo_caracteristicas WHERE id_hallazgo = ?`, [id]);
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

        await db.run(`DELETE FROM hallazgo_vestimenta WHERE id_hallazgo = ?`, [id]);
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
        logger.error(`❌ Error al actualizar hallazgo (admin): ${error.message}`);
        res.status(500).json({ success: false, message: 'Error interno del servidor al actualizar hallazgo.' });
    }
};


/**
 * Elimina un hallazgo por ID.
 * NO verifica la propiedad del usuario (para el admin).
 */
export const deleteHallazgoAdmin = async (req, res) => {
    const db = await openDb();
    await db.exec('BEGIN TRANSACTION');

    try {
        const { id } = req.params;
        const hallazgo = await db.get(`SELECT id_ubicacion_hallazgo FROM hallazgos WHERE id_hallazgo = ?`, [id]);

        if (!hallazgo) {
            await db.exec('ROLLBACK');
            return res.status(404).json({ success: false, message: 'Hallazgo no encontrado.' });
        }

        // Eliminar hallazgo y registros asociados (ubicación y datos anidados)
        await db.run(`DELETE FROM hallazgos WHERE id_hallazgo = ?`, [id]);
        await db.run(`DELETE FROM ubicaciones WHERE id_ubicacion = ?`, [hallazgo.id_ubicacion_hallazgo]);

        await db.exec('COMMIT');
        res.json({ success: true, message: 'Hallazgo y registros asociados eliminados correctamente.' });
    } catch (error) {
        await db.exec('ROLLBACK');
        logger.error(`❌ Error al eliminar hallazgo (admin): ${error.message}`);
        res.status(500).json({ success: false, message: 'Error interno del servidor al eliminar hallazgo.' });
    }
};

export const getCreateHallazgoPageData = async (req, res) => {
    try {
        const catalogos = await getAllHallazgosCatalogos();
        res.json({ success: true, catalogos });
    } catch (error) {
        logger.error(`❌ Error al obtener catálogos para la creación de hallazgos: ${error.message}`);
        res.status(500).json({ success: false, message: 'Error interno del servidor al obtener los catálogos.' });
    }
};

/**
 * Crea un nuevo hallazgo.
 */
export const createHallazgoAdmin = async (req, res) => {
    const db = await openDb();
    await db.exec('BEGIN TRANSACTION');

    try {
        const {
            nombre, segundo_nombre, apellido_paterno, apellido_materno,
            fecha_hallazgo, descripcion_general_hallazgo, id_tipo_lugar_hallazgo,
            ubicacion_hallazgo, caracteristicas, vestimenta
        } = req.body;

        // 1. Insertar la ubicación
        const ubicacionResult = await db.run(
            `INSERT INTO ubicaciones (estado, municipio, localidad, calle, referencias, latitud, longitud, codigo_postal)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                ubicacion_hallazgo.estado, ubicacion_hallazgo.municipio, ubicacion_hallazgo.localidad,
                ubicacion_hallazgo.calle, ubicacion_hallazgo.referencias, ubicacion_hallazgo.latitud,
                ubicacion_hallazgo.longitud, ubicacion_hallazgo.codigo_postal
            ]
        );
        const id_ubicacion = ubicacionResult.lastID;

        // 2. Insertar el hallazgo
        const hallazgoResult = await db.run(
            `INSERT INTO hallazgos (id_usuario_buscador, id_ubicacion_hallazgo, id_tipo_lugar_hallazgo,
             nombre, segundo_nombre, apellido_paterno, apellido_materno, fecha_hallazgo, descripcion_general_hallazgo)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                req.user.id, // Suponiendo que el ID del admin está en req.user.id
                id_ubicacion,
                id_tipo_lugar_hallazgo,
                nombre, segundo_nombre, apellido_paterno, apellido_materno,
                fecha_hallazgo, descripcion_general_hallazgo
            ]
        );
        const id_hallazgo = hallazgoResult.lastID;

        // 3. Insertar características (si existen)
        if (caracteristicas && caracteristicas.length > 0) {
            const caracteristicasPromises = caracteristicas.map(c =>
                db.run(
                    `INSERT INTO hallazgo_caracteristicas (id_hallazgo, id_parte_cuerpo, tipo_caracteristica, descripcion)
                     VALUES (?, ?, ?, ?)`,
                    [id_hallazgo, c.id_parte_cuerpo, c.tipo_caracteristica, c.descripcion]
                )
            );
            await Promise.all(caracteristicasPromises);
        }

        // 4. Insertar vestimenta (si existe)
        if (vestimenta && vestimenta.length > 0) {
            const vestimentaPromises = vestimenta.map(v =>
                db.run(
                    `INSERT INTO hallazgo_vestimenta (id_hallazgo, id_prenda, color, marca, caracteristica_especial)
                     VALUES (?, ?, ?, ?, ?)`,
                    [id_hallazgo, v.id_prenda, v.color, v.marca, v.caracteristica_especial]
                )
            );
            await Promise.all(vestimentaPromises);
        }
        
        await db.exec('COMMIT');
        res.status(201).json({ success: true, message: 'Hallazgo creado correctamente', id: id_hallazgo });
        
    } catch (error) {
        await db.exec('ROLLBACK');
        logger.error(`❌ Error al crear hallazgo (admin): ${error.message}`);
        res.status(500).json({ success: false, message: 'Error interno del servidor al crear hallazgo.' });
    }
};
