// RUTA: backend/db/queries/fichasActions.js
// Este archivo contendrá EXCLUSIVAMENTE operaciones de escritura (CREATE, UPDATE, DELETE).

import { openDb } from '../users/initDb.js';
import logger from '../../utils/logger.js';

/**
 * CREA una nueva ficha completa, incluyendo su ubicación, rasgos y vestimenta.
 * Maneja la transacción internamente.
 * @param {object} fichaData - El objeto completo de la ficha desde el frontend.
 * @returns {Promise<number>} El ID de la nueva ficha creada.
 */
export const createFichaCompleta = async (fichaData) => {
    const db = await openDb();
    await db.exec('BEGIN TRANSACTION');
    try {
        const { ubicacion_desaparicion, rasgos_fisicos, vestimenta, ...fichaPrincipal } = fichaData;

        // 1. Insertar ubicación
        const u = ubicacion_desaparicion;
        const ubicacionResult = await db.run(
            `INSERT INTO ubicaciones (estado, municipio, localidad, calle, referencias, latitud, longitud, codigo_postal) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [u.estado, u.municipio, u.localidad, u.calle, u.referencias, u.latitud, u.longitud, u.codigo_postal]
        );
        const id_ubicacion_desaparicion = ubicacionResult.lastID;

        // 2. Insertar ficha principal
        const fichaResult = await db.run(
            `INSERT INTO fichas_desaparicion (id_usuario_creador, nombre, segundo_nombre, apellido_paterno, apellido_materno, fecha_desaparicion, id_ubicacion_desaparicion, id_tipo_lugar_desaparicion, foto_perfil, edad_estimada, genero, estatura, complexion, peso) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [fichaPrincipal.id_usuario_creador, fichaPrincipal.nombre, fichaPrincipal.segundo_nombre, fichaPrincipal.apellido_paterno, fichaPrincipal.apellido_materno, fichaPrincipal.fecha_desaparicion, id_ubicacion_desaparicion, fichaPrincipal.id_tipo_lugar_desaparicion, fichaPrincipal.foto_perfil, fichaPrincipal.edad_estimada, fichaPrincipal.genero, fichaPrincipal.estatura, fichaPrincipal.complexion, fichaPrincipal.peso]
        );
        const idFicha = fichaResult.lastID;

        // 3. Insertar rasgos
        if (rasgos_fisicos?.length > 0) {
            const rasgosPromises = rasgos_fisicos.map(r => db.run(`INSERT INTO ficha_rasgos_fisicos (id_ficha, id_parte_cuerpo, tipo_rasgo, descripcion_detalle) VALUES (?, ?, ?, ?)`, [idFicha, r.id_parte_cuerpo, r.tipo_rasgo, r.descripcion_detalle]));
            await Promise.all(rasgosPromises);
        }

        // 4. Insertar vestimenta
        if (vestimenta?.length > 0) {
            const vestimentaPromises = vestimenta.map(v => db.run(`INSERT INTO ficha_vestimenta (id_ficha, id_prenda, color, marca, caracteristica_especial) VALUES (?, ?, ?, ?, ?)`, [idFicha, v.id_prenda, v.color, v.marca, v.caracteristica_especial]));
            await Promise.all(vestimentaPromises);
        }

        await db.exec('COMMIT');
        return idFicha;
    } catch (error) {
        await db.exec('ROLLBACK');
        logger.error(`❌ Error en transacción de crear ficha: ${error.message}`);
        throw error;
    }
};

/**
 * ACTUALIZA una ficha completa existente.
 * @param {number} idFicha - El ID de la ficha a actualizar.
 * @param {object} fichaData - El objeto completo con los nuevos datos.
 * @param {number} userId - El ID del usuario que realiza la acción (para seguridad).
 * @returns {Promise<boolean>} - true si la operación fue exitosa, false si no.
 */
