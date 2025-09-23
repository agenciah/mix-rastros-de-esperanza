import { openDb } from '../users/initDb.js';
import logger from '../../utils/logger.js';
// Asumimos que hallazgosQueries.js también será migrado
import { getHallazgoCompletoById } from './hallazgosQueries.js';

/**
 * Obtiene una ficha completa por su ID (Versión PostgreSQL).
 * @param {number} id - El ID de la ficha a buscar.
 * @returns {Promise<object | null>} - La ficha completa o null si no se encuentra.
 */
export const getFichaCompletaById = async (id) => {
    const db = openDb(); // Obtiene el pool de PostgreSQL

    const fichaPrincipalSql = `
        SELECT
            fd.id_ficha, fd.id_usuario_creador, fd.nombre, fd.segundo_nombre, fd.apellido_paterno,
            fd.apellido_materno, fd.fecha_desaparicion, fd.foto_perfil, fd.estado_ficha,
            fd.estado_pago, fd.fecha_registro_encontrado, fd.edad_estimada, fd.genero,
            fd.estatura, fd.peso, fd.complexion, fd.id_ubicacion_desaparicion, fd.id_tipo_lugar_desaparicion,
            u.estado, u.municipio, u.localidad, u.calle, u.referencias, u.codigo_postal,
            ctl.nombre_tipo AS tipo_lugar
        FROM fichas_desaparicion AS fd
        LEFT JOIN ubicaciones AS u ON fd.id_ubicacion_desaparicion = u.id_ubicacion
        LEFT JOIN catalogo_tipo_lugar AS ctl ON fd.id_tipo_lugar_desaparicion = ctl.id_tipo_lugar
        WHERE fd.id_ficha = $1;
    `;
    const rasgosSql = `SELECT * FROM ficha_rasgos_fisicos WHERE id_ficha = $1;`;
    const vestimentaSql = `SELECT * FROM ficha_vestimenta WHERE id_ficha = $1;`;

    try {
        const [fichaResult, rasgosResult, vestimentaResult] = await Promise.all([
            db.query(fichaPrincipalSql, [id]),
            db.query(rasgosSql, [id]),
            db.query(vestimentaSql, [id])
        ]);

        if (fichaResult.rowCount === 0) {
            return null;
        }

        const ficha = fichaResult.rows[0];
        const rasgos_fisicos = rasgosResult.rows;
        const vestimenta = vestimentaResult.rows;

        const { estado, municipio, localidad, calle, referencias, codigo_postal, ...restOfFicha } = ficha;
        return {
            ...restOfFicha,
            ubicacion_desaparicion: { estado, municipio, localidad, calle, referencias, codigo_postal },
            rasgos_fisicos: rasgos_fisicos || [],
            vestimenta: vestimenta || []
        };
    } catch (error) {
        logger.error(`❌ Error en getFichaCompletaById (PostgreSQL): ${error.message}`);
        throw error;
    }
};

/**
 * Busca fichas de desaparición basándose en múltiples criterios (Versión PostgreSQL).
 * @param {object} params - Objeto con los parámetros de búsqueda.
 * @returns {Promise<Array<object>>} - Array de fichas que coinciden.
 */
