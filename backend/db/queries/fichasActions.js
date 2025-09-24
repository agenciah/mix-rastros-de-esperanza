// RUTA: backend/db/queries/fichasActions.js
// Este archivo contiene EXCLUSIVAMENTE operaciones de escritura (CREATE, UPDATE, DELETE).

import { query } from '../users/initDb.js';
import logger from '../../utils/logger.js';

/**
 * CREA una nueva ficha completa (Versión PostgreSQL)
 * @param {object} fichaData - El objeto completo de la ficha desde el frontend.
 * @returns {Promise<number>} El ID de la nueva ficha creada.
 */
export const createFichaCompleta = async (fichaData) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        const { ubicacion_desaparicion, rasgos_fisicos, vestimenta, ...fichaPrincipal } = fichaData;
        
        // 1. Insertar ubicación
        const u = ubicacion_desaparicion;
        const ubicacionResult = await client.query(
            `INSERT INTO ubicaciones (estado, municipio, localidad, calle, referencias, latitud, longitud, codigo_postal) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id_ubicacion`,
            [u.estado, u.municipio, u.localidad, u.calle, u.referencias, u.latitud, u.longitud, u.codigo_postal]
        );
        const id_ubicacion_desaparicion = ubicacionResult.rows[0].id_ubicacion;

        // 2. Insertar ficha principal
        const fichaResult = await client.query(
            `INSERT INTO fichas_desaparicion (id_usuario_creador, nombre, segundo_nombre, apellido_paterno, apellido_materno, fecha_desaparicion, id_ubicacion_desaparicion, id_tipo_lugar_desaparicion, foto_perfil, edad_estimada, genero, estatura, complexion, peso) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING id_ficha`,
            [fichaPrincipal.id_usuario_creador, fichaPrincipal.nombre, fichaPrincipal.segundo_nombre, fichaPrincipal.apellido_paterno, fichaPrincipal.apellido_materno, fichaPrincipal.fecha_desaparicion, id_ubicacion_desaparicion, fichaPrincipal.id_tipo_lugar_desaparicion, fichaPrincipal.foto_perfil, fichaPrincipal.edad_estimada, fichaPrincipal.genero, fichaPrincipal.estatura, fichaPrincipal.complexion, fichaPrincipal.peso]
        );
        const idFicha = fichaResult.rows[0].id_ficha;

        // 3. Insertar rasgos
        if (rasgos_fisicos?.length > 0) {
            const rasgosPromises = rasgos_fisicos.map(r => 
                client.query(`INSERT INTO ficha_rasgos_fisicos (id_ficha, id_parte_cuerpo, tipo_rasgo, descripcion_detalle) VALUES ($1, $2, $3, $4)`, 
                [idFicha, r.id_parte_cuerpo, r.tipo_rasgo, r.descripcion_detalle])
            );
            await Promise.all(rasgosPromises);
        }

        // 4. Insertar vestimenta
        if (vestimenta?.length > 0) {
            const vestimentaPromises = vestimenta.map(v => 
                client.query(`INSERT INTO ficha_vestimenta (id_ficha, id_prenda, color, marca, caracteristica_especial) VALUES ($1, $2, $3, $4, $5)`, 
                [idFicha, v.id_prenda, v.color, v.marca, v.caracteristica_especial])
            );
            await Promise.all(vestimentaPromises);
        }

        await client.query('COMMIT');
        return idFicha;
    } catch (error) {
        await client.query('ROLLBACK');
        logger.error(`❌ Error en transacción de crear ficha: ${error.message}`);
        throw error;
    } finally {
        client.release();
    }
};

/**
 * ACTUALIZA una ficha completa existente (Versión PostgreSQL)
 * @param {number} idFicha - El ID de la ficha a actualizar.
 * @param {object} fichaData - El objeto completo con los nuevos datos.
 * @param {number} userId - El ID del usuario que realiza la acción (para seguridad).
 * @returns {Promise<boolean>} - true si la operación fue exitosa.
 */
