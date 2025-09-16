// RUTA: backend/db/queries/hallazgosQueries.js

import { openDb } from '../users/initDb.js';
import logger from '../../utils/logger.js';

/**
 * FUNCIÓN MAESTRA: Obtiene un hallazgo completo por su ID con todos los datos.
 */
export const getHallazgoCompletoById = async (id) => {
    const db = await openDb();
    const hallazgoPrincipalSql = `
        SELECT
            h.*,
            u.estado, u.municipio, u.localidad, u.calle, u.referencias, u.codigo_postal,
            ctl.nombre_tipo AS tipo_lugar
        FROM hallazgos AS h
        LEFT JOIN ubicaciones AS u ON h.id_ubicacion_hallazgo = u.id_ubicacion
        LEFT JOIN catalogo_tipo_lugar AS ctl ON h.id_tipo_lugar_hallazgo = ctl.id_tipo_lugar
        WHERE h.id_hallazgo = ?;
    `;
    const hallazgo = await db.get(hallazgoPrincipalSql, [id]);

    if (!hallazgo) return null;

    const caracteristicasSql = `SELECT * FROM hallazgo_caracteristicas WHERE id_hallazgo = ?;`;
    const vestimentaSql = `SELECT * FROM hallazgo_vestimenta WHERE id_hallazgo = ?;`;

    const [caracteristicas, vestimenta] = await Promise.all([
        db.all(caracteristicasSql, [id]),
        db.all(vestimentaSql, [id])
    ]);
    
    const { estado, municipio, localidad, calle, referencias, codigo_postal, ...restOfHallazgo } = hallazgo;
    
    return {
        ...restOfHallazgo,
        ubicacion_hallazgo: { estado, municipio, localidad, calle, referencias, codigo_postal },
        caracteristicas: caracteristicas || [],
        vestimenta: vestimenta || []
    };
};

/**
 * ✅ CORREGIDO Y MEJORADO: Obtiene todos los hallazgos activos utilizando la función maestra.
 */
export const getAllHallazgosCompletos = async () => {
    const db = await openDb();
    // 1. Obtenemos solo los IDs de los hallazgos activos
    const hallazgosIds = await db.all(`SELECT id_hallazgo FROM hallazgos WHERE estado_hallazgo = 'activo'`);

    // 2. Usamos la función maestra para obtener los detalles completos de cada uno
    const hallazgosCompletosPromises = hallazgosIds.map(h => getHallazgoCompletoById(h.id_hallazgo));
    const hallazgosCompletos = await Promise.all(hallazgosCompletosPromises);

    return hallazgosCompletos.filter(Boolean); // Filtramos por si alguno fue nulo
};


/**
 * Busca hallazgos basándose en múltiples criterios detallados.
 */
export const searchHallazgos = async (params) => {
    const db = await openDb();
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

    // Lógica de filtrado (se queda igual, está bien)
    if (params.nombre) {
        conditions.push(`h.nombre LIKE ?`);
        queryParams.push(`%${params.nombre}%`);
    }
    if (params.apellido) {
        conditions.push(`(h.apellido_paterno LIKE ? OR h.apellido_materno LIKE ?)`);
        queryParams.push(`%${params.apellido}%`, `%${params.apellido}%`);
    }
    if (params.estado) {
        conditions.push(`u.estado = ?`);
        queryParams.push(params.estado);
    }
    if (params.municipio) {
        conditions.push(`u.municipio = ?`);
        queryParams.push(params.municipio);
    }
    if (params.genero) {
        conditions.push(`h.genero = ?`);
        queryParams.push(params.genero);
    }
    if (params.edad_estimada_min) {
        conditions.push(`h.edad_estimada >= ?`);
        queryParams.push(params.edad_estimada_min);
    }
    if (params.edad_estimada_max) {
        conditions.push(`h.edad_estimada <= ?`);
        queryParams.push(params.edad_estimada_max);
    }
    if (params.fecha_hallazgo_inicio) {
        conditions.push(`h.fecha_hallazgo >= ?`);
        queryParams.push(params.fecha_hallazgo_inicio);
    }
    if (params.fecha_hallazgo_fin) {
        conditions.push(`h.fecha_hallazgo <= ?`);
        queryParams.push(params.fecha_hallazgo_fin);
    }
    
    conditions.push(`h.estado_hallazgo = 'activo'`);

    if (conditions.length > 0) {
        query += ` WHERE ` + conditions.join(' AND ');
    }

    query += ` ORDER BY h.fecha_hallazgo DESC`;

    try {
        return await db.all(query, queryParams);
    } catch (error) {
        logger.error(`❌ Error en la búsqueda de hallazgos: ${error.message}`);
        throw error;
    }
};

