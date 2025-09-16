// RUTA: backend/db/queries/fichasQueries.js
// Contiene EXCLUSIVAMENTE operaciones de lectura (GET).

import { openDb } from '../users/initDb.js';
import logger from '../../utils/logger.js';

/**
 * FUNCIÓN MAESTRA: Obtiene UNA ficha completa por su ID.
 */
export const getFichaCompletaById = async (id) => {
    const db = await openDb();
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
        WHERE fd.id_ficha = ?;
    `;
    const ficha = await db.get(fichaSql, [id]);
    if (!ficha) return null;

    const rasgosSql = `SELECT * FROM ficha_rasgos_fisicos WHERE id_ficha = ?;`;
    const vestimentaSql = `SELECT * FROM ficha_vestimenta WHERE id_ficha = ?;`;

    const [rasgos_fisicos, vestimenta] = await Promise.all([
        db.all(rasgosSql, [id]),
        db.all(vestimentaSql, [id])
    ]);
    
    const { estado, municipio, localidad, calle, referencias, codigo_postal, ...restOfFicha } = ficha;

    return {
        ...restOfFicha,
        ubicacion_desaparicion: { estado, municipio, localidad, calle, referencias, codigo_postal },
        rasgos_fisicos: rasgos_fisicos || [],
        vestimenta: vestimenta || []
    };
};

/**
 * Obtiene TODAS las fichas de un usuario específico con todos sus campos.
 */
export const getFichasCompletasByUserId = async (userId) => {
    const db = await openDb();
    const idsSql = `SELECT id_ficha FROM fichas_desaparicion WHERE id_usuario_creador = ? ORDER BY fecha_desaparicion DESC`;
    const fichaIds = await db.all(idsSql, [userId]);
    
    if (!fichaIds || fichaIds.length === 0) return [];
    
    const fichasPromises = fichaIds.map(item => getFichaCompletaById(item.id_ficha));
    return Promise.all(fichasPromises);
};

/**
 * Obtiene una lista paginada de fichas públicas para el feed.
 */
export const getFichasFeed = async (limit = 10, offset = 0) => {
    const db = await openDb();
    const sql = `
        SELECT
            fd.id_ficha, fd.nombre, fd.apellido_paterno, fd.fecha_desaparicion, 
            fd.foto_perfil, fd.genero, fd.edad_estimada, u.estado, u.municipio
        FROM fichas_desaparicion AS fd
        LEFT JOIN ubicaciones AS u ON fd.id_ubicacion_desaparicion = u.id_ubicacion
        WHERE fd.estado_ficha = 'activa' 
        ORDER BY fd.fecha_desaparicion DESC
        LIMIT ? OFFSET ?;
    `;
    return db.all(sql, [limit, offset]);
};

/**
 * BÚSQUEDA UNIVERSAL: Busca fichas por un término clave.
 */
export const searchFichasByKeyword = async (searchTerm = '', limit = 10, offset = 0) => {
    const db = await openDb();
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
        -- ✅ AÑADIDO: Join con el catálogo de lugares
        LEFT JOIN catalogo_tipo_lugar AS ctl ON fd.id_tipo_lugar_desaparicion = ctl.id_tipo_lugar
        WHERE fd.estado_ficha = 'activa' AND (
            LOWER(fd.nombre) LIKE ? OR
            LOWER(fd.apellido_paterno) LIKE ? OR
            LOWER(fd.genero) LIKE ? OR
            LOWER(u.estado) LIKE ? OR
            LOWER(u.municipio) LIKE ? OR
            LOWER(frf.descripcion_detalle) LIKE ? OR
            LOWER(cpc.nombre_parte) LIKE ? OR
            LOWER(fv.color) LIKE ? OR
            LOWER(fv.marca) LIKE ? OR
            LOWER(cp.tipo_prenda) LIKE ? OR
            -- ✅ AÑADIDO: Condición para buscar en el tipo de lugar
            LOWER(ctl.nombre_tipo) LIKE ?
        )
        ORDER BY fd.fecha_desaparicion DESC
        LIMIT ? OFFSET ?;
    `;
    // ✅ AÑADIDO: Un parámetro más para la nueva condición
    const params = Array(11).fill(sqlTerm).concat([limit, offset]);
    return db.all(sql, params);
};