export const updateFichaCompleta = async (idFicha, fichaData, userId) => {
    const client = await pool.connect()
    try {
        await client.query('BEGIN');

        const { ubicacion_desaparicion, rasgos_fisicos, vestimenta, ...fichaPrincipal } = fichaData;

        const fichaExistenteResult = await client.query(
            `SELECT id_ubicacion_desaparicion FROM fichas_desaparicion WHERE id_ficha = $1 AND id_usuario_creador = $2`, 
            [idFicha, userId]
        );
        
        if (fichaExistenteResult.rowCount === 0) {
            await client.query('ROLLBACK');
            return false;
        }
        const fichaExistente = fichaExistenteResult.rows[0];

        const fichaFields = Object.keys(fichaPrincipal);
        if (fichaFields.length > 0) {
            const fichaSetClause = fichaFields.map((key, i) => `${key} = $${i + 1}`).join(', ');
            await client.query(`UPDATE fichas_desaparicion SET ${fichaSetClause} WHERE id_ficha = $${fichaFields.length + 1}`, [...Object.values(fichaPrincipal), idFicha]);
        }

        const ubicacionFields = Object.keys(ubicacion_desaparicion);
        if (ubicacionFields.length > 0) {
            const ubicacionSetClause = ubicacionFields.map((key, i) => `${key} = $${i + 1}`).join(', ');
            await client.query(`UPDATE ubicaciones SET ${ubicacionSetClause} WHERE id_ubicacion = $${ubicacionFields.length + 1}`, [...Object.values(ubicacion_desaparicion), fichaExistente.id_ubicacion_desaparicion]);
        }
        
        await client.query(`DELETE FROM ficha_rasgos_fisicos WHERE id_ficha = $1`, [idFicha]);
        if (rasgos_fisicos?.length > 0) {
            const rasgosPromises = rasgos_fisicos.map(r => client.query(`INSERT INTO ficha_rasgos_fisicos (id_ficha, id_parte_cuerpo, tipo_rasgo, descripcion_detalle) VALUES ($1, $2, $3, $4)`, [idFicha, r.id_parte_cuerpo, r.tipo_rasgo, r.descripcion_detalle]));
            await Promise.all(rasgosPromises);
        }

        await client.query(`DELETE FROM ficha_vestimenta WHERE id_ficha = $1`, [idFicha]);
        if (vestimenta?.length > 0) {
            const vestimentaPromises = vestimenta.map(v => client.query(`INSERT INTO ficha_vestimenta (id_ficha, id_prenda, color, marca, caracteristica_especial) VALUES ($1, $2, $3, $4, $5)`, [idFicha, v.id_prenda, v.color, v.marca, v.caracteristica_especial]));
            await Promise.all(vestimentaPromises);
        }

        await client.query('COMMIT');
        return true;
    } catch (error) {
        await client.query('ROLLBACK');
        logger.error(`❌ Error en transacción de actualizar ficha: ${error.message}`);
        throw error;
    } finally {
        client.release();
    }
};

/**
 * ELIMINA una ficha completa (Versión PostgreSQL)
 * @param {number} idFicha - El ID de la ficha a eliminar.
 * @param {number} userId - El ID del usuario que solicita la eliminación.
 * @returns {Promise<boolean>} - true si la operación fue exitosa.
 */
export const deleteFichaCompleta = async (idFicha, userId) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const fichaResult = await client.query(`SELECT id_ubicacion_desaparicion FROM fichas_desaparicion WHERE id_ficha = $1 AND id_usuario_creador = $2`, [idFicha, userId]);
        if (fichaResult.rowCount === 0) {
            await client.query('ROLLBACK');
            return false;
        }
        const ficha = fichaResult.rows[0];

        // ON DELETE CASCADE se encarga de rasgos y vestimenta.
        await client.query(`DELETE FROM fichas_desaparicion WHERE id_ficha = $1`, [idFicha]);
        
        // La ubicación se debe borrar manualmente.
        await client.query(`DELETE FROM ubicaciones WHERE id_ubicacion = $1`, [ficha.id_ubicacion_desaparicion]);

        await client.query('COMMIT');
        return true;
    } catch (error) {
        await client.query('ROLLBACK');
        logger.error(`❌ Error en transacción de eliminar ficha: ${error.message}`);
        throw error;
    } finally {
        client.release();
    }
};