/**
 * Busca hallazgos por un término de búsqueda general y exhaustivo.
 */
export const searchHallazgosByKeyword = async (searchTerm = '', limit = 20, offset = 0) => {
    const db = await openDb();
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
            LOWER(h.nombre) LIKE ? OR LOWER(h.apellido_paterno) LIKE ? OR
            LOWER(h.descripcion_general_hallazgo) LIKE ? OR
            LOWER(u.estado) LIKE ? OR LOWER(u.municipio) LIKE ? OR
            LOWER(ctl.nombre_tipo) LIKE ? OR
            LOWER(cpc.nombre_parte) LIKE ? OR LOWER(hc.descripcion) LIKE ? OR
            LOWER(cp.tipo_prenda) LIKE ? OR LOWER(hv.color) LIKE ?
        )
        ORDER BY h.fecha_hallazgo DESC
        LIMIT ? OFFSET ?;
    `;
    const params = Array(10).fill(sqlTerm).concat([limit, offset]);
    try {
        return await db.all(hallazgosSql, params);
    } catch (error) {
        logger.error(`❌ Error en la búsqueda por palabra clave de hallazgos: ${error.message}`);
        throw error;
    }
};


/**
 * Obtiene todos los catálogos necesarios para los formularios de hallazgos.
 */
export const getAllHallazgosCatalogos = async () => {
    const db = await openDb();
    try {
        const [tiposLugar, partesCuerpo, prendas] = await Promise.all([
            db.all(`SELECT id_tipo_lugar, nombre_tipo FROM catalogo_tipo_lugar ORDER BY nombre_tipo`),
            db.all(`SELECT id_parte_cuerpo, nombre_parte, categoria_principal FROM catalogo_partes_cuerpo ORDER BY nombre_parte`),
            db.all(`SELECT id_prenda, tipo_prenda, categoria_general FROM catalogo_prendas ORDER BY tipo_prenda`)
        ]);
        
        return { tiposLugar, partesCuerpo, prendas };
    } catch (error) {
        logger.error(`❌ Error al obtener catálogos para hallazgos: ${error.message}`);
        throw error;
    }
};

/**
 * Inserta una nueva ubicación y devuelve su ID.
 * @param {object} db - La instancia de la base de datos.
 * @param {object} ubicacionData - Los datos de la ubicación.
 * @returns {Promise<number>} - El ID de la nueva ubicación.
 */
export const insertUbicacion = async (db, ubicacionData) => {
    const { estado, municipio, localidad, calle, referencias, latitud, longitud, codigo_postal } = ubicacionData;
    const result = await db.run(
        `INSERT INTO ubicaciones (estado, municipio, localidad, calle, referencias, latitud, longitud, codigo_postal)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [estado, municipio, localidad, calle, referencias, latitud, longitud, codigo_postal]
    );
    return result.lastID;
};

/**
 * Inserta un nuevo hallazgo y devuelve su ID.
 * @param {object} db - La instancia de la base de datos.
 * @param {object} hallazgoData - Los datos del hallazgo.
 * @returns {Promise<number>} - El ID del nuevo hallazgo.
 */
