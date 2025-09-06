// backend/controllers/hallazgos/matchController.js

import { openDb } from '../../db/users/initDb.js';
import logger from '../../utils/logger.js';
import { getFichaCompletaById, getAllHallazgosCompletos } from '../../db/queries/fichasAndHallazgosQueries.js';
import { insertPossibleMatch } from '../../db/queries/messagingQueries.js';

// Importa las funciones de matching que ya creamos y validamos en el servicio anterior
import {
    checkLocationMatch,
    checkGeneralDataMatch,
    checkRasgosMatch,
    checkVestimentaMatch,
    checkNameMatch
} from '../fichas/matchingService.js';


// Nueva función para obtener todas las fichas completas
const getAllFichasCompletas = async () => {
    const db = await openDb();
    const fichasQuery = `
        SELECT
            fd.id_ficha, fd.id_usuario_creador, fd.nombre, fd.segundo_nombre, fd.apellido_paterno,
            fd.apellido_materno, fd.fecha_desaparicion, fd.foto_perfil, fd.estado_ficha,
            -- Campos nuevos
            fd.edad_estimada, fd.genero, fd.estatura, fd.peso, fd.complexion,
            json_object(
                'id_ubicacion', u.id_ubicacion, 'estado', u.estado, 'municipio', u.municipio
            ) AS ubicacion_desaparicion_json,
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
        WHERE fd.estado_ficha = 'activa'
        GROUP BY fd.id_ficha;
    `;
    const fichasResult = await db.all(fichasQuery);

    return fichasResult.map(ficha => {
        const rasgos = JSON.parse(ficha.rasgos_fisicos_json);
        const vestimenta = JSON.parse(ficha.vestimenta_json);
        const ubicacion = JSON.parse(ficha.ubicacion_desaparicion_json);

        delete ficha.rasgos_fisicos_json;
        delete ficha.vestimenta_json;
        delete ficha.ubicacion_desaparicion_json;

        return {
            ...ficha,
            ubicacion_desaparicion: ubicacion,
            rasgos_fisicos: rasgos[0] === null ? [] : rasgos,
            vestimenta: vestimenta[0] === null ? [] : vestimenta,
        };
    });
};

/**
 * Busca coincidencias de un nuevo hallazgo con fichas de desaparición existentes.
 * @param {Object} hallazgoData - Los datos del hallazgo a buscar coincidencias.
 * @returns {Promise<Array<Object>>} Promesa que resuelve con una lista de fichas que coinciden.
 */
export const findMatchesForHallazgo = async (hallazgoData) => {
    let db;
    try {
        db = await openDb();

        // Obtener todas las fichas de desaparición activas de forma completa
        const fichasDesaparicion = await getAllFichasCompletas();

        if (!fichasDesaparicion || fichasDesaparicion.length === 0) {
            logger.info('🔍 No hay fichas de desaparición activas para buscar coincidencias.');
            return [];
        }

        const matches = [];

        // Iterar sobre cada ficha y calcular la puntuación de coincidencia
        for (const ficha of fichasDesaparicion) {
            let score = 0;
            let matchedCriteria = [];

            // Coincidencia por datos generales
            const generalDataMatch = checkGeneralDataMatch(ficha, hallazgoData);
            if (generalDataMatch.score > 0) {
                score += generalDataMatch.score;
                matchedCriteria.push(...generalDataMatch.criteria);
            }

            // Coincidencia por Ubicación
            const locationMatch = checkLocationMatch(ficha.ubicacion_desaparicion, hallazgoData);
            if (locationMatch.score > 0) {
                score += locationMatch.score;
                matchedCriteria.push(...locationMatch.criteria);
            }

            // Coincidencia por Rasgos Físicos
            if (ficha.rasgos_fisicos && ficha.rasgos_fisicos.length > 0) {
                const rasgosScore = checkRasgosMatch(ficha.rasgos_fisicos, hallazgoData.rasgos_fisicos);
                if (rasgosScore.score > 0) {
                    score += rasgosScore.score;
                    matchedCriteria.push(...rasgosScore.criteria);
                }
            }

            // Coincidencia por Vestimenta
            if (ficha.vestimenta && ficha.vestimenta.length > 0) {
                const vestimentaScore = checkVestimentaMatch(ficha.vestimenta, hallazgoData.vestimenta);
                if (vestimentaScore.score > 0) {
                    score += vestimentaScore.score;
                    matchedCriteria.push(...vestimentaScore.criteria);
                }
            }
            
            // Coincidencia por Nombre
            const nameScore = checkNameMatch(ficha, hallazgoData);
            if (nameScore.score > 0) {
                score += nameScore.score;
                matchedCriteria.push(...nameScore.criteria);
            }

            // Si la puntuación excede el umbral, agregar la ficha a las coincidencias
            const matchThreshold = 60; 
            if (score >= matchThreshold) {
                logger.info(`✅ Coincidencia encontrada: Hallazgo ID ${hallazgoData.id_hallazgo} coincide con Ficha ID ${ficha.id_ficha} con una puntuación de ${score}.`);
                
                // Guardar la posible coincidencia en la base de datos
                await insertPossibleMatch(db, ficha.id_ficha, hallazgoData.id_hallazgo, score, matchedCriteria.join(', '));
                
                matches.push({ id_ficha: ficha.id_ficha, score, id_usuario_creador: ficha.id_usuario_creador });
            }
        }
        
        matches.sort((a, b) => b.score - a.score);
        return matches;

    } catch (error) {
        logger.error(`❌ Error al buscar coincidencias para hallazgo: ${error.message}`);
        return [];
    }
};