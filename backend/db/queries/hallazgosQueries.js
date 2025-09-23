// RUTA: backend/db/queries/hallazgosQueries.js

import { openDb } from '../users/initDb.js';
import logger from '../../utils/logger.js';

/**
 * FUNCIÓN MAESTRA: Obtiene un hallazgo completo por su ID con todos los datos.
 */
export const getHallazgoCompletoById = async (id) => {
    const db = openDb();
    const hallazgoPrincipalSql = `
        SELECT
            h.*,
            u.estado, u.municipio, u.localidad, u.calle, u.referencias, u.codigo_postal,
            ctl.nombre_tipo AS tipo_lugar
        FROM hallazgos AS h
        LEFT JOIN ubicaciones AS u ON h.id_ubicacion_hallazgo = u.id_ubicacion
        LEFT JOIN catalogo_tipo_lugar AS ctl ON h.id_tipo_lugar_hallazgo = ctl.id_tipo_lugar
        WHERE h.id_hallazgo = $1;
    `;
    const caracteristicasSql = `SELECT * FROM hallazgo_caracteristicas WHERE id_hallazgo = $1;`;
    const vestimentaSql = `SELECT * FROM hallazgo_vestimenta WHERE id_hallazgo = $1;`;

    try {
        const [hallazgoResult, caracteristicasResult, vestimentaResult] = await Promise.all([
            db.query(hallazgoPrincipalSql, [id]),
            db.query(caracteristicasSql, [id]),
            db.query(vestimentaSql, [id])
        ]);

        if (hallazgoResult.rowCount === 0) return null;

        const hallazgo = hallazgoResult.rows[0];
        const { estado, municipio, localidad, calle, referencias, codigo_postal, ...restOfHallazgo } = hallazgo;
        
        return {
            ...restOfHallazgo,
            ubicacion_hallazgo: { estado, municipio, localidad, calle, referencias, codigo_postal },
            caracteristicas: caracteristicasResult.rows || [],
            vestimenta: vestimentaResult.rows || []
        };
    } catch (error) {
        logger.error(`❌ Error en getHallazgoCompletoById (PostgreSQL): ${error.message}`);
        throw error;
    }
};

/**
 * Obtiene todos los hallazgos activos utilizando la función maestra.
 */
export const getAllHallazgosCompletos = async () => {
    const db = openDb();
    try {
        const hallazgosIdsResult = await db.query(`SELECT id_hallazgo FROM hallazgos WHERE estado_hallazgo = 'encontrado'`);
        const hallazgosIds = hallazgosIdsResult.rows;

        if (!hallazgosIds || hallazgosIds.length === 0) {
            return [];
        }
        
        const hallazgosCompletosPromises = hallazgosIds.map(h => getHallazgoCompletoById(h.id_hallazgo));
        const hallazgosCompletos = await Promise.all(hallazgosCompletosPromises);

        return hallazgosCompletos.filter(Boolean);
    } catch (error) {
        logger.error(`❌ Error en getAllHallazgosCompletos (PostgreSQL): ${error.message}`);
        throw error;
    }
};

/**
 * Busca hallazgos basándose en múltiples criterios detallados.
 */
export const searchHallazgos = async (params) => {
    const db = openDb();
    let query = `
        SELECT
            h.id_hallazgo, h.nombre, h.apellido_paterno, h.apellido_materno,
            h.fecha_hallazgo, h.foto_hallazgo, h.estado_hallazgo,
            h.edad_estimada, h.genero, h.estatura, h.peso, h.complexion,
            u.estado, u.municipio
        FROM hallazgos AS h
        LEFT JOIN ubicaciones AS u ON h.id_ubicacion_hallazgo = u.id_ubicacion
    `;

    const conditions = [];
    const queryParams = [];
    let paramIndex = 1;

    if (params.nombre) {
        conditions.push(`h.nombre ILIKE $${paramIndex++}`);
        queryParams.push(`%${params.nombre}%`);
    }
    if (params.apellido) {
        conditions.push(`(h.apellido_paterno ILIKE $${paramIndex++} OR h.apellido_materno ILIKE $${paramIndex++})`);
        queryParams.push(`%${params.apellido}%`, `%${params.apellido}%`);
    }
    if (params.estado) {
        conditions.push(`u.estado = $${paramIndex++}`);
        queryParams.push(params.estado);
    }
    // ... (El resto de tus 'if' para construir la consulta) ...
    
    conditions.push(`h.estado_hallazgo = 'encontrado'`);

    if (conditions.length > 0) {
        query += ` WHERE ` + conditions.join(' AND ');
    }
    query += ` ORDER BY h.fecha_hallazgo DESC`;

    try {
        const result = await db.query(query, queryParams);
        return result.rows;
    } catch (error) {
        logger.error(`❌ Error en la búsqueda de hallazgos (PostgreSQL): ${error.message}`);
        throw error;
    }
};

