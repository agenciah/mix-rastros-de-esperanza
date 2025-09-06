import { openDb } from '../users/initDb.js';
import logger from '../../utils/logger.js';

/**
 * Obtiene una ficha completa por su ID, incluyendo sus rasgos y vestimenta.
 * @param {number} id - El ID de la ficha a buscar.
 * @returns {Promise<object | null>} - La ficha completa o null si no se encuentra.
 */
export const getFichaCompletaById = async (id) => {
    const db = await openDb();
    const fichaSql = `
        SELECT
            fd.id_ficha, fd.id_usuario_creador, fd.nombre, fd.segundo_nombre, fd.apellido_paterno,
            fd.apellido_materno, fd.fecha_desaparicion, fd.foto_perfil, fd.estado_ficha,
            -- Campos nuevos para la ficha
            fd.edad_estimada, fd.genero, fd.estatura, fd.peso, fd.complexion,
            json_object(
                'id_ubicacion', u.id_ubicacion, 'estado', u.estado, 'municipio', u.municipio,
                'localidad', u.localidad, 'calle', u.calle, 'referencias', u.referencias,
                'latitud', u.latitud, 'longitud', u.longitud, 'codigo_postal', u.codigo_postal
            ) AS ubicacion_desaparicion,
            ctl.nombre_tipo AS tipo_lugar,
            json_group_array(DISTINCT json_object(
                'tipo_rasgo', frf.tipo_rasgo, 'descripcion_detalle', frf.descripcion_detalle,
                'nombre_parte', cpc.nombre_parte, 'id_parte_cuerpo', cpc.id_parte_cuerpo
            )) FILTER (WHERE frf.id_rasgo IS NOT NULL) AS rasgos_fisicos_json,
            json_group_array(DISTINCT json_object(
                'color', fv.color, 'marca', fv.marca, 'caracteristica_especial', fv.caracteristica_especial,
                'tipo_prenda', cp.tipo_prenda, 'id_prenda', cp.id_prenda
            )) FILTER (WHERE fv.id_vestimenta IS NOT NULL) AS vestimenta_json
        FROM fichas_desaparicion AS fd
        LEFT JOIN ubicaciones AS u ON fd.id_ubicacion_desaparicion = u.id_ubicacion
        LEFT JOIN catalogo_tipo_lugar AS ctl ON fd.id_tipo_lugar_desaparicion = ctl.id_tipo_lugar
        LEFT JOIN ficha_rasgos_fisicos AS frf ON fd.id_ficha = frf.id_ficha
        LEFT JOIN catalogo_partes_cuerpo AS cpc ON frf.id_parte_cuerpo = cpc.id_parte_cuerpo
        LEFT JOIN ficha_vestimenta AS fv ON fd.id_ficha = fv.id_ficha
        LEFT JOIN catalogo_prendas AS cp ON fv.id_prenda = cp.id_prenda
        WHERE fd.id_ficha = ?
        GROUP BY fd.id_ficha;
    `;
    const fichaResult = await db.get(fichaSql, [id]);

    if (!fichaResult) {
        return null;
    }

    const fichaCompleta = {
        ...fichaResult,
        ubicacion_desaparicion: JSON.parse(fichaResult.ubicacion_desaparicion),
        rasgos_fisicos: JSON.parse(fichaResult.rasgos_fisicos_json)[0] === null ? [] : JSON.parse(fichaResult.rasgos_fisicos_json),
        vestimenta: JSON.parse(fichaResult.vestimenta_json)[0] === null ? [] : JSON.parse(fichaResult.vestimenta_json)
    };

    delete fichaCompleta.rasgos_fisicos_json;
    delete fichaCompleta.vestimenta_json;

    return fichaCompleta;
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
            fd.fecha_desaparicion, fd.foto_perfil, fd.estado_ficha,
            -- Campos nuevos para el resultado de la búsqueda
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
 * Obtiene todos los hallazgos completos, incluyendo sus rasgos y vestimenta.
 * @returns {Promise<Array<object>>} - Lista de hallazgos completos.
 */
export const getAllHallazgosCompletos = async () => {
    const db = await openDb();
    const hallazgosQuery = `
        SELECT
            h.id_hallazgo, 
            h.id_usuario_buscador, 
            h.estado_hallazgo,
            -- Campos nuevos para el hallazgo
            h.edad_estimada, h.genero, h.estatura, h.peso, h.complexion,
            u.estado, 
            u.municipio, 
            u.localidad,
            u.latitud, 
            u.longitud,
            json_group_array(DISTINCT json_object(
                'id_parte_cuerpo', hrf.id_parte_cuerpo, 
                'tipo_caracteristica', hrf.tipo_caracteristica,
                'descripcion', hrf.descripcion
            )) FILTER (WHERE hrf.id_hallazgo_caracteristica IS NOT NULL) AS rasgos_fisicos_json,
            json_group_array(DISTINCT json_object(
                'id_prenda', hv.id_prenda, 
                'color', hv.color, 
                'marca', hv.marca,
                'caracteristica_especial', hv.caracteristica_especial
            )) FILTER (WHERE hv.id_hallazgo_vestimenta IS NOT NULL) AS vestimenta_json
        FROM hallazgos AS h
        LEFT JOIN ubicaciones AS u ON h.id_ubicacion_hallazgo = u.id_ubicacion
        LEFT JOIN hallazgo_caracteristicas AS hrf ON h.id_hallazgo = hrf.id_hallazgo
        LEFT JOIN hallazgo_vestimenta AS hv ON h.id_hallazgo = hv.id_hallazgo
        WHERE h.estado_hallazgo = 'activo'
        GROUP BY h.id_hallazgo;
    `;
    logger.debug(`Consulta de hallazgos a ejecutar: ${hallazgosQuery}`);
    const hallazgosResult = await db.all(hallazgosQuery);

    const hallazgosCompletos = hallazgosResult.map(hallazgo => {
        const rasgos = JSON.parse(hallazgo.rasgos_fisicos_json);
        const vestimenta = JSON.parse(hallazgo.vestimenta_json);
        
        delete hallazgo.rasgos_fisicos_json;
        delete hallazgo.vestimenta_json;

        return {
            ...hallazgo,
            rasgos_fisicos: rasgos[0] === null ? [] : rasgos,
            vestimenta: vestimenta[0] === null ? [] : vestimenta,
        };
    });

    return hallazgosCompletos;
};

/**
 * Obtiene una ficha de desaparición con todos sus detalles y datos del usuario creador.
 */
export const getFichaCompletaByIdAdmin = async (id_ficha) => {
    const db = await openDb();
    const fichaSql = `
        SELECT
            fd.id_ficha,
            fd.id_usuario_creador,
            u.nombre AS nombre_usuario,
            u.email AS email_usuario,
            fd.nombre,
            fd.segundo_nombre,
            fd.apellido_paterno,
            fd.apellido_materno,
            fd.fecha_desaparicion,
            fd.id_ubicacion_desaparicion,
            fd.id_tipo_lugar_desaparicion,
            ctl.nombre_tipo AS tipo_lugar,
            fd.foto_perfil,
            fd.estado_ficha,
            fd.estado_pago,
            fd.fecha_registro_encontrado,
            -- Campos nuevos para la ficha
            fd.edad_estimada, fd.genero, fd.estatura, fd.peso, fd.complexion,
            ubicacion.estado,
            ubicacion.municipio,
            ubicacion.localidad,
            ubicacion.calle,
            ubicacion.referencias,
            ubicacion.latitud,
            ubicacion.longitud,
            ubicacion.codigo_postal
        FROM fichas_desaparicion AS fd
        LEFT JOIN users AS u ON fd.id_usuario_creador = u.id
        LEFT JOIN ubicaciones AS ubicacion ON fd.id_ubicacion_desaparicion = ubicacion.id_ubicacion
        LEFT JOIN catalogo_tipo_lugar AS ctl ON fd.id_tipo_lugar_desaparicion = ctl.id_tipo_lugar
        WHERE fd.id_ficha = ?;
    `;

    const rasgosSql = `
        SELECT frf.*, cpc.nombre_parte AS nombre_parte_cuerpo
        FROM ficha_rasgos_fisicos AS frf
        LEFT JOIN catalogo_partes_cuerpo AS cpc ON frf.id_parte_cuerpo = cpc.id_parte_cuerpo
        WHERE frf.id_ficha = ?;
    `;

    const vestimentaSql = `
        SELECT fv.*, cp.tipo_prenda AS tipo_prenda_nombre
        FROM ficha_vestimenta AS fv
        LEFT JOIN catalogo_prendas AS cp ON fv.id_prenda = cp.id_prenda
        WHERE fv.id_ficha = ?;
    `;

    const ficha = await db.get(fichaSql, [id_ficha]);
    if (!ficha) return null;

    const rasgos = await db.all(rasgosSql, [id_ficha]);
    const vestimenta = await db.all(vestimentaSql, [id_ficha]);

    return {
        ...ficha,
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
            h.fecha_hallazgo, h.descripcion_general_hallazgo, h.estado_hallazgo,
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
 * Obtiene un hallazgo completo por su ID, incluyendo sus rasgos y vestimenta.
 * @param {number} id - El ID del hallazgo a buscar.
 * @returns {Promise<object | null>} - El hallazgo completo o null si no se encuentra.
 */
export const getHallazgoCompletoById = async (id) => {
    const db = await openDb();

    // Consulta principal del hallazgo
    const hallazgoSql = `
        SELECT
            h.id_hallazgo, h.id_usuario_buscador, h.estado_hallazgo, h.fecha_hallazgo,
            -- Campos nuevos para el hallazgo
            h.edad_estimada, h.genero, h.estatura, h.peso, h.complexion,
            json_object(
                'id_ubicacion', u.id_ubicacion, 'estado', u.estado, 'municipio', u.municipio,
                'localidad', u.localidad, 'calle', u.calle, 'referencias', u.referencias,
                'latitud', u.latitud, 'longitud', u.longitud, 'codigo_postal', u.codigo_postal
            ) AS ubicacion_hallazgo_json
        FROM hallazgos AS h
        LEFT JOIN ubicaciones AS u ON h.id_ubicacion_hallazgo = u.id_ubicacion
        WHERE h.id_hallazgo = ?;
    `;
    const hallazgoResult = await db.get(hallazgoSql, [id]);

    if (!hallazgoResult) {
        return null;
    }
    
    // Consultas para los detalles de características y vestimenta
    const rasgosSql = `
        SELECT hrf.*, cpc.nombre_parte AS nombre_parte_cuerpo
        FROM hallazgo_caracteristicas AS hrf
        LEFT JOIN catalogo_partes_cuerpo AS cpc ON hrf.id_parte_cuerpo = cpc.id_parte_cuerpo
        WHERE hrf.id_hallazgo = ?;
    `;

    const vestimentaSql = `
        SELECT hv.*, cp.tipo_prenda AS tipo_prenda_nombre
        FROM hallazgo_vestimenta AS hv
        LEFT JOIN catalogo_prendas AS cp ON hv.id_prenda = cp.id_prenda
        WHERE hv.id_hallazgo = ?;
    `;

    const rasgos = await db.all(rasgosSql, [id]);
    const vestimenta = await db.all(vestimentaSql, [id]);

    const hallazgoCompleto = {
        ...hallazgoResult,
        ubicacion_hallazgo: JSON.parse(hallazgoResult.ubicacion_hallazgo_json),
        rasgos_fisicos: rasgos,
        vestimenta: vestimenta
    };

    delete hallazgoCompleto.ubicacion_hallazgo_json;

    return hallazgoCompleto;
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