import { openDb } from '../users/initDb.js';
import logger from '../../utils/logger.js';
import { getHallazgoCompletoById } from '../queries/hallazgosQueries.js'

/**
 * Obtiene una ficha completa por su ID. VERSIÓN MEJORADA Y EXPLÍCITA.
 * @param {number} id - El ID de la ficha a buscar.
 * @returns {Promise<object | null>} - La ficha completa o null si no se encuentra.
 */
export const getFichaCompletaById = async (id) => {
    const db = await openDb();

    // 1. Consulta principal con TODOS los campos listados explícitamente
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
        WHERE fd.id_ficha = ?;
    `;
    const ficha = await db.get(fichaPrincipalSql, [id]);

    if (!ficha) return null;

    // 2. Obtener rasgos (sin cambios)
    const rasgosSql = `SELECT * FROM ficha_rasgos_fisicos WHERE id_ficha = ?;`;
    const rasgos_fisicos = await db.all(rasgosSql, [id]);

    // 3. Obtener vestimenta (sin cambios)
    const vestimentaSql = `SELECT * FROM ficha_vestimenta WHERE id_ficha = ?;`;
    const vestimenta = await db.all(vestimentaSql, [id]);

    // 4. Unir y formatear el resultado
    const { estado, municipio, localidad, calle, referencias, codigo_postal, ...restOfFicha } = ficha;
    return {
        ...restOfFicha,
        ubicacion_desaparicion: { estado, municipio, localidad, calle, referencias, codigo_postal },
        rasgos_fisicos: rasgos_fisicos || [],
        vestimenta: vestimenta || []
    };
};

/**
 * Busca fichas de desaparición basándose en múltiples criterios.
 * @param {object} params - Objeto con los parámetros de búsqueda.
 * @param {string} [params.nombre] - Nombre de la persona.
 * @param {string} [params.apellido] - Apellido de la persona.
 * @param {string} [params.estado] - Estado de desaparición.
 * @param {string} [params.municipio] - Municipio de desaparición.
 * @param {string} [params.genero] - Género de la persona.
 * @param {string} [params.edad_estimada_min] - Edad mínima.
 * @param {string} [params.edad_estimada_max] - Edad máxima.
 * @param {string} [params.fecha_desaparicion_inicio] - Fecha de inicio del rango.
 * @param {string} [params.fecha_desaparicion_fin] - Fecha de fin del rango.
 * @returns {Promise<Array<object>>} - Array de fichas que coinciden con los criterios.
 */
export const searchFichas = async (params) => {
    const db = await openDb();
    let query = `
        SELECT
            fd.id_ficha, fd.nombre, fd.apellido_paterno, fd.apellido_materno,
            fd.fecha_desaparicion,
            fd.foto_perfil, -- ✅ CAMBIO: Campo de foto añadido
            fd.estado_ficha,
            fd.edad_estimada, fd.genero, fd.estatura, fd.peso, fd.complexion,
            u.estado, u.municipio
        FROM fichas_desaparicion AS fd
        LEFT JOIN ubicaciones AS u ON fd.id_ubicacion_desaparicion = u.id_ubicacion
    `;

    const conditions = [];
    const queryParams = [];

    // Condiciones de nombre y apellido
    if (params.nombre) {
        conditions.push(`fd.nombre LIKE ?`);
        queryParams.push(`%${params.nombre}%`);
    }
    if (params.apellido) {
        conditions.push(`fd.apellido_paterno LIKE ? OR fd.apellido_materno LIKE ?`);
        queryParams.push(`%${params.apellido}%`, `%${params.apellido}%`);
    }

    // Condiciones de ubicación
    if (params.estado) {
        conditions.push(`u.estado = ?`);
        queryParams.push(params.estado);
    }
    if (params.municipio) {
        conditions.push(`u.municipio = ?`);
        queryParams.push(params.municipio);
    }

    // Condiciones de género
    if (params.genero) {
        conditions.push(`fd.genero = ?`);
        queryParams.push(params.genero);
    }

    // Condiciones de edad
    if (params.edad_estimada_min) {
        conditions.push(`fd.edad_estimada >= ?`);
        queryParams.push(params.edad_estimada_min);
    }
    if (params.edad_estimada_max) {
        conditions.push(`fd.edad_estimada <= ?`);
        queryParams.push(params.edad_estimada_max);
    }

    // Condiciones de fecha
    if (params.fecha_desaparicion_inicio) {
        conditions.push(`fd.fecha_desaparicion >= ?`);
        queryParams.push(params.fecha_desaparicion_inicio);
    }
    if (params.fecha_desaparicion_fin) {
        conditions.push(`fd.fecha_desaparicion <= ?`);
        queryParams.push(params.fecha_desaparicion_fin);
    }
    
    // Solo mostrar fichas activas por defecto
    conditions.push(`fd.estado_ficha = 'activa'`);

    if (conditions.length > 0) {
        query += ` WHERE ` + conditions.join(' AND ');
    }

    query += ` ORDER BY fd.fecha_desaparicion DESC`;

    try {
        const result = await db.all(query, queryParams);
        return result;
    } catch (error) {
        logger.error(`❌ Error en la búsqueda de fichas: ${error.message}`);
        throw error;
    }
};

/**
 * Obtiene todos los hallazgos completos. VERSIÓN MEJORADA.
 * @returns {Promise<Array<object>>} - Lista de hallazgos completos.
 */
export const getAllHallazgosCompletos = async () => {
    const db = await openDb();
    
    // 1. Obtenemos solo los IDs de los hallazgos activos.
    const hallazgosIds = await db.all(`
        SELECT id_hallazgo FROM hallazgos WHERE estado_hallazgo = 'activo'
    `);

    if (!hallazgosIds || hallazgosIds.length === 0) {
        return [];
    }

    // 2. Para cada ID, usamos la función maestra 'getHallazgoCompletoById'
    // (Asegúrate de que esta función exista en tu archivo de queries de hallazgos).
    const hallazgosPromises = hallazgosIds.map(h => getHallazgoCompletoById(h.id_hallazgo));
    const hallazgosCompletos = await Promise.all(hallazgosPromises);

    return hallazgosCompletos.filter(Boolean); // Filtramos por si alguno fue nulo
};

/**
 * Obtiene una ficha de desaparición con todos sus detalles para el admin. VERSIÓN MEJORADA.
 */
export const getFichaCompletaByIdAdmin = async (id_ficha) => {
    const db = await openDb();
    
    // La consulta principal se queda igual, ya es bastante completa.
    const fichaSql = `
        SELECT
            fd.*,
            u.nombre AS nombre_usuario, u.email AS email_usuario,
            ubicacion.estado, ubicacion.municipio, ubicacion.localidad, ubicacion.calle,
            ubicacion.referencias, ubicacion.latitud, ubicacion.longitud, ubicacion.codigo_postal
        FROM fichas_desaparicion AS fd
        LEFT JOIN users AS u ON fd.id_usuario_creador = u.id
        LEFT JOIN ubicaciones AS ubicacion ON fd.id_ubicacion_desaparicion = ubicacion.id_ubicacion
        WHERE fd.id_ficha = ?;
    `;
    const ficha = await db.get(fichaSql, [id_ficha]);
    if (!ficha) return null;

    // Las consultas de rasgos y vestimenta se quedan igual.
    const rasgosSql = `SELECT * FROM ficha_rasgos_fisicos WHERE id_ficha = ?;`;
    const vestimentaSql = `SELECT * FROM ficha_vestimenta WHERE id_ficha = ?;`;
    
    const [rasgos, vestimenta] = await Promise.all([
        db.all(rasgosSql, [id_ficha]),
        db.all(vestimentaSql, [id_ficha])
    ]);

    // ✅ CAMBIO: Formateamos el objeto final para anidar la ubicación.
    const { estado, municipio, localidad, calle, referencias, latitud, longitud, codigo_postal, ...restOfFicha } = ficha;
    
    return {
        ...restOfFicha,
        ubicacion_desaparicion: { estado, municipio, localidad, calle, referencias, latitud, longitud, codigo_postal },
        rasgos_fisicos: rasgos,
        vestimenta: vestimenta,
    };
};

/**
 * Busca hallazgos basándose en múltiples criterios.
 * @param {object} params - Objeto con los parámetros de búsqueda.
 * @param {string} [params.nombre] - Nombre de la persona encontrada.
 * @param {string} [params.apellido] - Apellido de la persona encontrada.
 * @param {string} [params.estado] - Estado del hallazgo.
 * @param {string} [params.municipio] - Municipio del hallazgo.
 * @param {string} [params.genero] - Género de la persona.
 * @param {string} [params.edad_estimada_min] - Edad mínima.
 * @param {string} [params.edad_estimada_max] - Edad máxima.
 * @param {string} [params.fecha_hallazgo_inicio] - Fecha de inicio del rango.
 * @param {string} [params.fecha_hallazgo_fin] - Fecha de fin del rango.
 * @returns {Promise<Array<object>>} - Array de hallazgos que coinciden con los criterios.
 */
export const searchHallazgos = async (params) => {
    const db = await openDb();
    let query = `
        SELECT
            h.id_hallazgo, h.nombre, h.apellido_paterno, h.apellido_materno,
            h.fecha_hallazgo, h.foto_hallazgo, h.descripcion_general_hallazgo, h.estado_hallazgo,
            -- Campos nuevos para el resultado de la búsqueda
            h.edad_estimada, h.genero, h.estatura, h.peso, h.complexion,
            u.estado, u.municipio
        FROM hallazgos AS h
        LEFT JOIN ubicaciones AS u ON h.id_ubicacion_hallazgo = u.id_ubicacion
    `;

    const conditions = [];
    const queryParams = [];

    // Condiciones de nombre y apellido
    if (params.nombre) {
        conditions.push(`h.nombre LIKE ?`);
        queryParams.push(`%${params.nombre}%`);
    }
    if (params.apellido) {
        conditions.push(`h.apellido_paterno LIKE ? OR h.apellido_materno LIKE ?`);
        queryParams.push(`%${params.apellido}%`, `%${params.apellido}%`);
    }

    // Condiciones de ubicación
    if (params.estado) {
        conditions.push(`u.estado = ?`);
        queryParams.push(params.estado);
    }
    if (params.municipio) {
        conditions.push(`u.municipio = ?`);
        queryParams.push(params.municipio);
    }

    // Condiciones de género
    if (params.genero) {
        conditions.push(`h.genero = ?`);
        queryParams.push(params.genero);
    }

    // Condiciones de edad
    if (params.edad_estimada_min) {
        conditions.push(`h.edad_estimada >= ?`);
        queryParams.push(params.edad_estimada_min);
    }
    if (params.edad_estimada_max) {
        conditions.push(`h.edad_estimada <= ?`);
        queryParams.push(params.edad_estimada_max);
    }

    // Condiciones de fecha
    if (params.fecha_hallazgo_inicio) {
        conditions.push(`h.fecha_hallazgo >= ?`);
        queryParams.push(params.fecha_hallazgo_inicio);
    }
    if (params.fecha_hallazgo_fin) {
        conditions.push(`h.fecha_hallazgo <= ?`);
        queryParams.push(params.fecha_hallazgo_fin);
    }
    
    // Solo mostrar hallazgos activos por defecto
    conditions.push(`h.estado_hallazgo = 'activo'`);

    if (conditions.length > 0) {
        query += ` WHERE ` + conditions.join(' AND ');
    }

    query += ` ORDER BY h.fecha_hallazgo DESC`;

    try {
        const result = await db.all(query, queryParams);
        return result;
    } catch (error) {
        logger.error(`❌ Error en la búsqueda de hallazgos: ${error.message}`);
        throw error;
    }
};

/**
 * Obtiene todos los catálogos necesarios para los formularios de hallazgos.
 * @returns {Promise<object>} - Un objeto con arrays de los catálogos.
 */
export const getAllHallazgosCatalogos = async () => {
    const db = await openDb();

    try {
        const tiposLugar = await db.all(`SELECT id_tipo_lugar, nombre_tipo FROM catalogo_tipo_lugar ORDER BY nombre_tipo`);
        const partesCuerpo = await db.all(`SELECT id_parte_cuerpo, nombre_parte, categoria_principal FROM catalogo_partes_cuerpo ORDER BY nombre_parte`);
        const prendas = await db.all(`SELECT id_prenda, tipo_prenda, categoria_general FROM catalogo_prendas ORDER BY tipo_prenda`);
        
        return {
            tiposLugar,
            partesCuerpo,
            prendas
        };
    } catch (error) {
        logger.error(`❌ Error al obtener catálogos para hallazgos: ${error.message}`);
        throw error;
    }
};

/**
 * Busca hallazgos por un término de búsqueda general, incluyendo nombres, descripciones, rasgos y vestimenta.
 * @param {string} searchTerm - El término de búsqueda.
 * @param {number} [limit=20] - Límite de resultados.
 * @param {number} [offset=0] - Offset de resultados.
 * @returns {Promise<Array<object>>} - Array de hallazgos que coinciden con la búsqueda.
 */
// Reemplaza la función completa con esta versión definitiva
export const searchHallazgosByKeyword = async (searchTerm = '', limit = 20, offset = 0) => {
    const db = await openDb();
    
    const sqlTerm = `%${searchTerm.toLowerCase()}%`;

    const hallazgosSql = `
        SELECT 
            h.id_hallazgo, h.nombre, h.segundo_nombre, h.apellido_paterno, 
            h.apellido_materno, h.fecha_hallazgo, h.descripcion_general_hallazgo,
            h.edad_estimada, h.genero, h.estatura, h.complexion, h.peso,
            u.estado, u.municipio, u.localidad
        FROM hallazgos AS h
        -- Joins que ya teníamos
        LEFT JOIN ubicaciones AS u ON h.id_ubicacion_hallazgo = u.id_ubicacion
        LEFT JOIN hallazgo_vestimenta AS hv ON h.id_hallazgo = hv.id_hallazgo
        LEFT JOIN catalogo_prendas AS cp ON hv.id_prenda = cp.id_prenda
        -- ===================================================================
        -- NUEVOS JOINS PARA BÚSQUEDA EXHAUSTIVA
        -- ===================================================================
        LEFT JOIN catalogo_tipo_lugar AS ctl ON h.id_tipo_lugar_hallazgo = ctl.id_tipo_lugar
        LEFT JOIN hallazgo_caracteristicas AS hc ON h.id_hallazgo = hc.id_hallazgo
        LEFT JOIN catalogo_partes_cuerpo AS cpc ON hc.id_parte_cuerpo = cpc.id_parte_cuerpo
        -- ===================================================================
        WHERE ( 
            -- === Parte 1: Datos Generales del Hallazgo ===
            LOWER(h.nombre) LIKE ? OR
            LOWER(h.segundo_nombre) LIKE ? OR
            LOWER(h.apellido_paterno) LIKE ? OR
            LOWER(h.apellido_materno) LIKE ? OR
            LOWER(h.descripcion_general_hallazgo) LIKE ? OR
            LOWER(h.genero) LIKE ? OR
            LOWER(h.complexion) LIKE ? OR
            CAST(h.edad_estimada AS TEXT) LIKE ? OR
            CAST(h.estatura AS TEXT) LIKE ? OR
            CAST(h.peso AS TEXT) LIKE ? OR
            LOWER(u.estado) LIKE ? OR
            LOWER(u.municipio) LIKE ? OR
            LOWER(ctl.nombre_tipo) LIKE ? OR -- <-- Búsqueda en Tipo de Lugar del Catálogo

            -- === Parte 2: Rasgos Físicos ===
            LOWER(cpc.nombre_parte) LIKE ? OR -- <-- Búsqueda en Parte del Cuerpo del Catálogo
            LOWER(hc.tipo_caracteristica) LIKE ? OR
            LOWER(hc.descripcion) LIKE ? OR

            -- === Parte 3: Vestimenta ===
            LOWER(cp.tipo_prenda) LIKE ? OR -- <-- Búsqueda en Tipo de Prenda del Catálogo
            LOWER(hv.color) LIKE ? OR
            LOWER(hv.marca) LIKE ? OR -- <-- Campo que faltaba
            LOWER(hv.caracteristica_especial) LIKE ? -- <-- Campo que faltaba
        )
        GROUP BY h.id_hallazgo
        ORDER BY h.fecha_hallazgo DESC
        LIMIT ? OFFSET ?;
    `;
    
    // Lista de parámetros actualizada para coincidir con cada '?' en la consulta
    const params = [
        // Parte 1 (13 params)
        sqlTerm, sqlTerm, sqlTerm, sqlTerm, sqlTerm, sqlTerm, sqlTerm, sqlTerm, 
        sqlTerm, sqlTerm, sqlTerm, sqlTerm, sqlTerm,
        // Parte 2 (3 params)
        sqlTerm, sqlTerm, sqlTerm,
        // Parte 3 (4 params)
        sqlTerm, sqlTerm, sqlTerm, sqlTerm,
        // Paginación (2 params)
        limit, offset
    ];

    console.log(`[Query] SQL a ejecutar (Exhaustivo): \n`, hallazgosSql);
    console.log(`[Query] Parámetros (${params.length}):`, params);

    try {
        const hallazgosResult = await db.all(hallazgosSql, params);
        console.log(`[Query] Resultados de la consulta SQL:`, hallazgosResult);
        return hallazgosResult;
    } catch (error) {
        console.error(`❌ Error en la consulta SQL: ${error.message}`);
        throw error;
    }
};

/**
 * Obtiene una lista paginada de fichas públicas para el feed. VERSIÓN MEJORADA.
 * @param {number} limit - El número de fichas a devolver.
 * @param {number} offset - El punto de inicio para la paginación.
 * @returns {Promise<Array<object>>} - Un array de fichas para el feed.
 */
export const getAllPublicFichas = async (limit = 10, offset = 0) => {
    const db = await openDb();
    // Esta consulta es un balance: trae los campos más importantes para una tarjeta
    // sin ser tan pesada como una consulta de detalles completos.
    const sql = `
        SELECT
            fd.id_ficha,
            fd.nombre,
            fd.segundo_nombre,
            fd.apellido_paterno,
            fd.apellido_materno,
            fd.fecha_desaparicion,
            fd.foto_perfil,
            fd.genero,
            fd.edad_estimada,
            u.estado,
            u.municipio
        FROM fichas_desaparicion AS fd
        LEFT JOIN ubicaciones AS u ON fd.id_ubicacion_desaparicion = u.id_ubicacion
        WHERE
            fd.estado_ficha = 'activa' 
        ORDER BY fd.fecha_desaparicion DESC
        LIMIT ? OFFSET ?;
    `;
    
    try {
        const fichas = await db.all(sql, [limit, offset]);
        return fichas;
    } catch (error) {
        logger.error(`❌ Error al obtener las fichas públicas del feed: ${error.message}`);
        throw error;
    }
};

/**
 * Cuenta el número de fichas activas para un usuario específico.
 * @param {number} userId - El ID del usuario.
 * @returns {Promise<number>} - El número de fichas activas.
 */
export const countActiveFichasByUserId = async (userId) => {
    const db = await openDb();
    const sql = `
        SELECT COUNT(*) AS count 
        FROM fichas_desaparicion 
        WHERE id_usuario_creador = ? AND estado_ficha = 'activa';
    `;
    try {
        const result = await db.get(sql, [userId]);
        return result.count || 0;
    } catch (error) {
        logger.error(`❌ Error al contar las fichas activas del usuario ${userId}: ${error.message}`);
        throw error;
    }
};