/**
 * Busca hallazgos por un término de búsqueda general y exhaustivo.
 */
export const searchHallazgosByKeyword = async (searchTerm = '', limit = 20, offset = 0) => {
    const db = openDb();
    const sqlTerm = `%${searchTerm.toLowerCase()}%`;
    const hallazgosSql = `
        SELECT DISTINCT
            h.id_hallazgo, h.nombre, h.segundo_nombre, h.apellido_paterno,
            h.foto_hallazgo, h.apellido_materno, h.fecha_hallazgo,
            h.edad_estimada, h.genero,
            u.estado, u.municipio
        FROM hallazgos AS h
        LEFT JOIN ubicaciones AS u ON h.id_ubicacion_hallazgo = u.id_ubicacion
        LEFT JOIN hallazgo_vestimenta AS hv ON h.id_hallazgo = hv.id_hallazgo
        LEFT JOIN catalogo_prendas AS cp ON hv.id_prenda = cp.id_prenda
        LEFT JOIN catalogo_tipo_lugar AS ctl ON h.id_tipo_lugar_hallazgo = ctl.id_tipo_lugar
        LEFT JOIN hallazgo_caracteristicas AS hc ON h.id_hallazgo = hc.id_hallazgo
        LEFT JOIN catalogo_partes_cuerpo AS cpc ON hc.id_parte_cuerpo = cpc.id_parte_cuerpo
        WHERE ( 
            h.nombre ILIKE $1 OR h.apellido_paterno ILIKE $2 OR
            h.descripcion_general_hallazgo ILIKE $3 OR
            u.estado ILIKE $4 OR u.municipio ILIKE $5 OR
            ctl.nombre_tipo ILIKE $6 OR
            cpc.nombre_parte ILIKE $7 OR hc.descripcion ILIKE $8 OR
            cp.tipo_prenda ILIKE $9 OR hv.color ILIKE $10
        )
        ORDER BY h.fecha_hallazgo DESC
        LIMIT $11 OFFSET $12;
    `;
    const params = Array(10).fill(sqlTerm).concat([limit, offset]);
    try {
        const result = await db.query(hallazgosSql, params);
        return result.rows;
    } catch (error) {
        logger.error(`❌ Error en búsqueda por palabra clave (PostgreSQL): ${error.message}`);
        throw error;
    }
};

/**
 * Obtiene todos los catálogos necesarios para los formularios de hallazgos.
 */
export const getAllHallazgosCatalogos = async () => {
    const db = openDb();
    try {
        const [tiposLugar, partesCuerpo, prendas] = await Promise.all([
            db.query(`SELECT id_tipo_lugar, nombre_tipo FROM catalogo_tipo_lugar ORDER BY nombre_tipo`),
            db.query(`SELECT id_parte_cuerpo, nombre_parte, categoria_principal FROM catalogo_partes_cuerpo ORDER BY nombre_parte`),
            db.query(`SELECT id_prenda, tipo_prenda, categoria_general FROM catalogo_prendas ORDER BY tipo_prenda`)
        ]);
        return { tiposLugar: tiposLugar.rows, partesCuerpo: partesCuerpo.rows, prendas: prendas.rows };
    } catch (error) {
        logger.error(`❌ Error al obtener catálogos para hallazgos (PostgreSQL): ${error.message}`);
        throw error;
    }
};

/**
 * Inserta una nueva ubicación y devuelve su ID.
 */
export const insertUbicacion = async (db, ubicacionData) => {
    const { estado, municipio, localidad, calle, referencias, latitud, longitud, codigo_postal } = ubicacionData;
    const res = await db.query(
        `INSERT INTO ubicaciones (estado, municipio, localidad, calle, referencias, latitud, longitud, codigo_postal) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id_ubicacion`,
        [estado, municipio, localidad, calle, referencias, latitud, longitud, codigo_postal]
    );
    return res.rows[0].id_ubicacion;
};

/**
 * Inserta un nuevo hallazgo y devuelve su ID.
 */
