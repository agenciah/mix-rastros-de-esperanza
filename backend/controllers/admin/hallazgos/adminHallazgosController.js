// RUTA: backend/controllers/admin/hallazgos/adminHallazgosController.js

import { openDb } from '../../../db/users/initDb.js';
import logger from '../../../utils/logger.js';
// Asumimos que la función de queries ya fue migrada a PostgreSQL
import { getAllHallazgosCatalogos } from '../../../db/queries/fichasAndHallazgosQueries.js';

/**
 * Obtiene todos los hallazgos para el dashboard de administrador (Versión PostgreSQL).
 */
export const getAllHallazgosAdmin = async (req, res) => {
    try {
        const db = openDb(); // Obtiene el pool de PostgreSQL
        const { searchTerm = '' } = req.query;
        const queryTerm = `%${searchTerm.toLowerCase()}%`;

        const sql = `
            SELECT
                h.id_hallazgo, h.nombre, h.segundo_nombre, h.apellido_paterno, h.apellido_materno,
                h.fecha_hallazgo, h.estado_hallazgo, h.descripcion_general_hallazgo,
                u.nombre AS nombre_usuario_buscador, u.email AS email_usuario_buscador,
                lugar.estado AS ubicacion_estado, lugar.municipio AS ubicacion_municipio
            FROM hallazgos AS h
            LEFT JOIN users AS u ON h.id_usuario_buscador = u.id
            LEFT JOIN ubicaciones AS lugar ON h.id_ubicacion_hallazgo = lugar.id_ubicacion
            WHERE (h.nombre || ' ' || h.apellido_paterno) ILIKE $1 -- ILIKE es case-insensitive
            ORDER BY h.fecha_hallazgo DESC;
        `;

        const result = await db.query(sql, [queryTerm]);
        res.json({ success: true, data: result.rows });

    } catch (error) {
        logger.error(`❌ Error al obtener hallazgos para administrador (PostgreSQL): ${error.message}`);
        res.status(500).json({ success: false, message: 'Error interno del servidor al obtener hallazgos.' });
    }
};

/**
 * Obtiene un hallazgo completo por ID para el administrador (Versión PostgreSQL).
 */
export const getHallazgoByIdAdmin = async (req, res) => {
    try {
        const db = openDb();
        const { id } = req.params;

        const sql = `
            SELECT
                h.*,
                u.nombre AS nombre_usuario_buscador, u.email AS email_usuario_buscador,
                ubicacion.id_ubicacion AS id_ubicacion_hallazgo,
                ubicacion.estado, ubicacion.municipio, ubicacion.localidad, ubicacion.calle,
                ubicacion.referencias, ubicacion.latitud, ubicacion.longitud, ubicacion.codigo_postal
            FROM hallazgos AS h
            LEFT JOIN users AS u ON h.id_usuario_buscador = u.id
            LEFT JOIN ubicaciones AS ubicacion ON h.id_ubicacion_hallazgo = ubicacion.id_ubicacion
            WHERE h.id_hallazgo = $1;
        `;
        const caracteristicasSql = `SELECT * FROM hallazgo_caracteristicas WHERE id_hallazgo = $1;`;
        const vestimentaSql = `SELECT * FROM hallazgo_vestimenta WHERE id_hallazgo = $1;`;

        const [hallazgoResult, caracteristicasResult, vestimentaResult] = await Promise.all([
            db.query(sql, [id]),
            db.query(caracteristicasSql, [id]),
            db.query(vestimentaSql, [id]),
        ]);

        if (hallazgoResult.rowCount === 0) {
            return res.status(404).json({ success: false, message: 'Hallazgo no encontrado.' });
        }

        const hallazgo = hallazgoResult.rows[0];
        const caracteristicas = caracteristicasResult.rows;
        const vestimenta = vestimentaResult.rows;

        res.json({ 
            success: true, 
            data: { ...hallazgo, caracteristicas, vestimenta }
        });
        
    } catch (error) {
        logger.error(`❌ Error al obtener hallazgo por ID (admin, PostgreSQL): ${error.message}`);
        res.status(500).json({ success: false, message: 'Error interno del servidor al obtener el hallazgo.' });
    }
};

/**
 * Actualiza un hallazgo existente por ID (Versión PostgreSQL).
 */
