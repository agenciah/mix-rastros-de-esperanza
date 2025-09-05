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