export const insertHallazgo = async (db, hallazgoData) => {
    const { id_usuario_buscador, nombre, segundo_nombre, apellido_paterno, apellido_materno, id_ubicacion_hallazgo, id_tipo_lugar_hallazgo, fecha_hallazgo, descripcion_general_hallazgo, edad_estimada, genero, estatura, complexion, peso, foto_hallazgo } = hallazgoData;
    const res = await db.query(
        `INSERT INTO hallazgos (id_usuario_buscador, nombre, segundo_nombre, apellido_paterno, apellido_materno, id_ubicacion_hallazgo, id_tipo_lugar_hallazgo, fecha_hallazgo, descripcion_general_hallazgo, edad_estimada, genero, estatura, complexion, peso, foto_hallazgo) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) RETURNING id_hallazgo`,
        [id_usuario_buscador, nombre, segundo_nombre, apellido_paterno, apellido_materno, id_ubicacion_hallazgo, id_tipo_lugar_hallazgo, fecha_hallazgo, descripcion_general_hallazgo, edad_estimada, genero, estatura, complexion, peso, foto_hallazgo]
    );
    return res.rows[0].id_hallazgo;
};

/**
 * Inserta las características (rasgos) de un hallazgo.
 */
export const insertCaracteristicas = async (db, idHallazgo, caracteristicas) => {
    if (!caracteristicas || caracteristicas.length === 0) return;
    const promises = caracteristicas.map(c => db.query(
        `INSERT INTO hallazgo_caracteristicas (id_hallazgo, id_parte_cuerpo, tipo_caracteristica, descripcion) VALUES ($1, $2, $3, $4)`,
        [idHallazgo, c.id_parte_cuerpo, c.tipo_caracteristica, c.descripcion]
    ));
    await Promise.all(promises);
};

/**
 * Inserta la vestimenta de un hallazgo.
 */
export const insertVestimenta = async (db, idHallazgo, vestimenta) => {
    if (!vestimenta || vestimenta.length === 0) return;
    const promises = vestimenta.map(v => db.query(
        `INSERT INTO hallazgo_vestimenta (id_hallazgo, id_prenda, color, marca, caracteristica_especial) VALUES ($1, $2, $3, $4, $5)`,
        [idHallazgo, v.id_prenda, v.color, v.marca, v.caracteristica_especial]
    ));
    await Promise.all(promises);
};

/**
 * Obtiene todos los hallazgos completos creados por un usuario específico.
 */
export const getHallazgosCompletosByUserId = async (userId) => {
    const db = await openDb();
    const hallazgosIdsResult = await db.query(
        `SELECT id_hallazgo FROM hallazgos WHERE id_usuario_buscador = $1 ORDER BY fecha_hallazgo DESC`, [userId]
    );
    const hallazgosIds = hallazgosIdsResult.rows;

    if (!hallazgosIds || hallazgosIds.length === 0) return [];
    
    const hallazgosCompletosPromises = hallazgosIds.map(h => getHallazgoCompletoById(h.id_hallazgo));
    return Promise.all(hallazgosCompletosPromises);
};

/**
 * Actualiza la tabla principal de un hallazgo.
 */
export const updateHallazgo = async (db, id, hallazgoData) => {
    const fields = Object.keys(hallazgoData);
    const values = Object.values(hallazgoData);
    const setClause = fields.map((field, index) => `${field} = $${index + 1}`).join(', ');

    const sql = `UPDATE hallazgos SET ${setClause} WHERE id_hallazgo = $${fields.length + 1}`;
    return db.query(sql, [...values, id]);
};

/**
 * Actualiza una ubicación existente.
 */
export const updateUbicacion = async (db, id, ubicacionData) => {
    const fields = Object.keys(ubicacionData);
    const values = Object.values(ubicacionData);
    const setClause = fields.map((field, index) => `${field} = $${index + 1}`).join(', ');

    const sql = `UPDATE ubicaciones SET ${setClause} WHERE id_ubicacion = $${fields.length + 1}`;
    return db.query(sql, [...values, id]);
};

/**
 * Elimina todas las características de un hallazgo por su ID.
 */
export const deleteCaracteristicasByHallazgoId = async (db, idHallazgo) => {
    return db.query(`DELETE FROM hallazgo_caracteristicas WHERE id_hallazgo = $1`, [idHallazgo]);
};

/**
 * Elimina toda la vestimenta de un hallazgo por su ID.
 */
export const deleteVestimentaByHallazgoId = async (db, idHallazgo) => {
    return db.query(`DELETE FROM hallazgo_vestimenta WHERE id_hallazgo = $1`, [idHallazgo]);
};