export const insertHallazgo = async (db, hallazgoData) => {
    const {
        id_usuario_buscador, nombre, segundo_nombre, apellido_paterno, apellido_materno,
        id_ubicacion_hallazgo, id_tipo_lugar_hallazgo, fecha_hallazgo,
        descripcion_general_hallazgo, edad_estimada, genero, estatura, complexion, peso, foto_hallazgo
    } = hallazgoData;
    const result = await db.run(
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
    return result.lastID;
};

/**
 * Inserta las características (rasgos) de un hallazgo.
 * @param {object} db - La instancia de la base de datos.
 * @param {number} idHallazgo - El ID del hallazgo.
 * @param {Array<object>} caracteristicas - El array de características.
 */
export const insertCaracteristicas = async (db, idHallazgo, caracteristicas) => {
    if (!caracteristicas || caracteristicas.length === 0) return;
    const promises = caracteristicas.map(c => db.run(
        `INSERT INTO hallazgo_caracteristicas (id_hallazgo, id_parte_cuerpo, tipo_caracteristica, descripcion) VALUES (?, ?, ?, ?)`,
        [idHallazgo, c.id_parte_cuerpo, c.tipo_caracteristica, c.descripcion]
    ));
    await Promise.all(promises);
};

/**
 * Inserta la vestimenta de un hallazgo.
 * @param {object} db - La instancia de la base de datos.
 * @param {number} idHallazgo - El ID del hallazgo.
 * @param {Array<object>} vestimenta - El array de prendas.
 */
export const insertVestimenta = async (db, idHallazgo, vestimenta) => {
    if (!vestimenta || vestimenta.length === 0) return;
    const promises = vestimenta.map(v => db.run(
        `INSERT INTO hallazgo_vestimenta (id_hallazgo, id_prenda, color, marca, caracteristica_especial) VALUES (?, ?, ?, ?, ?)`,
        [idHallazgo, v.id_prenda, v.color, v.marca, v.caracteristica_especial]
    ));
    await Promise.all(promises);
};

/**
 * Obtiene todos los hallazgos completos creados por un usuario específico.
 * @param {number} userId - El ID del usuario que creó los hallazgos.
 * @returns {Promise<Array<object>>} - Lista de hallazgos completos.
 */
export const getHallazgosCompletosByUserId = async (userId) => {
    const db = await openDb();
    
    // 1. Obtenemos solo los IDs de los hallazgos del usuario
    const hallazgosIds = await db.all(
        `SELECT id_hallazgo FROM hallazgos WHERE id_usuario_buscador = ? ORDER BY fecha_hallazgo DESC`,
        [userId]
    );

    if (!hallazgosIds || hallazgosIds.length === 0) {
        return [];
    }
    
    // 2. Usamos la función maestra para obtener los detalles completos de cada uno
    const hallazgosCompletosPromises = hallazgosIds.map(h => getHallazgoCompletoById(h.id_hallazgo));
    const hallazgosCompletos = await Promise.all(hallazgosCompletosPromises);

    return hallazgosCompletos.filter(Boolean); // Filtramos por si alguno fue nulo
};

/**
 * Actualiza la tabla principal de un hallazgo.
 */
export const updateHallazgo = async (db, id, hallazgoData) => {
    const fields = Object.keys(hallazgoData);
    const values = Object.values(hallazgoData);
    const setClause = fields.map(field => `${field} = ?`).join(', ');

    const sql = `UPDATE hallazgos SET ${setClause} WHERE id_hallazgo = ?`;
    return db.run(sql, [...values, id]);
};

/**
 * Actualiza una ubicación existente.
 */
export const updateUbicacion = async (db, id, ubicacionData) => {
    const fields = Object.keys(ubicacionData);
    const values = Object.values(ubicacionData);
    const setClause = fields.map(field => `${field} = ?`).join(', ');

    const sql = `UPDATE ubicaciones SET ${setClause} WHERE id_ubicacion = ?`;
    return db.run(sql, [...values, id]);
};

/**
 * Elimina todas las características de un hallazgo por su ID.
 */
export const deleteCaracteristicasByHallazgoId = async (db, idHallazgo) => {
    return db.run(`DELETE FROM hallazgo_caracteristicas WHERE id_hallazgo = ?`, [idHallazgo]);
};

/**
 * Elimina toda la vestimenta de un hallazgo por su ID.
 */
export const deleteVestimentaByHallazgoId = async (db, idHallazgo) => {
    return db.run(`DELETE FROM hallazgo_vestimenta WHERE id_hallazgo = ?`, [idHallazgo]);
};