export const searchFichas = async (params) => {
    const db = openDb();
    let query = `
        SELECT
            fd.id_ficha, fd.nombre, fd.apellido_paterno, fd.apellido_materno,
            fd.fecha_desaparicion, fd.foto_perfil, fd.estado_ficha,
            fd.edad_estimada, fd.genero, fd.estatura, fd.peso, fd.complexion,
            u.estado, u.municipio
        FROM fichas_desaparicion AS fd
        LEFT JOIN ubicaciones AS u ON fd.id_ubicacion_desaparicion = u.id_ubicacion
    `;

    const conditions = [];
    const queryParams = [];
    let paramIndex = 1;

    if (params.nombre) {
        conditions.push(`fd.nombre ILIKE $${paramIndex++}`); // ILIKE es case-insensitive en PostgreSQL
        queryParams.push(`%${params.nombre}%`);
    }
    if (params.apellido) {
        conditions.push(`(fd.apellido_paterno ILIKE $${paramIndex++} OR fd.apellido_materno ILIKE $${paramIndex++})`);
        queryParams.push(`%${params.apellido}%`, `%${params.apellido}%`);
    }
    if (params.estado) {
        conditions.push(`u.estado = $${paramIndex++}`);
        queryParams.push(params.estado);
    }
    if (params.municipio) {
        conditions.push(`u.municipio = $${paramIndex++}`);
        queryParams.push(params.municipio);
    }
    if (params.genero) {
        conditions.push(`fd.genero = $${paramIndex++}`);
        queryParams.push(params.genero);
    }
    if (params.edad_estimada_min) {
        conditions.push(`fd.edad_estimada >= $${paramIndex++}`);
        queryParams.push(params.edad_estimada_min);
    }
    if (params.edad_estimada_max) {
        conditions.push(`fd.edad_estimada <= $${paramIndex++}`);
        queryParams.push(params.edad_estimada_max);
    }
    if (params.fecha_desaparicion_inicio) {
        conditions.push(`fd.fecha_desaparicion >= $${paramIndex++}`);
        queryParams.push(params.fecha_desaparicion_inicio);
    }
    if (params.fecha_desaparicion_fin) {
        conditions.push(`fd.fecha_desaparicion <= $${paramIndex++}`);
        queryParams.push(params.fecha_desaparicion_fin);
    }
    
    conditions.push(`fd.estado_ficha = 'activa'`);

    if (conditions.length > 0) {
        query += ` WHERE ` + conditions.join(' AND ');
    }

    query += ` ORDER BY fd.fecha_desaparicion DESC`;

    try {
        const result = await db.query(query, queryParams);
        return result.rows;
    } catch (error) {
        logger.error(`❌ Error en la búsqueda de fichas (PostgreSQL): ${error.message}`);
        throw error;
    }
};

/**
 * Obtiene todos los hallazgos completos (Versión PostgreSQL).
 * @returns {Promise<Array<object>>} - Lista de hallazgos completos.
 */
export const getAllHallazgosCompletos = async () => {
    const db = await openDb();
    
    const hallazgosIdsResult = await db.query(`SELECT id_hallazgo FROM hallazgos WHERE estado_hallazgo = 'encontrado'`);
    const hallazgosIds = hallazgosIdsResult.rows;

    if (!hallazgosIds || hallazgosIds.length === 0) {
        return [];
    }
    
    const hallazgosPromises = hallazgosIds.map(h => getHallazgoCompletoById(h.id_hallazgo));
    const hallazgosCompletos = await Promise.all(hallazgosPromises);

    return hallazgosCompletos.filter(Boolean);
};

/**
 * Obtiene una ficha de desaparición con detalles para el admin (Versión PostgreSQL).
 */
export const getFichaCompletaByIdAdmin = async (id_ficha) => {
    const db = openDb();
    
    const fichaSql = `
        SELECT
            fd.*,
            u.nombre AS nombre_usuario, u.email AS email_usuario,
            ubicacion.estado, ubicacion.municipio, ubicacion.localidad, ubicacion.calle,
            ubicacion.referencias, ubicacion.latitud, ubicacion.longitud, ubicacion.codigo_postal
        FROM fichas_desaparicion AS fd
        LEFT JOIN users AS u ON fd.id_usuario_creador = u.id
        LEFT JOIN ubicaciones AS ubicacion ON fd.id_ubicacion_desaparicion = ubicacion.id_ubicacion
        WHERE fd.id_ficha = $1;
    `;
    const rasgosSql = `SELECT * FROM ficha_rasgos_fisicos WHERE id_ficha = $1;`;
    const vestimentaSql = `SELECT * FROM ficha_vestimenta WHERE id_ficha = $1;`;
    
    try {
        const [fichaResult, rasgosResult, vestimentaResult] = await Promise.all([
            db.query(fichaSql, [id_ficha]),
            db.query(rasgosSql, [id_ficha]),
            db.query(vestimentaSql, [id_ficha])
        ]);

        if (fichaResult.rowCount === 0) return null;

        const ficha = fichaResult.rows[0];
        const { estado, municipio, localidad, calle, referencias, latitud, longitud, codigo_postal, ...restOfFicha } = ficha;
        
        return {
            ...restOfFicha,
            ubicacion_desaparicion: { estado, municipio, localidad, calle, referencias, latitud, longitud, codigo_postal },
            rasgos_fisicos: rasgosResult.rows,
            vestimenta: vestimentaResult.rows,
        };
    } catch (error) {
        logger.error(`❌ Error en getFichaCompletaByIdAdmin (PostgreSQL): ${error.message}`);
        throw error;
    }
};

