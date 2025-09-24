// RUTA: backend/db/queries/fichasQueries.js
// Contiene EXCLUSIVAMENTE operaciones de lectura (GET) para fichas.

import { query } from '../users/initDb.js';
import logger from '../../utils/logger.js';

/**
 * FUNCIÓN MAESTRA: Obtiene UNA ficha completa por su ID.
 */
export const getFichaCompletaById = async (id) => {
    const fichaSql = `
        SELECT
            fd.id_ficha, fd.id_usuario_creador, fd.nombre, fd.segundo_nombre, fd.apellido_paterno,
            fd.apellido_materno, fd.fecha_desaparicion, fd.foto_perfil, fd.estado_ficha,
            fd.estado_pago, fd.fecha_registro_encontrado, fd.edad_estimada, fd.genero,
            fd.estatura, fd.peso, fd.complexion, fd.id_ubicacion_desaparicion, fd.id_tipo_lugar_desaparicion,
            u.estado, u.municipio, u.localidad, u.calle, u.referencias, u.codigo_postal,
            ctl.nombre_tipo AS tipo_lugar,
            creator.nombre as nombre_usuario,
            creator.email as email_usuario
        FROM fichas_desaparicion AS fd
        LEFT JOIN users AS creator ON fd.id_usuario_creador = creator.id
        LEFT JOIN ubicaciones AS u ON fd.id_ubicacion_desaparicion = u.id_ubicacion
        LEFT JOIN catalogo_tipo_lugar AS ctl ON fd.id_tipo_lugar_desaparicion = ctl.id_tipo_lugar
        WHERE fd.id_ficha = $1;
    `;
    const rasgosSql = `SELECT * FROM ficha_rasgos_fisicos WHERE id_ficha = $1;`;
    const vestimentaSql = `SELECT * FROM ficha_vestimenta WHERE id_ficha = $1;`;

    try {
        const [fichaResult, rasgosResult, vestimentaResult] = await Promise.all([
            query(fichaSql, [id]),      // ✅ Corregido
            query(rasgosSql, [id]),     // ✅ Corregido
            query(vestimentaSql, [id])  // ✅ Corregido
        ]);

        if (fichaResult.rowCount === 0) return null;

        const ficha = fichaResult.rows[0];
        const { estado, municipio, localidad, calle, referencias, codigo_postal, ...restOfFicha } = ficha;

        return {
            ...restOfFicha,
            ubicacion_desaparicion: { estado, municipio, localidad, calle, referencias, codigo_postal },
            rasgos_fisicos: rasgosResult.rows || [],
            vestimenta: vestimentaResult.rows || []
        };
    } catch (error) {
        logger.error(`❌ Error en getFichaCompletaById (PostgreSQL): ${error.message}`);
        throw error;
    }
};

/**
 * Obtiene TODAS las fichas de un usuario específico con todos sus campos.
 */
export const getFichasCompletasByUserId = async (userId) => {
    const idsSql = `SELECT id_ficha FROM fichas_desaparicion WHERE id_usuario_creador = $1 ORDER BY fecha_desaparicion DESC`;

    try {
        const fichaIdsResult = await query(idsSql, [userId]); // ✅ Corregido
        const fichaIds = fichaIdsResult.rows;

        if (!fichaIds || fichaIds.length === 0) return [];

        const fichasPromises = fichaIds.map(item => getFichaCompletaById(item.id_ficha));
        return Promise.all(fichasPromises);
    } catch (error) {
        logger.error(`❌ Error en getFichasCompletasByUserId (PostgreSQL): ${error.message}`);
        throw error;
    }
};

/**
 * Obtiene una lista paginada de fichas públicas para el feed.
 */
export const getFichasFeed = async (limit = 10, offset = 0) => {
    const sql = `
        SELECT
            fd.id_ficha, fd.nombre, fd.apellido_paterno, fd.fecha_desaparicion,
            fd.foto_perfil, fd.genero, fd.edad_estimada, u.estado, u.municipio
        FROM fichas_desaparicion AS fd
        LEFT JOIN ubicaciones AS u ON fd.id_ubicacion_desaparicion = u.id_ubicacion
        WHERE fd.estado_ficha = 'activa'
        ORDER BY fd.fecha_desaparicion DESC
        LIMIT $1 OFFSET $2;
    `;
    try {
        const result = await query(sql, [limit, offset]); // ✅ Corregido
        return result.rows;
    } catch (error) {
        logger.error(`❌ Error en getFichasFeed (PostgreSQL): ${error.message}`);
        throw error;
    }
};

/**
 * BÚSQUEDA UNIVERSAL: Busca fichas por un término clave.
 */
export const searchFichasByKeyword = async (searchTerm = '', limit = 10, offset = 0) => {
    const sqlTerm = `%${searchTerm.toLowerCase()}%`;
    const sql = `
        SELECT DISTINCT
            fd.id_ficha, fd.nombre, fd.apellido_paterno, fd.fecha_desaparicion,
            fd.foto_perfil, fd.genero, fd.edad_estimada, u.estado, u.municipio
        FROM fichas_desaparicion AS fd
        LEFT JOIN ubicaciones AS u ON fd.id_ubicacion_desaparicion = u.id_ubicacion
        LEFT JOIN ficha_rasgos_fisicos AS frf ON fd.id_ficha = frf.id_ficha
        LEFT JOIN catalogo_partes_cuerpo AS cpc ON frf.id_parte_cuerpo = cpc.id_parte_cuerpo
        LEFT JOIN ficha_vestimenta AS fv ON fd.id_ficha = fv.id_ficha
        LEFT JOIN catalogo_prendas AS cp ON fv.id_prenda = cp.id_prenda
        LEFT JOIN catalogo_tipo_lugar AS ctl ON fd.id_tipo_lugar_desaparicion = ctl.id_tipo_lugar
        WHERE fd.estado_ficha = 'activa' AND (
            fd.nombre ILIKE $1 OR
            fd.apellido_paterno ILIKE $2 OR
            fd.genero ILIKE $3 OR
            u.estado ILIKE $4 OR
            u.municipio ILIKE $5 OR
            frf.descripcion_detalle ILIKE $6 OR
            cpc.nombre_parte ILIKE $7 OR
            fv.color ILIKE $8 OR
            fv.marca ILIKE $9 OR
            cp.tipo_prenda ILIKE $10 OR
            ctl.nombre_tipo ILIKE $11
        )
        ORDER BY fd.fecha_desaparicion DESC
        LIMIT $12 OFFSET $13;
    `;
    const params = Array(11).fill(sqlTerm).concat([limit, offset]);
    try {
        const result = await query(sql, params); // ✅ Corregido
        return result.rows;
    } catch (error) {
        logger.error(`❌ Error en searchFichasByKeyword (PostgreSQL): ${error.message}`);
        throw error;
    }
};