export const updateFichaCompleta = async (idFicha, fichaData, userId) => {
    const db = await openDb();
    await db.exec('BEGIN TRANSACTION');

    try {
        const { ubicacion_desaparicion, rasgos_fisicos, vestimenta, ...fichaPrincipal } = fichaData;

        // 1. Verificar propiedad y obtener ID de la ubicación actual
        const fichaExistente = await db.get(
            `SELECT id_ubicacion_desaparicion FROM fichas_desaparicion WHERE id_ficha = ? AND id_usuario_creador = ?`, 
            [idFicha, userId]
        );
        
        if (!fichaExistente) {
            // Si no se encuentra, el usuario no es el dueño o la ficha no existe.
            await db.exec('ROLLBACK');
            return false;
        }

        // 2. Actualizar la tabla principal 'fichas_desaparicion'
        const fichaFields = Object.keys(fichaPrincipal);
        if (fichaFields.length > 0) {
            const fichaSetClause = fichaFields.map(key => `${key} = ?`).join(', ');
            await db.run(`UPDATE fichas_desaparicion SET ${fichaSetClause} WHERE id_ficha = ?`, [...Object.values(fichaPrincipal), idFicha]);
        }

        // 3. Actualizar la tabla 'ubicaciones'
        const ubicacionFields = Object.keys(ubicacion_desaparicion);
        if (ubicacionFields.length > 0) {
            const ubicacionSetClause = ubicacionFields.map(key => `${key} = ?`).join(', ');
            await db.run(`UPDATE ubicaciones SET ${ubicacionSetClause} WHERE id_ubicacion = ?`, [...Object.values(ubicacion_desaparicion), fichaExistente.id_ubicacion_desaparicion]);
        }
        
        // 4. Borrar y re-insertar rasgos para asegurar consistencia
        await db.run(`DELETE FROM ficha_rasgos_fisicos WHERE id_ficha = ?`, [idFicha]);
        if (rasgos_fisicos?.length > 0) {
            const rasgosPromises = rasgos_fisicos.map(r => db.run(`INSERT INTO ficha_rasgos_fisicos (id_ficha, id_parte_cuerpo, tipo_rasgo, descripcion_detalle) VALUES (?, ?, ?, ?)`, [idFicha, r.id_parte_cuerpo, r.tipo_rasgo, r.descripcion_detalle]));
            await Promise.all(rasgosPromises);
        }

        // 5. Borrar y re-insertar vestimenta
        await db.run(`DELETE FROM ficha_vestimenta WHERE id_ficha = ?`, [idFicha]);
        if (vestimenta?.length > 0) {
            const vestimentaPromises = vestimenta.map(v => db.run(`INSERT INTO ficha_vestimenta (id_ficha, id_prenda, color, marca, caracteristica_especial) VALUES (?, ?, ?, ?, ?)`, [idFicha, v.id_prenda, v.color, v.marca, v.caracteristica_especial]));
            await Promise.all(vestimentaPromises);
        }

        await db.exec('COMMIT');
        return true;
    } catch (error) {
        await db.exec('ROLLBACK');
        logger.error(`❌ Error en transacción de actualizar ficha: ${error.message}`);
        throw error; // Lanzamos el error para que el controlador lo atrape y envíe un 500.
    }
};


/**
 * ELIMINA una ficha completa, incluyendo su ubicación y datos asociados.
 * @param {number} idFicha - El ID de la ficha a eliminar.
 * @param {number} userId - El ID del usuario que solicita la eliminación (para verificación).
 * @returns {Promise<boolean>} - true si la operación fue exitosa.
 */
export const deleteFichaCompleta = async (idFicha, userId) => {
    const db = await openDb();
    await db.exec('BEGIN TRANSACTION');
    try {
        // 1. Verificar propiedad y obtener ID de ubicación
        const ficha = await db.get(`SELECT id_ubicacion_desaparicion FROM fichas_desaparicion WHERE id_ficha = ? AND id_usuario_creador = ?`, [idFicha, userId]);
        if (!ficha) {
            // Si no se encuentra, no es un error, simplemente no se puede borrar.
            await db.exec('ROLLBACK');
            return false;
        }

        // 2. Eliminar la ficha (rasgos y vestimenta se borran en cascada si la BD está configurada así)
        await db.run(`DELETE FROM fichas_desaparicion WHERE id_ficha = ?`, [idFicha]);
        
        // 3. Eliminar la ubicación, que no tiene borrado en cascada
        await db.run(`DELETE FROM ubicaciones WHERE id_ubicacion = ?`, [ficha.id_ubicacion_desaparicion]);

        await db.exec('COMMIT');
        return true;
    } catch (error) {
        await db.exec('ROLLBACK');
        logger.error(`❌ Error en transacción de eliminar ficha: ${error.message}`);
        throw error;
    }
};