/**
 * Busca hallazgos basándose en múltiples criterios (Versión PostgreSQL).
 * @param {object} params - Objeto con los parámetros de búsqueda.
 * @returns {Promise<Array<object>>} - Array de hallazgos que coinciden.
 */
export const searchHallazgos = async (params) => {
    const db = openDb();
    let query = `
        SELECT
            h.id_hallazgo, h.nombre, h.apellido_paterno, h.apellido_materno,
            h.fecha_hallazgo, h.foto_hallazgo, h.descripcion_general_hallazgo, h.estado_hallazgo,
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
    if (params.municipio) {
        conditions.push(`u.municipio = $${paramIndex++}`);
        queryParams.push(params.municipio);
    }
    if (params.genero) {
        conditions.push(`h.genero = $${paramIndex++}`);
        queryParams.push(params.genero);
    }
    if (params.edad_estimada_min) {
        conditions.push(`h.edad_estimada >= $${paramIndex++}`);
        queryParams.push(params.edad_estimada_min);
    }
    if (params.edad_estimada_max) {
        conditions.push(`h.edad_estimada <= $${paramIndex++}`);
        queryParams.push(params.edad_estimada_max);
    }
    if (params.fecha_hallazgo_inicio) {
        conditions.push(`h.fecha_hallazgo >= $${paramIndex++}`);
        queryParams.push(params.fecha_hallazgo_inicio);
    }
    if (params.fecha_hallazgo_fin) {
        conditions.push(`h.fecha_hallazgo <= $${paramIndex++}`);
        queryParams.push(params.fecha_hallazgo_fin);
    }
    
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
 * Obtiene todos los catálogos (Versión PostgreSQL).
 * @returns {Promise<object>} - Un objeto con arrays de los catálogos.
 */
export const getAllHallazgosCatalogos = async () => {
    const db = openDb();
    try {
        const [tiposLugarResult, partesCuerpoResult, prendasResult] = await Promise.all([
            db.query(`SELECT id_tipo_lugar, nombre_tipo FROM catalogo_tipo_lugar ORDER BY nombre_tipo`),
            db.query(`SELECT id_parte_cuerpo, nombre_parte, categoria_principal FROM catalogo_partes_cuerpo ORDER BY nombre_parte`),
            db.query(`SELECT id_prenda, tipo_prenda, categoria_general FROM catalogo_prendas ORDER BY tipo_prenda`)
        ]);
        
        return {
            tiposLugar: tiposLugarResult.rows,
            partesCuerpo: partesCuerpoResult.rows,
            prendas: prendasResult.rows
        };
    } catch (error) {
        logger.error(`❌ Error al obtener catálogos (PostgreSQL): ${error.message}`);
        throw error;
    }
};

/**
 * Busca hallazgos por un término de búsqueda general (Versión PostgreSQL).
 * @returns {Promise<Array<object>>} - Array de hallazgos que coinciden.
 */
export const searchHallazgosByKeyword = async (searchTerm = '', limit = 20, offset = 0) => {
    const db = openDb();
    const sqlTerm = `%${searchTerm.toLowerCase()}%`;

    // ✅ CORRECCIÓN: La consulta ahora usa placeholders posicionales ($1, $2, etc.)
    const hallazgosSql = `
        SELECT DISTINCT
            h.id_hallazgo, h.nombre, h.segundo_nombre, h.apellido_paterno, 
            h.apellido_materno, h.fecha_hallazgo, h.descripcion_general_hallazgo,
            h.edad_estimada, h.genero, h.estatura, h.complexion, h.peso,
            u.estado, u.municipio, u.localidad, h.foto_hallazgo
        FROM hallazgos AS h
        LEFT JOIN ubicaciones AS u ON h.id_ubicacion_hallazgo = u.id_ubicacion
        LEFT JOIN hallazgo_vestimenta AS hv ON h.id_hallazgo = hv.id_hallazgo
        LEFT JOIN catalogo_prendas AS cp ON hv.id_prenda = cp.id_prenda
        LEFT JOIN catalogo_tipo_lugar AS ctl ON h.id_tipo_lugar_hallazgo = ctl.id_tipo_lugar
        LEFT JOIN hallazgo_caracteristicas AS hc ON h.id_hallazgo = hc.id_hallazgo
        LEFT JOIN catalogo_partes_cuerpo AS cpc ON hc.id_parte_cuerpo = cpc.id_parte_cuerpo
        WHERE 
            h.nombre ILIKE $1 OR
            h.segundo_nombre ILIKE $2 OR
            h.apellido_paterno ILIKE $3 OR
            h.apellido_materno ILIKE $4 OR
            h.descripcion_general_hallazgo ILIKE $5 OR
            h.genero ILIKE $6 OR
            h.complexion ILIKE $7 OR
            CAST(h.edad_estimada AS TEXT) ILIKE $8 OR
            CAST(h.estatura AS TEXT) ILIKE $9 OR
            CAST(h.peso AS TEXT) ILIKE $10 OR
            u.estado ILIKE $11 OR
            u.municipio ILIKE $12 OR
            ctl.nombre_tipo ILIKE $13 OR
            cpc.nombre_parte ILIKE $14 OR
            hc.tipo_caracteristica ILIKE $15 OR
            hc.descripcion ILIKE $16 OR
            cp.tipo_prenda ILIKE $17 OR
            hv.color ILIKE $18 OR
            hv.marca ILIKE $19 OR
            hv.caracteristica_especial ILIKE $20
        GROUP BY h.id_hallazgo, u.estado, u.municipio, u.localidad
        ORDER BY h.fecha_hallazgo DESC
        LIMIT $21 OFFSET $22;
    `;
    
    // ✅ CORRECCIÓN: El array de parámetros ahora tiene un valor para cada placeholder
    const params = Array(20).fill(sqlTerm).concat([limit, offset]);

    try {
        const hallazgosResult = await db.query(hallazgosSql, params);
        return hallazgosResult.rows;
    } catch (error) {
        logger.error(`❌ Error en la consulta SQL exhaustiva (PostgreSQL): ${error.message}`);
        throw error;
    }
};

/**
 * Obtiene una lista paginada de fichas públicas para el feed (Versión PostgreSQL).
 * @returns {Promise<Array<object>>} - Un array de fichas para el feed.
 */
export const getAllPublicFichas = async (limit = 10, offset = 0) => {
    const db = openDb();
    const sql = `
        SELECT
            fd.id_ficha, fd.nombre, fd.segundo_nombre, fd.apellido_paterno,
            fd.apellido_materno, fd.fecha_desaparicion, fd.foto_perfil,
            fd.genero, fd.edad_estimada, u.estado, u.municipio
        FROM fichas_desaparicion AS fd
        LEFT JOIN ubicaciones AS u ON fd.id_ubicacion_desaparicion = u.id_ubicacion
        WHERE fd.estado_ficha = 'activa' 
        ORDER BY fd.fecha_desaparicion DESC
        LIMIT $1 OFFSET $2;
    `;
    
    try {
        const result = await db.query(sql, [limit, offset]);
        return result.rows;
    } catch (error) {
        logger.error(`❌ Error al obtener las fichas públicas del feed (PostgreSQL): ${error.message}`);
        throw error;
    }
};

/**
 * Cuenta el número de fichas activas para un usuario específico (Versión PostgreSQL).
 * @param {number} userId - El ID del usuario.
 * @returns {Promise<number>} - El número de fichas activas.
 */
export const countActiveFichasByUserId = async (userId) => {
    const db = openDb();
    const sql = `SELECT COUNT(*) AS count FROM fichas_desaparicion WHERE id_usuario_creador = $1 AND estado_ficha = 'activa';`;
    try {
        const result = await db.query(sql, [userId]);
        return parseInt(result.rows[0].count, 10) || 0;
    } catch (error) {
        logger.error(`❌ Error al contar las fichas activas del usuario (PostgreSQL): ${error.message}`);
        throw error;
    }
};