export const updateHallazgoAdmin = async (req, res) => {
    const client = await openDb().connect();
    try {
        await client.query('BEGIN');
        const { id } = req.params;
        const {
            nombre, segundo_nombre, apellido_paterno, apellido_materno,
            fecha_hallazgo, descripcion_general_hallazgo, id_tipo_lugar_hallazgo,
            estado_hallazgo, ubicacion_hallazgo, caracteristicas, vestimenta,
        } = req.body;

        const hallazgoResult = await client.query(`SELECT id_ubicacion_hallazgo FROM hallazgos WHERE id_hallazgo = $1`, [id]);
        if (hallazgoResult.rowCount === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ success: false, message: 'Hallazgo no encontrado.' });
        }
        const hallazgo = hallazgoResult.rows[0];

        // Actualizar tabla principal 'hallazgos'
        const hallazgoUpdateData = {
            nombre, segundo_nombre, apellido_paterno, apellido_materno,
            fecha_hallazgo, descripcion_general_hallazgo, id_tipo_lugar_hallazgo, estado_hallazgo
        };
        const hallazgoFields = Object.keys(hallazgoUpdateData);
        const hallazgoSetClause = hallazgoFields.map((key, index) => `${key} = $${index + 1}`).join(', ');
        await client.query(
            `UPDATE hallazgos SET ${hallazgoSetClause} WHERE id_hallazgo = $${hallazgoFields.length + 1}`,
            [...Object.values(hallazgoUpdateData), id]
        );

        // Actualizar tabla 'ubicaciones'
        await client.query(
            `UPDATE ubicaciones SET
                estado = $1, municipio = $2, localidad = $3, calle = $4, referencias = $5,
                latitud = $6, longitud = $7, codigo_postal = $8
            WHERE id_ubicacion = $9`,
            [
                ubicacion_hallazgo.estado, ubicacion_hallazgo.municipio, ubicacion_hallazgo.localidad,
                ubicacion_hallazgo.calle, ubicacion_hallazgo.referencias, ubicacion_hallazgo.latitud,
                ubicacion_hallazgo.longitud, ubicacion_hallazgo.codigo_postal,
                hallazgo.id_ubicacion_hallazgo,
            ]
        );

        // Eliminar y reinsertar características y vestimenta
        await client.query(`DELETE FROM hallazgo_caracteristicas WHERE id_hallazgo = $1`, [id]);
        if (caracteristicas && caracteristicas.length > 0) {
            const promises = caracteristicas.map(c => client.query(`INSERT INTO hallazgo_caracteristicas (id_hallazgo, id_parte_cuerpo, tipo_caracteristica, descripcion) VALUES ($1, $2, $3, $4)`, [id, c.id_parte_cuerpo, c.tipo_caracteristica, c.descripcion]));
            await Promise.all(promises);
        }
        await client.query(`DELETE FROM hallazgo_vestimenta WHERE id_hallazgo = $1`, [id]);
        if (vestimenta && vestimenta.length > 0) {
            const promises = vestimenta.map(v => client.query(`INSERT INTO hallazgo_vestimenta (id_hallazgo, id_prenda, color, marca, caracteristica_especial) VALUES ($1, $2, $3, $4, $5)`, [id, v.id_prenda, v.color, v.marca, v.caracteristica_especial]));
            await Promise.all(promises);
        }

        await client.query('COMMIT');
        res.json({ success: true, message: 'Hallazgo actualizado correctamente' });
    } catch (error) {
        await client.query('ROLLBACK');
        logger.error(`❌ Error al actualizar hallazgo (admin, PostgreSQL): ${error.message}`);
        res.status(500).json({ success: false, message: 'Error interno del servidor al actualizar hallazgo.' });
    } finally {
        client.release();
    }
};

/**
 * Elimina un hallazgo por ID (Versión PostgreSQL).
 */
export const deleteHallazgoAdmin = async (req, res) => {
    const client = await openDb().connect();
    try {
        await client.query('BEGIN');
        const { id } = req.params;
        const hallazgoResult = await client.query(`SELECT id_ubicacion_hallazgo FROM hallazgos WHERE id_hallazgo = $1`, [id]);
        const hallazgo = hallazgoResult.rows[0];

        if (!hallazgo) {
            await client.query('ROLLBACK');
            return res.status(404).json({ success: false, message: 'Hallazgo no encontrado.' });
        }

        await client.query(`DELETE FROM hallazgos WHERE id_hallazgo = $1`, [id]);
        await client.query(`DELETE FROM ubicaciones WHERE id_ubicacion = $1`, [hallazgo.id_ubicacion_hallazgo]);

        await client.query('COMMIT');
        res.json({ success: true, message: 'Hallazgo y registros asociados eliminados correctamente.' });
    } catch (error) {
        await client.query('ROLLBACK');
        logger.error(`❌ Error al eliminar hallazgo (admin, PostgreSQL): ${error.message}`);
        res.status(500).json({ success: false, message: 'Error interno del servidor al eliminar hallazgo.' });
    } finally {
        client.release();
    }
};

/**
 * Obtiene los catálogos para la página de creación de hallazgos.
 * No necesita cambios ya que delega a un archivo de queries ya migrado.
 */
export const getCreateHallazgoPageData = async (req, res) => {
    try {
        const catalogos = await getAllHallazgosCatalogos();
        res.json({ success: true, catalogos });
    } catch (error) {
        logger.error(`❌ Error al obtener catálogos para creación de hallazgos: ${error.message}`);
        res.status(500).json({ success: false, message: 'Error interno al obtener los catálogos.' });
    }
};

/**
 * Crea un nuevo hallazgo (Versión PostgreSQL).
 */
export const createHallazgoAdmin = async (req, res) => {
    const client = await openDb().connect();
    try {
        await client.query('BEGIN');
        const {
            nombre, segundo_nombre, apellido_paterno, apellido_materno,
            fecha_hallazgo, descripcion_general_hallazgo, id_tipo_lugar_hallazgo,
            ubicacion_hallazgo, caracteristicas, vestimenta
        } = req.body;

        const u = ubicacion_hallazgo;
        const ubicacionResult = await client.query(
            `INSERT INTO ubicaciones (estado, municipio, localidad, calle, referencias, latitud, longitud, codigo_postal)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id_ubicacion`,
            [u.estado, u.municipio, u.localidad, u.calle, u.referencias, u.latitud, u.longitud, u.codigo_postal]
        );
        const id_ubicacion = ubicacionResult.rows[0].id_ubicacion;

        const hallazgoResult = await client.query(
            `INSERT INTO hallazgos (id_usuario_buscador, id_ubicacion_hallazgo, id_tipo_lugar_hallazgo,
             nombre, segundo_nombre, apellido_paterno, apellido_materno, fecha_hallazgo, descripcion_general_hallazgo)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id_hallazgo`,
            [
                req.user.id, id_ubicacion, id_tipo_lugar_hallazgo,
                nombre, segundo_nombre, apellido_paterno, apellido_materno,
                fecha_hallazgo, descripcion_general_hallazgo
            ]
        );
        const id_hallazgo = hallazgoResult.rows[0].id_hallazgo;

        if (caracteristicas && caracteristicas.length > 0) {
            const promises = caracteristicas.map(c => client.query(`INSERT INTO hallazgo_caracteristicas (id_hallazgo, id_parte_cuerpo, tipo_caracteristica, descripcion) VALUES ($1, $2, $3, $4)`, [id_hallazgo, c.id_parte_cuerpo, c.tipo_caracteristica, c.descripcion]));
            await Promise.all(promises);
        }
        if (vestimenta && vestimenta.length > 0) {
            const promises = vestimenta.map(v => client.query(`INSERT INTO hallazgo_vestimenta (id_hallazgo, id_prenda, color, marca, caracteristica_especial) VALUES ($1, $2, $3, $4, $5)`, [id_hallazgo, v.id_prenda, v.color, v.marca, v.caracteristica_especial]));
            await Promise.all(promises);
        }
        
        await client.query('COMMIT');
        res.status(201).json({ success: true, message: 'Hallazgo creado correctamente', id: id_hallazgo });
        
    } catch (error) {
        await client.query('ROLLBACK');
        logger.error(`❌ Error al crear hallazgo (admin, PostgreSQL): ${error.message}`);
        res.status(500).json({ success: false, message: 'Error interno del servidor al crear hallazgo.' });
    } finally {
        client.release();
    }
};
